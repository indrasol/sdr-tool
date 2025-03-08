from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from services.auth_handler import verify_token
from core.cache.session_manager import SessionManager
from core.db.supabase_manager import SupabaseManager    
from utils.logger import log_info
import asyncio

# Initialize Session Manager
session_manager = SessionManager()

# Initialize Database Manager
supabase_manager = SupabaseManager()

router = APIRouter()

@router.post("/save_project")
async def save_project(
    session_id: str,
    current_user: dict = Depends(verify_token)
):
    """
    Save session data to the database when the user clicks the 'Save' button in the UI.

    Args:
        session_id: The session ID to save
        current_user: Authenticated user (via dependency)

    Returns:
        JSONResponse: Confirmation of save or error details
    """
    try:
        # Retrieve session data (wrap sync call in asyncio.to_thread if synchronous)
        session_data = await asyncio.to_thread(session_manager.get_session, session_id)
        if session_data is None:
            return JSONResponse(
                status_code=404,
                content={"detail": "Session not found"}
            )

        # Verify session ownership
        if session_data.get("user_id") != current_user["id"]:
            return JSONResponse(
                status_code=403,
                content={"detail": "Session does not belong to user"}
            )

        # Validate project_code existence
        project_code = session_data.get("project_code")
        if not project_code:
            return JSONResponse(
                status_code=400,
                content={"detail": "Project code missing in session data"}
            )

        # Save to database using the Supabase-compatible database manager
        await supabase_manager.update_project_data(
            user_id=current_user["id"],
            project_code=project_code,
            conversation_history=session_data.get("conversation_history", []),
            diagram_state=session_data.get("diagram_state", {"nodes": [], "edges": []})
        )

        log_info(f"Project {project_code} saved successfully for user {current_user['id']}")
        return JSONResponse(
            status_code=200,
            content={"message": "Project saved successfully"}
        )

    except HTTPException as e:
        log_info(f"HTTPException in save_project: {e.detail}")
        return JSONResponse(
            status_code=e.status_code,
            content={"detail": e.detail}
        )
    except ValueError as e:
        # Handle specific database errors (e.g., project not found)
        log_info(f"ValueError in save_project: {str(e)}")
        return JSONResponse(
            status_code=400,
            content={"detail": str(e)}
        )
    except Exception as e:
        # Handle unexpected errors
        log_info(f"Unexpected error saving project: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to save project: {str(e)}"}
        )