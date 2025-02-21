from fastapi import Request
from fastapi.responses import JSONResponse


class SecurityValidationError(Exception):
    """Raised when security rules are violated"""
    pass

class ValidationError(Exception):
    """Raised when security rules are violated"""
    pass

class RateLimitError(Exception):
    """Raised when rate limits are exceeded"""
    pass

class LLMError(Exception):
    """Base exception for LLM gateway errors"""
    pass

# @app.exception_handler(LLMError)
# async def llm_error_handler(request: Request, exc: LLMError):
#     return JSONResponse(
#         status_code=500,
#         content={"error": "LLM processing failed", "detail": str(exc)}
#     )

# @app.exception_handler(RateLimitError)
# async def rate_limit_handler(request: Request, exc: RateLimitError):
#     return JSONResponse(
#         status_code=429,
#         content={"error": "Rate limit exceeded", "retry_after": 60}
#     )

# Error response format
# {
#     "error": {
#         "code": "validation-error|rate-limit|security-violation",
#         "message": "Human-readable error message",
#         "details": {
#             "field": "specific field causing error",
#             "expected": "expected value",
#             "actual": "actual value"
#         }
#     }
# }