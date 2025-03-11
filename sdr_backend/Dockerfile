FROM python:3.8.10-slim

WORKDIR /app

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip>=25.0.1

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create a non-root user and switch to it
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Copy application code (as root, then change permissions)
COPY --chown=appuser:appuser . .

# Run the application
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
