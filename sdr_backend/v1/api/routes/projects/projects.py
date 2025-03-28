from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import JSONResponse
from services.auth_handler import verify_token
from services.supabase_manager import SupabaseManager
from typing import Optional, Dict, Any
from models.project_models import ProjectData, UpdateProjectData
from models.request_models import SaveProjectRequest
from utils.logger import log_info
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from constants import ProjectStatus, ProjectPriority
from core.cache.session_manager import SessionManager

router = APIRouter()

# Initialize DatabaseManager
supabase_manager = SupabaseManager()
session_manager = SessionManager()

# Create a new project
@router.post("/projects")
async def create_project(
    project: ProjectData,
    current_user: dict = Depends(verify_token)
):
    """
    Create a new project for the authenticated user under a tenant.

    Args:
        project: Project data from the request body.
        current_user: Authenticated user details from token.

    Returns:
        dict: {"project_id": project_code}

    Raises:
        HTTPException: For authorization or creation errors.
    """
    log_info(f"Current user: {current_user}")
    log_info(f"Tenant ID: {project.tenant_id}")
    log_info(f"Creator : {project.creator}")

    supabase = get_supabase_client()
    # Check Tenant user access
    check_tenant_access = lambda: supabase.from_("user_tenant_association").select("tenant_id").eq("user_id", current_user).execute()
    tenant_response = await safe_supabase_operation(check_tenant_access, "Failed to verify tenant access")
    user_tenant_ids = [item["tenant_id"] for item in tenant_response.data]

    if project.tenant_id not in user_tenant_ids:
        raise HTTPException(status_code=403, detail="Not authorized for this tenant")
    
    # Get user info
    user_info = lambda: supabase.from_("users").select("*").eq("id", current_user).execute()
    user_response = await safe_supabase_operation(user_info, "Failed supabase operation to fetch user info")
    user_name = user_response.data[0]["username"]
    log_info(f"user : {user_name}")
    log_info(f"tenant_id : {project.tenant_id}")



    # Optional: Ensure creator matches authenticated user
    if project.creator != user_name:
        log_info(f"Creator mismatch: {project.creator} vs {user_name}")
        
        raise HTTPException(status_code=403, detail="Creator must match authenticated user")

    try:
        log_info(f"Creating project for user: {current_user}, tenant: {project.tenant_id}")
        project_id = await supabase_manager.create_project(
            user_id=current_user, 
            name=project.name,
            tenant_id=project.tenant_id,
            description=project.description,
            status=project.status,  # Enum object
            priority=project.priority,  # Enum object
            created_date=project.created_date,
            due_date=project.due_date,
            creator=project.creator,
            domain=project.domain,
            template_type=project.template_type,
            imported_file=project.imported_file
        )
        log_info("project id : {project_id}")
        return {
            "id": project_id,
            "name": project.name,
            "description": project.description,
            "status": project.status,
            "priority": project.priority,
            "createdDate": project.created_date,
            "dueDate": project.due_date,
            "creator": project.creator,
            "domain": project.domain,
            "templateType": project.template_type,
            "importedFile": project.imported_file,
            "tenantId": project.tenant_id
        }
        # return {"project_id": project_id}
    except HTTPException as he:
        raise he
    except Exception as e:
        log_info(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

# Get all projects for the user
@router.get("/projects")
async def get_projects(
    tenant_id: int,
    status: Optional[ProjectStatus] = None,  # Enum for status filtering
    priority: Optional[ProjectPriority] = None,  # Enum for priority filtering
    sort_by: Optional[str] = "created_date",
    sort_order: Optional[str] = "desc",
    limit: int = 10,
    offset: int = 0,
    current_user: dict = Depends(verify_token)  # Dependency for user authentication
) -> Dict[str, Any]:
    """
    Retrieve projects for the authenticated user with optional filters.
    """
    try:
        log_info("entered projects try block")
        projects = await supabase_manager.get_user_projects(
            user_id=current_user,
            tenant_id=tenant_id,
            status=status,
            priority=priority,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset
        )
        log_info("projects : {projects}")
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
            return supabase.from_("projects").select("*").eq("project_code", project_code).eq("user_id", current_user).execute()
            
        project_response = await safe_supabase_operation(
            fetch_project,
            f"Failed to fetch project {project_code}"
        )

        project_response = project_response.data[0]
        # Get the string values from the database
        status_str = project_response["status"]
        priority_str = project_response["priority"]
        # Convert strings to Enum objects
        try:
            status_enum = ProjectStatus[status_str]
            log_info(f"status inside get after fetch: {status_enum}")
        except KeyError:
            log_info(f"Invalid status value from database: {status_str}")
            status_enum = None  # Fallback to None or handle differently
            
        try:
            priority_enum = ProjectPriority[priority_str]
        except KeyError:
            log_info(f"Invalid priority value from database: {priority_str}")
            priority_enum = None  # Fallback to None or handle differently
            
        log_info(f"Status enum : {status_enum}")
        log_info(f"Priority enum : {priority_enum}")

        return {
            "id": project_code,
            "name": project_response["name"],
            "description": project_response["description"],
            "status": status_enum.value if status_enum else status_str,
            "priority": priority_enum.value if priority_enum else priority_str,
            "createdDate": project_response["created_date"],
            "assigned_to": project_response["assigned_to"],
            "dueDate": project_response["due_date"],
            "diagram_state": project_response["diagram_state"],
            "conversation_history": project_response["conversation_history"],
            "creator": project_response["creator"],
            "domain": project_response["domain"],
            "templateType": project_response["template_type"],
            "importedFile": project_response["imported_file"],
            "tenantId": project_response["tenant_id"]
        }

    except HTTPException:
        raise
    except Exception as e:
        log_info(f"Error retrieving project {project_code}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve project: {str(e)}")

# Update project data
@router.put("/projects/{project_code}")
async def update_project(
    project_code: str,  # Get project_code from path
    project_update: UpdateProjectData,
    current_user: dict = Depends(verify_token)
):
    """Update a project's details."""
    try:
        supabase = get_supabase_client()

        log_info(f"Update project request: {project_update.model_dump()}")
        
        # First check if the project exists and belongs to the user
        def check_project():
            return supabase.from_("projects").select("id").eq("project_code", project_code).eq("user_id", current_user).execute()
            
        project_check = await safe_supabase_operation(
            check_project,
            f"Failed to verify project {project_code}"
        )
        
        if not project_check.data:
            raise HTTPException(status_code=404, detail=f"Project {project_code} not found or not authorized")
        
        # Get only the fields that were explicitly set in the request
        update_data = project_update.model_dump(exclude_unset=True, exclude={"project_code"})
        log_info(f"Initial update data: {update_data}")

        # If due_date is provided, convert it to ISO format
        if "due_date" in update_data and update_data['due_date']:
            update_data['due_date'] = update_data['due_date'].isoformat()
        
        # Handle status field
        if "status" in update_data and update_data['status']:
            try:
                status_str = update_data['status']
                log_info(f"Processing status: {status_str}")
                # Handle case-insensitive status and convert spaces to underscores
                normalized_status = status_str.upper().replace(" ", "_")
                status_enum = ProjectStatus[normalized_status]
                update_data["status"] = status_enum.name
                log_info(f"Processed status update: {status_enum.name}")
            except (KeyError, ValueError) as e:
                log_info(f"Invalid status value: {status_str}. Error: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Invalid status value: {status_str}")

        # Handle priority field - THIS IS THE FIX
        if "priority" in update_data and update_data['priority']:
            try:
                priority_str = update_data['priority']
                log_info(f"Processing priority: {priority_str}")
                # Handle case-insensitive priority
                normalized_priority = priority_str.upper().replace(" ", "_")
                priority_enum = ProjectPriority[normalized_priority]
                update_data["priority"] = priority_enum.name
                log_info(f"Processed priority update: {priority_enum.name}")
            except (KeyError, ValueError) as e:
                log_info(f"Invalid priority value: {priority_str}. Error: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Invalid priority value: {priority_str}")

        # Log updates for debugging
        log_info(f"Final update data: {update_data}")

        # Only update if there are fields to update
        if not update_data:
            return {"message": f"No fields to update for project {project_code}"}
        
        def update_project():
            return supabase.from_("projects").update(update_data).eq("project_code", project_code).eq("user_id", current_user).execute()
            
        await safe_supabase_operation(
            update_project,
            f"Failed to update project {project_code}"
        )

        log_info(f"Completed supabase update operation")

        # Fetch the updated project
        def get_updated_project():
            return supabase.from_("projects").select("*").eq("project_code", project_code).eq("user_id", current_user).execute()
            
        updated_project_result = await safe_supabase_operation(
            get_updated_project,
            f"Failed to retrieve updated project {project_code}"
        )

        updated_project = updated_project_result.data[0] if updated_project_result.data else None
        log_info(f"Updated Project details: {updated_project}")
        
        # Create a response that contains only the updated fields
        updated_fields = {}
        if updated_project:
            for key, value in update_data.items():
                if key in updated_project:
                    try:
                        if key == 'status':
                            status_enum = ProjectStatus[updated_project['status']]
                            updated_fields[key] = status_enum.value
                        elif key == 'priority':
                            priority_enum = ProjectPriority[updated_project['priority']]
                            updated_fields[key] = priority_enum.value
                        else:
                            updated_fields[key] = updated_project[key]
                    except (KeyError, ValueError) as e:
                        log_info(f"Error processing response field {key}: {str(e)}")
                        updated_fields[key] = updated_project[key]
        
        return {
            "message": f"Project {project_code} updated successfully",
            "updated_fields": updated_fields,
            "project": updated_project
        }
    
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
            return supabase.from_("projects").select("id").eq("project_code", project_code).eq("user_id", current_user).execute()
            
        project_check = await safe_supabase_operation(
            check_project,
            f"Failed to verify project {project_code}"
        )
        
        if not project_check.data:
            raise HTTPException(status_code=404, detail=f"Project {project_code} not found or not authorized")
        
        def delete_project():
            return supabase.from_("projects").delete().eq("project_code", project_code).eq("user_id", current_user).execute()
            
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
    

# Get a specific project
@router.get("/load_project/{project_code}")
async def load_project(
    project_code: str,
    current_user: dict = Depends(verify_token)
):
    """
    Load a project and create a new session for it.
    Used when a user returns to continue working on a previously saved project.

    Args:
        project_id: The project ID to load
        current_user: Authenticated user (via dependency)
        session_manager: SessionManager instance (injected)
        supabase_manager: SupabaseManager instance (injected)

    Returns:
        JSONResponse: Session ID and project data
    """
    try:
        user_id = current_user
        if not user_id:
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid user authentication data"}
            )

        # Fetch project data from the database
        project_data = await supabase_manager.get_project_data(
            user_id=user_id,
            project_code=project_code
        )

        if not project_data:
            log_info(f"Project {project_code} not found for user {user_id}")
            return JSONResponse(
                status_code=404,
                content={"detail": "Project not found"}
            )
        
        log_info(f"Load Project Data : {project_data}")

        # Create a new session for this project
        session_id = await session_manager.create_project_session(
            user_id=user_id,
            project_id=project_code
        )

        # Get the conversation history and diagram state from project data
        conversation_history = project_data.get("conversation_history", [])
        diagram_state = project_data.get("diagram_state", {"nodes": [], "edges": []})

        log_info(f"Diagram state for load project  : {project_data['diagram_state']}")
        log_info(f"Conversation history for load project  : {project_data['conversation_history']}")

        # Update the diagram state in the session
        await session_manager.update_diagram_state(
            session_id=session_id,
            diagram_state=diagram_state
        )

        # Add conversation history entries to the session
        for entry in conversation_history:
            if "query" in entry and "response" in entry:
                await session_manager.add_to_conversation(
                    session_id=session_id,
                    query=entry["query"],
                    response=entry["response"]
                )

        log_info(f"Project {project_code} loaded successfully for user {user_id}")
        return JSONResponse(
            status_code=200,
            content={
                "session_id": session_id,
                "project_id": project_code,
                "diagram_state": diagram_state,
                "conversation_history": conversation_history,
                "message": "Project loaded successfully"
            }
        )

    except HTTPException as e:
        log_info(f"HTTPException in load_project: {e.detail}")
        return JSONResponse(
            status_code=e.status_code,
            content={"detail": e.detail}
        )
    except Exception as e:
        log_info(f"Unexpected error loading project: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to load project: {str(e)}"}
        )

