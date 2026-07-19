from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.core.security import verify_token

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    payload = verify_token(token)

    if "error" in payload:

        raise HTTPException(
            status_code=401,
            detail=payload["error"]
        )

    user = db.query(User).filter(User.id == int(payload["sub"])).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user