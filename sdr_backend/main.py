# main.py
import uvicorn
from fastapi import FastAPI
from v1.api.routes.routes import router as api_router
from fastapi.middleware.cors import CORSMiddleware
import asyncio
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
from core.intent_classification.intent_classifier import IntentClassifier
from core.cache.session_manager import SessionManager
from config.settings import SUPABASE_URL
from alembic import command
from alembic.config import Config



session_manager = SessionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to database and Redis
    log_info("Connecting redis session manager...")
    await session_manager.connect()  # Connect to Redis
    log_info("Connected to session manager...")

    log_info("Loading pre-trained intent classifier")
    global classifier
    # classifier = IntentClassifier(model_path=ML_MODELS_DIR)  # Load the model here

    # Apply database migrations with Alembic
    log_info("Loading Alembic configuration...")
    # alembic_cfg = Config("alembic.ini")  # Load config from alembic.ini
    # alembic_cfg.set_main_option("sqlalchemy.url", SUPABASE_URL)  # Set the database URL
    log_info("Applying all pending migrations...")
    # command.upgrade(alembic_cfg, "head")  # Apply migrations to the latest version
    log_info("Database migrations applied successfully.")

    yield
    await session_manager.disconnect()  # Disconnect from Redis
    log_info("disconnected redis session manager...")
    log_info("Shutting down")


app = FastAPI(
    title=title,
    description=description,
    version=version,
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


# Add custom exception handler for HTTP exceptions
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    log_info(f"HTTP exception: {exc.detail}, status_code: {exc.status_code}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

# Add custom exception handler for validation errors
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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
