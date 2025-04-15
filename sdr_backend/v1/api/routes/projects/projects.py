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
from datetime import datetime, timezone, timedelta

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
            "tenantId": project_response["tenant_id"],
            "dfd_data": project_response["dfd_data"],
            "threat_model_id": project_response["threat_model_id"]
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
        project_code: The project code to load
        current_user: Authenticated user (via dependency)

    Returns:
        JSONResponse: Session ID and project data including any cached threat model
    """
    user_id = current_user
    log_info(f"Loading project {project_code} for user {user_id}")
    
    try:
        # Initialize services
        supabase = get_supabase_client()
        
        # 1. Fetch project data from Supabase
        def fetch_project():
            return supabase.from_("projects").select("*").eq("project_code", project_code).eq("user_id", user_id).execute()
            
        project_response = await safe_supabase_operation(
            fetch_project,
            f"Failed to fetch project {project_code}"
        )
            
        if not project_response.data:
            log_info(f"Project {project_code} not found for user {user_id}")
            raise HTTPException(status_code=404, detail="Project not found or access denied")
            
        project_data = project_response.data[0]
        
        # 2. Create a new session for this project
        session_id = await session_manager.create_project_session(
            user_id=user_id,
            project_id=project_code
        )

        # 3. Get the conversation history and diagram state from project data
        conversation_history = project_data.get("conversation_history", [])
        diagram_state = project_data.get("diagram_state", {"nodes": [], "edges": []})
        
        # 4. Get threat model data if available
        threat_model_id = project_data.get("threat_model_id")
        dfd_data = project_data.get("dfd_data")
        
        log_info(f"Project loaded with diagram nodes: {len(diagram_state.get('nodes', []))}, " 
                f"edges: {len(diagram_state.get('edges', []))}, "
                f"conversations: {len(conversation_history)}, "
                f"threat_model_id: {threat_model_id}")

        # 5. Update the diagram state in the session
        await session_manager.update_diagram_state(
            session_id=session_id,
            diagram_state=diagram_state
        )

        # 6. Process conversation history entries 
        log_info(f"Processing {len(conversation_history)} conversation history entries")
        
        # First, determine the format of our conversation history
        uses_role_format = any("role" in entry for entry in conversation_history if isinstance(entry, dict))
        uses_query_format = any("query" in entry for entry in conversation_history if isinstance(entry, dict))
        
        # Process role-based format (new format)
        if uses_role_format:
            # Get all user messages
            user_messages = [msg for msg in conversation_history if isinstance(msg, dict) and msg.get("role") == "user"]
            
            # Sort user messages by ID if possible
            if all("id" in msg for msg in user_messages):
                user_messages.sort(key=lambda msg: msg.get("id", 0))
            
            # Process each user message and its corresponding assistant response
            for user_msg in user_messages:
                user_content = user_msg.get("content", "")
                user_id = user_msg.get("id")
                
                # Find corresponding assistant message (should be the next message with id = user_id + 1)
                ai_response = next(
                    (msg for msg in conversation_history 
                     if isinstance(msg, dict) and msg.get("role") == "assistant" and msg.get("id") == user_id + 1), 
                    None
                )
                
                if ai_response:
                    log_info(f"Adding conversation pair: User message {user_id} with AI response {ai_response.get('id')}")
                    
                    await session_manager.add_to_conversation(
                        session_id=session_id,
                        query=user_content,
                        response={
                            "message": ai_response.get("content", ""),
                            "response_type": ai_response.get("response_type", "Message")
                        },
                        diagram_state=ai_response.get("diagram_state"),
                        changed=ai_response.get("changed", False)
                    )
                else:
                    log_info(f"No matching assistant response found for user message {user_id}")
        
        # Process query-based format (old format)
        elif uses_query_format:
            # Process entries with query and response fields
            for i, entry in enumerate(conversation_history):
                if isinstance(entry, dict) and "query" in entry and "response" in entry:
                    log_info(f"Adding conversation pair {i+1} from query-based format")
                    await session_manager.add_to_conversation(
                        session_id=session_id,
                        query=entry["query"],
                        response=entry["response"]
                    )
        
        # 7. Cache the threat model in the session if available
        if dfd_data and threat_model_id:
            try:
                # Store the threat model in session cache
                await session_manager.store_threat_model(
                    session_id=session_id,
                    threat_model=dfd_data,
                    diagram_state=diagram_state
                )
                log_info(f"Cached threat model {threat_model_id} in session {session_id}")
            except Exception as e:
                log_info(f"Error caching threat model: {str(e)}")
                
        # 8. Get the final session data for response
        final_session_data = await session_manager.get_session(session_id)
        
        # 9. Return the loaded project data with session information
        return JSONResponse(
            status_code=200,
            content={
                "session_id": session_id,
                "project_id": project_code,
                "diagram_state": diagram_state,
                "conversation_history": conversation_history,
                "threat_model_id": threat_model_id,
                "dfd_data": dfd_data,
                "message": "Project loaded successfully"
            }
        )

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        log_info(f"Error loading project {project_code}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load project: {str(e)}")

@router.post("/save_project/{session_id}")
async def save_project(
    session_id: str,
    request_data: SaveProjectRequest = Body(...),
    current_user: dict = Depends(verify_token)
):
    """
    Save the project state from the active session to the database.
    This includes diagram state, conversation history, and generated threat model.
    
    Args:
        session_id: Active session identifier
        request_data: Project save request data
        current_user: Current authenticated user
        
    Returns:
        JSON response with save status
    """
    user_id = current_user
    project_code = request_data.project_code
    log_info(f"Saving project {project_code} from session {session_id}")
    
    try:
        # Initialize services
        session_mgr = SessionManager()
        if not session_mgr.redis_pool:
            await session_mgr.connect()
            
        # 1. Verify session exists and belongs to this user/project
        session_data = await session_mgr.get_session(
            session_id=session_id,
            expected_project_id=project_code,
            expected_user_id=user_id
        )
        
        if not session_data:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found or access denied")
            
        # 2. Extract data to save
        diagram_state = session_data.get("diagram_state", {})
        conversation_history = session_data.get("conversation_history", [])
        
        # 3. Check if there's a threat model in the session
        threat_model = None
        threat_model_id = None
        
        try:
            # Get threat model from session cache
            cached_threat_model, _ = await session_mgr.get_threat_model(
                session_id=session_id
            )
            
            if cached_threat_model:
                threat_model = cached_threat_model
                threat_model_id = cached_threat_model.get("threat_model_id")
                log_info(f"Found threat model {threat_model_id} in session to save")
        except Exception as e:
            log_info(f"Error retrieving threat model for saving: {str(e)}")
            
        # 4. Update the project in the database
        supabase = get_supabase_client()
        
        # Prepare update data
        update_data = {
            "diagram_state": diagram_state,
            "conversation_history": conversation_history,
            "diagram_updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Add threat model data if available
        if threat_model:
            update_data["dfd_data"] = threat_model
            
            if threat_model_id:
                update_data["threat_model_id"] = threat_model_id
                
        # Update the project
        def update_project_data():
            return supabase.from_("projects").update(update_data).eq("project_code", project_code).eq("user_id", user_id).execute()
            
        update_response = await safe_supabase_operation(
            update_project_data,
            f"Failed to update project {project_code}"
        )
        
        log_info(f"Successfully saved project {project_code} from session {session_id}")
        
        return JSONResponse(content={
            "status": "success",
            "message": "Project saved successfully",
            "project_code": project_code
        })
            
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        log_info(f"Error saving project {project_code} from session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save project: {str(e)}")

@router.get("/projects/{project_code}/history")
async def get_project_history(
    project_code: str,
    days: int = 10,
    current_user: dict = Depends(verify_token)
):
    """
    Retrieve user messages from the past specified number of days, 
    with an indication of which messages caused system changes.
    
    Args:
        project_code: The unique identifier for the project
        days: Number of days to look back (default: 10)
        current_user: Authenticated user (via dependency)
        
    Returns:
        List of user messages with metadata including whether they changed the system
    """
    try:
        user_id = current_user
        if not user_id:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        # Get project data from supabase
        project_data = await supabase_manager.get_project_data(
            user_id=user_id,
            project_code=project_code
        )
        
        if not project_data:
            raise HTTPException(status_code=404, detail=f"Project {project_code} not found")
        
        # Get conversation history
        conversation_history = project_data.get("conversation_history", [])
        
        # Calculate the cutoff date (days ago from now)
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Filter user messages from the past specified days
        user_messages = []
        
        for entry in conversation_history:
            # Handle both old and new format of conversation history
            if "id" in entry and "role" in entry:
                # New format with explicit IDs and roles
                if entry["role"] == "user":
                    try:
                        # Parse timestamp
                        timestamp = datetime.fromisoformat(entry["timestamp"].replace('Z', '+00:00'))
                        
                        # Check if message is within the specified timeframe
                        if timestamp >= cutoff_date:
                            # Find the corresponding AI response to check if it changed the diagram
                            changed = False
                            diagram_state = None
                            
                            # Look for the next message which should be the AI response
                            for i, potential_response in enumerate(conversation_history):
                                if "id" in potential_response and potential_response.get("id") == entry["id"] + 1:
                                    changed = potential_response.get("changed", False)
                                    diagram_state = potential_response.get("diagram_state")
                                    break
                            
                            user_messages.append({
                                "id": entry["id"],
                                "content": entry["content"],
                                "timestamp": entry["timestamp"],
                                "changed": changed,
                                "has_diagram_state": diagram_state is not None
                            })
                    except (ValueError, KeyError) as e:
                        # Skip entries with invalid timestamps or missing required fields
                        log_info(f"Skipping entry due to error: {str(e)}")
                        continue
            else:
                # Old format with query/response structure
                if "query" in entry and "timestamp" in entry:
                    try:
                        # Parse timestamp
                        timestamp = datetime.fromisoformat(entry["timestamp"].replace('Z', '+00:00'))
                        
                        # Check if message is within the specified timeframe
                        if timestamp >= cutoff_date:
                            # For old format, we can't reliably determine if it changed the diagram
                            user_messages.append({
                                "id": None,  # No ID in old format
                                "content": entry["query"],
                                "timestamp": entry["timestamp"],
                                "changed": False,  # Can't determine for old format
                                "has_diagram_state": False
                            })
                    except (ValueError, KeyError) as e:
                        # Skip entries with invalid timestamps
                        log_info(f"Skipping entry due to error: {str(e)}")
                        continue
        
        # Sort messages by timestamp, newest first
        user_messages.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return {"messages": user_messages}
    
    except HTTPException as e:
        raise e
    except Exception as e:
        log_info(f"Error retrieving project history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve project history: {str(e)}")

@router.post("/projects/{project_code}/revert/{message_id}")
async def revert_to_message(
    project_code: str,
    message_id: int,
    current_user: dict = Depends(verify_token)
):
    """
    Revert diagram state to the version that existed after a specific message in the conversation history.
    
    Args:
        project_code: The unique identifier for the project
        message_id: The ID of the user message to revert to
        current_user: Authenticated user (via dependency)
        
    Returns:
        Dictionary with success message and updated diagram state
    """
    try:
        user_id = current_user
        if not user_id:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        # Get project data from supabase
        project_data = await supabase_manager.get_project_data(
            user_id=user_id,
            project_code=project_code
        )
        
        if not project_data:
            raise HTTPException(status_code=404, detail=f"Project {project_code} not found")
        
        # Get conversation history
        conversation_history = project_data.get("conversation_history", [])
        
        # Find the message we want to revert to
        target_user_message = None
        target_ai_response = None
        saved_diagram_state = None
        
        # First, find the user message with the given ID
        for entry in conversation_history:
            if "id" in entry and entry["id"] == message_id and entry.get("role") == "user":
                target_user_message = entry
                # Now find the corresponding AI response (should be the next message)
                expected_ai_id = message_id + 1
                for ai_entry in conversation_history:
                    if "id" in ai_entry and ai_entry["id"] == expected_ai_id and ai_entry.get("role") == "assistant":
                        target_ai_response = ai_entry
                        saved_diagram_state = ai_entry.get("diagram_state")
                        break
                break
        
        if not target_user_message:
            raise HTTPException(status_code=404, detail=f"Message with ID {message_id} not found")
        
        if not saved_diagram_state:
            raise HTTPException(
                status_code=400, 
                detail="Cannot revert to this message as it has no associated diagram state"
            )
        
        # Update the project with the reverted diagram state
        await supabase_manager.update_project_data(
            user_id=user_id,
            project_code=project_code,
            diagram_state=saved_diagram_state
        )
        
        # Check for existing active sessions for this user and project
        active_sessions = await session_manager.get_active_sessions_for_user(user_id, project_code)
        session_id = None
        
        if active_sessions:
            # Use the most recent active session
            session_id = active_sessions[0]["session_id"]
            log_info(f"Using existing active session {session_id} for revert operation")
        else:
            # Create a new session
            session_id = await session_manager.create_project_session(user_id, project_code)
            log_info(f"Created new session {session_id} for revert operation")
        
        # Update session with the reverted diagram state
        await session_manager.update_diagram_state(session_id, saved_diagram_state)
        
        # Add a reverting message to the conversation history
        user_revert_message = f"Revert diagram to state after: \"{target_user_message.get('content')}\""
        ai_response_message = f"Successfully reverted to diagram state after message: \"{target_user_message.get('content')}\""
        
        await session_manager.add_to_conversation(
            session_id,
            user_revert_message,
            {
                "message": ai_response_message,
                "response_type": "SystemNotification"
            }
        )
        
        # Update the conversation history in the database as well
        new_conversation_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "query": user_revert_message,
            "response": {
                "message": ai_response_message,
                "response_type": "SystemNotification"
            }
        }
        
        updated_conversation_history = conversation_history + [new_conversation_entry]
        
        await supabase_manager.update_project_data(
            user_id=user_id,
            project_code=project_code,
            conversation_history=updated_conversation_history
        )
        
        return {
            "message": "Successfully reverted to previous diagram state",
            "diagram_state": saved_diagram_state,
            "session_id": session_id,
            "revert_message": user_revert_message,
            "response_message": ai_response_message
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        log_info(f"Error reverting to message state: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to revert to message state: {str(e)}")