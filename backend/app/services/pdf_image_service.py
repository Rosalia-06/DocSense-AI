from pdf2image import convert_from_path

def pdf_to_images(pdf_path):
    images = convert_from_path(pdf_path)
    paths = []
    for i, image in enumerate(images):
        path = f"{pdf_path}_{i}.png"
        image.save(path)
        paths.append(path)
    return paths