from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class Chat(Base):
    __tablename__ = "chat_history"  
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE")
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE")
    )

    document = relationship("Document")
    user = relationship("User")