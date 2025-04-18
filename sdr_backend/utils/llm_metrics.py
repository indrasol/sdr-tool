import time
import functools
from typing import Callable, Any, Dict, Optional
import asyncio
from utils.prometheus_metrics import (
    record_llm_request,
    record_llm_tokens,
    time_llm_request,
    record_llm_completion_size,
    record_llm_error,
    record_llm_rate_limit
)

def track_llm_metrics(endpoint: str = "generate"):
    """
    Decorator to track LLM API metrics.
    
    This decorator wraps LLM API calls to record:
    - Request counts
    - Token usage
    - Request latency
    - Completion size
    - Errors and rate limits
    
    Args:
        endpoint: The specific LLM endpoint being called (e.g., "generate", "analyze", etc.)
    
    Returns:
        Decorated function that tracks metrics
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper_async(*args, **kwargs):
            # Extract model from the instance (self)
            if len(args) > 0 and hasattr(args[0], 'model'):
                model = args[0].model
            else:
                model = "unknown"
            
            # Record the request
            record_llm_request(model=model, endpoint=endpoint)
            
            # Measure response time
            start_time = time.time()
            
            try:
                # Execute the function
                with time_llm_request(model=model, endpoint=endpoint):
                    result = await func(*args, **kwargs)
                
                # Extract response information
                if isinstance(result, dict):
                    # For direct response objects
                    if "usage" in result:
                        usage = result["usage"]
                        if "input_tokens" in usage:
                            record_llm_tokens(
                                model=model, 
                                input_tokens=usage.get("input_tokens", 0),
                                output_tokens=usage.get("output_tokens", 0)
                            )
                    
                    # Record completion size if content exists
                    if "content" in result and isinstance(result["content"], str):
                        content_size = len(result["content"].encode("utf-8"))
                        record_llm_completion_size(model=model, size_bytes=content_size)
                    
                    # Check for errors
                    if result.get("success") is False:
                        error_type = result.get("error_type", "unknown")
                        if "rate limit" in str(result.get("error", "")).lower():
                            record_llm_rate_limit(model=model)
                        else:
                            record_llm_error(model=model, error_type=error_type)
                
                elif isinstance(result, tuple) and len(result) == 3:
                    # For response tuples (thinking_process, final_response, metadata)
                    thinking_process, final_response, metadata = result
                    
                    if isinstance(metadata, dict) and "usage" in metadata:
                        usage = metadata["usage"]
                        record_llm_tokens(
                            model=model, 
                            input_tokens=usage.get("input_tokens", 0),
                            output_tokens=usage.get("output_tokens", 0)
                        )
                    
                    # Record completion sizes
                    if isinstance(thinking_process, str):
                        thinking_size = len(thinking_process.encode("utf-8"))
                        record_llm_completion_size(model=model, size_bytes=thinking_size)
                    
                    if isinstance(final_response, str):
                        response_size = len(final_response.encode("utf-8"))
                        record_llm_completion_size(model=model, size_bytes=response_size)
                
                return result
            
            except Exception as e:
                # Record errors
                error_type = type(e).__name__
                if "rate limit" in str(e).lower():
                    record_llm_rate_limit(model=model)
                else:
                    record_llm_error(model=model, error_type=error_type)
                # Re-raise the exception
                raise
        
        return wrapper_async
    
    return decorator 