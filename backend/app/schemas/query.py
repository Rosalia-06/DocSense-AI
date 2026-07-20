from pydantic import BaseModel
from app.schemas.document import Citation


class MultiDocQuestion(BaseModel):
    question: str


class MultiDocAnswer(BaseModel):
    answer: str
    citations: list[Citation]