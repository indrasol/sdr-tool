
from fastapi import FastAPI, Request, Depends, HTTPException, status, APIRouter
from v1.api.health.health_monitor import health_monitor
from models.health_monitoring_models import RequestLog, ErrorLog, HealthStatus  
from config.settings import HEALTH_API_KEY
import uuid
import time
import datetime
from v1.api.health.health_monitor import get_api_key





# Create router for health endpoints
router = APIRouter()

@health_router.get("/health", response_model=HealthStatus, dependencies=[Depends(get_api_key)])
async def health_check(request: Request):
    # Check if there's a session_manager in the app state
    session_manager = getattr(request.app.state, "session_manager", None)
    return health_monitor.get_health_status(session_manager)

@health_router.get("/health/public")
async def public_health():
    health = health_monitor.get_health_status()
    # Return limited information for public view
    return {
        "status": health.status,
        "version": health.version,
        "uptime": health.uptime,
        "environment": health.environment
    }

@health_router.get("/health/errors", dependencies=[Depends(get_api_key)])
async def get_errors():
    return {"errors": health_monitor.error_logs}

@health_router.get("/health/requests", dependencies=[Depends(get_api_key)])
async def get_requests():
    return {"requests": health_monitor.request_logs}

@health_router.post("/health/clear-logs", dependencies=[Depends(get_api_key)])
async def clear_logs():
    health_monitor.request_logs = []
    health_monitor.error_logs = []
    health_monitor.requests_by_path = {}
    health_monitor.requests_by_method = {}
    health_monitor.requests_by_status = {}
    health_monitor.path_response_times = {}
    health_monitor.total_requests = 0
    health_monitor.total_errors = 0
    health_monitor.errors_by_path = {}
    health_monitor.errors_by_exception = {}
    return {"message": "Logs and statistics cleared successfully"}

# Function to set up health monitoring middleware
def setup_health_monitoring(app: FastAPI, session_manager=None):
    # Store session manager in app state for health checks
    if session_manager:
        app.state.session_manager = session_manager
        
    # Capture route information
    health_monitor.capture_routes_info(app)
    
    # Add middleware to monitor requests
    @app.middleware("http")
    async def health_monitoring_middleware(request: Request, call_next):
        # Skip monitoring for static files if applicable
        if request.url.path.startswith(("/reports/", "/outputs/")):
            return await call_next(request)
            
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Record start time
        start_time = time.time()
        
        try:
            # Process the request
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Log the request
            request_log = RequestLog(
                request_id=request_id,
                timestamp=datetime.datetime.now(),
                path=request.url.path,
                method=request.method,
                status_code=response.status_code,
                duration_ms=duration_ms,
                client_ip=request.client.host if request.client else "unknown",
                user_agent=request.headers.get("user-agent"),
            )
            health_monitor.log_request(request_log)
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            return response
            
        except Exception as e:
            # Calculate duration even for errors
            duration_ms = (time.time() - start_time) * 1000
            
            # Log the error
            import traceback
            error_details = str(e)
            error_traceback = traceback.format_exc()
            
            error_log = ErrorLog(
                error_id=str(uuid.uuid4()),
                timestamp=datetime.datetime.now(),
                path=request.url.path,
                method=request.method,
                exception=error_details,
                traceback=error_traceback,
                request_id=request_id
            )
            health_monitor.log_error(error_log)
            
            # Log the failed request too
            request_log = RequestLog(
                request_id=request_id,
                timestamp=datetime.datetime.now(),
                path=request.url.path,
                method=request.method,
                status_code=500,  # Assuming server error
                duration_ms=duration_ms,
                client_ip=request.client.host if request.client else "unknown",
                user_agent=request.headers.get("user-agent"),
                error=error_details
            )
            health_monitor.log_request(request_log)
            
            # Let the exception propagate so the app's exception handlers can catch it
            raise
