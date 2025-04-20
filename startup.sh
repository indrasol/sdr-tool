#!/bin/bash
cd /home/site/wwwroot
source /antenv/bin/activate
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind=0.0.0.0:8000 --timeout 600
