from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.db_schema_models import User, Project
from services.auth_handler import get_current_user
from core.db.connection_manager import get_db
from core.db.database_manager import DatabaseManager
from typing import Optional

router = APIRouter()

# Initialize DatabaseManager
database_manager = DatabaseManager()

# Create a new project
@router.post("/projects")
async def create_project(
    project_name: str,
    tenant_id: int,
    project_description: Optional[str] = None,  # Optional description from SecureTrack interface
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new project associated with a tenant for the authenticated user."""
    # Validate tenant access
    if tenant_id not in [tenant.id for tenant in current_user.tenants]:
        raise HTTPException(status_code=403, detail="Not authorized for this tenant")
    
    try:
        project_id = await database_manager.create_project(
            user_id=current_user.id,
            project_name=project_name,
            tenant_id=tenant_id,
            project_description=project_description,
            db=db
        )
        return {"project_id": project_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

# Get all projects for the user
@router.get("/projects")
async def get_projects(
    tenant_id: Optional[int] = None,  # Optional tenant filter
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all projects for the authenticated user, optionally filtered by tenant."""
    try:
        if tenant_id:
            # Filter by user_id and tenant_id
            stmt = select(Project).where(
                Project.user_id == current_user.id,
                Project.tenant_id == tenant_id
            )
        else:
            # Get all projects for the user
            stmt = select(Project).where(Project.user_id == current_user.id)
        
        result = await db.execute(stmt)
        projects = result.scalars().all()
        return {"projects": [project.to_dict() for project in projects]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve projects: {str(e)}")