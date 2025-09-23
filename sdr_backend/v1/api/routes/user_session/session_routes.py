from fastapi import APIRouter, Depends, Request, HTTPException
from services.auth_handler import verify_token
from services.session_tracker import UserSessionTracker
from typing import Dict
from models.session_models import EventRequest, EventResponse, EventsRequest
from utils.logger import log_info

router = APIRouter()
session_tracker = UserSessionTracker()

# ---------------------------------------------------------------------------
# New endpoint to support the richer EventsRequest model which contains
# `meta_data` instead of `meta_data` and introduces new logout event names.
# ---------------------------------------------------------------------------


@router.post("/events", response_model=EventResponse)
async def track_updated_event(
    request: EventsRequest,
    fastapi_request: Request,
    current_user: Dict = Depends(verify_token)
):
    """Track user events using the new EventsRequest schema.

    Differences from the legacy /events endpoint:

    1. Payload uses `meta_data` (camelCase avoided) instead of `meta_data`.
    2. New logout event names: ``logout_successful`` and ``user_logout``.
       These mirror the behaviour of ``logout_success`` in the legacy flow.
    3. Stores session information (session_id, user_id, session_start, created_at,
       user_agent, device_info, geo_location) at login/signup success and stores
       ``session_end`` + ``duration_seconds`` at logout events.
    """

    # Make meta_data accessible as meta_data so we can reuse existing helpers
    setattr(request, "meta_data", request.meta_data)  # type: ignore[attr-defined]

    # Derive geo_location (if latitude/longitude present)
    geo_location = {}
    if request.latitude and request.longitude:
        latitude = request.latitude
        longitude = request.longitude
        try:
            latitude = float(latitude)
            longitude = float(longitude)
            geo_location = session_tracker.get_location(latitude, longitude)
            log_info(f"Geo location: {geo_location}")
        except (ValueError, TypeError) as e:
            log_info(f"Invalid latitude/longitude values in meta_data: {e}")

    # Get user_id from authentication context
    user_id = current_user.get("user_id") or current_user.get("id")
    # user_id = request.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in authentication context")

    session_id = None

    # ---------------------------------
    # Session START (login / signup)
    # ---------------------------------
    if (
        request.event_name in ["login_success", "signup_success"]
        and request.event_type == "button_click"
    ):
        log_info(f"Starting session for user {user_id} on {request.event_name}")

        # Use provided session_id or create a new one
        if  request.session_id:
            session_id = await session_tracker.update_session_start(
                session_id=request.session_id,
                user_id=str(user_id),
                user_agent=request.user_agent or fastapi_request.headers.get("user-agent", ""),
                geo_location=geo_location,
                created_at=request.created_at
            )
            request.session_id = session_id  # propagate back
            log_info(f"Created new session {session_id} for user {user_id} with created_at from request")
        else:
            session_id = request.session_id
            log_info(f"Using existing session {session_id} from request for user {user_id}")

    # ---------------------------------
    # Session END (logout / tab close)
    # ---------------------------------
    elif (
        request.event_name in ["logout_success", "user_logout", "close_window"]
        and request.event_type == "button_click"
    ):
        log_info(f"Ending session for user {user_id} on {request.event_name}")

        session_id = request.session_id
        await session_tracker.session_end(user_id=str(user_id))

    # ---------------------------------
    # Other events (no session changes)
    # ---------------------------------
    else:
        if request.session_id:
            session_id = request.session_id
            log_info(f"Using session_id from request for other event: {session_id}")
        else:
            log_info(f"No session_id provided in request for event {request.event_name}")

    # Store the event record
    success, event_id = await session_tracker.event_update(request, user_id, session_id)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to store event")

    return EventResponse(
        status="success",
        event_id=event_id,
        session_id=session_id,
        message=f"Event {request.event_name} processed successfully",
    )


# @router.post("/events", response_model=EventResponse)
# async def track_event(
#     request: EventRequest,
#     fastapi_request: Request,
#     current_user: Dict = Depends(verify_token)
# ):
#     """
#     Track user events and manage sessions based on event type
    
#     Handles specific event patterns:
#     - login_success + button_click → starts session
#     - signup_success + button_click → starts session
#     - logout_success + button_click → ends session
#     - close_window + button_click → ends session
#     - login_failure + button_click → records event only
#     - signup_failure + button_click → records event only
#     """
    
#     # Get geo_location using latitude and longitude from meta_data
#     geo_location = {}
#     if (request.metadata and 
#         'latitude' in request.metadata and 'longitude' in request.metadata and 
#         request.metadata['latitude'] and request.metadata['longitude']):
#         try:
#             latitude = float(request.metadata['latitude'])
#             longitude = float(request.metadata['longitude'])
#             geo_location = session_tracker.get_location(latitude, longitude)
#             log_info(f"Geo location: {geo_location}")
#         except (ValueError, TypeError) as e:
#             log_info(f"Invalid latitude/longitude values in metadata: {e}")
    
#     # Get user_id from authentication context
#     user_id = current_user.get('user_id') or current_user.get('id')
#     if not user_id:
#         raise HTTPException(status_code=401, detail="User ID not found in authentication context")
    
#     session_id = None
    
#     # Handle session start events (successful authentication)
#     if (request.event_name in ["login_success", "signup_success"] and 
#         request.event_type == "button_click"):
#         log_info(f"Starting session for user {user_id} on {request.event_name}")
        
#         # Check if session_id is empty in the request
#         if not request.session_id:
#             # Create new session
#             session_id = await session_tracker.session_start(
#                 user_id=str(user_id),
#                 user_agent=fastapi_request.headers.get("user-agent", ""),
#                 geo_location=geo_location
#             )
#             # Update the request object with the new session_id
#             request.session_id = session_id
#             log_info(f"Created new session {session_id} and updated request for user {user_id}")
#         else:
#             # Use the session_id from the request
#             session_id = request.session_id
#             log_info(f"Using existing session {session_id} from request for user {user_id}")
        
#     # Handle session end events
#     elif (request.event_name in ["logout_success", "close_window", "login_failure", "signup_failure"] and 
#           request.event_type == "button_click"):
#         log_info(f"Ending session for user {user_id} on {request.event_name}")
        
#         # Get the session_id before ending the session
#         session_id = await session_tracker.get_active_session_id(str(user_id))
        
#         # Map event names to session end types
#         end_type_mapping = {
#             "logout_success": "manual",
#             "close_window": "tab_closed",
#             "login_failure": "crash",
#             "signup_failure": "crash"
#         }
        
#         end_type = end_type_mapping.get(request.event_name, "manual")
#         success = await session_tracker.session_end(
#            user_id=str(user_id),
#            end_type=end_type
#         )
        
#         log_info(f"Ended session for user {user_id} due to {request.event_name}")
        
#     # For all other events, use session_id from request (don't query database)
#     else:
#         if request.session_id:
#             session_id = request.session_id
#             log_info(f"Using session_id from request for other event: {session_id}")
#         else:
#             log_info(f"No session_id provided in request for event {request.event_name}")
#             # session_id remains None for events without session context
    
#     # Store ALL events in user_events table with original event_name and event_type
#     success, event_id = await session_tracker.event_update(request, user_id, session_id)
    
#     if not success:
#         raise HTTPException(status_code=500, detail="Failed to store event")
    
#     log_info(f"Event '{request.event_name}' with type '{request.event_type}' processed successfully with event_id: {event_id}")
    
#     return EventResponse(
#         status="success",
#         event_id=event_id,
#         session_id=session_id,
#         message=f"Event {request.event_name} processed successfully"
#     )

