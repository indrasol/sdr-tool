FROM python:3.8.10-slim

WORKDIR /app

# Install system dependencies needed for building Python packages
# Removed rustc and cargo, added curl for rustup installation
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
    tesseract-ocr \
    libtesseract-dev \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install rustup to get the latest Rust and Cargo
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Add Rust to the PATH
ENV PATH="/root/.cargo/bin:${PATH}"

# Upgrade pip to the latest available version
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy requirements file
COPY requirements.txt .

# Install dependencies
# RUN pip install --no-cache-dir -r requirements.txt

# Install packages in groups to isolate issues
# Base packages
RUN pip install --no-cache-dir fastapi==0.109.2 uvicorn==0.27.1 python-multipart==0.0.9 tenacity==8.2.3

RUN pip install --no-cache-dir pydantic==2.3.0

# Install packages that depend on pydantic
RUN pip install --no-cache-dir pydantic-settings==2.1.0

# Image processing
RUN pip install --no-cache-dir pytesseract==0.3.10 Pillow==9.5.0

# Database
RUN pip install --no-cache-dir sqlalchemy==2.0.27 psycopg2-binary==2.9.9 pandas==2.0.3 aiosqlite==0.19.0 asyncpg==0.29.0
RUN pip install --no-cache-dir redis==5.0.1 aioredis==2.0.1 databases==0.8.0 alembic==1.13.1

# Configuration and utilities
RUN pip install --no-cache-dir python-dotenv==1.0.1 pyyaml==6.0.1 PyJWT==2.8.0

# AI/LLM packages with explicit dependency order
# Install httpx first at compatible version
RUN pip install --no-cache-dir httpx==0.27.2
# AI packages
RUN pip install --no-cache-dir openai==1.13.3 anthropic==0.49.0

# ML packages
RUN pip install --no-cache-dir scikit-learn==1.2.2 faiss-cpu==1.8.0
RUN pip install --no-cache-dir torch==2.0.1
RUN pip install --no-cache-dir accelerate==1.0.1 sentence-transformers==3.2.1

# API clients
RUN pip install --no-cache-dir supabase>=1.0.0 python-jose==3.3.0 postgrest==0.10.6

# Create a non-root user and switch to it (commented out as in original)
# RUN adduser --disabled-password --gecos '' appuser
# USER appuser

# Copy application code (as root, then change permissions) (commented out as in original)
# COPY --chown=appuser:appuser . .
COPY . .

# Run the application
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
