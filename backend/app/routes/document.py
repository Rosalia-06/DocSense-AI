from pathlib import Path

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
from app.services.pdf_service import extract_text_from_pdf

from app.services.ocr_service import extract_text_from_image
from app.services.pdf_image_service import pdf_to_images
from app.services.pdf_service import is_scanned_pdf
import os

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


@router.post("/upload", response_model=DocumentResponse)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if not validate_extension(file.filename):
        raise HTTPException(
            status_code=400,
            detail="Only PDF, PNG, JPG, JPEG and PPTX files are allowed."
        )

    extension = "." + file.filename.split(".")[-1].lower()

    saved_file = save_uploaded_file(file)

    text = ""

    if extension == ".pdf":
        text = extract_text_from_pdf(saved_file["file_path"])

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

    return document


@router.get("/", response_model=list[DocumentResponse])
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    documents = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )

    return documents


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


@router.delete(
    "/{document_id}",
    response_model=DeleteResponse
)
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