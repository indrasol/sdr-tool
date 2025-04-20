#!/bin/bash
cd /home/site/wwwroot
source /antenv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
