# main.py
import time
import uvicorn
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from fastapi import FastAPI, Request, Response, Depends
from v1.api.routes.routes import router as api_router
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import uuid
# from config.settings import origins
from config.settings import title
from config.settings import description
from config.settings import version
from fastapi.staticfiles import StaticFiles
from config.settings import REPORTS_DIR
from config.settings import ML_MODELS_DIR
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request
from core.intent_classification.intent_dataset import train_intent_classifier
from contextlib import asynccontextmanager
from utils.logger import log_info
from core.cache.session_manager import SessionManager
from config.settings import SUPABASE_URL
from alembic import command
import anthropic
import httpx
from alembic.config import Config
from v1.api.health.health_monitor import health_monitor
from v1.api.routes.health import setup_health_monitoring
from services.logging import setup_logging
import sys
# Prometheus instrumentation
from prometheus_fastapi_instrumentator import Instrumentator
from utils.prometheus_metrics import setup_custom_metrics_endpoint, APP_ACTIVE_SESSIONS, authenticate_metrics
import os


session_manager = SessionManager()
# logger = setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):

    log_info("Starting up SecureTrack ")
    log_info(f"Anthropic version: {anthropic.__version__}")
    log_info(f"httpx version: {httpx.__version__}")
    # Startup: Connect to database and Redis
    log_info("Connecting redis session manager...")
    
    try:
        await session_manager.connect()  # Connect to Redis
        log_info("Connected to session manager...")

        # Initialize health monitoring after app is fully set up
        log_info("Setting up health monitoring...")
        # Capture initial route information after all routes are registered
        health_monitor.capture_routes_info(app)
        log_info("Health monitoring initialized.")

        # Initialize active sessions gauge
        APP_ACTIVE_SESSIONS.set(0)
        
        yield
    finally:
        # Cleanup resources in finally block to ensure they run even on errors
        await session_manager.disconnect()  # Disconnect from Redis
        log_info("disconnected redis session manager...")
        log_info("Shutting down")


app = FastAPI(
    title="SecureTrack - A Secure Architecture Analyzer",
    description="Analyzes security architecture documents and images to identify gaps and provide recommendations.",
    version="1.0.0",
    lifespan=lifespan
)

# Allow frontend origins
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",  # React default port
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
    "https://securetrackv1.netlify.app",
    "https://development--securetrackv1.netlify.app"
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows specific origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Set up health monitoring middleware (needs to be after CORS middleware)
setup_health_monitoring(app, session_manager)

# Set up custom metrics endpoint
setup_custom_metrics_endpoint(app)

# Prometheus instrumentation for default metrics
Instrumentator().instrument(app)

# Custom exception handler for HTTP exceptions
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    log_info(f"HTTP exception: {exc.detail}, status_code: {exc.status_code}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    log_info(f"Validation error: {str(exc)}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# Add custom exception handler for all other exceptions
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    log_info(f"Unhandled exception in {request.url.path}: {str(exc)}")
    log_info(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )

# Include our API routes under the /api prefix
app.include_router(api_router, prefix="/v1/routes")


@app.get("/metrics", dependencies=[Depends(authenticate_metrics)])
async def default_metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint providing basic API information.
    """
    return {
        "name": "SecureTrack - A Secure Architecture Analyzer",
        "App version": "1.0.0",
        "python_version": sys.version,
        "docs_url": "/docs",
        "health_check": "https://securetrack.onrender.com/v1/routes/health"
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
