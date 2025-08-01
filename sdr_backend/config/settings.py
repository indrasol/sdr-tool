import os
from dotenv import load_dotenv

load_dotenv()

env = os.getenv('ENV', 'development') 

if env == 'development':
    load_dotenv('.env.dev')
elif env == 'production':
    load_dotenv('.env.prod')

# Main
title=os.getenv("title")
description=os.getenv("description")
version=os.getenv("version")

print(f"title: {title}, description: {description}, version: {version}")

# API Keys
OPENAI_API_KEY = os.getenv("OPENAIST")
# CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPICAPIKEYST")
GROK_API_KEY = os.getenv("GROKAPIKEYST")
# CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY"


# Langsmith Tracing
# LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")
# LANGSMITH_TRACING=os.getenv("LANGSMITH_TRACING", "false")  # Default to false if not set
# LANGSMITH_ENDPOINT=os.getenv("LANGSMITH_ENDPOINT", "https://api.langsmith.com/v1/trace")  # Default endpoint
# LANGSMITH_PROJECT=os.getenv("LANGSMITH_PROJECT", "default_project")  # Default project name

# TESSERACT_PATH = os.getenv("TESSERACT_PATH", "C:/Program Files/Tesseract-OCR/tesseract.exe")  # Update if needed

# Feature flags
IR_BUILDER_MIN_ACTIVE = os.getenv("IR_BUILDER_MIN_ACTIVE", "true").lower() in {"1", "true", "yes"}

# vector DB
# Get the VECTOR_DB_PATH from your environment
VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", "knowledge_base/faiss_index/index.faiss")


# Allow frontend origins (Update this to match your frontend URL)
# origins = os.getenv("origins").split(",")  # Split comma-separated string into list


CVE_API_URL=os.getenv("CVE_API_URL")

# Get the base directory of the entire project (one level up from /config)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load the CVE data path from .env but make it relative to BASE_DIR
CVE_DATA_PATH = os.getenv("CVE_DATA_PATH", "knowledge_base/cve_data/cve_data.json")

# Ensure it's a valid path within the project
if not os.path.isabs(CVE_DATA_PATH):
    CVE_DATA_PATH = os.path.join(BASE_DIR, CVE_DATA_PATH)

# Uploads directory
UPLOADS_DIR = os.getenv("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))

# Output directory
OUTPUT_DIR = os.getenv("OUTPUT_FOLDER", os.path.join(BASE_DIR, "output"))

# Reports directory
REPORTS_DIR = os.getenv("REPORTS_FOLDER", os.path.join(BASE_DIR, "reports"))

# ML Models directory
ML_MODELS_DIR = os.getenv("ML_MODELS_FOLDER", os.path.join(BASE_DIR, "ml_models/intent_classifier"))

# JWT Secret Key
SUPABASE_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

# Database
# DB_USER = os.getenv("DB_USER")
# DB_PASSWORD = os.getenv("DB_PASSWORD")
# DB_HOST = os.getenv("DB_HOST")
# DB_PORT = os.getenv("DB_PORT")
# DB_NAME = os.getenv("DB_NAME")

# POSTGRES_DATABASE_URL = os.getenv("POSTGRES_DATABASE_URL")

SUPABASE_URL = os.getenv("SUPABASE_DB_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_PROJECT_URL = os.getenv("SUPABASEURLST")
SUPABASE_API_KEY = os.getenv("SUPABASEAPIKEYST")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASESERVICEKEYST")
SUPABASE_SECRET_KEY = os.getenv("SUPABASESECRETKEYST")

HEALTH_API_KEY = os.getenv("HEALTH_API_KEY")


# Redis settings for session management
REDIS_HOST = os.getenv("REDISHOSTST")
REDIS_PORT = os.getenv("REDISPORTST")
REDIS_PASSWORD = os.getenv("REDISPASSWORDST")
REDIS_DB = os.getenv("REDISDBST")
SESSION_EXPIRY = os.getenv("SESSIONEXPIRYST")
DATABASE_URL_ASYNC = os.getenv("DATABASEURLASYNCST")
SUPABASE_DATABASE_URL = os.getenv("SUPABASEDATABASEURLST")

# Custom Metrics
METRICS_USERNAME = os.getenv("METRICS_USERNAME")
METRICS_PASSWORD = os.getenv("METRICS_PASSWORD")

# Trasnformer Model Token
TRANSFORMER_MODEL_TOKEN = os.getenv("TRANSFORMERMODELTOKENST")