from datetime import datetime
from pydantic import BaseModel
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    filename: str
    stored_filename: str
    file_size: int
    uploaded_at: datetime
    user_id: int
    extracted_text: str | None

    class Config:
        from_attributes = True

class DeleteResponse(BaseModel):
    message: str

class AskQuestion(BaseModel):
    question: str

class Citation(BaseModel):
    document_id: int
    document_name: str
    chunk_index: int
    snippet: str

class AIResponse(BaseModel):
    answer: str
    citations: list[Citation] = []
