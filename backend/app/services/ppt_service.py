from pptx import Presentation

def extract_text_from_ppt(ppt_path: str):
    presentation = Presentation(ppt_path)
    text = ""

    for slide in presentation.slides:
        for shape in slide.shapes:
            if hasattr(shape, "text"):
                text += shape.text + "\n"
    return text.strip()