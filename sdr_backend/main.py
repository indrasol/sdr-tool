# main.py
import time
import uvicorn
from fastapi import FastAPI
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
from alembic.config import Config
from v1.api.health.health_monitor import health_monitor
from v1.api.routes.health import setup_health_monitoring
from services.logging import setup_logging


session_manager = SessionManager()
# logger = setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):

    log_info("Starting up SecureTrack ")
    # Startup: Connect to database and Redis
    log_info("Connecting redis session manager...")
    
    await session_manager.connect()  # Connect to Redis
    log_info("Connected to session manager...")

    # Apply database migrations with Alembic
    # logger.info("Loading Alembic configuration...")
    # alembic_cfg = Config("alembic.ini")  # Load config from alembic.ini
    # alembic_cfg.set_main_option("sqlalchemy.url", SUPABASE_URL)  # Set the database URL
    # logger.info("Applying all pending migrations...")
    # command.upgrade(alembic_cfg, "head")  # Apply migrations to the latest version
    # logger.info("Database migrations applied successfully.")

    # Initialize health monitoring after app is fully set up
    log_info("Setting up health monitoring...")
    # Capture initial route information after all routes are registered
    health_monitor.capture_routes_info(app)
    log_info("Health monitoring initialized.")

    yield
    await session_manager.disconnect()  # Disconnect from Redis
    log_info("disconnected redis session manager...")
    log_info("Shutting down")


app = FastAPI(
    title="SecureTrack - A Secure Architecture Analyzer",
    description="Analyzes security architecture documents and images to identify gaps and provide recommendations.",
    version="1.0.0",
    lifespan=lifespan
)


# app.mount("/reports", StaticFiles(directory=REPORTS_DIR), name="reports")
# Mount the "outputs" directory as a static files directory
# app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Allow frontend origins
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",  # React default port
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
    "https://securetrack.netlify.app",
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

# Add request ID middleware
# @app.middleware("http")
# async def request_middleware(request: Request, call_next):
#     """
#     Middleware to add request ID and timing information.
#     """
#     # Generate unique request ID
#     request_id = str(uuid.uuid4())
#     request.state.request_id = request_id
    
#     # Track request timing
#     start_time = time.time()
    
#     # Process request
#     try:
#         response = await call_next(request)
        
#         # Add request ID and processing time headers
#         process_time = time.time() - start_time
#         response.headers["X-Request-ID"] = request_id
#         response.headers["X-Process-Time"] = str(process_time)
        
#         # Log request details
#         logger.info(
#             f"Request processed",
#             extra={
#                 "props": {
#                     "request_id": request_id,
#                     "method": request.method,
#                     "path": request.url.path,
#                     "status_code": response.status_code,
#                     "process_time": process_time
#                 }
#             }
#         )
        
#         return response
#     except Exception as e:
#         # Log error details
#         logger.error(
#             f"Request failed: {str(e)}",
#             exc_info=True,
#             extra={
#                 "props": {
#                     "request_id": request_id,
#                     "method": request.method,
#                     "path": request.url.path
#                 }
#             }
#         )
        
#         # Re-raise to be handled by exception handlers
#         raise


# # Exception handlers
# @app.exception_handler(RequestValidationError)
# async def validation_exception_handler(request: Request, exc: RequestValidationError):
#     """
#     Handle validation errors in request data.
#     """
#     logger.warning(
#         "Validation error",
#         extra={
#             "props": {
#                 "request_id": getattr(request.state, "request_id", "unknown"),
#                 "errors": exc.errors()
#             }
#         }
#     )
    
#     return JSONResponse(
#         status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
#         content={
#             "detail": exc.errors(),
#             "request_id": getattr(request.state, "request_id", "unknown")
#         }
#     )

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

# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint providing basic API information.
    """
    return {
        "name": "SecureTrack - A Secure Architecture Analyzer",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": f"{https://securetrack.onrender.com/v1/routes}/health"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
