import pytesseract
from pytesseract import Output
from PIL import Image, ImageFilter, ImageOps
import fitz  # PyMuPDF
import io
import os
import re
from dotenv import load_dotenv
import platform

load_dotenv()

if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = os.getenv(
        "TESSERACT_PATH",
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )
else:
    pytesseract.pytesseract.tesseract_cmd = "/usr/bin/tesseract"

def preprocess_image(image: Image.Image) -> Image.Image:
    image = ImageOps.grayscale(image)
    image = image.filter(ImageFilter.MedianFilter(size=3))
    image = ImageOps.autocontrast(image)
    return image

def get_ocr_data(image: Image.Image):
    data = pytesseract.image_to_data(image, output_type=Output.DICT)
    words = []
    confidences = []
    low_conf_count = 0
    
    for i in range(len(data['text'])):
        text = data['text'][i].strip()
        conf = int(data['conf'][i])
        if text and conf != -1:
            words.append(text)
            confidences.append(conf)
            if conf < 60:
                low_conf_count += 1
                
    full_text = " ".join(words)
    avg_conf = sum(confidences) / len(confidences) if confidences else 100.0
    # Penalty for too many low confidence words
    if len(confidences) > 0 and (low_conf_count / len(confidences)) > 0.2:
        avg_conf = min(avg_conf, 59.0) # Force low confidence
        
    return full_text, avg_conf

def extract_text_from_image(file_bytes: bytes) -> dict:
    image = Image.open(io.BytesIO(file_bytes))
    image = preprocess_image(image)
    text, conf = get_ocr_data(image)
    return {
        "pages": [{"page": 1, "text": text}],
        "overall_confidence": conf
    }

def extract_text_from_pdf(file_bytes: bytes) -> dict:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_data = []
    total_conf = 0
    num_pages = len(doc)
    
    for i, page in enumerate(doc):
        text = page.get_text()
        
        # Heuristic for low quality / scanned pdf
        char_count = len(text.strip())
        alnum_count = len(re.findall(r'[a-zA-Z0-9]', text))
        ratio = (alnum_count / char_count) if char_count > 0 else 0
        
        if char_count < 50 or ratio < 0.6:
            # Fallback to OCR
            pix = page.get_pixmap(dpi=300)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            img = preprocess_image(img)
            ocr_text, conf = get_ocr_data(img)
            pages_data.append({"page": i + 1, "text": ocr_text})
            total_conf += conf
        else:
            # Good quality text layer
            pages_data.append({"page": i + 1, "text": text.strip()})
            total_conf += 100.0
            
    avg_conf = total_conf / num_pages if num_pages > 0 else 100.0
    return {
        "pages": pages_data,
        "overall_confidence": avg_conf
    }

def extract_text(file_bytes: bytes, filename: str) -> dict:
    ext = filename.lower().split(".")[-1]
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ["jpg", "jpeg", "png", "bmp", "tiff"]:
        return extract_text_from_image(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {ext}")