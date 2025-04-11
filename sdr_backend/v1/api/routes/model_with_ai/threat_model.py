# routers/threatmodel.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import json
import asyncio

# Adjust import paths as necessary
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from services.auth_handler import verify_token
from services.supabase_manager import SupabaseManager
from core.cache.session_manager import SessionManager
from services.threat_modeling_service import ThreatModelingService
from models.dfd_models import DFDResponse, DFDGenerationStartedResponse, DFDSwitchRequest
from utils.logger import log_info
from v1.api.routes.model_with_ai.design import run_dfd_generation_and_save, generate_threat_model_background

router = APIRouter()
supabase_manager = SupabaseManager()
threat_modeling_service = ThreatModelingService()
session_manager = SessionManager()

@router.get(
    "/projects/{project_code}/threatmodel",
    response_model=DFDResponse,
    summary="Get Latest Threat Model",
    description="Retrieves the most recently generated threat model data for a project.",
    tags=["Threat Modeling"]
)
async def get_threat_model_endpoint(
    project_code: str,
    current_user: dict = Depends(verify_token),
    trigger_generation: bool = Query(False, description="Whether to trigger generation if not available")
):

    user_id = current_user
    log_info(f"Request to get threat model for project: {project_code} by user: {user_id}")

    try:
        supabase = get_supabase_client()
        # Fetch project data
        def fetch_project():
            return supabase.from_("projects").select("*").eq("project_code", project_code).eq("user_id", current_user).execute()
            
        project_response = await safe_supabase_operation(
            fetch_project,
            f"Failed to fetch project {project_code}"
        )

        project = project_response.data[0]
        # project_list = await supabase_manager.get_user_projects(user_id=user_id, project_code_filter=project_code, limit=1)
        # if not project_list:
        #      raise HTTPException(status_code=404, detail=f"Project {project_code} not found or access denied.")
        # project = project_list[0]

        # Check if dfd_data and threat_model_id exist
        dfd_data = project.get("dfd_data")
        threat_model_id_from_db = project.get("threat_model_id")
        
        log_info(f"DFD Data : {dfd_data}")
        log_info(f"Threat Model Id : {threat_model_id_from_db}")

        # If no threat model exists and trigger_generation is True, initiate generation
        if (not dfd_data or not threat_model_id_from_db) and trigger_generation:
            # Check if diagram is empty
            diagram_state = project.get("diagram_state")
            if not diagram_state or not diagram_state.get("nodes"):
                raise HTTPException(status_code=400, detail="Architecture diagram is empty. Cannot generate threat model.")
                
            # Create a background task to generate the DFD
            background_tasks = BackgroundTasks()
            background_tasks.add_task(
                run_dfd_generation_and_save,
                user_id,
                project_code,
                diagram_state
            )
            
            # Return a special response indicating generation has started
            return JSONResponse(
                content={
                    "status": "generating",
                    "message": "Threat model generation has been initiated. Please check back shortly.",
                    "project_code": project_code
                },
                status_code=202
            )

        if not dfd_data or not threat_model_id_from_db:
            log_info(f"Threat model data or ID not found for project {project_code}")
            raise HTTPException(status_code=404, detail="Threat model has not been generated or is incomplete for this project.")

        # Consistency check and correction
        if dfd_data.get("threat_model_id") != threat_model_id_from_db:
             log_info(f"Warning: Mismatch between threat_model_id in dfd_data ({dfd_data.get('threat_model_id')}) and DB column ({threat_model_id_from_db}). Correcting dfd_data.")
             dfd_data["threat_model_id"] = threat_model_id_from_db

        # Validate the retrieved data
        try:
            # Ensure generated_at is present, add if missing (though service should add it)
            if "generated_at" not in dfd_data:
                 dfd_data["generated_at"] = datetime.now(timezone.utc).isoformat() # Fallback
            validated_response = DFDResponse(**dfd_data)
        except Exception as validation_error:
             log_info(f"Stored dfd_data for project {project_code} failed validation: {validation_error}")
             # Optionally log the invalid data: log_info(f"Invalid dfd_data: {dfd_data}")
             raise HTTPException(status_code=500, detail="Stored threat model data is invalid.")

        log_info(f"Returning existing threat model {validated_response.threat_model_id} for project {project_code}")
        return JSONResponse(content=validated_response.model_dump(exclude_none=True))

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        log_info(f"Error retrieving threat model for project {project_code}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve threat model: {str(e)}")
    

