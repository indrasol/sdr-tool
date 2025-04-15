"""
Utilities for tracking user activity metrics in Prometheus.
"""
from prometheus_client import Counter, Histogram, Gauge, Summary

# User activity metrics
USER_ACTION_COUNTER = Counter(
    'user_action_total',
    'Total number of specific user actions',
    ['action_type']
)

USER_ACTION_LATENCY = Histogram(
    'user_action_duration_seconds',
    'Duration of user actions in seconds',
    ['action_type'],
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0)
)

WORKSPACE_SIZE = Gauge(
    'workspace_size_bytes',
    'Size of user workspace in bytes',
    ['user_id']
)

ANALYSIS_COMPLEXITY = Histogram(
    'analysis_complexity',
    'Complexity score of user analyses',
    ['analysis_type'],
    buckets=(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
)

# Function to track user actions
def track_user_action(action_type: str):
    """
    Track a user action.
    
    Args:
        action_type: Type of user action (e.g., 'document_upload', 'run_analysis', 'export_report')
    """
    USER_ACTION_COUNTER.labels(action_type=action_type).inc()

# Context manager for timing user actions
class UserActionTimer:
    """
    Context manager for timing user actions.
    
    Example usage:
    
    ```python
    with UserActionTimer("document_upload"):
        # upload document
        upload_document(file)
    ```
    """
    
    def __init__(self, action_type: str):
        """
        Initialize the user action timer.
        
        Args:
            action_type: Type of user action
        """
        self.action_type = action_type
        self.timer = None
    
    def __enter__(self):
        """
        Start tracking the user action and timing.
        """
        USER_ACTION_COUNTER.labels(action_type=self.action_type).inc()
        self.timer = USER_ACTION_LATENCY.labels(action_type=self.action_type).time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Stop timing.
        """
        if self.timer:
            self.timer.__exit__(exc_type, exc_val, exc_tb)

# Function to update workspace size
def update_workspace_size(user_id: str, size_bytes: float):
    """
    Update the size of a user's workspace.
    
    Args:
        user_id: User identifier
        size_bytes: Size of the workspace in bytes
    """
    WORKSPACE_SIZE.labels(user_id=user_id).set(size_bytes)

# Function to record analysis complexity
def record_analysis_complexity(analysis_type: str, complexity_score: float):
    """
    Record the complexity of an analysis.
    
    Args:
        analysis_type: Type of analysis (e.g., 'threat_model', 'data_flow', 'security_review')
        complexity_score: Complexity score (1-10)
    """
    ANALYSIS_COMPLEXITY.labels(analysis_type=analysis_type).observe(complexity_score) 