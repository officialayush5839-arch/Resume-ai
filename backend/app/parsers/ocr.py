import pymupdf as fitz  # PyMuPDF (modern import)
import pytesseract
from PIL import Image
import io

def extract_text_with_ocr(pdf_path: str) -> str:
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images(full=True)
            for img_index, img in enumerate(image_list):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image = Image.open(io.BytesIO(image_bytes))
                text += pytesseract.image_to_string(image) + "\n"
    except Exception as e:
        print(f"OCR Error: {e}")
    return text
