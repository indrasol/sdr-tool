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

#Threat Model
# from v1.api.routes.model_with_ai.dfd import router as dfd_router
from v1.api.routes.model_with_ai.threat_model import router as threat_model_router

# Templates
from v1.api.routes.templates import router as templates_router

# Reports
from v1.api.routes.model_with_ai.reports.generate_report import router as report_router

# Data Flow
from v1.api.routes.model_with_ai.data_flow import router as data_flow_router

# (v2 routers are included at the app level – do not import here)
from v2.api.routes.notifications import router as notifications_router
from v2.api.routes.model_with_ai.design_v2 import router as design_v2_router


router = APIRouter()

# Legacy Routes
# router.include_router(upload_router, tags=["Upload"])
# router.include_router(analyze_router, tags=["Analyze"])



# Register Routes
router.include_router(register_router, tags=["Register - sign_up_router"])
router.include_router(login_router, tags=["Register - login_router"])
router.include_router(auth_router, tags=["Register - auth_router"])

# Model With AI 
router.include_router(design_router, tags=["model_with_ai - design_router"])
router.include_router(threat_model_router, tags=["model_with_ai - threat_model_router"])

# Model With AI - Reports
router.include_router(report_router, tags=["Reports - generate report"])

# Projects
router.include_router(project_router, tags=["Projects - project_router"])
# Templates
router.include_router(templates_router, tags=["Templates - templates_router"])

# Redis Cache
router.include_router(redis_cache_router, tags=["Redis Cache - redis_cache_router"])

# Health
router.include_router(health_router, tags=["Health - health_router"])

# Data Flow
router.include_router(data_flow_router, tags=["model_with_ai - data_flow_router"])

# (notifications_router & design_v2_router mounted globally – removed here)
router.include_router(notifications_router, tags=["Notifications - notifications_router"])
router.include_router(design_v2_router, tags=["model_with_ai - design_v2_router"])