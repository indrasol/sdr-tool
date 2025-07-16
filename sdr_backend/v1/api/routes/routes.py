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

# Teams
from v1.api.routes.teams.teams import router as teams_router

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

# Notifications
from v1.api.routes.notifications import router as notifications_router

# Design V2
from v1.api.routes.model_with_ai.design_v2 import router as design_v2_router

# Dashboard
from v1.api.routes.dashboard.metrics import router as dashboard_metrics_router
from v1.api.routes.dashboard.reports import router as dashboard_reports_router


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

# Teams
router.include_router(teams_router, tags=["Teams - teams_router"])

# Templates
router.include_router(templates_router, tags=["Templates - templates_router"])

# Redis Cache
router.include_router(redis_cache_router, tags=["Redis Cache - redis_cache_router"])

# Health
router.include_router(health_router, tags=["Health - health_router"])

# Data Flow
router.include_router(data_flow_router, tags=["model_with_ai - data_flow_router"])

# Notifications
router.include_router(notifications_router, tags=["Notifications - notifications_router"])

# Design V2
router.include_router(design_v2_router, tags=["model_with_ai - design_v2_router"])

# Dashboard
router.include_router(dashboard_metrics_router, tags=["Dashboard - metrics"])
router.include_router(dashboard_reports_router, tags=["Dashboard - recent reports"])