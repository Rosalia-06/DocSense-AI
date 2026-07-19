from paddleocr import PaddleOCR
from PIL import Image

ocr = PaddleOCR(use_angle_cls=True, lang="en")


def extract_text_from_image(image_path: str):

    result = ocr.ocr(image_path)

    text = ""

    for page in result:
        for line in page:
            text += line[1][0] + "\n"

    return text.strip()