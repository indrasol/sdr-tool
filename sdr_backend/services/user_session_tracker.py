from datetime import datetime, timezone, timedelta
import json
import uuid
import requests
from typing import Dict, Any, Optional, List, Tuple
from utils.logger import log_info
from core.db.supabase_db import get_supabase_client, safe_supabase_operation

class UserSessionTracker:
    """
    Tracks user sessions in Supabase.
    Handles geolocation, session management, and tracking end reasons.
    """
    
    async def create_session(self, user_id: str, ip_address: str, user_agent: str) -> str:
        """
        Create a new user session and store it in Supabase
        """
        session_id = str(uuid.uuid4())
        current_time = datetime.now(timezone.utc)
        
        # Get geolocation data
        geo_data = self._get_geolocation(ip_address)
        
        # Parse device info
        device_info = self._parse_user_agent(user_agent)
        
        # Prepare extra data
        extra_data = {
            "geo_location": geo_data,
            "user_agent": user_agent,
            "device_info": device_info,
            "last_seen": current_time.isoformat()
        }
        
        # Store in Supabase
        supabase = get_supabase_client()
        
        def create_session_record():
            return supabase.from_("user_sessions").insert({
                "session_id": session_id,
                "user_id": user_id,
                "session_start": current_time.isoformat(),
                "extra_data": extra_data
            }).execute()
        
        await safe_supabase_operation(
            create_session_record,
            f"Failed to create user session record for user {user_id}"
        )
        
        log_info(f"Created session {session_id} for user {user_id}")
        return session_id
    
    async def end_session(self, session_id: str, end_type: str = "manual") -> bool:
        """
        End a user session with specified reason
        
        end_type options:
        - manual: User explicitly logged out
        - inactivity: Session ended due to inactivity
        - forced: Admin forced logout
        - crash: Unexpected termination
        - timeout: Session timeout due to policy
        - tab_closed: Browser tab was closed
        """
        # Make sure end_type is valid for our DB schema
        valid_end_types = ["manual", "inactivity", "forced", "crash", "timeout", "tab_closed"]
        if end_type not in valid_end_types:
            end_type = "manual"  # Default to manual if invalid type
            
        # If tab_closed isn't in your DB schema constraints, map it to an existing value
        db_end_type = end_type
        if end_type == "tab_closed" and end_type not in ["manual", "inactivity", "forced", "crash", "timeout"]:
            db_end_type = "inactivity"  # Map to closest meaning in existing schema
        
        current_time = datetime.now(timezone.utc)
        supabase = get_supabase_client()
        
        # Get session data first to calculate duration
        def get_session():
            return supabase.from_("user_sessions").select("*").eq("session_id", session_id).is_("session_end", None).execute()
        
        session_response = await safe_supabase_operation(
            get_session,
            f"Failed to retrieve session {session_id}"
        )
        
        if not session_response.data or len(session_response.data) == 0:
            log_info(f"Session {session_id} not found or already ended")
            return False
        
        session_data = session_response.data[0]
        session_start = datetime.fromisoformat(session_data["session_start"])
        
        # Calculate duration in seconds
        duration_seconds = int((current_time - session_start).total_seconds())
        
        # Update session in Supabase
        def end_session_record():
            return supabase.from_("user_sessions").update({
                "session_end": current_time.isoformat(),
                "session_end_type": db_end_type, 
                "duration_seconds": duration_seconds
            }).eq("session_id", session_id).execute()
        
        await safe_supabase_operation(
            end_session_record,
            f"Failed to end session {session_id}"
        )
        
        log_info(f"Ended session {session_id} after {duration_seconds}s with reason: {end_type}")
        return True
    
    async def update_session_activity(self, session_id: str, ip_address: str = None) -> bool:
        """Update last_seen timestamp and optionally location if IP changed"""
        current_time = datetime.now(timezone.utc)
        supabase = get_supabase_client()
        
        # Get current session data
        def get_session():
            return supabase.from_("user_sessions").select("*").eq("session_id", session_id).is_("session_end", None).execute()
        
        session_response = await safe_supabase_operation(
            get_session,
            f"Failed to retrieve session {session_id} for activity update"
        )
        
        if not session_response.data or len(session_response.data) == 0:
            log_info(f"Session {session_id} not found or already ended")
            return False
            
        session_data = session_response.data[0]
        extra_data = session_data.get("extra_data", {}) or {}
        
        # Update last_seen
        extra_data["last_seen"] = current_time.isoformat()
        
        # Check if IP changed and update geolocation if needed
        if ip_address and ip_address != extra_data.get("geo_location", {}).get("ip"):
            geo_data = self._get_geolocation(ip_address)
            extra_data["geo_location"] = geo_data
        
        # Update in Supabase
        def update_session():
            return supabase.from_("user_sessions").update({
                "extra_data": extra_data
            }).eq("session_id", session_id).execute()
            
        await safe_supabase_operation(
            update_session,
            f"Failed to update activity for session {session_id}"
        )
        
        log_info(f"Updated activity for session {session_id}")
        return True
    
    async def check_inactive_sessions(self, inactive_minutes: int = 30) -> List[str]:
        """
        Find and end sessions that have been inactive beyond the threshold
        Returns list of ended session IDs
        """
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=inactive_minutes)
        cutoff_iso = cutoff_time.isoformat()
        supabase = get_supabase_client()
        ended_sessions = []
        
        # Find active sessions where last_seen is older than the cutoff
        def get_inactive_sessions():
            return supabase.from_("user_sessions").select("*").is_("session_end", None).execute()
        
        sessions_response = await safe_supabase_operation(
            get_inactive_sessions,
            "Failed to retrieve inactive sessions"
        )
        
        if not sessions_response.data:
            return []
        
        # Filter sessions where last_seen is older than cutoff
        inactive_sessions = []
        for session in sessions_response.data:
            extra_data = session.get("extra_data", {}) or {}
            last_seen_str = extra_data.get("last_seen")
            
            if not last_seen_str:
                inactive_sessions.append(session)
                continue
                
            try:
                last_seen = datetime.fromisoformat(last_seen_str)
                if last_seen < cutoff_time:
                    inactive_sessions.append(session)
            except ValueError:
                # Invalid datetime format
                inactive_sessions.append(session)
        
        # End each inactive session
        for session in inactive_sessions:
            session_id = session.get("session_id")
            if session_id:
                success = await self.end_session(session_id, "inactivity")
                if success:
                    ended_sessions.append(session_id)
        
        if ended_sessions:
            log_info(f"Ended {len(ended_sessions)} inactive sessions")
            
        return ended_sessions
    
    def _get_geolocation(self, ip_address: str) -> Dict[str, Any]:
        """
        Get geolocation data for an IP address using ip-api.com's free API
        """
        geo_data = {
            "ip": ip_address,
            "country": None,
            "region": None,
            "city": None,
            "lat": None,
            "lon": None,
            "isp": None,
            "timezone": None
        }
        
        try:
            # Use IP-API (free tier, 45 req/minute)
            response = requests.get(f"http://ip-api.com/json/{ip_address}?fields=status,country,regionName,city,lat,lon,isp,timezone", timeout=3)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    geo_data.update({
                        "country": data.get("country"),
                        "region": data.get("regionName"),
                        "city": data.get("city"),
                        "lat": data.get("lat"),
                        "lon": data.get("lon"),
                        "isp": data.get("isp"),
                        "timezone": data.get("timezone")
                    })
        except Exception as e:
            log_info(f"Error getting geolocation: {str(e)}")
        
        return geo_data
    
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