@router.post(
    "/projects/{project_code}/threatmodel",
    response_model=DFDGenerationStartedResponse, # Correct response model
    status_code=202, # Correct status code
    summary="Trigger Threat Model Generation",
    description="Starts the asynchronous generation of the DFD/Threat Model based on the project's current Architecture Diagram.",
    tags=["Threat Modeling"]
)
async def trigger_generate_threat_model_endpoint(
    project_code: str,
    background_tasks: BackgroundTasks,
    current_user_sub: str = Depends(verify_token), # Get user_id/sub
    # Allow frontend to optionally send state if it has unsaved changes
    diagram_state: Optional[Dict[str, Any]] = None
):
    """
    Triggers the asynchronous generation of the threat model.
    """
    user_id = current_user_sub
    log_info(f"Received direct POST request to trigger threat model generation for project: {project_code} by user: {user_id}")

    # Call the centralized trigger function
    # Session ID is optional here, primarily relies on diagram_state if provided,
    # otherwise background task will fetch from DB.
    await _trigger_dfd_generation(
        user_id=user_id,
        project_code=project_code,
        session_id=None,
        request_diagram_state=diagram_state,
        background_tasks=background_tasks
    )

    # Return 202 Accepted response
    return DFDGenerationStartedResponse(project_code=project_code)


