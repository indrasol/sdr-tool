# ────────── Go builder stage for d2json tool ──────────
FROM golang:1.24.4-bookworm AS d2json-builder
WORKDIR /src/d2json

# Copy Go module files first for caching
COPY sdr_backend/tools/cmd/d2json/go.* ./

# Download dependencies (this will cache unless go.mod changes)
RUN go mod download

# Copy the rest of the source and build the binary
COPY sdr_backend/tools/cmd/d2json/*.go ./
RUN go build -o /d2json main.go  # Adjust if your entrypoint file is different, e.g., d2json.go

# Copy the rest of the source and build the binary
COPY sdr_backend/tools/cmd/d2json/*.go ./
RUN GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /d2json main.go

# ────────── build image ──────────
# 1) Force amd64 so Azure Web App (x86_64) can run it
FROM python:3.11-slim-bookworm AS base
WORKDIR /app

# Install system deps (including tesseract for OCR, poppler for PDFs, git for potential runtime use)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    tesseract-ocr \
    poppler-utils \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install D2
RUN curl -fsSL https://d2lang.com/install.sh | sh -s --

# Copy the built d2json binary from the Go stage
COPY --from=d2json-builder /d2json /usr/local/bin/d2json

# Install system dependencies that might be needed
# RUN apt-get update && apt-get install -y \
#     curl \
#     && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY sdr_backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the actual application code
COPY sdr_backend/ .

# Create a non-root user for security
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/docs || exit 1

# gunicorn will listen on 8000 inside the container
EXPOSE 8000

# Simplified startup command with better error handling
# CMD ["gunicorn", "--workers", "2", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "info", "main:app"]
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--access-log", "--log-level", "info"]
