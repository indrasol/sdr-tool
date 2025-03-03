# Add to your API router file (e.g., cache/api/session.py or a new router)
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from core.cache.session_manager import SessionManager
from core.db.database_manager import DatabaseManager
from core.db.connection_manager import get_db
from models.db_schema_models import User  # Adjust based on your user model
from utils.logger import log_info
from services.auth_handler import get_current_user

router = APIRouter()
session_manager = SessionManager()
database_manager = DatabaseManager()

@router.post("/start_project_session")
async def start_project_session(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Create a new session for a specific project.

    Args:
        project_id: The ID of the project to start a session for

    Returns:
        JSONResponse with the session_id
    """
    try:
        project_data = database_manager.get_project_data(current_user.id, project_id, db)
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