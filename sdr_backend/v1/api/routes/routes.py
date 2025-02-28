# routes.py (Main router file)
from fastapi import APIRouter
# from api.routes.upload import router as upload_router
# from api.routes.analyze import router as analyze_router
from v1.api.routes.model_with_ai.generate_architecture import router as generate_architecture_router
# from api.routes.model_with_ai.chat import router as chat_router

# Model With AI -  Design
from v1.api.routes.model_with_ai.design import router as design_router

# Model With AI - Reports
from v1.api.routes.model_with_ai.reports.generate_report import router as generate_report_router
from v1.api.routes.model_with_ai.reports.update_report import router as update_report_router
from v1.api.routes.model_with_ai.reports.get_report import router as get_report_router
from v1.api.routes.model_with_ai.reports.get_report_versions import router as get_report_versions_router
from v1.api.routes.projects.projects import router as project_router
router = APIRouter()

# Legacy Routes
# router.include_router(upload_router, tags=["Upload"])
# router.include_router(analyze_router, tags=["Analyze"])
router.include_router(generate_architecture_router, tags=["model_with_ai - generate_architecture_router"])
# router.include_router(chat_router, tags=["model_with_ai - chat_router"])

# Model With AI - Design
router.include_router(design_router, tags=["model_with_ai - design_router"])

# Model With AI - Reports
router.include_router(generate_report_router, tags=["model_with_ai - generate_report_router"])
router.include_router(update_report_router, tags=["model_with_ai - update_report_router"])
router.include_router(get_report_router, tags=["model_with_ai - get_report_router"])
router.include_router(get_report_versions_router, tags=["model_with_ai - get_report_versions_router"])
router.include_router(project_router, tags=["Projects"])