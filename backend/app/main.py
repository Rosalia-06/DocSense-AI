import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.document import router as document_router

from app.database.database import Base
import app.models
from app.routes.download import router as download_router

from app.routes.admin import router as admin_router
from app.core.limiter import limiter
from app.core.logging_config import setup_logging
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler


app = FastAPI(
    title="DocSense AI",
    description="Enterprise Document Intelligence Platform",
    version="1.0.0"
)

setup_logging()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — origins come from env var, comma-separated. Falls back to local dev origin.
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(document_router)
app.include_router(download_router)
app.include_router(admin_router)

@app.get("/")
def root():
    return {
        "message": "Welcome to DocSense AI 🚀"
    }