@router.post("/save_project/{session_id}")
async def save_project(
    session_id: str,
    request_data: SaveProjectRequest = Body(...),
    current_user: dict = Depends(verify_token)
):
    """
    Save session data to the database when the user clicks the 'Save' button in the UI.
    Allows sending the current diagram state to ensure it's up to date.

    Args:
        session_id: The session ID to save (path parameter)
        request_data: Request body containing session_id and optional diagram_state
        current_user: Authenticated user (via dependency)
        session_manager: SessionManager instance (injected)
        supabase_manager: SupabaseManager instance (injected)

    Returns:
        JSONResponse: Confirmation of save or error details
    """
    try:
        # Get user ID from the authenticated user
        user_id = current_user
        if not user_id:
            log_info(f"Invalid user authentication data")
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid user authentication data"}
            )

        # Retrieve session data - this is already async in the SessionManager
        try:
            session_data = await session_manager.get_session(
                session_id, 
                expected_user_id=user_id  # Verify user ID right in the get_session call
            )
        except HTTPException as e:
            log_info(f"Session error: {e.detail}")
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail}
            )

        # Get project ID from session
        project_id = session_data.get("project_id")
        log_info(f"Project id in save project : {project_id}")
        if not project_id:
            log_info(f"Project ID missing in session {session_id}")
            return JSONResponse(
                status_code=400,
                content={"detail": "Project ID missing in session data"}
            )
        
        # If diagram state is provided in the request, update it in the session
        if request_data.diagram_state:
            await session_manager.update_diagram_state(session_id, request_data.diagram_state)
            log_info(f"Updated diagram state for session {session_id}")
    

        # Extend session TTL to keep it alive
        await session_manager.extend_session_ttl(session_id)

        # Use the diagram state from the request if provided, otherwise fall back to session data
        session_data_for_reference = await session_manager.get_session(session_id)
        diagram_state = request_data.diagram_state if request_data.diagram_state else session_data_for_reference.get("diagram_state", {"nodes": [], "edges": []})
        conversation_history = session_data_for_reference.get("conversation_history", [])

        log_info(f"Diagram state in save project : {diagram_state}")
        log_info(f"Conversation History in save project : {conversation_history}")
        
        # Save to database
        await supabase_manager.update_project_data(
            user_id=user_id,
            project_code=project_id,
            conversation_history=conversation_history,
            diagram_state=diagram_state
        )

        log_info(f"Project {project_id} saved successfully for user {user_id}")
        return JSONResponse(
            status_code=200,
            content={
                "message": "Project saved successfully", 
                "session_id": session_id,
                "project_id": project_id
            }
        )

    except HTTPException as e:
        log_info(f"HTTPException in save_project: {e.detail}")
        return JSONResponse(
            status_code=e.status_code,
            content={"detail": e.detail}
        )
    except ValueError as e:
        # Handle specific database errors
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