# routes.py (Main router file)
from fastapi import APIRouter
from api.routes.upload import router as upload_router
from api.routes.analyze import router as analyze_router

router = APIRouter()

# Include both routes
router.include_router(upload_router, tags=["Upload"])
router.include_router(analyze_router, tags=["Analyze"])
