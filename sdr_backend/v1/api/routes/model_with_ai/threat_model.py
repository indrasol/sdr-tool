# routers/threatmodel.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Body
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
from models.threat_models import FullThreatModelResponse
from utils.logger import log_info

router = APIRouter()
supabase_manager = SupabaseManager()
threat_modeling_service = ThreatModelingService()
session_manager = SessionManager()


@router.post(
    "/projects/{project_code}/generate-threatmodel",
    response_model=FullThreatModelResponse,
    summary="Generate Threat Model",
    description="Generates a threat model for the current architecture diagram state, with session caching for efficiency.",
    tags=["Threat Modeling"]
)
async def generate_threat_model_endpoint(
    project_code: str,
    request: DFDSwitchRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Generate a threat model based on the current architecture diagram.
    Uses session caching for performance when diagram hasn't changed.
    
    Args:
        project_code: Project identifier
        request: Contains optional session_id and diagram_state
        current_user: Current authenticated user
    
    Returns:
        FullThreatModelResponse: Complete threat model with DFD and threats
    """
    user_id = current_user["id"]
    session_id = request.session_id
    diagram_state = request.diagram_state
    
    log_info(f"Generating threat model for project: {project_code}, session: {session_id}, user: {user_id}")
    
    try:
        # Initialize services
        supabase = get_supabase_client()
        session_mgr = SessionManager()
        
        # Normalize and clean the diagram state to ensure consistent hashing
        if diagram_state:
            # Use the session manager's sanitization method for consistency
            original_node_count = len(diagram_state.get("nodes", []))
            original_edge_count = len(diagram_state.get("edges", []))
            
            # Let the session manager handle diagram state sanitization
            diagram_state = session_mgr._sanitize_diagram_state(diagram_state)
            
            log_info(f"Sanitized diagram state: {len(diagram_state.get('nodes', []))} nodes and {len(diagram_state.get('edges', []))} edges (from original {original_node_count} nodes and {original_edge_count} edges)")
        
        # 1. Check if we have a valid session with cached threat model
        session_threat_model = None
        diagram_changed = True
        
        if session_id:
            # Connect to Redis if not already connected
            if not session_mgr.redis_pool:
                await session_mgr.connect()
                
            # Get session data (will validate session belongs to correct project and user)
            session_data = await session_mgr.get_session(
                session_id=session_id,
                expected_project_id=project_code,
                expected_user_id=user_id
            )
            
            if session_data:
                # Use the session's diagram state if not provided
                log_info(f"Inside session_data : {session_data}")
                if not diagram_state and "diagram_state" in session_data:
                    diagram_state = session_data.get("diagram_state")
                    # Also sanitize this diagram state
                    if diagram_state:
                        diagram_state = session_mgr._sanitize_diagram_state(diagram_state)
                
                # Check for cached threat model
                cached_model, diagram_changed = await session_mgr.get_threat_model(
                    session_id=session_id, 
                    diagram_state=diagram_state
                )

                log_info(f"Cached model : {cached_model}")
                
                if cached_model and not diagram_changed:
                    log_info(f"Using cached threat model from session {session_id}")
                    return FullThreatModelResponse(**cached_model)
        
        # 2. If no diagram state provided, fetch from database
        if not diagram_state:
            def fetch_project():
                return supabase.from_("projects").select("diagram_state").eq("project_code", project_code).eq("user_id", user_id).execute()
                
            project_response = await safe_supabase_operation(
                fetch_project,
                f"Failed to fetch project {project_code}"
            )
            
            if not project_response.data:
                raise HTTPException(status_code=404, detail=f"Project {project_code} not found or access denied.")
                
            diagram_state = project_response.data[0].get("diagram_state", {})
            
            # Sanitize this diagram state too if it exists
            if diagram_state:
                diagram_state = session_mgr._sanitize_diagram_state(diagram_state)
            
        # 3. Validate diagram state
        if not diagram_state or not diagram_state.get("nodes") or len(diagram_state.get("nodes", [])) == 0:
            raise HTTPException(status_code=400, detail="Architecture diagram is empty. Cannot generate threat model.")
            
        # 4. Generate new threat model
        conversation_history = []
        
        # Get conversation history from session if available
        if session_id and session_data:
            conversation_history = session_data.get("conversation_history", [])
            
        # Generate threat model
        threat_modeling_service = ThreatModelingService()
        threat_model = await threat_modeling_service.generate_threat_model(
            conversation_history=conversation_history,
            diagram_state=diagram_state
        )
        
        # 5. Cache the new threat model in the session
        if session_id and session_mgr.redis_pool:
            await session_mgr.store_threat_model(
                session_id=session_id,
                threat_model=threat_model.model_dump(),
                diagram_state=diagram_state
            )
                
        # Return the threat model response
        log_info(f"Generated new threat model for project {project_code}")
        return threat_model
        
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        log_info(f"Error generating threat model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate threat model: {str(e)}")