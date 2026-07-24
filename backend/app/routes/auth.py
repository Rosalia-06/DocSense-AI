from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserLogin
from app.schemas.token import Token
from app.core.security import (
    verify_password,
    create_access_token,
    hash_password,
    create_verification_token,
    verify_verification_token
)
from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserResponse, ChangePasswordRequest, ResendVerificationRequest
from app.auth.dependencies import get_current_user
from app.core.config import settings
from app.utils.email import send_verification_email
from app.core.limiter import limiter
from fastapi import Request

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
def register(
    request: Request,
    user: UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_verification_token(new_user.id)
    base_url = settings.BACKEND_BASE_URL.rstrip("/")
    verify_link = f"{base_url}/auth/verify-email?token={token}"
    send_verification_email(new_user.email, verify_link)

    return new_user

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(
    request: Request,
    user: UserLogin,
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        db_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not db_user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before logging in"
        )

    token = create_access_token(
        {
            "sub": str(db_user.id),
            "email": db_user.email
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user_id = verify_verification_token(token)

    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification link"
        )

    db_user = db.query(User).filter(User.id == int(user_id)).first()

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if db_user.is_verified:
        return {"message": "Email already verified"}

    db_user.is_verified = True
    db.commit()

    return {"message": "Email verified successfully"}

@router.post("/resend-verification")
@limiter.limit("5/minute")
def resend_verification(
    request: Request,
    payload: ResendVerificationRequest,
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(User.email == payload.email).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="No account found with this email")

    if db_user.is_verified:
        return {"message": "Email already verified"}

    token = create_verification_token(db_user.id)
    verify_link = f"{settings.BACKEND_BASE_URL}/auth/verify-email?token={token}"
    send_verification_email(db_user.email, verify_link)

    return {"message": "Verification email resent"}

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(payload.current_password, current_user.password):
        raise HTTPException(
            status_code=401,
            detail="Current password is incorrect"
        )

    current_user.password = hash_password(payload.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user