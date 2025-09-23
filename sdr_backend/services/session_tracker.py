from datetime import datetime, timezone, timedelta
import json
import uuid
import requests
from typing import Dict, Any, Optional, List, Tuple
from utils.logger import log_info
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from geopy.geocoders import Nominatim

class UserSessionTracker:
    """
    Tracks user sessions in Supabase.
    Handles geolocation, session management, and tracking end reasons.
    """
    
    # async def session_start(self, user_id: str, user_agent: str, geo_location: Dict[str, Any]) -> str:
    #     """
    #     Create a new user session and store it in Supabase
    #     Session ID is generated server-side automatically
        
    #     Args:
    #         user_id: User identifier
    #         user_agent: Browser/device user agent string
    #         geo_location: Dictionary containing location information
            
    #     Returns:
    #         session_id: Unique identifier for the created session
    #     """
        
    #     current_time = datetime.now(timezone.utc)
        
    #     # Parse device info
    #     device_info = self._parse_user_agent(user_agent)
        
    #     # Prepare extra data (removed last_seen from here)
    #     extra_data = {
    #         "geo_location": geo_location,
    #         "user_agent": user_agent,
    #         "device_info": device_info
    #     }
        
        
    #     # Store in Supabase - session_id will be auto-generated
    #     supabase = get_supabase_client()
        
    #     def create_session_record():
    #         return supabase.from_("user_sessions").insert({
    #             "user_id": user_id,
    #             "session_start": current_time.isoformat(),
    #             "created_at": current_time.isoformat(),
    #             "extra_data": extra_data
                
    #         }).execute()
        
    #     session_response = await safe_supabase_operation(
    #         create_session_record,
    #         f"Failed to create user session record for user {user_id}"
    #     )
        
    #     # Get the server-generated session_id
    #     session_id = session_response.data[0]["session_id"]
    #     log_info(f"Created session {session_id} for user {user_id}")
    #     return session_id
    
    async def update_session_start(self, session_id: str, user_id: str, user_agent: str, geo_location: Dict[str, Any], created_at: str = None) -> str:
        """
        Create a new user session and store it in Supabase
        Session ID is generated server-side automatically
        
        Args:
            user_id: User identifier
            user_agent: Browser/device user agent string
            geo_location: Dictionary containing location information
            created_at: Timestamp from request (optional)
            
        Returns:
            session_id: Unique identifier for the created session
        """
        
        # Use provided created_at or current time as fallback
        if created_at:
            try:
                # Handle ISO format with 'Z' timezone indicator
                if created_at.endswith('Z'):
                    created_at = created_at.replace('Z', '+00:00')
                current_time = datetime.fromisoformat(created_at)
            except (ValueError, TypeError):
                # Fallback to current time if parsing fails
                current_time = datetime.now(timezone.utc)
        else:
            current_time = datetime.now(timezone.utc)
        # Parse device info
        device_info = self._parse_user_agent(user_agent)
        
        
        user_agent=user_agent
        device_info=device_info
        geo_location=geo_location
        
        # Store in Supabase - session_id will be auto-generated
        supabase = get_supabase_client()
        
        def create_session_record():
            return supabase.from_("user_sessions").insert({
                "user_id": user_id,
                "session_id": session_id,
                "session_start": current_time.isoformat(),
                "created_at": current_time.isoformat(),
                # "extra_data": extra_data
                "user_agent": user_agent,
                "device_info": device_info,
                "geo_location": geo_location
            }).execute()
        log_info(f"Creating session record for user {user_id} with created_at: {current_time.isoformat()}")
        session_response = await safe_supabase_operation(
            create_session_record,
            f"Failed to create user session record for user {user_id}"
        )
        
        # Get the server-generated session_id
        session_id = session_response.data[0]["session_id"]
        log_info(f"Created session {session_id} for user {user_id}")
        return session_id
    
    async def session_end(self, user_id: str) -> bool:
        """
        End a user session with specified reason
        
        end_type options:
        - manual: User explicitly logged out (logout_success)
        - tab_closed: Browser tab was closed (close_window)  
        - inactivity: Session ended due to inactivity
        - forced: Admin forced logout
        - crash: Unexpected termination
        - timeout: Session timeout due to policy
        """
        
        current_time = datetime.now(timezone.utc)
        supabase = get_supabase_client()
        
        # Get session data first to calculate duration
        def get_session():
            return supabase.from_("user_sessions").select("*").eq("user_id", user_id).is_("session_end", None).execute()
        
        session_response = await safe_supabase_operation(
            get_session,
            f"Failed to retrieve session {user_id}"
        )
        
        if not session_response.data or len(session_response.data) == 0:
            log_info(f"Session {user_id} not found or already ended")
            return False
        
        session_data = session_response.data[0]
        session_start = datetime.fromisoformat(session_data["session_start"])
        
        # Calculate duration in seconds
        duration_seconds = int((current_time - session_start).total_seconds())
        
        # Update session in Supabase
        def end_session_record():
            return supabase.from_("user_sessions").update({
                "session_end": current_time.isoformat(),
                "duration_seconds": duration_seconds
            }).eq("user_id", user_id).execute()
        
        await safe_supabase_operation(
            end_session_record,
            f"Failed to end session {user_id}"
        )
        
        log_info(f"Ended session {user_id} after {duration_seconds}s.")
        return True
    
    def _parse_user_agent(self, user_agent_string: str) -> Dict[str, Any]:
        """
        Basic user agent parsing
        For more advanced parsing, consider installing the user-agents library
        """
        device_info = {
            "raw": user_agent_string
        }
        
        # Simple OS detection
        if "Windows" in user_agent_string:
            device_info["os"] = "Windows"
        elif "Mac OS" in user_agent_string:
            device_info["os"] = "Mac OS"
        elif "Android" in user_agent_string:
            device_info["os"] = "Android"
        elif "iOS" in user_agent_string:
            device_info["os"] = "iOS"
        elif "Linux" in user_agent_string:
            device_info["os"] = "Linux"
        else:
            device_info["os"] = "Unknown"
        
        # Simple browser detection
        if "Chrome" in user_agent_string and "Edg" not in user_agent_string:
            device_info["browser"] = "Chrome"
        elif "Firefox" in user_agent_string:
            device_info["browser"] = "Firefox"
        elif "Safari" in user_agent_string and "Chrome" not in user_agent_string:
            device_info["browser"] = "Safari"
        elif "Edg" in user_agent_string:
            device_info["browser"] = "Edge"
        elif "MSIE" in user_agent_string or "Trident" in user_agent_string:
            device_info["browser"] = "Internet Explorer"
        else:
            device_info["browser"] = "Unknown"
        
        # Device type detection
        if "Mobile" in user_agent_string:
            device_info["device_type"] = "Mobile"
        elif "Tablet" in user_agent_string:
            device_info["device_type"] = "Tablet"
        else:
            device_info["device_type"] = "Desktop"
        
        return device_info
    
    def get_location(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Get location details from latitude and longitude using geopy
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            Dictionary containing address, city, and country information
        """
        geo_location = {
            "address": None,
            "city": None,
            "country": None
        }
        
        try:
            # Initialize Nominatim geocoder with a custom user agent
            geolocator = Nominatim(user_agent="sdr_tool_geocoder")
            
            # Reverse geocode the coordinates
            location = geolocator.reverse((latitude, longitude), exactly_one=True)
            
            if location and location.raw.get('address'):
                address_data = location.raw['address']
                
                # Extract location components
                geo_location["address"] = location.address
                geo_location["city"] = address_data.get('city') or address_data.get('town') or address_data.get('village')
                geo_location["country"] = address_data.get('country')
                
            log_info(f"Retrieved location data for coordinates: {latitude}, {longitude}")
        except Exception as e:
            log_info(f"Error getting location from coordinates: {str(e)}")
        
        return geo_location
        
    async def event_update(self, request, user_id: str, session_id: str = None) -> tuple[bool, str]:
        """
        Store user event data in the user_events table
        Both event_id and session_id are managed server-side
        
        Args:
            request: Event request object containing event details
            user_id: User ID to associate with the event
            session_id: Optional session ID to associate with the event
            
        Returns:
            tuple: (success: bool, event_id: str)
        """
        try:
            # Use created_at from request if provided, otherwise use current time
            if hasattr(request, 'created_at') and request.created_at:
                try:
                    # Assume the created_at is in ISO format, convert if needed
                    created_at = request.created_at
                except:
                    created_at = datetime.now(timezone.utc).isoformat()
            else:
                created_at = datetime.now(timezone.utc).isoformat()
                
            supabase = get_supabase_client()
            
            # Extract data from request - store event_name and event_type exactly as received
            event_data = {
                "user_id": str(user_id),
                "event_name": request.event_name,  # Store exactly as received (login_success, etc.)
                "event_type": request.event_type,  # Store exactly as received (button_click, etc.)
                "created_at": created_at
            }
            
            # Add session_id if provided
            if session_id:
                event_data["session_id"] = session_id
            
            # Add extra_data if available
            extra_data = {}
            
            
            # Include metadata if available
            if hasattr(request, "meta_data") and request.meta_data:
                extra_data["meta_data"] = request.meta_data
                
            # Add extra_data to event_data if not empty
            if extra_data:
                event_data["extra_data"] = extra_data
            
            # Store in Supabase - event_id will be auto-generated
            def create_event_record():
                return supabase.from_("user_events").insert(event_data).execute()
            
            event_response = await safe_supabase_operation(
                create_event_record,
                f"Failed to store event {request.event_name} for user {user_id}"
            )
            
            # Get the server-generated event_id
            event_id = event_response.data[0]["event_id"]
            
            log_info(f"Stored event '{request.event_name}' with type '{request.event_type}' (ID: {event_id}) for user {user_id}" + 
                    (f" in session {session_id}" if session_id else " without session"))
            return True, event_id
            
        except Exception as e:
            log_info(f"Error storing event: {str(e)}")
            return False, ""


