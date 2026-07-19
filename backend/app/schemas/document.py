from datetime import datetime
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