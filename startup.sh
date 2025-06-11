#!/bin/bash

# Set Python path
export PYTHONPATH=/home/site/wwwroot/sdr_backend:$PYTHONPATH

# Log startup
echo "Starting SecureTrack application..."
echo "Python path: $PYTHONPATH"
echo "Working directory: $(pwd)"
echo "Directory contents:"
ls -la /home/site/wwwroot/

# Start Gunicorn with proper configuration
cd /home/site/wwwroot
exec gunicorn \
    --workers 2 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 600 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    sdr_backend.main:app
