import uuid
import shutil
from pathlib import Path

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def generate_unique_filename(filename: str):
    unique = uuid.uuid4().hex
    return f"{unique}-{filename}"


def save_uploaded_file(file):
    if not file.filename:
        raise ValueError("Filename cannot be empty.")
    unique_filename = generate_unique_filename(file.filename)
    file_path = UPLOAD_DIR / unique_filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "original_filename": file.filename,
        "stored_filename": unique_filename,
        "file_path": str(file_path),
        "file_size": file_path.stat().st_size
    }