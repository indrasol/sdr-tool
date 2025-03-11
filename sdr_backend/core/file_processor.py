# import pytesseract
# from PIL import Image
# import pdf2image
# import os
# from docx import Document
# from pptx import Presentation
# from lxml import etree
# # from .config import TESSERACT_PATH

# # pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

# def extract_text_from_document(file_path: str) -> str:
#     try:
#         file_extension = os.path.splitext(file_path)[1].lower()

#         if file_extension in ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff']:  # Image files
#             return extract_text_from_image(file_path)
#         elif file_extension == '.pdf':  # PDF files
#             return extract_text_from_pdf(file_path)
#         elif file_extension == '.docx':  # DOCX files
#             return extract_text_from_docx(file_path)
#         elif file_extension == '.pptx':  # PowerPoint files
#             return extract_text_from_pptx(file_path)
#         elif file_extension == '.svg':  # SVG files
#             return extract_text_from_svg(file_path)
#         elif file_extension == '.html':  # HTML files
#             return extract_text_from_html(file_path)
#         else:
#             return "Unsupported file type"

#     except Exception as e:
#         return f"OCR Error: {str(e)}"

# ## Helper functions for extracting text from different file types
# # Extract text from image
# def extract_text_from_image(image_path: str) -> str:
#     try:
#         image = Image.open(image_path)
#         text = pytesseract.image_to_string(image)
#         return text
#     except Exception as e:
#         return f"OCR Error: {str(e)}"

# # Extract text from pdf
# def extract_text_from_pdf(pdf_path: str) -> str:
#     try:
#         images = pdf2image.convert_from_path(pdf_path)
#         extracted_text = " ".join([pytesseract.image_to_string(img) for img in images])
#         return extracted_text
#     except Exception as e:
#         return f"OCR Error: {str(e)}"

# # Extract text from docx
# def extract_text_from_docx(docx_path: str) -> str:
#     try:
#         doc = Document(docx_path)
#         full_text = [para.text for para in doc.paragraphs]
#         return "\n".join(full_text)
#     except Exception as e:
#         return f"Error reading DOCX file: {str(e)}"

# # Extract text from pptx
# def extract_text_from_pptx(pptx_path: str) -> str:
#     try:
#         presentation = Presentation(pptx_path)
#         full_text = []
#         for slide in presentation.slides:
#             for shape in slide.shapes:
#                 if hasattr(shape, "text"):
#                     full_text.append(shape.text)
#         return "\n".join(full_text)
#     except Exception as e:
#         return f"Error reading PPTX file: {str(e)}"

# # Extract text from .svg
# def extract_text_from_svg(svg_path: str) -> str:
#     try:
#         with open(svg_path, 'r') as file:
#             tree = etree.parse(file)
#             return " ".join(tree.xpath("//text()"))
#     except Exception as e:
#         return f"Error reading SVG file: {str(e)}"

# # Extract text from .html
# def extract_text_from_html(html_path: str) -> str:
#     try:
#         with open(html_path, 'r') as file:
#             tree = etree.parse(file)
#             return " ".join(tree.xpath("//text()"))
#     except Exception as e:
#         return f"Error reading HTML file: {str(e)}"
