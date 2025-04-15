# Prometheus Metrics System

This document describes the custom metrics implemented in the SecureTrack application. These metrics are designed to be scraped by Prometheus and visualized in Grafana.

## Endpoints

- **Default Metrics**: `/metrics` - Standard FastAPI metrics provided by the Prometheus FastAPI Instrumentator
- **Custom Metrics**: `/custom_metrics` - Our custom application metrics

## Metric Categories

### LLM Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `llm_requests_total` | Counter | Total number of LLM API requests | `model`, `endpoint` |
| `llm_tokens_total` | Counter | Total number of tokens processed by LLM | `model`, `type` |
| `llm_request_duration_seconds` | Histogram | Duration of LLM API requests in seconds | `model`, `endpoint` |
| `llm_completion_size_bytes` | Summary | Size of LLM completions in bytes | `model` |
| `llm_errors_total` | Counter | Total number of LLM API errors | `model`, `error_type` |
| `llm_rate_limits_total` | Counter | Total number of LLM API rate limit errors | `model` |

### Application-wide Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `app_requests_total` | Counter | Total number of application requests | `endpoint`, `method`, `status_code` |
| `app_request_duration_seconds` | Histogram | Duration of application requests in seconds | `endpoint`, `method` |
| `app_active_sessions` | Gauge | Number of active user sessions | - |
| `app_errors_total` | Counter | Total number of application errors | `endpoint`, `error_type` |

### Feature-specific Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `feature_usage_total` | Counter | Total number of times a feature is used | `feature_name` |
| `feature_duration_seconds` | Histogram | Duration of feature execution in seconds | `feature_name` |
| `feature_errors_total` | Counter | Total number of feature-specific errors | `feature_name`, `error_type` |

### User Registration Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `user_registrations_total` | Counter | Total number of user registrations | - |
| `user_logins_total` | Counter | Total number of user logins | - |
| `user_auth_failures_total` | Counter | Total number of user authentication failures | `reason` |

### User Activity Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `user_action_total` | Counter | Total number of specific user actions | `action_type` |
| `user_action_duration_seconds` | Histogram | Duration of user actions in seconds | `action_type` |
| `workspace_size_bytes` | Gauge | Size of user workspace in bytes | `user_id` |
| `analysis_complexity` | Histogram | Complexity score of user analyses | `analysis_type` |

## Usage Examples

### Tracking LLM Usage

LLM metrics are automatically tracked when using the decorated methods in the `LLMService` class:

```python
from core.llm.llm_gateway_v1 import LLMService

llm_service = LLMService()
response = await llm_service.generate_response(prompt="Your prompt here")
```

### Tracking Feature Usage

Use the `FeatureMetrics` context manager or decorators:

```python
from utils.feature_metrics import FeatureMetrics, track_feature_async

# Using context manager
with FeatureMetrics("threat_analysis"):
    result = analyze_threats(input_data)

# Using decorator
@track_feature_async("data_flow_analysis")
async def analyze_data_flow(diagram):
    # Feature code here
    return result
```

### Tracking User Sessions

```python
from utils.session_metrics import track_session_start, track_session_end

# When a user logs in
track_session_start()
track_user_login()

# When a user logs out
track_session_end()
```

### Tracking User Actions

```python
from utils.user_metrics import UserActionTimer, track_user_action

# Simple action tracking
track_user_action("export_report")

# Timed action
with UserActionTimer("document_upload"):
    upload_document(file)
```

## Grafana Dashboard Examples

Here are some example Grafana dashboard panels you can create:

1. **LLM API Usage**
   - Graph showing `llm_requests_total` over time
   - Graph showing `llm_tokens_total` by model and type
   - Histogram of `llm_request_duration_seconds`

2. **Application Performance**
   - Graph of `app_request_duration_seconds` by endpoint
   - Count of `app_errors_total` by error type
   - Current `app_active_sessions`

3. **Feature Usage**
   - Top features by `feature_usage_total`
   - Average execution time from `feature_duration_seconds`
   - Error rate calculated from `feature_errors_total` / `feature_usage_total`

4. **User Metrics**
   - New users over time from `user_registrations_total`
   - Active users from `app_active_sessions`
   - Authentication failures from `user_auth_failures_total`

## Prometheus Configuration

When configuring Prometheus to scrape these metrics, ensure you have both endpoints configured:

```yaml
scrape_configs:
  - job_name: 'securetrack'
    scrape_interval: 15s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['securetrack:8000']
  
  - job_name: 'securetrack-custom'
    scrape_interval: 15s
    metrics_path: '/custom_metrics'
    static_configs:
      - targets: ['securetrack:8000']
```

## Implementation Notes

- All metrics are defined in `utils/prometheus_metrics.py`
- The `/custom_metrics` endpoint is set up in the main FastAPI application
- Helper modules provide easy-to-use functions and decorators for different metric types 