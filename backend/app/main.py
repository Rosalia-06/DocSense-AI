from fastapi import FastAPI

from app.routes.auth import router as auth_router

from app.database.database import Base, engine

import app.models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DocSense AI",
    description="Enterprise Document Intelligence Platform",
    version="1.0.0"
)

app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to DocSense AI 🚀"
    }