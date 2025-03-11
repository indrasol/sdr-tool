FROM python:3.8.10-slim

WORKDIR /app

# Install system dependencies needed for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    python3-dev \
    git \
    cmake \
    pkg-config \
    libpq-dev \
    libffi-dev \
    libjpeg-dev \
    libopenblas-dev \
    rustc \
    cargo \
    tesseract-ocr \
    libtesseract-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade 'pip>=25.0.1' setuptools wheel

# Copy requirements file
COPY requirements.txt .

# Install dependencies
# RUN pip install --no-cache-dir -r requirements.txt

# Install packages in groups to isolate issues
RUN pip install --no-cache-dir fastapi==0.109.2 uvicorn==0.27.1 python-multipart==0.0.9 httpx==0.24.1 tenacity==8.2.3
RUN pip install --no-cache-dir pytesseract==0.3.10 Pillow==9.5.0 lxml==4.9.3
RUN pip install --no-cache-dir pdfplumber==0.10.3 pdf2image==1.17.0 python-docx==1.0.1 python-pptx==0.6.22 reportlab==4.0.8
RUN pip install --no-cache-dir sqlalchemy==2.0.27 psycopg2-binary==2.9.9 pandas==2.0.3 aiosqlite==0.19.0 asyncpg==0.29.0
RUN pip install --no-cache-dir redis==5.0.1 aioredis==2.0.1 databases==0.8.0 alembic==1.13.1
RUN pip install --no-cache-dir python-dotenv==1.0.1 pydantic-settings==2.1.0 pyyaml==6.0.1 PyJWT==2.8.0
RUN pip install --no-cache-dir openai==1.13.3 anthropic==0.8.1
RUN pip install --no-cache-dir scikit-learn==1.2.2 faiss-cpu==1.7.4
RUN pip install --no-cache-dir torch==2.0.1
RUN pip install --no-cache-dir transformers==4.36.2 accelerate==0.26.1
RUN pip install --no-cache-dir langchain==0.1.11 langchain-openai==0.0.5 langchain-community==0.0.19

# Create a non-root user and switch to it
# RUN adduser --disabled-password --gecos '' appuser
# USER appuser

# Copy application code (as root, then change permissions)
# COPY --chown=appuser:appuser . .
COPY . .

# Run the application
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
