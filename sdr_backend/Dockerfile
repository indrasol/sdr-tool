FROM python:3.8.10-slim

WORKDIR /app

# Upgrade pip to the latest version
RUN pip install --no-cache-dir --upgrade pip>=25.0.1

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run the application
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