@router.post("/projects/{project_code}/switch-to-dfd", status_code=202)
async def switch_to_dfd_endpoint(
    project_code: str,
    switch_request: DFDSwitchRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(verify_token)
):
    """
    Endpoint triggered when user switches from AD to DFD view.
    Initiates background DFD generation if needed.
    """
    user_id = current_user
    log_info(f"Switch to DFD view triggered for project: {project_code} by user: {user_id}")

    try:
        # Fetch project data and current diagram state
        supabase = get_supabase_client()
        # Fetch project data
        def fetch_project():
            return supabase.from_("projects").select("*").eq("project_code", project_code).eq("user_id", user_id).execute()
            
        project_response = await safe_supabase_operation(
            fetch_project,
            f"Failed to fetch project {project_code}"
        )

        if not project_response.data:
            raise HTTPException(status_code=404, detail=f"Project {project_code} not found or access denied.")

        project = project_response.data[0]
        diagram_state = project.get("diagram_state", {})
        
        if not diagram_state:
            log_info(f"Empty diagram state for project {project_code}")
            raise HTTPException(status_code=400, detail="Architecture diagram is empty. Add components before generating a threat model.")
        
        # Check if nodes array is empty
        if not diagram_state.get("nodes") or len(diagram_state.get("nodes", [])) == 0:
            log_info(f"Empty diagram state (no nodes) for project {project_code}")
            raise HTTPException(status_code=400, detail="Architecture diagram is empty. Add components before generating a threat model.")
        
        # Check if there are at least two connected nodes (basic topology check)
        node_count = len(diagram_state.get("nodes", []))
        edge_count = len(diagram_state.get("edges", []))
        
        if node_count < 2 or edge_count < 1:
            log_info(f"Diagram has insufficient components for threat modeling: {node_count} nodes, {edge_count} edges")
            return {
                "message": "Your diagram needs at least two connected components to generate a threat model.",
                "status": "insufficient_diagram",
                "project_code": project_code
            }
        
        log_info(f"Diagram state validated: {node_count} nodes, {edge_count} edges")
        
        # Check for existing DFD generation in progress
        current_status_str = project.get("dfd_generation_status", "")
        current_status = {}
        
        # Parse the status string to a dictionary if it's not empty
        if current_status_str and isinstance(current_status_str, str):
            try:
                import json
                current_status = json.loads(current_status_str)
            except json.JSONDecodeError:
                log_info(f"Error parsing dfd_generation_status JSON: {current_status_str}")
                current_status = {}
        
        if current_status and isinstance(current_status, dict) and current_status.get("status") == "in_progress":
            # Check if it's been running too long (more than 10 minutes)
            started_at = current_status.get("started_at")
            if started_at:
                try:
                    start_time = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
                    now = datetime.now(timezone.utc)
                    elapsed = (now - start_time).total_seconds()
                    
                    if elapsed < 600:  # Less than 10 minutes
                        log_info(f"DFD generation already in progress for project {project_code}, started {elapsed:.0f} seconds ago")
                        return {
                            "message": f"DFD generation already in progress (started {elapsed:.0f} seconds ago)",
                            "status": "generating",
                            "project_code": project_code,
                            "started_at": started_at
                        }
                except Exception as e:
                    log_info(f"Error parsing date: {e}")
                    # Continue with regeneration if date parsing fails
            
            # If we reach here, either the generation has been running too long or there was an error
            # Let's reset and start a new generation
            log_info(f"Resetting stalled DFD generation for project {project_code}")
        
        # Check if threat model already exists and is up-to-date
        dfd_data = project.get("dfd_data")
        diagram_updated_at = project.get("diagram_updated_at")
        threat_model_id = project.get("threat_model_id")
        dfd_generated_at = None
        extract_final_response=await threat_modeling_service.extract_structured_dfd(dfd_data, threat_model_id)
        log_info(f"Extract Final Response in switch dfd : {extract_final_response}")
        # Ensure dfd_data is a dictionary before using .get()
        if dfd_data and not isinstance(dfd_data, dict):
            log_info(f"Warning: dfd_data is not a dictionary: {type(dfd_data)}")
            dfd_data = {}
        
        if dfd_data and "generated_at" in dfd_data:
            dfd_generated_at = dfd_data.get("generated_at")
        
        # Determine if we need to regenerate the DFD
        need_regeneration = True
        status_message = "DFD generation started"
        
        # 1. DFD data exists with valid threat_model_id
        if dfd_data and threat_model_id and dfd_generated_at:
            # 2. And we have valid timestamps
            if diagram_updated_at and dfd_generated_at:
                try:
                    # Parse timestamps for comparison
                    generated_time = datetime.fromisoformat(dfd_generated_at.replace('Z', '+00:00'))
                    updated_time = diagram_updated_at
                    if isinstance(updated_time, str):
                        updated_time = datetime.fromisoformat(updated_time.replace('Z', '+00:00'))
                    
                    # If diagram hasn't been updated since DFD was generated, no need to regenerate
                    if updated_time <= generated_time and not switch_request.force_regenerate:
                        need_regeneration = False
                        status_message = "Using existing threat model (diagram unchanged)"
                        log_info(f"Using cached DFD (last generated: {dfd_generated_at}, diagram updated: {diagram_updated_at})")
                except Exception as e:
                    log_info(f"Error comparing timestamps, regenerating: {e}")
        
        # if switch_request.force_regenerate:
        #     need_regeneration = True
        #     status_message = "Regenerating threat model as requested"
        #     log_info(f"Forcing DFD regeneration for project {project_code}")
        
        if need_regeneration:
            # Start the background task to generate threat model
            generation_start = datetime.now(timezone.utc)
            status_data = {
                "status": "in_progress",
                "started_at": generation_start.isoformat(),
                "message": status_message,
                "step": "initializing",
                "progress": 0,
                "project_code": project_code
            }
            
            # Convert status_data to JSON string before storing
            import json
            status_data_str = json.dumps(status_data)
            
            # Update project with in-progress status
            supabase_mgr = SupabaseManager()
            await supabase_mgr.update_project_data(
                user_id=user_id,
                project_code=project_code,
                dfd_generation_status=status_data_str
            )
            
            # Start the background task to generate the threat model
            background_tasks.add_task(
                generate_threat_model_background,
                project_code=project_code,
                user_id=user_id,
                diagram_state=diagram_state,
                session_manager=session_manager
            )
            
            log_info(f"Started background DFD generation for project {project_code}")
            return {
                "message": "Threat model generation started",
                "status": "generating",
                "project_code": project_code,
                "started_at": generation_start.isoformat()
            }
        else:
            # No need to regenerate, just return success
            log_info(f"Using existing threat model for project {project_code}")
            return {
                "message": status_message,
                "status": "complete",
                "project_code": project_code,
                "threat_model_id": threat_model_id
            }
            
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        log_info(f"Error processing DFD view switch: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process DFD view switch: {str(e)}")


