from __future__ import annotations

from typing import Dict, Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class EventRequest(BaseModel):
    """Request body for client-side event tracking.
    
    Note: event_id is generated server-side, so it's not included in the request.
    Supports the following event patterns:
    - login_success + button_click (starts session)
    - login_failure + button_click (no session impact)
    - logout_success + button_click (ends session)  
    - signup_success + button_click (starts session)
    - signup_failure + button_click (no session impact)
    - close_window + button_click (ends session)
    """

    session_id: Optional[str] = Field(None, description="Session identifier")
    event_name: str = Field(..., min_length=1, description="Event name (login_success, logout_success, etc.)")
    event_type: str = Field(..., min_length=1, description="Event type (button_click, etc.)")
    created_at: Optional[str] = Field(None, description="Timestamp when the event was created")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context for the event including latitude, longitude, search_query, opportunity_id, title, naics_code")


#
# Added new EventsRequest model to capture richer event data from the client
class EventsRequest(BaseModel):
    """Request body for tracking generic events with richer metadata.

    Example payload::
        {
            "session_id": "abc123",
            "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            "created_at": "2025-09-17T12:34:56Z",
            "event_name": "login_success",
            "event_type": "button_click",
            "meta_data": {
                "longitude": "-122.4194",
                "latitude": "37.7749",
                "search_query": "cyber threat modeling"
            }
        }
    """

    session_id: Optional[str] = Field(None, description="Session identifier")
    user_id: Optional[str] = Field( None, description="User identifier")
    user_agent: Optional[str] = Field(None, description="Client's user agent string")
    created_at: Optional[str] = Field(None, description="Timestamp when the event was created")
    event_name: str = Field(..., min_length=1, description="Event name (login_success, logout_success, etc.)")
    event_type: str = Field( ..., min_length=1, description="Event type (button_click, etc.)")
    latitude:float = Field(None, description="Latitude of the event")
    longitude:float = Field(None, description="Longitude of the event")
    meta_data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional context including longitude, latitude, search_query, etc.",
    )




class EventResponse(BaseModel):
    """Response model for event tracking."""
    
    status: str = Field(..., description="Response status")
    event_id: str = Field(..., description="Server-generated event ID")
    session_id: Optional[str] = Field(None, description="Associated session ID")
    message: str = Field(..., description="Response message")


