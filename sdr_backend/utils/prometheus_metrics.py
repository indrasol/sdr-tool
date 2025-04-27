from prometheus_client import Counter, Histogram, Gauge, Summary
from typing import Dict, Optional
from fastapi import FastAPI, Request, Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from config.settings import METRICS_PASSWORD, METRICS_USERNAME

# LLM Metrics
LLM_REQUEST_COUNTER = Counter(
    'llm_requests_total', 
    'Total number of LLM API requests',
    ['model', 'endpoint']
)

LLM_TOKEN_COUNTER = Counter(
    'llm_tokens_total',
    'Total number of tokens processed by LLM',
    ['model', 'type']  # type can be 'input', 'output', 'total'
)

LLM_REQUEST_LATENCY = Histogram(
    'llm_request_duration_seconds',
    'Duration of LLM API requests in seconds',
    ['model', 'endpoint'],
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, 120.0)
)

LLM_COMPLETION_SIZE = Summary(
    'llm_completion_size_bytes',
    'Size of LLM completions in bytes',
    ['model']
)

LLM_ERROR_COUNTER = Counter(
    'llm_errors_total',
    'Total number of LLM API errors',
    ['model', 'error_type']
)

LLM_RATE_LIMITS = Counter(
    'llm_rate_limits_total',
    'Total number of LLM API rate limit errors',
    ['model']
)

# Application-wide metrics
APP_REQUEST_COUNTER = Counter(
    'app_requests_total',
    'Total number of application requests',
    ['endpoint', 'method', 'status_code']
)

APP_REQUEST_LATENCY = Histogram(
    'app_request_duration_seconds',
    'Duration of application requests in seconds',
    ['endpoint', 'method'],
    buckets=(0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0)
)

APP_ACTIVE_SESSIONS = Gauge(
    'app_active_sessions',
    'Number of active user sessions'
)

APP_ERRORS = Counter(
    'app_errors_total',
    'Total number of application errors',
    ['endpoint', 'error_type']
)

# Feature-specific metrics
FEATURE_USAGE = Counter(
    'feature_usage_total',
    'Total number of times a feature is used',
    ['feature_name']
)

FEATURE_LATENCY = Histogram(
    'feature_duration_seconds',
    'Duration of feature execution in seconds',
    ['feature_name'],
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0)
)

FEATURE_ERRORS = Counter(
    'feature_errors_total',
    'Total number of feature-specific errors',
    ['feature_name', 'error_type']
)

# User registration metrics
USER_REGISTRATIONS = Counter(
    'user_registrations_total',
    'Total number of user registrations'
)

USER_LOGINS = Counter(
    'user_logins_total',
    'Total number of user logins'
)

USER_AUTH_FAILURES = Counter(
    'user_auth_failures_total',
    'Total number of user authentication failures',
    ['reason']
)

# Utility functions for LLM metrics
def record_llm_request(model: str, endpoint: str):
    """Record an LLM API request"""
    LLM_REQUEST_COUNTER.labels(model=model, endpoint=endpoint).inc()

def record_llm_tokens(model: str, input_tokens: int = 0, output_tokens: int = 0):
    """Record tokens used in an LLM request"""
    if input_tokens > 0:
        LLM_TOKEN_COUNTER.labels(model=model, type='input').inc(input_tokens)
    if output_tokens > 0:
        LLM_TOKEN_COUNTER.labels(model=model, type='output').inc(output_tokens)
    if input_tokens > 0 and output_tokens > 0:
        LLM_TOKEN_COUNTER.labels(model=model, type='total').inc(input_tokens + output_tokens)

def time_llm_request(model: str, endpoint: str):
    """Return a context manager to time an LLM request"""
    return LLM_REQUEST_LATENCY.labels(model=model, endpoint=endpoint).time()

def record_llm_completion_size(model: str, size_bytes: int):
    """Record the size of an LLM completion"""
    LLM_COMPLETION_SIZE.labels(model=model).observe(size_bytes)

def record_llm_error(model: str, error_type: str):
    """Record an LLM API error"""
    LLM_ERROR_COUNTER.labels(model=model, error_type=error_type).inc()

def record_llm_rate_limit(model: str):
    """Record an LLM API rate limit error"""
    LLM_RATE_LIMITS.labels(model=model).inc()


# Define the security object
security = HTTPBasic()

# Authentication function
def authenticate_metrics(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != METRICS_USERNAME or credentials.password != METRICS_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return True

# Register application routes
def setup_custom_metrics_endpoint(app: FastAPI):
    """Set up a custom metrics endpoint for Prometheus"""
    
    @app.get("/custom_metrics")
    async def metrics():
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
    
    @app.middleware("http")
    async def metrics_middleware(request: Request, call_next):
        # Record request start
        method = request.method
        path = request.url.path
        
        # Skip metrics for the metrics endpoints themselves to avoid recursion
        if path in ["/metrics", "/custom_metrics"]:
            return await call_next(request)
        
        # Use a timer context for the request
        with APP_REQUEST_LATENCY.labels(endpoint=path, method=method).time():
            response = await call_next(request)
            
        # Record the completed request with status
        status_code = str(response.status_code)
        APP_REQUEST_COUNTER.labels(
            endpoint=path, 
            method=method, 
            status_code=status_code
        ).inc()
        
        # Record errors (4xx and 5xx)
        if response.status_code >= 400:
            error_type = "client_error" if response.status_code < 500 else "server_error"
            APP_ERRORS.labels(endpoint=path, error_type=error_type).inc()
            
        return response 