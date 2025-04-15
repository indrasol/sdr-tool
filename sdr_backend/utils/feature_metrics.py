"""
Utilities for tracking feature-specific metrics in Prometheus.
"""
from utils.prometheus_metrics import (
    FEATURE_USAGE,
    FEATURE_LATENCY,
    FEATURE_ERRORS
)

class FeatureMetrics:
    """
    Context manager for tracking metrics of a specific feature.
    
    Example usage:
    
    ```python
    with FeatureMetrics("threat_analysis"):
        # feature code here
        result = analyze_threats(input_data)
    ```
    """
    
    def __init__(self, feature_name: str):
        """
        Initialize the feature metrics tracker.
        
        Args:
            feature_name: Name of the feature being tracked
        """
        self.feature_name = feature_name
        self.timer = None
    
    def __enter__(self):
        """
        Start tracking the feature usage and timing.
        """
        FEATURE_USAGE.labels(feature_name=self.feature_name).inc()
        self.timer = FEATURE_LATENCY.labels(feature_name=self.feature_name).time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Stop timing and track any errors that occurred.
        """
        if self.timer:
            self.timer.__exit__(exc_type, exc_val, exc_tb)
        
        if exc_type:
            error_type = exc_type.__name__ if exc_type else "unknown"
            FEATURE_ERRORS.labels(
                feature_name=self.feature_name, 
                error_type=error_type
            ).inc()

def track_feature_error(feature_name: str, error_type: str):
    """
    Track an error that occurred in a feature.
    
    Args:
        feature_name: Name of the feature
        error_type: Type of error that occurred
    """
    FEATURE_ERRORS.labels(
        feature_name=feature_name,
        error_type=error_type
    ).inc()

# Function decorator for feature metrics
def track_feature(feature_name: str):
    """
    Decorator for tracking metrics of a specific feature.
    
    Example usage:
    
    ```python
    @track_feature("threat_analysis")
    def analyze_threats(input_data):
        # feature code here
        return result
    ```
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            with FeatureMetrics(feature_name):
                return func(*args, **kwargs)
        return wrapper
    return decorator

# Async function decorator for feature metrics
def track_feature_async(feature_name: str):
    """
    Decorator for tracking metrics of an asynchronous feature.
    
    Example usage:
    
    ```python
    @track_feature_async("data_flow_analysis")
    async def analyze_data_flow(diagram):
        # async feature code here
        return result
    ```
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            with FeatureMetrics(feature_name):
                return await func(*args, **kwargs)
        return wrapper
    return decorator 