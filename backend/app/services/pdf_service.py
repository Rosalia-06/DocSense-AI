import fitz


def extract_text_from_pdf(pdf_path: str):
    document = fitz.open(pdf_path)
    text = ""
    for page in document:
        text += page.get_text()
    document.close()
    return text.strip()


def is_scanned_pdf(pdf_path: str):
    text = extract_text_from_pdf(pdf_path)
    return len(text.strip()) < 20