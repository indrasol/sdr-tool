# routers/threatmodel.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Body
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import json
import asyncio
import re
import uuid

# Adjust import paths as necessary
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from services.auth_handler import verify_token
from services.supabase_manager import SupabaseManager
from core.cache.session_manager import SessionManager
from services.threat_modeling_service import ThreatModelingService
from models.dfd_models import DFDResponse, DFDGenerationStartedResponse, DFDSwitchRequest
from models.threat_models import FullThreatModelResponse, ThreatsResponse
from utils.logger import log_info
from core.llm.llm_gateway_v1 import LLMService
from core.prompt_engineering.prompt_builder import PromptBuilder

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

        log_info(f"Generated threat model : {threat_model}")
        
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


@router.post(
    "/projects/{project_code}/threat_analysis",
    response_model=ThreatsResponse,
    summary="Run Threat Analysis",
    description="Analyzes the current architecture diagram for potential threats, returning only threats without the DFD model.",
    tags=["Threat Modeling"]
)
async def run_threat_analysis_endpoint(
    project_code: str,
    request: DFDSwitchRequest,
    current_user: dict = Depends(verify_token)
):
    """
    Run threat analysis on the current architecture diagram.
    Uses session caching for performance when diagram hasn't changed.
    
    Args:
        project_code: Project identifier
        request: Contains optional session_id and diagram_state
        current_user: Current authenticated user
    
    Returns:
        ThreatsResponse: List of threats and severity counts
    """
    user_id = current_user["id"]
    session_id = request.session_id
    diagram_state = request.diagram_state
    
    log_info(f"Running threat analysis for project: {project_code}, session: {session_id}, user: {user_id}")
    
    try:
        # Initialize services
        supabase = get_supabase_client()
        session_mgr = SessionManager()
        llm_service = LLMService()
        
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

                log_info(f"Cached model: {cached_model}")
                
                if cached_model and not diagram_changed:
                    log_info(f"Using cached threat model from session {session_id}")
                    # Return only the threats part
                    if "threats" in cached_model:
                        return ThreatsResponse(**cached_model["threats"])
                    # Backward compatibility for older cache format
                    elif isinstance(cached_model, dict) and "severity_counts" in cached_model and "threats" in cached_model:
                        return ThreatsResponse(**cached_model)
        
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
            raise HTTPException(status_code=400, detail="Architecture diagram is empty. Cannot run threat analysis.")
            
        # 4. Generate threat analysis
        conversation_history = []
        
        # Get conversation history from session if available
        if session_id and session_data:
            conversation_history = session_data.get("conversation_history", [])
            
        # Generate or reuse data flow description for the diagram
        if request.data_flow_description:
            data_flow_content = request.data_flow_description
            log_info(
                f"Reusing pre-computed data flow description passed from caller ({len(data_flow_content)} chars)"
            )
        else:
            data_flow_description = await llm_service.analyze_diagram(
                diagram_content=diagram_state,
                model_provider="openai",
                model_name="gpt-4.1-mini"
            )
            data_flow_content = data_flow_description.get("data_flow_description", "")
            log_info(
                f"Generated data flow description via LLM ({len(data_flow_content)} chars)"
            )
        
        # Create a prompt builder for generating the threat prompt
        prompt_builder = PromptBuilder()
        
        # Build the specialized threat prompt with data flow description
        threat_prompt = await prompt_builder.build_threat_prompt(
            conversation_history, 
            diagram_state,
            data_flow_content
        )
        
        # Generate threats using the threat prompt
        log_info(f"Generating threats analysis using threat prompt")
        threat_response = await llm_service.generate_llm_response(
            prompt=threat_prompt,
            model_provider="openai",
            model_name="gpt-4.1",
            temperature=0.3,  # Lower temperature for more deterministic output
            stream=False,
            timeout=90
        )
        
        # Extract the threat JSON from the response
        threat_json = {}
        if isinstance(threat_response, dict) and "content" in threat_response:
            content = threat_response["content"]
            try:
                # Look for JSON in the content
                json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL)
                if json_match:
                    threat_json = json.loads(json_match.group(1))
                else:
                    # Try to parse the whole content as JSON
                    threat_json = json.loads(content)
            except json.JSONDecodeError as e:
                log_info(f"Failed to parse threat JSON: {e}")
                threat_json = {"threats": [], "severity_counts": {"HIGH": 0, "MEDIUM": 0, "LOW": 0}}
        else:
            threat_json = {"threats": [], "severity_counts": {"HIGH": 0, "MEDIUM": 0, "LOW": 0}}

        log_info(f"LLM threats json: {threat_json}")
        
        # Process threats and severity counts
        severity_counts = threat_json.get("severity_counts", {"HIGH": 0, "MEDIUM": 0, "LOW": 0})
        threat_items = threat_json.get("threats", [])
        
        # Create the ThreatsResponse
        threats_response = ThreatsResponse(
            severity_counts=severity_counts,
            threats=threat_items
        )
        
        # If we have a valid session, cache the generated threats for future use
        if session_id and session_mgr.redis_pool:
            # Create a full threat model response for caching
            full_threat_model = {
                "threat_model_id": str(uuid.uuid4()),
                "dfd_model": {
                    "elements": [],
                    "edges": [],
                    "boundaries": []
                },
                "threats": threats_response.model_dump(),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await session_mgr.store_threat_model(
                session_id=session_id,
                threat_model=full_threat_model,
                diagram_state=diagram_state
            )
                
        # Return the threats response
        log_info(f"Generated threat analysis for project {project_code} with {len(threat_items)} threats")
        return threats_response
        
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        log_info(f"Error generating threat analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate threat analysis: {str(e)}")


