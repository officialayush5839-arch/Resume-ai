import os
import pymupdf as fitz  # PyMuPDF (modern import)
import docx
from app.parsers.ocr import extract_text_with_ocr

def parse_pdf(file_path: str) -> str:
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
        
        if len(text.strip()) < 50:
            text = extract_text_with_ocr(file_path)
            
    except Exception as e:
        print(f"Error parsing PDF: {e}")
    return text

def parse_docx(file_path: str) -> str:
    text = ""
    try:
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error parsing DOCX: {e}")
    return text

def parse_file(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        return parse_pdf(file_path)
    elif ext in ['.docx', '.doc']:
        return parse_docx(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")
