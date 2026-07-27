# ============================================================
# DocVQA — Fine-tune sentence-transformer embeddings for retrieval
# Run this in Google Colab. Runtime > Change runtime type > T4 GPU.
# Paste each "# %%" block into its own Colab cell (or just run top to bottom).
# ============================================================

# %%
# --- Cell 1: Install dependencies ---
!pip install -q datasets sentence-transformers

# %%
# --- Cell 2a: (optional but recommended) log in for higher HF rate limits ---
# Free account at https://huggingface.co/join -> https://huggingface.co/settings/tokens
# Skip this cell if you don't want to bother; it just avoids throttling.
# from huggingface_hub import login
# login()  # paste your token when prompted

# %%
# --- Cell 2: Pull an indexed SLICE of DocVQA (NOT streaming) ---
# Streaming iterates row-by-row over the network and is unreliable on Colab
# (causes exactly the hang/disconnect you hit). Indexed slicing downloads only
# the shards needed for that range, in bulk — much faster and more stable.
from datasets import load_dataset

TRAIN_SIZE = 6000
EVAL_SIZE = 800

print("Downloading DocVQA train slice (this pulls only the needed shards)...")
train_ds = load_dataset(
    "pixparse/docvqa-single-page-questions", split=f"train[:{TRAIN_SIZE}]"
)
print(f"Train examples downloaded: {len(train_ds)}")

print("Downloading DocVQA validation slice for eval...")
eval_ds = load_dataset(
    "pixparse/docvqa-single-page-questions", split=f"validation[:{EVAL_SIZE}]"
)
print(f"Eval examples downloaded: {len(eval_ds)}")

# We never use the image column — only OCR text — so drop it immediately.
# Keeping it in memory (via list()) is what caused the crash: images decode
# into large byte blobs and 6800 of them blew past Colab free-tier RAM.
cols_to_drop = [c for c in train_ds.column_names if c == "image"]
if cols_to_drop:
    train_ds = train_ds.remove_columns(cols_to_drop)
    eval_ds = eval_ds.remove_columns(cols_to_drop)
    print(f"Dropped columns: {cols_to_drop}")

print("Sample keys:", train_ds[0].keys())

# %%
# --- Cell 3: Build (question, positive_context) training pairs from OCR text ---
# Each example has OCR words for its page — we join them into the "document context"
# that the question should retrieve. This mirrors your RAG pipeline's chunk-retrieval step.

def build_context(example):
    ocr = example.get("ocr_results", {}) or {}
    # Real schema: {"page":.., "width":.., "lines": [{"text": "...", "bounding_box": [...]}, ...]}
    # (NOT a flat "text" list — that was wrong and silently returned "" for everyone)
    lines = ocr.get("lines", []) if isinstance(ocr, dict) else []
    texts = [line.get("text", "") for line in lines if line.get("text")]
    return " ".join(texts).strip()

def build_pairs(dataset):
    pairs = []
    for ex in dataset:  # iterates lazily over the memory-mapped table, low RAM
        context = build_context(ex)
        question = ex.get("question", "").strip()
        if context and question:
            pairs.append((question, context))
    return pairs

train_pairs = build_pairs(train_ds)
eval_pairs = build_pairs(eval_ds)
print(f"Usable train pairs: {len(train_pairs)} | eval pairs: {len(eval_pairs)}")

# %%
# --- Cell 4: Baseline retrieval eval (BEFORE fine-tuning) ---
from sentence_transformers import SentenceTransformer, InputExample, losses, util
from torch.utils.data import DataLoader
import torch

def evaluate_retrieval(model, pairs, k=1):
    """Recall@k: for each question, does the correct context rank in the top-k
    among all eval contexts (using cosine similarity)?"""
    questions = [q for q, _ in pairs]
    contexts = [c for _, c in pairs]

    q_emb = model.encode(questions, convert_to_tensor=True, show_progress_bar=True)
    c_emb = model.encode(contexts, convert_to_tensor=True, show_progress_bar=True)

    sims = util.cos_sim(q_emb, c_emb)  # [num_q, num_c]
    correct = 0
    for i in range(len(questions)):
        topk = torch.topk(sims[i], k=k).indices.tolist()
        if i in topk:
            correct += 1
    return correct / len(questions)

baseline_model = SentenceTransformer("all-MiniLM-L6-v2")
baseline_recall1 = evaluate_retrieval(baseline_model, eval_pairs, k=1)
print(f"BASELINE Recall@1: {baseline_recall1:.4f}")

# %%
# --- Cell 5: Fine-tune MiniLM on the training pairs ---
model = SentenceTransformer("all-MiniLM-L6-v2")

train_examples = [InputExample(texts=[q, c]) for q, c in train_pairs]
train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=32)
train_loss = losses.MultipleNegativesRankingLoss(model)

EPOCHS = 3
model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    epochs=EPOCHS,
    warmup_steps=int(len(train_dataloader) * 0.1),
    show_progress_bar=True,
)

SAVE_PATH = "docvqa-finetuned-minilm"
model.save(SAVE_PATH)
print(f"Saved fine-tuned model to {SAVE_PATH}")

# %%
# --- Cell 6: Evaluate AFTER fine-tuning, compare to baseline ---
finetuned_recall1 = evaluate_retrieval(model, eval_pairs, k=1)
print(f"BASELINE   Recall@1: {baseline_recall1:.4f}")
print(f"FINE-TUNED Recall@1: {finetuned_recall1:.4f}")
print(f"Improvement: {(finetuned_recall1 - baseline_recall1) * 100:.2f} percentage points")

# %%
# --- Cell 7: Zip and download the fine-tuned model to use in your backend ---
!zip -r docvqa-finetuned-minilm.zip docvqa-finetuned-minilm
from google.colab import files
files.download("docvqa-finetuned-minilm.zip")

# ============================================================
# NEXT STEPS (do these outside Colab, in your backend repo):
# 1. Unzip into backend/app/ai/models/docvqa-finetuned-minilm/
# 2. In your embedding service, load with:
#    SentenceTransformer("app/ai/models/docvqa-finetuned-minilm")
#    instead of "all-MiniLM-L6-v2"
# 3. Record baseline_recall1 and finetuned_recall1 printed above —
#    these numbers go directly into your technical report's
#    "Evaluation Metrics" section.
# ============================================================
