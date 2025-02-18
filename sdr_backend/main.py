# main.py
import uvicorn
from fastapi import FastAPI
from api.routes.routes import router as api_router
from fastapi.middleware.cors import CORSMiddleware
# from config.settings import origins
from config.settings import title
from config.settings import description
from config.settings import version
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title=title,
    description=description,
    version=version,
)

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
app.include_router(api_router, prefix="/api/routes")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
