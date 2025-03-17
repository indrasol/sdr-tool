# v1/api/health/health_monitor.py
import time
import os
import logging
import psutil
import datetime
import uuid
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, Header, Request, Depends, HTTPException, Security, status, APIRouter
from fastapi.security import APIKeyHeader
from fastapi.responses import JSONResponse
from models.health_monitoring_models import RequestLog, ErrorLog, HealthStatus
from config.settings import HEALTH_API_KEY
import secrets
from utils.logger import log_info
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("health_monitor")

# Models


# In-memory storage for logs (will reset on app restart on Render)
class HealthMonitor:
    def __init__(self, max_logs=500):
        self.start_time = datetime.datetime.now()
        self.request_logs: List[RequestLog] = []
        self.error_logs: List[ErrorLog] = []
        self.max_logs = max_logs
        self.version = os.getenv("APP_VERSION", "1.0.0")
        self.environment = os.getenv("ENVIRONMENT", "development")
        
        # Request statistics
        self.total_requests = 0
        self.requests_by_path = {}
        self.requests_by_method = {}
        self.requests_by_status = {}
        self.requests_by_tag = {}
        
        # Performance statistics
        self.path_response_times = {}
        
        # Error statistics
        self.total_errors = 0
        self.errors_by_path = {}
        self.errors_by_exception = {}
        
        # Route information
        self.routes_info = {}
    
    def log_request(self, request_log: RequestLog):
        self.request_logs.append(request_log)
        self.total_requests += 1
        
        # Update statistics
        self.requests_by_path[request_log.path] = self.requests_by_path.get(request_log.path, 0) + 1
        self.requests_by_method[request_log.method] = self.requests_by_method.get(request_log.method, 0) + 1
        self.requests_by_status[request_log.status_code] = self.requests_by_status.get(request_log.status_code, 0) + 1
        
        # Update response time tracking
        if request_log.path not in self.path_response_times:
            self.path_response_times[request_log.path] = {
                "count": 0,
                "total_ms": 0,
                "avg_ms": 0,
                "min_ms": float('inf'),
                "max_ms": 0
            }
            
        path_stats = self.path_response_times[request_log.path]
        path_stats["count"] += 1
        path_stats["total_ms"] += request_log.duration_ms
        path_stats["avg_ms"] = path_stats["total_ms"] / path_stats["count"]
        path_stats["min_ms"] = min(path_stats["min_ms"], request_log.duration_ms)
        path_stats["max_ms"] = max(path_stats["max_ms"], request_log.duration_ms)
        
        # Trim logs if needed (memory management for Render free tier)
        if len(self.request_logs) > self.max_logs:
            self.request_logs = self.request_logs[-self.max_logs:]
    
    def log_error(self, error_log: ErrorLog):
        self.error_logs.append(error_log)
        self.total_errors += 1
        
        # Update statistics
        self.errors_by_path[error_log.path] = self.errors_by_path.get(error_log.path, 0) + 1
        exception_type = error_log.exception.split(":")[0] if ":" in error_log.exception else error_log.exception
        self.errors_by_exception[exception_type] = self.errors_by_exception.get(exception_type, 0) + 1
        
        # Trim logs if needed (memory management for Render free tier)
        if len(self.error_logs) > self.max_logs:
            self.error_logs = self.error_logs[-self.max_logs:]
    
    def capture_routes_info(self, app: FastAPI):
        """Capture information about all registered routes"""
        routes_by_tag = {}
        
        for route in app.routes:
            # Skip health monitoring routes to avoid cluttering
            if getattr(route, "path", "").startswith("/v1/routes/health"):
                continue
                
            path = getattr(route, "path", "unknown")
            methods = getattr(route, "methods", ["unknown"])
            
            # Try to extract tags if available
            tags = []
            if hasattr(route, "tags"):
                tags = route.tags
            elif hasattr(route, "endpoint") and hasattr(route.endpoint, "__tags__"):
                tags = route.endpoint.__tags__
                
            # Default tag if none found
            if not tags:
                tags = ["untagged"]
                
            for tag in tags:
                if tag not in routes_by_tag:
                    routes_by_tag[tag] = []
                    
                routes_by_tag[tag].append({
                    "path": path,
                    "methods": list(methods) if methods else ["unknown"]
                })
                
        self.routes_info = routes_by_tag
    
    def get_health_status(self, session_manager=None) -> HealthStatus:
        uptime = datetime.datetime.now() - self.start_time
        uptime_str = str(uptime).split('.')[0]  # Remove microseconds
        
        # Get CPU and memory usage
        try:
            cpu_usage = psutil.cpu_percent(interval=0.1)
            memory_usage = psutil.virtual_memory().percent
        except Exception as e:
            log_info(f"Error getting system stats: {e}")
            cpu_usage = 0
            memory_usage = 0
        
        # Check Redis status
        redis_status = "unknown"
        if session_manager:
            try:
                redis_status = "connected" if session_manager.is_connected else "disconnected"
            except Exception as e:
                log_info(f"Error checking Redis status: {e}")
                redis_status = f"error: {str(e)}"
        
        # Calculate performance metrics
        performance_by_path = {}
        for path, stats in self.path_response_times.items():
            if stats["count"] > 0:
                performance_by_path[path] = {
                    "avg_ms": round(stats["avg_ms"], 2),
                    "min_ms": round(stats["min_ms"], 2),
                    "max_ms": round(stats["max_ms"], 2),
                    "count": stats["count"]
                }
        
        # Prepare statistics
        request_stats = {
            "total": self.total_requests,
            "by_path": self.requests_by_path,
            "by_method": self.requests_by_method,
            "by_status": self.requests_by_status,
            "performance": performance_by_path,
            "success_rate": (
                (self.total_requests - self.total_errors) / self.total_requests * 100 
                if self.total_requests > 0 else 100
            )
        }
        
        error_stats = {
            "total": self.total_errors,
            "by_path": self.errors_by_path,
            "by_exception": self.errors_by_exception,
            "error_rate": (
                self.total_errors / self.total_requests * 100 
                if self.total_requests > 0 else 0
            )
        }
        
        # Get most recent items (reverse for chronological order)
        recent_errors = list(reversed(self.error_logs[-10:])) if self.error_logs else []
        recent_requests = list(reversed(self.request_logs[-10:])) if self.request_logs else []
        
        return HealthStatus(
            status="healthy",
            version=self.version,
            uptime=uptime_str,
            timestamp=datetime.datetime.now(),
            environment=self.environment,
            cpu_usage=cpu_usage,
            memory_usage=memory_usage,
            redis_status=redis_status,
            request_stats=request_stats,
            error_stats=error_stats,
            recent_errors=recent_errors,
            recent_requests=recent_requests,
            routes_summary=self.routes_info
        )

# Create health monitor instance
health_monitor = HealthMonitor()

# Security for health endpoint
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    # Check if environment variable is set
    log_info(f"HEALTH_API_KEY: {HEALTH_API_KEY}")
    log_info(f"api_key_header: {api_key_header}")
    
    if not HEALTH_API_KEY:
        print("Error: HEALTH_API_KEY environment variable not set")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API Key configuration error",
        )
    
    # Check if header is provided
    if not api_key_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key header missing",
        )
    
    # Use constant-time comparison for security
    if not secrets.compare_digest(api_key_header, HEALTH_API_KEY):
        print("API key validation failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )
    return api_key_header

