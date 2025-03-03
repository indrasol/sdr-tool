from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import JSONResponse
from services.auth_handler import get_current_user
from core.db.connection_manager import get_db
from models.db_schema_models import User
from core.cache.session_manager import SessionManager
from core.db.database_manager import DatabaseManager
from utils.logger import log_info
import asyncio

# Initialize Session Manager
session_manager = SessionManager()

# Initialize Database Manager
database_manager = DatabaseManager()

router = FastAPI()

@router.post("/save_project")
async def save_project(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Save session data to the database when the user clicks the 'Save' button in the UI.

    Args:
        session_id: The session ID to save
        current_user: Authenticated user (via dependency)
        db: Database connection (via dependency)

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
        if session_data["user_id"] != current_user.id:
            return JSONResponse(
                status_code=403,
                content={"detail": "Session does not belong to user"}
            )

        # Validate project_id existence
        project_id = session_data.get("project_id")
        if not project_id:
            return JSONResponse(
                status_code=400,
                content={"detail": "Project ID missing in session data"}
            )

        # Save to database (wrap sync call in asyncio.to_thread if synchronous)
        await database_manager.update_project_data(
            user_id=current_user.id,
            project_id=project_id,
            conversation_history=session_data["conversation_history"],
            diagram_state=session_data["diagram_state"],
            db=db
        )

        return JSONResponse(
            status_code=200,
            content={"message": "Project saved successfully"}
        )

    except HTTPException as e:
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
            content={"detail": "Failed to save project"}
        )