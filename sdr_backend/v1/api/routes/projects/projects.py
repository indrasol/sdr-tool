from fastapi import APIRouter, Depends, HTTPException
from databases import Database
from models.db_schema_models import User
from services.auth_handler import get_current_user
from core.db.connection_manager import get_db
from core.db.database_manager import DatabaseManager

router = APIRouter()

# Initialize DatabaseManager
database_manager = DatabaseManager()

# Create a new project
@router.post("/projects")
async def create_project(
    project_name: str,
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    try:
        project_id = await database_manager.create_project(
            user_id=current_user.id,
            project_name=project_name,
            db=db
        )
        return {"project_id": project_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

# Get all projects for the user
@router.get("/projects")
async def get_projects(
    current_user: User = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    try:
        projects = await database_manager.get_user_projects(
            user_id=current_user.id,
            db=db
        )
        return {"projects": projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve projects: {str(e)}")