###############################################################################
# 1️  Builder stage – compile the d2json helper with Go 1.24
###############################################################################
FROM golang:1.24.4-bookworm AS d2json-builder

# Allow the stub compiler to auto-download the real 1.24 toolchain if needed
ENV GOTOOLCHAIN=auto

# Enable Go’s build cache across layers (faster CI builds)
RUN mkdir -p /go-build-cache
ENV GOMODCACHE=/go-build-cache

WORKDIR /src/d2json

# Copy go.mod/go.sum first for better cache hits
COPY sdr_backend/tools/cmd/d2json/go.* ./
RUN --mount=type=cache,target=/go-build-cache \
    go mod download

# Copy the remaining source files and build a static Linux binary
COPY sdr_backend/tools/cmd/d2json/*.go ./
RUN --mount=type=cache,target=/go-build-cache \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /out/d2json .


###############################################################################
# 2️  Runtime stage – slim Python image with D2 + d2json
###############################################################################
FROM python:3.11-slim-bookworm

# Basic runtime hygiene
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DEFAULT_TIMEOUT=100

WORKDIR /app

# ---------------------------------------------------------------------------
# OS dependencies (OCR, PDF, etc.)
# ---------------------------------------------------------------------------
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      curl tesseract-ocr poppler-utils git ca-certificates make \
 && rm -rf /var/lib/apt/lists/*


# ---------------------------------------------------------------------------
# D2 CLI
# ---------------------------------------------------------------------------
RUN curl -fsSL https://d2lang.com/install.sh | sh -s -- \
 && mv "${HOME}/.d2/bin/d2" /usr/local/bin/ \
 && chmod +x /usr/local/bin/d2 \
 && d2 --version     # sanity check during build


# ---------------------------------------------------------------------------
# d2json helper from builder
# ---------------------------------------------------------------------------
COPY --from=d2json-builder /out/d2json /usr/local/bin/d2json
RUN chmod +x /usr/local/bin/d2json && d2json --help >/dev/null


# ---------------------------------------------------------------------------
# Python dependencies
# ---------------------------------------------------------------------------
COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# ---------------------------------------------------------------------------
# Application code
# ---------------------------------------------------------------------------
COPY . .

# ---------------------------------------------------------------------------
# Non-root user (optional but recommended)
# ---------------------------------------------------------------------------
RUN useradd --create-home --shell /bin/bash app \
 && chown -R app:app /app
USER app

# Add /src to PYTHONPATH so 'from app.config' works
ENV PYTHONPATH=/app

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/docs || exit 1
    
# FastAPI listens on 8080 inside the container (change if you want)
EXPOSE 8080

# ---------------------------------------------------------------------------
# Start the API
# ---------------------------------------------------------------------------
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--access-log", "--log-level", "info"]
