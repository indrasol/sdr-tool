from pydantic import BaseModel
from typing import Optional, Dict, List
import datetime

class RequestLog(BaseModel):
    request_id: str
    timestamp: datetime.datetime
    path: str
    method: str
    status_code: int
    duration_ms: float
    client_ip: str
    user_agent: Optional[str] = None
    error: Optional[str] = None

class ErrorLog(BaseModel):
    error_id: str
    timestamp: datetime.datetime
    path: str
    method: str
    exception: str
    traceback: str
    request_id: Optional[str] = None

class HealthStatus(BaseModel):
    status: str
    version: str
    uptime: str
    timestamp: datetime.datetime
    environment: str
    cpu_usage: float
    memory_usage: float
    redis_status: str
    request_stats: Dict
    error_stats: Dict
    recent_errors: List[ErrorLog]
    recent_requests: List[RequestLog]
    routes_summary: Dict