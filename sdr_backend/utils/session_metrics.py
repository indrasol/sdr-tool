"""
Utilities for tracking user session metrics in Prometheus.
"""
from utils.prometheus_metrics import (
    APP_ACTIVE_SESSIONS,
    USER_REGISTRATIONS,
    USER_LOGINS,
    USER_AUTH_FAILURES,
    FEATURE_USAGE
)

def track_session_start():
    """
    Track a new user session start.
    Increments the active sessions gauge.
    """
    APP_ACTIVE_SESSIONS.inc()

def track_session_end():
    """
    Track a user session end.
    Decrements the active sessions gauge.
    """
    APP_ACTIVE_SESSIONS.dec()

def track_user_registration():
    """
    Track a new user registration.
    """
    USER_REGISTRATIONS.inc()

def track_user_login():
    """
    Track a user login.
    """
    USER_LOGINS.inc()

def track_auth_failure(reason: str = "invalid_credentials"):
    """
    Track an authentication failure.
    
    Args:
        reason: The reason for the authentication failure
               (e.g., "invalid_credentials", "invalid_token", "expired_token")
    """
    USER_AUTH_FAILURES.labels(reason=reason).inc()

def track_feature_usage(feature_name: str):
    """
    Track usage of a specific feature.
    
    Args:
        feature_name: The name of the feature being used
    """
    FEATURE_USAGE.labels(feature_name=feature_name).inc() 