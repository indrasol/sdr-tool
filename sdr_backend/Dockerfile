# Use a lightweight Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables for model caching
ENV ML_MODELS_FOLDER=/app/ml_models/intent_classifier
ENV TRANSFORMERS_CACHE=/app/ml_models/intent_classifier
ENV HF_HOME=/app/ml_models/intent_classifier
ENV SENTENCE_TRANSFORMERS_HOME=/app/ml_models/intent_classifier

# Install system dependencies (if you need OCR etc.)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

    # Create model directory
RUN mkdir -p ${ML_MODELS_FOLDER}

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy model downloader script
COPY download_models.py .

# Download models during build (will use token if available)
ARG TRANSFORMER_MODEL_TOKEN
ENV TRANSFORMER_MODEL_TOKEN=${TRANSFORMER_MODEL_TOKEN}
RUN python download_models.py

# Copy app code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the port FastAPI will run on
EXPOSE 8080

# Startup command
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
