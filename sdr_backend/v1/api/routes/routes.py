# routes.py (Main router file)
from fastapi import APIRouter


# Legacy Routes
# from api.routes.upload import router as upload_router
# from api.routes.analyze import router as analyze_router


# Register Routes
from v1.api.routes.register.register import router as register_router
from v1.api.routes.register.login import router as login_router
from v1.api.routes.register.auth import router as auth_router
# Model With AI -  Design
from v1.api.routes.model_with_ai.design import router as design_router
from v1.api.routes.model_with_ai.dummy_design import router as dummy_design_router
# Model With AI - Reports
# from v1.api.routes.model_with_ai.reports.generate_report import router as generate_report_router
# from v1.api.routes.model_with_ai.reports.update_report import router as update_report_router
# from v1.api.routes.model_with_ai.reports.get_report import router as get_report_router
# from v1.api.routes.model_with_ai.reports.get_report_versions import router as get_report_versions_router

# Projects
from v1.api.routes.projects.projects import router as project_router


# Redis Cache
from v1.api.routes.redis_cache_route import router as redis_cache_router

# Health
from v1.api.routes.health import router as health_router


router = APIRouter()

# Legacy Routes
# router.include_router(upload_router, tags=["Upload"])
# router.include_router(analyze_router, tags=["Analyze"])



# Register Routes
router.include_router(register_router, tags=["Register - sign_up_router"])
router.include_router(login_router, tags=["Register - login_router"])
router.include_router(auth_router, tags=["Register - auth_router"])
# Model With AI - Design
router.include_router(design_router, tags=["model_with_ai - design_router"])
router.include_router(dummy_design_router, tags=["model_with_ai - dummy_design_router"])

# Model With AI - Reports
# router.include_router(generate_report_router, tags=["model_with_ai - generate_report_router"])
# router.include_router(update_report_router, tags=["model_with_ai - update_report_router"])
# router.include_router(get_report_router, tags=["model_with_ai - get_report_router"])
# router.include_router(get_report_versions_router, tags=["model_with_ai - get_report_versions_router"])


# Projects
router.include_router(project_router, tags=["Projects - project_router"])

# Redis Cache
router.include_router(redis_cache_router, tags=["Redis Cache - redis_cache_router"])

# Health
router.include_router(health_router, tags=["Health - health_router"])