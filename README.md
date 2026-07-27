# DocSense AI

**Enterprise document intelligence platform with retrieval-augmented Q&A — built for the Document Visual Question Answering (DocVQA) problem track.**

Upload contracts, reports, and decks. Ask questions in plain language. Get answers with citations traced back to the exact page they came from.

---

## Problem Statement

Enterprises and individuals routinely deal with long, unstructured documents (contracts, reports, forms, manuals) where finding a specific answer means manually skimming pages. Traditional keyword search (Ctrl+F) fails when the answer is phrased differently from the question, and generic chatbots without grounding hallucinate answers with no way to verify them against the source.

DocSense AI addresses this as a **Document Visual Question Answering (DocVQA)** problem: given a document (including scanned/image-based documents) and a natural-language question, return an accurate answer **grounded in and traceable to the source page**, combining OCR, retrieval, and language generation.

## Why AI Is Required

Rule-based keyword search cannot handle paraphrased questions, cross-references, or numerical/tabular reasoning inside documents. Purely OCR-based text dumps have no way to rank which part of a long document is relevant to a given question. This requires:
- **Computer Vision (OCR)** to convert scanned/image documents into machine-readable text
- **NLP embeddings + retrieval** to find the specific passage relevant to a question, from among potentially hundreds of pages
- **Language generation** to compose a natural-language answer grounded in the retrieved passage

## Features

- JWT-based authentication with role-based access control (RBAC)
- Document upload/list/delete (PDF, scanned PDF, images, PPTX)
- OCR pipeline: PaddleOCR + PyMuPDF + pdf2image + python-pptx
- Retrieval-Augmented Generation (RAG): chunking → embeddings → pgvector similarity search
- Per-document Q&A with chat history context
- Multi-document query with citations back to source page
- AI-generated summaries, streaming responses
- Admin endpoints (user management, force-delete documents)
- Rate limiting, structured logging
- Dockerized backend, GitHub Actions CI

## Technology Stack (and why)

| Layer | Choice | Justification |
|---|---|---|
| Backend | FastAPI + Python 3.13 | Async-native, auto-generates OpenAPI/Swagger docs, strong typing via Pydantic v2 |
| Database | PostgreSQL (Neon, hosted) + pgvector | Free managed Postgres; pgvector gives native vector similarity search without a separate vector DB |
| ORM / Migrations | SQLAlchemy + Alembic | Version-controlled schema changes, safe for a team/iterative project |
| Auth | JWT | Stateless, standard for API-based auth |
| OCR | PaddleOCR, PyMuPDF, pdf2image, python-pptx | Handles both digital and scanned documents; PaddleOCR gives strong accuracy on printed/scanned text without paid APIs |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`), **fine-tuned on a DocVQA subset** | Small (22M params), fast enough for CPU inference, fine-tuned specifically for document-question retrieval rather than generic semantic similarity |
| LLM | Groq API — Llama 3.3 70B (`llama-3.3-70b-versatile`) | Fast inference, free tier, required by course guidelines as the only LLM used |
| Frontend | React + Tailwind CSS | Component-based UI, fast styling iteration |
| Deployment | Docker + docker-compose | Reproducible environment; matches production-style setup |

## AI/ML Model Development

The retrieval component (`all-MiniLM-L6-v2` sentence embeddings) was fine-tuned on a subset of the **DocVQA dataset** (Mathew et al., 2021) to specialize it for document-question retrieval rather than relying on the generic pretrained model.

- **Dataset**: [DocVQA](https://www.docvqa.org/) (`pixparse/docvqa-single-page-questions` on Hugging Face) — ~6,000 training question-context pairs, ~800 held-out for evaluation
- **Preprocessing**: OCR line-text extracted per document image, paired with its corresponding question to form (question, positive-passage) training pairs
- **Training**: `MultipleNegativesRankingLoss` (in-batch negatives), 3 epochs, on a free-tier Colab T4 GPU
- **Evaluation metric**: Retrieval Recall@1 (does the correct document passage rank #1 for its question), measured before and after fine-tuning

**Results:**

| Metric | Baseline (`all-MiniLM-L6-v2`) | Fine-tuned |
|---|---|---|
| Recall@1 | `[FILL IN: baseline_recall1 from Colab output]` | `[FILL IN: finetuned_recall1 from Colab output]` |

*(See `training/docvqa_finetune_colab.py` for the full fine-tuning + evaluation script.)*

## System Architecture

```
[FILL IN: paste or describe your architecture diagram here — e.g.
User → React Frontend → FastAPI Backend → {Auth (JWT), OCR (PaddleOCR),
Embedding Service (fine-tuned MiniLM) → pgvector similarity search → Groq LLM (Llama 3.3 70B)} → PostgreSQL/Neon]
```

## Project Structure

```
DocSense-AI/
├── backend/
│   ├── app/
│   │   ├── services/        # embedding_service.py, ocr, RAG, etc.
│   │   ├── models/           # docvqa-finetuned-minilm/ (fine-tuned embedding model)
│   │   ├── ...
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/                 # React + Tailwind app
├── training/
│   └── docvqa_finetune_colab.py   # Colab script: fine-tuning + evaluation
└── README.md
```

## Setup & Running Locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
# set environment variables: DATABASE_URL, GROQ_API_KEY, JWT_SECRET, etc. (see .env.example)
alembic upgrade head
uvicorn app.main:app --reload
```

**Or via Docker:**
```bash
cd backend
docker-compose up --build
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

Once the backend is running, interactive API documentation (Swagger UI) is available at:
```
http://localhost:8000/docs
```

## Dataset Acknowledgment

This project uses the **DocVQA dataset** for fine-tuning and evaluation:
> Mathew, M., Karatzas, D., & Jawahar, C.V. (2021). *DocVQA: A Dataset for VQA on Document Images.* [arXiv:2007.00398](https://arxiv.org/abs/2007.00398)

Dataset accessed via the Hugging Face `pixparse/docvqa-single-page-questions` mirror.

## Academic Integrity

This project was independently designed and developed as a Major Project submission. All external datasets, libraries, and references are acknowledged above and in the accompanying Technical Report.


Author:
Vanshika Sangal -- B.Tech CS Student