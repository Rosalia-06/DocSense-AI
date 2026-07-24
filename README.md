---
title: DocSense AI Backend
sdk: docker
app_port: 7860
---

# DocSense AI Backend


# 🚀 DocSense AI

> Enterprise Document Intelligence Platform powered by AI.

DocSense AI is a production-oriented AI application that enables users to upload documents, extract text, analyze content, and interact with documents using Large Language Models.

This project is being built as a portfolio-quality software engineering project following industry best practices.

---

# ✨ Features

## Authentication

- Secure User Registration
- JWT Login
- Protected APIs
- Password Hashing using bcrypt

---

## Document Management

- Upload PDF Documents
- Upload Images (PNG, JPG, JPEG)
- Upload PowerPoint Presentations (PPTX)
- Unique File Storage using UUID
- View Uploaded Documents
- View Individual Document
- Delete Documents

---

## AI Features

### ✅ Completed

- Digital PDF Text Extraction using PyMuPDF

### 🚧 In Progress

- OCR using PaddleOCR
- Scanned PDF Processing
- Image Text Extraction

### 📌 Planned

- AI Document Summarization
- Document Question Answering
- Named Entity Recognition
- Document Classification
- Semantic Search
- Dashboard & Analytics
- RAG Pipeline
- Vector Database Integration

---

# 🛠 Tech Stack

## Frontend

- React
- Tailwind CSS
- Axios
- React Router

## Backend

- FastAPI
- SQLAlchemy
- Pydantic
- JWT Authentication

## Database

- PostgreSQL

## AI

- Groq API
- PyMuPDF
- PaddleOCR
- spaCy

---

# 📂 Project Structure

```
DocSense-AI/

├── backend/
│   ├── app/
│   │   ├── ai/
│   │   ├── auth/
│   │   ├── core/
│   │   ├── database/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── uploads/
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│
└── README.md
```

---

# 📌 Current Progress

✅ Backend Architecture

✅ PostgreSQL Integration

✅ JWT Authentication

✅ User Registration

✅ User Login

✅ Protected Routes

✅ Secure Password Hashing

✅ Document Upload

✅ UUID-based File Storage

✅ Store Document Metadata

✅ Extract Text from Digital PDFs

---

# 🚀 Upcoming Features

- OCR Support
- AI Summarization
- Chat with Documents
- Entity Extraction
- Document Classification
- Semantic Search
- Dashboard
- Docker Deployment
- AWS Deployment

---

# ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/Rosalia-06/DocSense-AI.git
```

Go inside the project

```bash
cd DocSense-AI
```

Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 📚 API Documentation

After running the backend:

```
http://127.0.0.1:8000/docs
```

---

# 🎯 Project Goals

- Production-Level Backend
- AI-Powered Document Intelligence
- Resume & Portfolio Project
- Placement Ready
- Major Project

---

# 👩‍💻 Author

**Vanshika Sangal**

GitHub: https://github.com/Rosalia-06
