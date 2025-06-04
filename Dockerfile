# ────────── build image ──────────
FROM python:3.11-slim AS base
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY sdr_backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the actual application code
COPY sdr_backend/ .

# gunicorn will listen on 8000 inside the container
EXPOSE 8000
CMD ["gunicorn","-w","2","-k","uvicorn.workers.UvicornWorker","-b","0.0.0.0:8000","--timeout","600","main:app"]
