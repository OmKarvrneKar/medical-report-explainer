import pytesseract
from PIL import Image, ImageFilter, ImageOps
import fitz  # PyMuPDF — install with: pip install pymupdf
import io
import os
from dotenv import load_dotenv

import platform

load_dotenv()

# Detect OS and set correct Tesseract path
if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = os.getenv(
        "TESSERACT_PATH",
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )
else:
    # Linux (Render server) — Tesseract installed via apt, lives here
    pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"

def preprocess_image(image: Image.Image) -> Image.Image:
    image = ImageOps.grayscale(image)
    image = image.filter(ImageFilter.MedianFilter(size=3))
    image = ImageOps.autocontrast(image)
    return image

def extract_text_from_image(file_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(file_bytes))
    image = preprocess_image(image)
    text = pytesseract.image_to_string(image)
    return text.strip()

def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    if full_text.strip():
        return full_text.strip()
    # If PDF has no text layer (scanned), OCR each page
    all_text = ""
    for page in doc:
        pix = page.get_pixmap(dpi=300)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        img = preprocess_image(img)
        all_text += pytesseract.image_to_string(img) + "\n"
    return all_text.strip()

def extract_text(file_bytes: bytes, filename: str) -> str:
    ext = filename.lower().split(".")[-1]
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ["jpg", "jpeg", "png", "bmp", "tiff"]:
        return extract_text_from_image(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {ext}")