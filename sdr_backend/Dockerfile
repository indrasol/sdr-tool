# ────────────────────────────── 1️⃣  builder stage ─────────────────────────────
FROM golang:1.22-bullseye AS d2json-builder

WORKDIR /src/d2json

# Copy only the d2json helper source (better cache hit-rate)
COPY sdr_backend/tools/cmd/d2json/go.* ./
RUN go mod download                            # cache Go deps first

COPY sdr_backend/tools/cmd/d2json/*.go ./
# Produce a static binary so the runtime image needs no libc
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /out/d2json .


# ────────────────────────────── 2️⃣  runtime stage ─────────────────────────────
# Use a lightweight Python image
FROM python:3.11-slim


ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    # Keep the binary cache small for pip
    PIP_DEFAULT_TIMEOUT=100

# -- APT packages only once ----------------------------------------------------
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      curl         \
      tesseract-ocr \
      poppler-utils \
      git           \
      ca-certificates \
 && rm -rf /var/lib/apt/lists/*


 # -- D2 CLI --------------------------------------------------------------------
RUN curl -fsSL https://d2lang.com/install.sh | sh \
&& mv "${HOME}/.d2/bin/d2" /usr/local/bin/ \
&& chmod +x /usr/local/bin/d2 \
&& d2 --version                                  # emits 0.7.0 during build


# -- d2json binary from builder -------------------------------------------------
COPY --from=d2json-builder /out/d2json /usr/local/bin/d2json
RUN chmod +x /usr/local/bin/d2json && d2json --help >/dev/null


 # -- layer 2 : Python deps ----------------------------------------------------
# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# -- layer 3 : application code ----------------------------------------------
# Copy app code
COPY . .

# Expose the port FastAPI will run on
EXPOSE 8080

# Startup command
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
