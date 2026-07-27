from pathlib import Path
from sentence_transformers import SentenceTransformer

_model = None
_MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "docvqa-finetuned-minilm"


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(str(_MODEL_PATH))
    return _model


def embed_text(text: str) -> list[float]:
    model = get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    model = get_model()
    vectors = model.encode(texts, normalize_embeddings=True)
    return [v.tolist() for v in vectors]