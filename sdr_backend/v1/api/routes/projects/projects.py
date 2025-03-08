from fastapi import APIRouter, Depends, HTTPException
from services.auth_handler import verify_token
from core.db.supabase_manager import SupabaseManager
from typing import Optional
from models.project_models import ProjectData
from utils.logger import log_info
from core.db.supabase_db import get_supabase_client, safe_supabase_operation

router = APIRouter()

# Initialize DatabaseManager
supabase_manager = SupabaseManager()

# Create a new project
@router.post("/projects")
async def create_project(
    project: ProjectData,
    current_user: dict = Depends(verify_token)
):
    """Create a new project associated with a tenant for the authenticated user."""
    # Validate tenant access
    log_info(f"Current user: {current_user}")
    log_info(f"Tenant ID: {project.tenant_id}")
    
    supabase = get_supabase_client()
    
    # Check user's tenant access
    def check_tenant_access():
        return supabase.from_("user_tenant_association").select("tenant_id").eq("user_id", current_user["id"]).execute()
    
    tenant_response = await safe_supabase_operation(
        check_tenant_access,
        "Failed to verify tenant access"
    )
    
    user_tenant_ids = [item["tenant_id"] for item in tenant_response.data]
    
    if project.tenant_id not in user_tenant_ids:
        raise HTTPException(status_code=403, detail="Not authorized for this tenant")
    
    try:
        log_info(f"Creating project for user: {current_user['id']}, tenant: {project.tenant_id}")
        project_id = await supabase_manager.create_project(
            user_id=current_user["id"],
            project_name=project.name,
            tenant_id=project.tenant_id,
            project_description=project.description,
            status=project.status,
            priority=project.priority,
            created_date=project.created_date,
            due_date=project.due_date,
            creator=project.creator,
            domain=project.domain,
            template_type=project.template_type,
            imported_file=project.imported_file
        )
        return {"project_id": project_id}
    except Exception as e:
        log_info(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

# Get all projects for the user
@router.get("/projects")
async def get_projects(
    tenant_id: Optional[int] = None,  # Optional tenant filter
    current_user: dict = Depends(verify_token)
):
    """Retrieve all projects for the authenticated user, optionally filtered by tenant."""
    try:
        projects = await supabase_manager.get_user_projects(
            user_id=current_user["id"],
            tenant_id=tenant_id
        )
        return {"projects": projects}
    except Exception as e:
        log_info(f"Error retrieving projects: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve projects: {str(e)}")

# Get a specific project
@router.get("/projects/{project_code}")
async def get_project(
    project_code: str,
    current_user: dict = Depends(verify_token)
):
    """Retrieve a specific project by its code for the authenticated user."""
    try:
        supabase = get_supabase_client()
        
        def fetch_project():
            return supabase.from_("projects").select("*").eq("project_code", project_code).eq("user_id", current_user["id"]).execute()
            
        project_response = await safe_supabase_operation(
            fetch_project,
            f"Failed to fetch project {project_code}"
        )
        
        if not project_response.data:
            raise HTTPException(status_code=404, detail=f"Project {project_code} not found")
            
        # Convert to the same format as the to_dict method in the SQLAlchemy model
        project = supabase_manager._project_to_dict(project_response.data[0])
        return project
    except HTTPException:
        raise
    except Exception as e:
        log_info(f"Error retrieving project {project_code}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve project: {str(e)}")

# Update project data
@router.put("/projects/{project_code}")
async def update_project(
    project_code: str,
    project_update: ProjectData,
    current_user: dict = Depends(verify_token)
):
    """Update a project's details."""
    try:
        supabase = get_supabase_client()
        
        # First check if the project exists and belongs to the user
        def check_project():
            return supabase.from_("projects").select("id").eq("project_code", project_code).eq("user_id", current_user["id"]).execute()
            
        project_check = await safe_supabase_operation(
            check_project,
            f"Failed to verify project {project_code}"
        )
        
        if not project_check.data:
            raise HTTPException(status_code=404, detail=f"Project {project_code} not found or not authorized")
        
        # Prepare update data
        update_data = {
            "name": project_update.name,
            "description": project_update.description,
            "status": project_update.status,
            "priority": project_update.priority,
            "due_date": project_update.due_date.isoformat() if project_update.due_date else None,
            "domain": project_update.domain,
            "template_type": project_update.template_type
        }
        
        def update_project():
            return supabase.from_("projects").update(update_data).eq("project_code", project_code).eq("user_id", current_user["id"]).execute()
            
        await safe_supabase_operation(
            update_project,
            f"Failed to update project {project_code}"
        )
        
        return {"message": f"Project {project_code} updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        log_info(f"Error updating project {project_code}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")

# Delete a project
@router.delete("/projects/{project_code}")
async def delete_project(
    project_code: str,
    current_user: dict = Depends(verify_token)
):
    """Delete a specific project."""
    try:
        supabase = get_supabase_client()
        
        # First check if the project exists and belongs to the user
        def check_project():
            return supabase.from_("projects").select("id").eq("project_code", project_code).eq("user_id", current_user["id"]).execute()
            
        project_check = await safe_supabase_operation(
            check_project,
            f"Failed to verify project {project_code}"
        )
        
        if not project_check.data:
            raise HTTPException(status_code=404, detail=f"Project {project_code} not found or not authorized")
        
        def delete_project():
            return supabase.from_("projects").delete().eq("project_code", project_code).eq("user_id", current_user["id"]).execute()
            
        await safe_supabase_operation(
            delete_project,
            f"Failed to delete project {project_code}"
        )
        
        return {"message": f"Project {project_code} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        log_info(f"Error deleting project {project_code}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")