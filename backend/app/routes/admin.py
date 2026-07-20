from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.user import User
from app.models.document import Document

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/users")
def list_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    users = db.query(User).all()
    return [
        {"id": u.id, "name": u.name, "email": u.email, "role": u.role}
        for u in users
    ]


@router.delete("/documents/{document_id}")
def admin_delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    db.delete(document)
    db.commit()

    return {"message": "Document deleted by admin."}