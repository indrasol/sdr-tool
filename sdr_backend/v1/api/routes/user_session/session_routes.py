from fastapi import APIRouter, Depends, Request, HTTPException
from services.auth_handler import verify_token
from services.user_session_tracker import UserSessionTracker
from typing import Dict, List, Optional
from datetime import datetime
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from utils.logger import log_info

router = APIRouter(prefix="/user_session", tags=["User Session"])
session_tracker = UserSessionTracker()

@router.post("/start", response_model=Dict)
async def start_session(
    request: Request,
    current_user: Dict = Depends(verify_token)
):
    """Start a new user session and return the session ID"""
    user_id = current_user["id"]
    ip_address = request.client.host
    user_agent = request.headers.get("user-agent", "")
    
    session_id = await session_tracker.create_session(
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    log_info(f"Started session {session_id} for user {user_id}")
    
    return {
        "status": "success", 
        "session_id": session_id,
        "message": "Session started successfully"
    }

@router.post("/end", response_model=Dict)
async def end_session(
    request: Request,
    session_id: str,
    end_type: Optional[str] = "manual",
    current_user: Dict = Depends(verify_token)
):
    """End a user session with specified reason"""
    success = await session_tracker.end_session(session_id, end_type)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or already ended")
    
    log_info(f"Ended session {session_id} with reason: {end_type}")
    
    return {"status": "success", "message": f"Session ended successfully with reason: {end_type}"}

@router.post("/heartbeat", response_model=Dict)
async def session_heartbeat(
    request: Request,
    session_id: str,
    current_user: Dict = Depends(verify_token)
):
    """Update session activity timestamp to keep it alive"""
    ip_address = request.client.host
    success = await session_tracker.update_session_activity(session_id, ip_address)
    
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or already ended")
    
    return {"status": "success", "message": "Session activity updated"}

@router.get("/active", response_model=List[Dict])
async def get_active_sessions(
    current_user: Dict = Depends(verify_token)
):
    """Get all active sessions for current user"""
    supabase = get_supabase_client()
    
    def get_sessions():
        return supabase.from_("user_sessions").select("*").eq("user_id", current_user["id"]).is_("session_end", None).execute()
    
    sessions_response = await safe_supabase_operation(
        get_sessions,
        f"Failed to get active sessions for user {current_user['id']}"
    )
    
    return sessions_response.data or []
