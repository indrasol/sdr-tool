# core/file_processor.py

# This module contains functions to process files. 
# It uses OCR for images (with pytesseract) and PDF text extraction (with pdfplumber)

import io
from PIL import Image
import pytesseract
# pytesseract.pytesseract.tesseract_cmd = "/usr/local/bin/tesseract"
import pdfplumber

def process_file_content_ocr(file_bytes: bytes, content_type: str) -> str:
    """
    Processes the input file and extracts text using OCR for images or
    PDF extraction for PDF documents.
    
    :param file_bytes: The file content in bytes.
    :param content_type: MIME type of the file.
    :return: Extracted text.
    """
    text_extracted = ""

    if content_type.startswith("image/"):
        try:
            image = Image.open(io.BytesIO(file_bytes))
            text_extracted = pytesseract.image_to_string(image)
        except Exception as e:
            raise Exception("Failed to process image. " + str(e))
    elif content_type == "application/pdf":
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_extracted += page_text + "\n"
        except Exception as e:
            raise Exception("Failed to process PDF. " + str(e))
    else:
        raise Exception("Unsupported file type. Please upload an image or a PDF document.")
    
    return text_extracted
