def chunk_text(
    text: str,
    chunk_size: int = 800,
    overlap: int = 150
) -> list[str]:

    if not text:
        return []

    chunks = []
    start = 0
    length = len(text)

    while start < length:
        end = start + chunk_size
        piece = text[start:end].strip()

        if piece:
            chunks.append(piece)

        start += chunk_size - overlap

    return chunks