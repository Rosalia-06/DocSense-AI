from datetime import datetime
from pydantic import BaseModel


class ChatResponse(BaseModel):
    id: int
    question: str
    answer: str
    created_at: datetime
    document_id: int
    user_id: int

    class Config:
        from_attributes = True