def build_document_prompt(
    text: str,
    question: str,
    history: str = ""
):

    return f"""
You are an enterprise AI assistant.

Previous conversation:

{history}

Document:

{text}

Current Question:

{question}

Answer ONLY from the document.

If the answer is unavailable, reply:

"I could not find that information in the uploaded document."
"""