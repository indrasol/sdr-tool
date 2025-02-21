# routes.py (Main router file)
from fastapi import APIRouter
from api.routes.upload import router as upload_router
from api.routes.analyze import router as analyze_router
from api.routes.model_with_ai.generate_architecture import router as generate_architecture_router
from api.routes.model_with_ai.chat import router as chat_router
from api.routes.model_with_ai.design import router as design_router
router = APIRouter()

# Include both routes
router.include_router(upload_router, tags=["Upload"])
router.include_router(analyze_router, tags=["Analyze"])
router.include_router(generate_architecture_router, tags=["model_with_ai - generate_architecture_router"])
router.include_router(chat_router, tags=["model_with_ai - chat_router"])
router.include_router(design_router, tags=["model_with_ai - design_router"])
