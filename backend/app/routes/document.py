from pathlib import Path
import os

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.auth.dependencies import get_current_user

from app.models.user import User
from app.models.document import Document

from app.schemas.document import (
    DocumentResponse,
    DeleteResponse
)

from app.services.document_service import save_uploaded_file
from app.services.file_validation import validate_extension

from app.services.pdf_service import (
    extract_text_from_pdf,
    is_scanned_pdf
)

from app.services.pdf_image_service import pdf_to_images
from app.services.ocr_service import extract_text_from_image
from app.services.ppt_service import extract_text_from_ppt

from app.schemas.document import (
    AskQuestion,
    AIResponse
)
from app.services.prompt_service import build_document_prompt
from app.services.llm_service import ask_llm
from app.models.chat import Chat
from app.schemas.chat import ChatResponse

from app.models.chunk import DocumentChunk
from app.services.chunking_service import chunk_text
from app.services.embedding_service import embed_text, embed_batch

from app.schemas.query import MultiDocQuestion, MultiDocAnswer
from app.schemas.document import Citation

from app.services.llm_service import ask_llm_stream
from fastapi.responses import StreamingResponse

from app.core.limiter import limiter
from fastapi import Request

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

MAX_FILE_SIZE = 20 * 1024 * 1024


@limiter.limit("10/minute")
@router.post("/upload", response_model=DocumentResponse)
def upload_document(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if not validate_extension(file.filename):
        raise HTTPException(
            status_code=400,
            detail="Only PDF, PNG, JPG, JPEG and PPTX files are allowed."
        )

    contents = file.file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Maximum file size is 20 MB."
        )

    file.file.seek(0)

    extension = "." + file.filename.split(".")[-1].lower()

    saved_file = save_uploaded_file(file)

    text = ""

    if extension == ".pdf":

        if is_scanned_pdf(saved_file["file_path"]):

            images = pdf_to_images(saved_file["file_path"])

            for image in images:
                text += extract_text_from_image(image) + "\n"
                os.remove(image)

        else:
            text = extract_text_from_pdf(saved_file["file_path"])

    elif extension in [".png", ".jpg", ".jpeg"]:

        text = extract_text_from_image(saved_file["file_path"])

    elif extension == ".pptx":

        text = extract_text_from_ppt(saved_file["file_path"])

    document = Document(
        filename=saved_file["original_filename"],
        stored_filename=saved_file["stored_filename"],
        file_path=saved_file["file_path"],
        file_size=saved_file["file_size"],
        extracted_text=text,
        user_id=current_user.id
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    pieces = chunk_text(text)

    if pieces:
        vectors = embed_batch(pieces)

        for i, piece in enumerate(pieces):
            db.add(DocumentChunk(
                document_id=document.id,
                chunk_index=i,
                content=piece,
                embedding=vectors[i]
            ))

        db.commit()

    return document


@router.get("/", response_model=list[DocumentResponse])
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )

@router.post("/query", response_model=MultiDocAnswer)
def query_all_documents(
    body: MultiDocQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    query_vector = embed_text(body.question)

    results = (
        db.query(DocumentChunk, Document)
        .join(Document, Document.id == DocumentChunk.document_id)
        .filter(Document.user_id == current_user.id)
        .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
        .limit(5)
        .all()
    )

    if not results:
        raise HTTPException(
            status_code=404,
            detail="No documents found to search."
        )

    context_text = "\n\n".join(
        [f"[{doc.filename}] {chunk.content}" for chunk, doc in results]
    )

    prompt = build_document_prompt(context_text, body.question, "")

    answer = ask_llm(prompt)

    citations = [
        Citation(
            document_id=doc.id,
            document_name=doc.filename,
            chunk_index=chunk.chunk_index,
            snippet=chunk.content[:200]
        )
        for chunk, doc in results
    ]

    return MultiDocAnswer(answer=answer, citations=citations)

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    return document

@router.post("/{document_id}/summary", response_model=AIResponse)
def summarize_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    prompt = f"""
You are an enterprise AI assistant.

Summarize the following document in 5-7 clear bullet points, covering the main topics, key facts, and purpose. Be concise and factual.

Document:

{document.extracted_text}
"""

    summary = ask_llm(prompt)

    return {
        "answer": summary,
        "citations": []
    }

@router.delete("/{document_id}", response_model=DeleteResponse)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    file_path = Path(document.file_path)

    if file_path.exists():
        file_path.unlink()

    db.delete(document)
    db.commit()

    return {
        "message": "Document deleted successfully."
    }

@limiter.limit("15/minute")
@router.post("/{document_id}/ask", response_model=AIResponse)
def ask_document(
    request: Request,
    document_id: int,
    body: AskQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    history = (
    db.query(Chat)
        .filter(
            Chat.document_id == document.id,
            Chat.user_id == current_user.id
        )
        .order_by(Chat.created_at.asc())
        .all()
    )

    history_text = ""

    for chat in history:
        history_text += f"User: {chat.question}\n"
        history_text += f"Assistant: {chat.answer}\n\n"

    query_vector = embed_text(body.question)

    top_chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == document.id)
        .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
        .limit(5)
        .all()
    )

    context_text = "\n\n".join([c.content for c in top_chunks]) if top_chunks else document.extracted_text

    citations = [
        Citation(
            document_id=document.id,
            document_name=document.filename,
            chunk_index=c.chunk_index,
            snippet=c.content[:200]
        )
        for c in top_chunks
    ]

    prompt = build_document_prompt(
        context_text,
        body.question,
        history_text
    )

    answer = ask_llm(prompt)

    chat = Chat(
        question=body.question,
        answer=answer,
        document_id=document.id,
        user_id=current_user.id
    )

    db.add(chat)
    db.commit()

    return {
        "answer": answer,
        "citations": citations
    }

@router.post("/{document_id}/ask/stream")
def ask_document_stream(
    document_id: int,
    body: AskQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    history = (
        db.query(Chat)
        .filter(
            Chat.document_id == document.id,
            Chat.user_id == current_user.id
        )
        .order_by(Chat.created_at.asc())
        .all()
    )

    history_text = ""
    for chat in history:
        history_text += f"User: {chat.question}\n"
        history_text += f"Assistant: {chat.answer}\n\n"

    query_vector = embed_text(body.question)

    top_chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == document.id)
        .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
        .limit(5)
        .all()
    )

    context_text = "\n\n".join([c.content for c in top_chunks]) if top_chunks else document.extracted_text

    prompt = build_document_prompt(context_text, body.question, history_text)

    def generate():
        full_answer = ""

        for token in ask_llm_stream(prompt):
            full_answer += token
            yield token

        chat = Chat(
            question=body.question,
            answer=full_answer,
            document_id=document.id,
            user_id=current_user.id
        )
        db.add(chat)
        db.commit()

    return StreamingResponse(generate(), media_type="text/plain")

@router.get("/{document_id}/history", response_model=list[ChatResponse])
def get_chat_history(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    chats = (
        db.query(Chat)
        .filter(
            Chat.document_id == document_id,
            Chat.user_id == current_user.id
        )
        .order_by(Chat.created_at.asc())
        .all()
    )

    return chats

@router.delete("/{document_id}/history")
def clear_history(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    (
        db.query(Chat)
        .filter(
            Chat.document_id == document_id,
            Chat.user_id == current_user.id
        )
        .delete()
    )

    db.commit()

    return {
        "message": "History deleted."
    }