@router.get(
    "/projects/{project_code}/threatmodel/status",
    summary="Get DFD Generation Status",
    description="Checks the status of DFD generation for a project",
    tags=["Threat Modeling"]
)
async def get_dfd_generation_status(
    project_code: str,
    current_user: dict = Depends(verify_token)
):
    """
    Get current status of DFD generation process
    
    Provides detailed information about the progress of threat model generation,
    including current step, progress percentage, and error details if any.
    """
    user_id = current_user
    log_info(f"Checking DFD generation status for project: {project_code} by user: {user_id}")

    try:
        # Generate a cache key for this project's DFD status
        status_cache_key = f"dfd_status:{project_code}"
        
        # First try to get status from Redis cache for faster responses
        redis_status = None
        try:
            # Use session manager to get cached status (much faster than DB query)
            if session_manager.redis_pool:
                redis_status = await session_manager.redis_pool.get(status_cache_key)
                if redis_status:
                    try:
                        cached_status = json.loads(redis_status)
                        log_info(f"Using cached DFD status for project {project_code}")
                        return JSONResponse(content=cached_status)
                    except json.JSONDecodeError:
                        log_info(f"Invalid JSON in cached status for project {project_code}")
        except Exception as cache_error:
            log_info(f"Error checking cached status: {cache_error}")

        # Only query the database if no valid cache exists
        supabase = get_supabase_client()
        def fetch_project():
            return supabase.from_("projects").select("*").eq("project_code", project_code).eq("user_id", current_user).execute()
            
        project_response = await safe_supabase_operation(
            fetch_project,
            f"Failed to fetch project {project_code}"
        )

        if not project_response.data:
            raise HTTPException(status_code=404, detail=f"Project {project_code} not found or access denied.")
        
        project = project_response.data[0]
        generation_status_str = project.get("dfd_generation_status", "")
        
        # Prepare the response with comprehensive information
        status_response = {}
        
        # Convert string status to dictionary if needed
        if generation_status_str:
            if isinstance(generation_status_str, str):
                try:
                    generation_status = json.loads(generation_status_str)
                    # If parsing succeeded, update the response with the status
                    if isinstance(generation_status, dict):
                        status_response.update(generation_status)
                    else:
                        log_info(f"Warning: Parsed dfd_generation_status is not a dictionary: {type(generation_status)}")
                        status_response["status"] = "unknown"
                        status_response["message"] = "Status format is invalid (not a dictionary)"
                        status_response["raw_status"] = str(generation_status)
                except json.JSONDecodeError:
                    # Handle case where status is not valid JSON
                    log_info(f"Warning: dfd_generation_status is not valid JSON: {generation_status_str}")
                    status_response["status"] = "unknown"
                    status_response["message"] = "Status format is invalid (not valid JSON)"
                    status_response["raw_status"] = generation_status_str
            else:
                # Handle case where status is not a string (shouldn't happen with fixed schema)
                log_info(f"Warning: dfd_generation_status is not a string: {type(generation_status_str)}")
                status_response["status"] = "unknown"
                status_response["message"] = "Status format is invalid (not a string)"
                status_response["raw_status"] = str(generation_status_str)
            
            # Check for a stalled in-progress generation (more than 10 minutes)
            if status_response.get("status") == "in_progress" and status_response.get("started_at"):
                try:
                    start_time = datetime.fromisoformat(status_response["started_at"].replace('Z', '+00:00'))
                    now = datetime.now(timezone.utc)
                    elapsed_seconds = (now - start_time).total_seconds()
                    
                    # Add elapsed time to response
                    status_response["elapsed_seconds"] = elapsed_seconds
                    
                    # Check if generation seems stuck
                    if elapsed_seconds > 600:  # More than 10 minutes
                        status_response["warning"] = "Generation appears to be taking longer than expected"
                except (ValueError, TypeError) as e:
                    log_info(f"Error calculating elapsed time: {e}")
        
        # If no status exists, check if DFD data exists
        if not status_response.get("status"):
            dfd_data = project.get("dfd_data")
            threat_model_id = project.get("threat_model_id")
            
            if dfd_data and threat_model_id:
                # DFD exists but no status - it was likely generated before status tracking was added
                generated_at = dfd_data.get("generated_at", datetime.now(timezone.utc).isoformat())
                
                status_response = {
                    "status": "complete",
                    "completed_at": generated_at,
                    "message": "Threat model is available",
                    "threat_count": len(dfd_data.get("threats", [])),
                    "legacy_generation": True  # Flag to indicate this was from before status tracking
                }
            else:
                # No DFD and no status
                status_response = {
                    "status": "not_started",
                    "message": "No threat model has been generated yet"
                }
                
        # Add helpful data for frontend
        status_response["project_code"] = project_code
        
        # Include summary of available data
        if project.get("dfd_data"):
            dfd_data = project.get("dfd_data", {})
            status_response["has_dfd_data"] = True
            status_response["threat_count"] = len(dfd_data.get("threats", []))
            status_response["node_count"] = len(dfd_data.get("nodes", []))
            status_response["edge_count"] = len(dfd_data.get("edges", []))
            status_response["boundary_count"] = len(dfd_data.get("boundaries", []))
        else:
            status_response["has_dfd_data"] = False
        
        # Cache the status in Redis for faster future requests
        if session_manager.redis_pool:
            try:
                # Cache for 15 seconds to reduce DB load during polling
                await session_manager.redis_pool.setex(
                    status_cache_key,
                    15,  # 15 seconds TTL for status cache
                    json.dumps(status_response)
                )
            except Exception as cache_err:
                log_info(f"Error caching DFD status: {cache_err}")
        
        log_info(f"Returning DFD generation status: {status_response.get('status')} for project {project_code}")
        return JSONResponse(content=status_response)
        
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        log_info(f"Error checking DFD generation status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check DFD generation status: {str(e)}")

