# main.py
import uvicorn
from fastapi import FastAPI
from v1.api.routes.routes import router as api_router
from fastapi.middleware.cors import CORSMiddleware
# from config.settings import origins
from config.settings import title
from config.settings import description
from config.settings import version
from fastapi.staticfiles import StaticFiles
from config.settings import REPORTS_DIR
from config.settings import ML_MODELS_DIR
from core.intent_classification.intent_dataset import train_intent_classifier
from contextlib import asynccontextmanager
from utils.logger import log_info
from core.intent_classification.intent_classifier import IntentClassifier
from core.db.connection_manager import create_tables
from core.cache.session_manager import SessionManager



session_manager = SessionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to database and Redis
    log_info("Creating tables...")
    await create_tables()

    log_info("Connecting redis session manager...")
    await session_manager.connect()  # Connect to Redis
    log_info("Connected to session manager...")

    log_info("Loading pre-trained intent classifier")
    global classifier
    classifier = IntentClassifier(model_path=ML_MODELS_DIR)  # Load the model here

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


app.mount("/reports", StaticFiles(directory=REPORTS_DIR), name="reports")
# Mount the "outputs" directory as a static files directory
# app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Allow frontend origins (Update this to match your frontend URL)
origins = [
    "http://localhost:8080",  # If your frontend runs on port 3000
    "http://127.0.0.1:8080",  # Alternative localhost format
    "http://yourfrontenddomain.com",  # Add this if deployed
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows specific origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Include our API routes under the /api prefix
app.include_router(api_router, prefix="/v1/routes")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
