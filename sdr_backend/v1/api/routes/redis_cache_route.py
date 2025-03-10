# Add to your API router file (e.g., cache/api/session.py or a new router)
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from core.cache.session_manager import SessionManager
from services.supabase_manager import SupabaseManager
from models.db_schema_models import User
from utils.logger import log_info
from services.auth_handler import verify_token
from core.db.supabase_db import get_supabase_client, safe_supabase_operation


router = APIRouter()

session_manager = SessionManager()
supabase_manager = SupabaseManager()

@router.post("/start_project_session")
async def start_project_session(
    project_id: str,
    current_user: User = Depends(verify_token)
):
    """
    Create a new session for a specific project.

    Args:
        project_id: The ID of the project to start a session for

    Returns:
        JSONResponse with the session_id
    """
    try:
        project_data = supabase_manager.get_project_data(current_user.id, project_id)
        if not project_data:
            return JSONResponse(
                status_code=404,
                content={"detail": f"Project {project_id} not found for user {current_user.id}"}
            )
        session_id = session_manager.create_project_session(current_user.id, project_id, project_data)
        return JSONResponse(
            status_code=200,
            content={"session_id": session_id, "message": "Project session created successfully"}
        )
    except Exception as e:
        log_info(f"Error creating project session: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to create session: {str(e)}"}
        )