@router.post(
    "/projects/{project_code}/threatmodel/cancel",
    summary="Cancel Threat Model Generation",
    description="Cancels an in-progress threat model generation",
    tags=["Threat Modeling"]
)
async def cancel_dfd_generation(
    project_code: str,
    current_user: dict = Depends(verify_token)
):
    """
    Cancels an in-progress threat model generation for a project
    """
    user_id = current_user
    log_info(f"Attempting to cancel DFD generation for project: {project_code} by user: {user_id}")
    
    try:
        # Generate a cache key for this project's DFD status
        status_cache_key = f"dfd_status:{project_code}"
        cancel_key = f"dfd_cancel:{project_code}"
        
        # Set a cancellation flag in Redis with high priority
        if session_manager.redis_pool:
            try:
                # Set cancellation flag (valid for 5 minutes)
                await session_manager.redis_pool.setex(
                    cancel_key,
                    300,  # 5 minute TTL
                    "true"
                )
                log_info(f"Set cancellation flag for project {project_code}")
                
                # Also set a sentinel value with higher priority to ensure it's seen quickly
                await session_manager.redis_pool.setex(
                    f"dfd_cancel_urgent:{project_code}",
                    60,  # 1 minute TTL
                    "urgent_cancel"
                )
                log_info(f"Set urgent cancellation flag for project {project_code}")
            except Exception as cache_error:
                log_info(f"Error setting cancellation flag: {cache_error}")
        
        # First fetch current status
        supabase = get_supabase_client()
        def fetch_project():
            return supabase.from_("projects").select("dfd_generation_status").eq("project_code", project_code).eq("user_id", current_user).execute()
            
        project_response = await safe_supabase_operation(
            fetch_project,
            f"Failed to fetch project {project_code} for cancellation"
        )
        
        if not project_response.data:
            raise HTTPException(status_code=404, detail=f"Project {project_code} not found or access denied.")
        
        # Check if generation is in progress
        generation_status_str = project_response.data[0].get("dfd_generation_status", "")
        generation_status = {}
        
        # Parse the status string to a dictionary if it's not empty
        if generation_status_str and isinstance(generation_status_str, str):
            try:
                import json
                generation_status = json.loads(generation_status_str)
            except json.JSONDecodeError:
                log_info(f"Error parsing dfd_generation_status JSON: {generation_status_str}")
                generation_status = {}
        
        # Update to cancelled status
        cancellation_status = {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "message": "Threat model generation was cancelled by the user",
            "previous_status": generation_status
        }
        
        # Convert to JSON string before storing
        import json
        cancellation_status_str = json.dumps(cancellation_status)
        
        # Update DB with cancelled status
        def update_status():
            return supabase.from_("projects").update({
                "dfd_generation_status": cancellation_status_str
            }).eq("project_code", project_code).eq("user_id", current_user).execute()
            
        await safe_supabase_operation(
            update_status,
            f"Failed to update cancellation status for project {project_code}"
        )
        
        # Also update Redis status
        if session_manager.redis_pool:
            try:
                await session_manager.redis_pool.setex(
                    status_cache_key,
                    60,  # 1 minute TTL
                    json.dumps(cancellation_status)
                )
            except Exception as e:
                log_info(f"Error updating Redis status on cancellation: {e}")
        
        if generation_status and isinstance(generation_status, dict) and generation_status.get("status") == "in_progress":
            log_info(f"Successfully cancelled in-progress DFD generation for project {project_code}")
            return {"status": "cancelled", "message": "Threat model generation cancelled successfully"}
        else:
            log_info(f"No active generation found to cancel for project {project_code}, but set flags anyway")
            return {"status": "no_active_generation", "message": "No active generation found, but cancellation flags set"}
            
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        log_info(f"Error cancelling DFD generation for project {project_code}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel DFD generation: {str(e)}")