import os
from dotenv import load_dotenv

load_dotenv()

# Main
title=os.getenv("title")
description=os.getenv("description")
version=os.getenv("version")

print(f"title: {title}, description: {description}, version: {version}")

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# TESSERACT_PATH = os.getenv("TESSERACT_PATH", "C:/Program Files/Tesseract-OCR/tesseract.exe")  # Update if needed

# vector DB
# Get the VECTOR_DB_PATH from your environment
VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", "knowledge_base/faiss_index/index.faiss")


# Allow frontend origins (Update this to match your frontend URL)
# origins = os.getenv("origins").split(",")  # Split comma-separated string into list


CVE_API_URL=os.getenv("CVE_API_URL")

# Get the base directory of the entire project (one level up from /config)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load the CVE data path from .env but make it relative to BASE_DIR
CVE_DATA_PATH = os.getenv("CVE_DATA_PATH", "knowledge_base/cve_data/cve_data.json")

# Ensure it's a valid path within the project
if not os.path.isabs(CVE_DATA_PATH):
    CVE_DATA_PATH = os.path.join(BASE_DIR, CVE_DATA_PATH)

# Uploads directory
UPLOADS_DIR = os.getenv("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))

# Output directory
OUTPUT_DIR = os.getenv("OUTPUT_FOLDER", os.path.join(BASE_DIR, "output"))
