import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional, Tuple
from services.auth_handler import verify_token
from core.llm.llm_gateway_v1 import LLMService
from core.intent_classification.intent_classifier_v1 import IntentClassifier
from core.prompt_engineering.prompt_builder import PromptBuilder
from services.response_processor import ResponseProcessor
from core.cache.session_manager import SessionManager
from services.response_handler import ResponseHandler
from models.dfd_models import  DFDGenerationStartedResponse
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from models.response_models import DesignResponse, ResponseType
from models.request_models import DesignRequest
from models.response_models import ArchitectureResponse
from services.feedback_handler import ResponseLearningService
from datetime import datetime, timezone
from utils.logger import log_info
import anthropic
import re
import uuid
import json
from services.threat_modeling_service import ThreatModelingService
from services.supabase_manager import SupabaseManager



# Initialize the router
router = APIRouter()

# Service instances
llm_service = LLMService()
intent_classifier = IntentClassifier(llm_service)
prompt_builder = PromptBuilder()
response_processor = ResponseProcessor()
session_manager = SessionManager()
response_learning = ResponseLearningService()
threat_modeling_service = ThreatModelingService()
supabase_manager = SupabaseManager()


async def _trigger_dfd_generation(
    user_id: str,
    project_code: str,
    session_id: Optional[str],
    request_diagram_state: Optional[Dict[str, Any]],
    background_tasks: BackgroundTasks,
):
    """Helper function to initiate the DFD generation background task."""
    log_info(f"Initiating DFD generation trigger for project {project_code}")
    try:
        # Ensure session is established if needed for state retrieval
        if not session_id:
            log_info(f"No session ID provided, cannot reliably fetch diagram state if not in request for {project_code}.")
            # Decide: either require session or rely solely on request_diagram_state
            # Let's rely on request_diagram_state if session_id is missing
            # session_id = await sess_manager.create_project_session(user_id, project_code)
        elif session_id:
            # Ensure session exists and extend TTL if we have one
             await session_manager.extend_session_ttl(session_id)

        # Determine the definitive diagram state to use
        current_diagram_state = request_diagram_state
        if not current_diagram_state and session_id:
            try:
                # Attempt to get state from session ONLY if not provided in request
                session_data = await session_manager.get_session(session_id, expected_project_id=project_code, expected_user_id=user_id)
                current_diagram_state = session_data.get("diagram_state", {})
                log_info(f"Retrieved diagram state from session {session_id} for DFD generation.")
            except HTTPException as e:
                 log_info(f"Session error retrieving diagram state for {project_code}: {e.detail}")
                 # Proceed without session state if error occurs, rely on DB state fetched later if needed,
                 # or fail if request_diagram_state is also missing. Best to ensure FE sends state.
                 pass # Fall through, background task might fetch from DB if needed


        # Fetch latest state from DB as fallback/verification if needed (optional)
        # Or better: ensure frontend *always* sends the state it wants modeled
        if not current_diagram_state:
             # Fetch from DB as last resort - less ideal as it might not reflect unsaved changes
             project_list = await supabase_manager.get_user_projects(user_id=user_id, project_code_filter=project_code, limit=1)
             if project_list:
                 current_diagram_state = project_list[0].get("diagram_state", {})
                 log_info(f"Retrieved diagram state from DB for {project_code} as fallback.")

        # Final check: Can we actually generate?
        if not current_diagram_state or not current_diagram_state.get("nodes"):
            log_info(f"Cannot generate DFD for {project_code}: Architecture diagram state is empty or invalid.")
            raise HTTPException(status_code=400, detail="Architecture diagram is empty. Add components before generating DFD.")

        # Add the actual generation task to the background
        log_info(f"Adding DFD generation task to background for project {project_code}")
        background_tasks.add_task(
            run_dfd_generation_and_save, # Assumes this function is defined (as in previous step)
            user_id,
            project_code,
            current_diagram_state, # Pass the determined state
            threat_modeling_service,  # Pass service instance
            supabase_manager,      # Pass service instance
            session_manager_instance=session_manager
        )

        # Add a simple confirmation to conversation history immediately if session exists
        if session_id:
             response_id = str(uuid.uuid4())
             confirmation_message = "Okay, I've started generating the Data Flow Diagram and analyzing threats. This might take a moment. Please check the DFD view shortly."
             background_tasks.add_task(
                 session_manager.add_to_conversation,
                 session_id,
                 "Generate DFD Request", # Generic query text for history
                 {
                     "response_type": "SystemNotification",
                     "message": confirmation_message,
                     "response_id": response_id
                 }
             )

    except HTTPException as http_exc:
        raise http_exc # Re-raise specific client errors
    except Exception as e:
        log_info(f"Error during DFD trigger setup for {project_code}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate DFD generation.")

async def run_dfd_generation_and_save(
    user_id: str,
    project_code: str,
    diagram_state: Dict[str, Any],
    threat_modeling_service: ThreatModelingService = None,
    supabase_manager: SupabaseManager = None,
    generation_context: Dict[str, Any] = None,
    session_manager_instance: SessionManager = None
):
    """Background task to generate and save the DFD/Threat Model.
    
    Args:
        user_id: User ID who initiated the generation
        project_code: Project code to generate DFD for
        diagram_state: Current state of the architecture diagram
        threat_modeling_service: Service used for threat modeling (optional)
        supabase_manager: Service for database operations (optional)
        generation_context: Additional metadata about the generation process
        session_manager_instance: Session manager instance (optional)
    """
    if not threat_modeling_service:
        threat_modeling_service = ThreatModelingService()
    
    if not supabase_manager:
        supabase_manager = SupabaseManager()
    
    # Use the provided session_manager, module-level one, or create a new instance
    local_session_manager = session_manager_instance or globals().get('session_manager')
    if not local_session_manager:
        log_info(f"Warning: No session_manager provided or found in run_dfd_generation_and_save, creating a new instance")
        local_session_manager = SessionManager()
        
    # Create a status cache key for this project
    status_cache_key = f"dfd_status:{project_code}"
    cancel_key = f"dfd_cancel:{project_code}"
    urgent_cancel_key = f"dfd_cancel_urgent:{project_code}"
    
    # Determine component counts for progress reporting
    node_count = len(diagram_state.get("nodes", []))
    edge_count = len(diagram_state.get("edges", []))
    
    log_info(f"[Background Task] Started threat model generation for project {project_code} with {node_count} nodes")
    
    # Setup a cancellation check function to be used throughout the process
    async def check_cancellation() -> bool:
        """Check if the generation has been cancelled by the user"""
        if local_session_manager.redis_pool:
            # First check urgent cancel flag (faster check)
            urgent_cancel = await local_session_manager.redis_pool.get(urgent_cancel_key)
            if urgent_cancel:
                log_info(f"[Background Task] Urgent cancellation flag detected for project {project_code}")
                return True
                
            # Then check the standard cancel flag
            cancel_flag = await local_session_manager.redis_pool.get(cancel_key)
            if cancel_flag:
                log_info(f"[Background Task] Cancellation flag detected for project {project_code}")
                return True
                
        return False
    
    # Setup a progress update function
    async def update_progress(progress_pct: int, step: str, message: str, update_db: bool = False):
        """Update the progress status in Redis and optionally in the database"""
        # Create the status object
        generation_status_updated = {
            **generation_status,
            "progress": progress_pct,
            "step": step,
            "message": message,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Update Redis cache first
        if local_session_manager.redis_pool:
            try:
                await local_session_manager.redis_pool.setex(
                    status_cache_key,
                    300,  # 5 minute TTL for the entire process
                    json.dumps(generation_status_updated)
                )
            except Exception as cache_err:
                log_info(f"[Background Task] Error updating Redis status: {cache_err}")
        
        if update_db:
            try:
                # Convert to JSON string before storing
                generation_status_str = json.dumps(generation_status_updated)
                
                await supabase_manager.update_project_data(
                    user_id=user_id,
                    project_code=project_code,
                    dfd_generation_status=generation_status_str
                )
                # Update the local status object to reflect the changes
                generation_status.update(generation_status_updated)
            except Exception as db_err:
                log_info(f"[Background Task] Error updating DB status: {db_err}")
    
    # Initialize the generation status
    generation_status = {
        "status": "in_progress",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "progress": 0,
        "step": "initialization",
        "message": "Starting threat model generation",
        "project_code": project_code,
        "node_count": node_count,
        "edge_count": edge_count
    }
    
    try:
        # Check for cancellation immediately
        is_cancelled = await check_cancellation()
        if is_cancelled:
            log_info(f"[Background Task] Generation cancelled during initialization for project {project_code}")
            cancellation_status = {
                "status": "cancelled",
                "cancelled_at": datetime.now(timezone.utc).isoformat(),
                "message": "Threat model generation was cancelled before it started"
            }
            # Convert to JSON string before storing
            cancellation_status_str = json.dumps(cancellation_status)
            await supabase_manager.update_project_data(
                user_id=user_id, 
                project_code=project_code,
                dfd_generation_status=cancellation_status_str
            )
            return
        
        # Initial status update to track progress - always update DB for initial status
        # Convert to JSON string before storing
        generation_status_str = json.dumps(generation_status)
        await supabase_manager.update_project_data(
            user_id=user_id, 
            project_code=project_code,
            dfd_generation_status=generation_status_str
        )
        
        # Cache initial status in Redis too
        if local_session_manager.redis_pool:
            try:
                await local_session_manager.redis_pool.setex(
                    status_cache_key,
                    300,  # 5 minute TTL for the entire process
                    json.dumps(generation_status)
                )
            except Exception as cache_err:
                log_info(f"[Background Task] Error caching initial status: {cache_err}")
                
        # Set flag to update DB on next step change
        should_update_db = True
        
        # First check for cancellation after initial setup
        is_cancelled = await check_cancellation()
        if is_cancelled:
            log_info(f"[Background Task] Generation cancelled after initialization for project {project_code}")
            await update_progress(5, "cancelled", "Generation cancelled after initialization", True)
            return
        
        # Update progress to show we're analyzing the architecture
        await update_progress(10, "analyzing_architecture", "Analyzing architecture components", True)
        
        # Validate nodes and edges before processing
        if not diagram_state or not isinstance(diagram_state, dict):
            raise ValueError("Invalid diagram state format")
        
        nodes = diagram_state.get("nodes", [])
        edges = diagram_state.get("edges", [])
        
        if not nodes or not isinstance(nodes, list) or len(nodes) == 0:
            raise ValueError("No nodes found in diagram state")
        
        if not edges or not isinstance(edges, list) or len(edges) == 0:
            log_info(f"[Background Task] Warning: No edges found in diagram for project {project_code}")
        
        # Flag to update DB for the next major step
        should_update_db = True
        
        # Check for cancellation before starting threat model generation
        is_cancelled = await check_cancellation()
        if is_cancelled:
            log_info(f"[Background Task] Generation cancelled before threat model generation for project {project_code}")
            await update_progress(15, "cancelled", "Generation cancelled before threat model generation", True)
            return
        
        # Update progress before starting threat model generation
        await update_progress(20, "generating_threat_model", "Building threat model from architecture", True)
        
        # 1. Generate Threat Model (with timeout handling)
        try:
            # First check for cancellation flag
            is_cancelled = await check_cancellation()
            if is_cancelled:
                log_info(f"[Background Task] Generation cancelled before PyTM execution for project {project_code}")
                raise RuntimeError("Threat model generation was cancelled by the user")
                
            # Use asyncio.wait_for to set a timeout
            pytm_code, new_threat_model_id, dfd_data = await asyncio.wait_for(
                threat_modeling_service.generate_threat_model(diagram_state, check_cancellation, project_code),
                timeout=300  # 5 minute timeout
            )
            
            # Check for cancellation after threat model generation
            is_cancelled = await check_cancellation()
            if is_cancelled:
                log_info(f"[Background Task] Generation cancelled after threat model generation for project {project_code}")
                raise RuntimeError("Threat model generation was cancelled after PyTM execution")
            
            # Update progress after successful generation
            await update_progress(70, "analyzing_threats", "Analyzing potential threats", True)
            
        except asyncio.TimeoutError:
            log_info(f"[Background Task] Timeout while generating threat model for project {project_code}")
            failure_status = {
                "status": "failed",
                "error": "Generation timed out after 5 minutes",
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
            # Convert to JSON string before storing
            failure_status_str = json.dumps(failure_status)
            # Always update DB for failures
            await supabase_manager.update_project_data(
                user_id=user_id, 
                project_code=project_code,
                dfd_generation_status=failure_status_str
            )
            # Also update Redis to ensure consistent status
            if local_session_manager.redis_pool:
                try:
                    await local_session_manager.redis_pool.setex(
                        status_cache_key,
                        60,  # 1 minute TTL for failure status
                        json.dumps(failure_status)
                    )
                except Exception as e:
                    log_info(f"[Background Task] Error updating Redis on failure: {e}")
            return
        except Exception as model_error:
            log_info(f"[Background Task] Error in threat model generation: {str(model_error)}")
            failure_status = {
                "status": "failed",
                "error": f"Error generating threat model: {str(model_error)}",
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
            # Convert to JSON string before storing
            failure_status_str = json.dumps(failure_status)
            # Always update DB for failures
            await supabase_manager.update_project_data(
                user_id=user_id, 
                project_code=project_code,
                dfd_generation_status=failure_status_str
            )
            # Also update Redis
            if local_session_manager.redis_pool:
                try:
                    await local_session_manager.redis_pool.setex(
                        status_cache_key,
                        60,  # 1 minute TTL for failure status
                        json.dumps(failure_status)
                    )
                except Exception as e:
                    log_info(f"[Background Task] Error updating Redis on failure: {e}")
            return

        # Check for cancellation before finalizing
        is_cancelled = await check_cancellation()
        if is_cancelled:
            log_info(f"[Background Task] Generation cancelled before finalizing results for project {project_code}")
            await update_progress(80, "cancelled", "Generation cancelled before finalizing results", True)
            return
            
        # Flag to update DB for the final step
        should_update_db = True
        
        # Update progress before saving results
        await update_progress(90, "finalizing_results", "Finalizing results", True)
        
        # 2. Store results in database
        # Ensure generated_at is included and data is valid
        if not dfd_data:
            raise ValueError("No DFD data was generated")
            
        if "generated_at" not in dfd_data:
            dfd_data["generated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Validate threat counts for reporting
        threat_count = len(dfd_data.get("threats", []))
        boundary_count = len(dfd_data.get("boundaries", []))
        
        log_info(f"[Background Task] Generated threat model with {threat_count} threats and {boundary_count} boundaries")
        
        # Add metadata to the DFD data for UI reporting
        dfd_data["metadata"] = {
            "node_count": node_count,
            "edge_count": edge_count,
            "threat_count": threat_count,
            "boundary_count": boundary_count,
            "generation_time_seconds": (datetime.now(timezone.utc) - 
                                       datetime.fromisoformat(generation_status["started_at"].replace('Z', '+00:00'))).total_seconds()
        }
        
        # Final check for cancellation before DB update
        is_cancelled = await check_cancellation()
        if is_cancelled:
            log_info(f"[Background Task] Generation cancelled at final step for project {project_code}")
            await update_progress(95, "cancelled", "Generation cancelled at final step", True)
            return
        
        # Always update DB for completion
        completion_status = {
            "status": "complete",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "threat_count": threat_count,
            "generation_time_seconds": (datetime.now(timezone.utc) - 
                                       datetime.fromisoformat(generation_status["started_at"].replace('Z', '+00:00'))).total_seconds(),
            "error": None
        }
        
        # Convert to JSON string before storing
        completion_status_str = json.dumps(completion_status)
            
        await supabase_manager.update_project_data(
            user_id=user_id,
            project_code=project_code,
            # pytm_model_code=pytm_code,
            dfd_data=dfd_data,
            threat_model_id=new_threat_model_id,
            dfd_generation_status=completion_status_str
        )
        
        # Update Redis with final status
        if local_session_manager.redis_pool:
            try:
                await local_session_manager.redis_pool.setex(
                    status_cache_key,
                    60,  # 1 minute TTL for completion status
                    json.dumps(completion_status)
                )
            except Exception as e:
                log_info(f"[Background Task] Error updating Redis on completion: {e}")
        
        log_info(f"[Background Task] Threat model {new_threat_model_id} generated and saved for project {project_code}")
        
    except Exception as e:
        log_info(f"[Background Task] Unexpected error in threat model generation for project {project_code}: {str(e)}")
        try:
            # Ensure we update the status to failed on any unhandled exception
            error_status = {
                "status": "failed",
                "error": f"Unexpected error: {str(e)}",
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
            # Convert to JSON string before storing
            error_status_str = json.dumps(error_status)
            await supabase_manager.update_project_data(
                user_id=user_id,
                project_code=project_code,
                dfd_generation_status=error_status_str
            )
            # Also update Redis
            if local_session_manager.redis_pool:
                try:
                    await local_session_manager.redis_pool.setex(
                        status_cache_key,
                        60,  # 1 minute TTL for error status
                        json.dumps(error_status)
                    )
                except Exception as redis_err:
                    log_info(f"[Background Task] Error updating Redis on unexpected error: {redis_err}")
        except Exception as update_err:
            log_info(f"[Background Task] Failed to update error status in DB: {update_err}")
    
async def generate_threat_model_background(
    project_code: str,
    user_id: str,
    diagram_state: Dict[str, Any],
    session_manager: SessionManager = None
):
    """
    Updated background task method specifically for the threat model generation.
    This is the main entry point for starting a background threat modeling process.
    """
    log_info(f"Starting background threat model generation for project {project_code}")
    
    # Initialize services
    threat_modeling_service = ThreatModelingService()
    supabase_manager = SupabaseManager()
    
    # Use the module-level session_manager if none is provided
    local_session_manager = session_manager or globals().get('session_manager')
    if not local_session_manager:
        log_info(f"Warning: No session_manager provided or found, creating a new instance")
        local_session_manager = SessionManager()
    
    # Execute the main generation process
    await run_dfd_generation_and_save(
        user_id=user_id,
        project_code=project_code,
        diagram_state=diagram_state,
        threat_modeling_service=threat_modeling_service,
        supabase_manager=supabase_manager,
        session_manager_instance=local_session_manager
    )


@router.post("/design")
async def design_endpoint(
    request: DesignRequest,
    background_tasks: BackgroundTasks,
    show_thinking: bool = Query(True, description="Whether to include thinking in the response"),
    current_user: dict = Depends(verify_token)
) -> JSONResponse:
    """
    Process a natural language query for the design interface and also generate DFD if command is detected,
    
    This endpoint handles the core functionality of the system. It:
    1. Manages user sessions
    2. Classifies user intent using Intent Classifier
    3. Builds appropriate prompts
    4. Applies learned improvements from feedback
    5. Generates responses using the LLM
    6. Processes and validates responses
    7. Updates conversation history
    8. Supports continuous learning through feedback
    
    Returns a structured response based on the classified intent.
    """
    try:
        user_id = current_user
        project_code = request.project_id
        session_id = request.session_id
        query_lower = request.query.lower()

        # --- DFD Generation Trigger Check ---
        dfd_command_patterns = [
            "generate dfd", "create dfd", "show dfd", "make dfd", "build dfd",
            "generate data flow diagram", "create data flow diagram", "show data flow diagram",
            "generate threat model", "create threat model", "run threat model", "analyze threats"
            # Add more variations as needed
        ]
        is_dfd_command = any(pattern in query_lower for pattern in dfd_command_patterns)

        # Also trigger if the frontend view mode indicates DFD and the query is generic like "update" or "refresh"
        if not is_dfd_command and request.view_mode == "DFD" and query_lower in ["update", "refresh", "generate","dfd"]:
            is_dfd_command = True
            
        if is_dfd_command:
            log_info(f"DFD generation command detected via /design for project {project_code}: '{request.query}'")
            # Call the centralized trigger function
            await _trigger_dfd_generation(
                user_id=user_id,
                project_code=project_code,
                session_id=session_id,
                request_diagram_state=request.diagram_state,
                background_tasks=background_tasks
            )
            # Return 202 Accepted
            response_content = DFDGenerationStartedResponse(project_code=project_code).model_dump()
            return JSONResponse(content=response_content, status_code=202)
        else:

            log_info(f"Processing design query for user: {current_user}, project: {request.project_id}")
            
            # Get or create session
            session_id = request.session_id
            if not session_id:
                log_info(f"Creating new session for user: {current_user}, project: {request.project_id}")
                session_id = await session_manager.create_project_session(current_user, request.project_id)
            
            # Ensure session exists and fetch data
            session_data = await session_manager.get_session(session_id)
            if not session_data:
                # Session expired or invalid, create a new one
                log_info(f"Session {session_id} not found or expired, creating new session")
                session_id = await session_manager.create_project_session(current_user, request.project_id)
                session_data = await session_manager.get_session(session_id)
            
            # Store the original diagram state for comparison later
            original_diagram_state = request.diagram_state or session_data.get("diagram_state", {})
            
            # Update diagram state if provided
            if request.diagram_state:
                log_info(f"Updating diagram state for session {session_id}")
                await session_manager.update_diagram_state(session_id, request.diagram_state)
            
            # Get conversation history from session
            conversation_history = session_data.get("conversation_history", [])
            
            # Get current diagram state
            diagram_state = request.diagram_state or session_data.get("diagram_state", {})
            
            # Classify user intent
            log_info(f"Classifying intent for query: {request.query}")

            # Adjust classification parameters if in retry mode
            pattern_threshold = 0.7
            vector_threshold = 0.65
            if getattr(request, 'retry_mode', False):
                # For retries, use more strict pattern matching and favor LLM for better quality
                pattern_threshold = 0.8
                vector_threshold = 0.75
                log_info("Retry mode: Using stricter classification thresholds")

                
            # Get classification with source information
            intent, confidence, classification_source = await intent_classifier.classify(
                request.query, 
                diagram_state,
                pattern_threshold=pattern_threshold,
                vector_threshold=vector_threshold
            )
            log_info(f"Classified intent: {intent} with confidence: {confidence}")
            
            # Build prompt based on intent
            base_prompt = await prompt_builder.build_prompt_by_intent(
                intent, 
                request.query, 
                conversation_history, 
                diagram_state
            )

            log_info(f"Base Prompt : {base_prompt}")
            
            # Apply any learned improvements if in retry mode or based on similar queries
            improved_prompt = base_prompt
            if hasattr(response_learning, 'apply_prompt_improvements') and response_learning:
                try:
                    improved_prompt = await response_learning.apply_prompt_improvements(
                        request.query, intent, base_prompt
                    )
                    if improved_prompt != base_prompt:
                        log_info("Applied prompt improvements based on feedback history")
                except Exception as e:
                    log_info(f"Error applying prompt improvements: {e}")
                    improved_prompt = base_prompt
            
            log_info(f"Improved Prompt : {improved_prompt}")
            
            # Determine if thinking should be used based on task complexity
            task_complexity = _determine_task_complexity(intent, request.query, diagram_state)
            use_thinking = task_complexity != "low"  # Use thinking for all but the simplest tasks

            # Always use thinking in retry mode
            if getattr(request, 'retry_mode', False):
                use_thinking = True
                # Increase complexity for retries to allocate more thinking budget
                if task_complexity == "low":
                    task_complexity = "medium"
                elif task_complexity == "medium":
                    task_complexity = "high"
            
            # Determine appropriate thinking budget based on task complexity
            thinking_budget = await llm_service.determine_thinking_budget(task_complexity, diagram_state)
            log_info(f"Task complexity: {task_complexity}, Using thinking: {use_thinking}, Budget: {thinking_budget}")
            
            # Calculate estimated response time based on complexity
            estimated_tokens = len(improved_prompt.split()) + 4096  # 4096 as a base response size
            
            # For complex tasks, streaming is recommended to avoid timeouts
            use_streaming = task_complexity in ["high", "very_high"] or estimated_tokens > 8000
            log_info(f"Using streaming: {use_streaming} (based on complexity and token estimation)")
            
            # Generate response using LLM with the appropriate approach
            log_info(f"Generating LLM response for intent: {intent}")

            # Initialize thinking variables
            thinking_content = ""
            has_redacted_thinking = False
            thinking_signature = None

            # Generate unique ID for the response (for feedback reference)
            response_id = str(uuid.uuid4())

            # timeout handling
            timeout = None
            if task_complexity == "very_high":
                # For very complex tasks, use a longer timeout
                timeout = 600  # 10 minutes
            elif task_complexity == "high":
                timeout = 300  # 5 minutes
            
            # For architecture responses and expert responses, we need structured data
            try:
                if intent in [ResponseType.ARCHITECTURE, ResponseType.EXPERT]:
                    # Use structured response with thinking for complex cases
                    log_info(f"Generating LLM Structured Response...")
                    llm_response_data = await llm_service.generate_structured_response(
                        improved_prompt, 
                        with_thinking=use_thinking,
                        thinking_budget=thinking_budget,
                        temperature=0.2 if getattr(request, 'retry_mode', False) else None,
                        stream=use_streaming,  # Always set streaming parameter explicitly
                        timeout=timeout
                    )
                    log_info(f"LLM Response Data : {llm_response_data}")
                    
                    # Extract thinking from response if present
                    if use_thinking and "thinking" in llm_response_data:
                        thinking_content = llm_response_data.pop("thinking", "")
                        has_redacted_thinking = llm_response_data.pop("has_redacted_thinking", False)
                        thinking_signature = llm_response_data.pop("signature", None) if "signature" in llm_response_data else None
                        
                        # Store thinking in session
                        background_tasks.add_task(
                            session_manager.add_to_thinking_history,
                            session_id,
                            request.query,
                            thinking_content,
                            has_redacted_thinking,
                            thinking_signature
                        )
                    
                    # Process the structured response with response processor
                    log_info(f"Processing LLM Structured Response...")
                    processed_response = response_processor.process_response_from_json(
                        llm_response_data,
                        intent,
                        session_id,
                        classification_source
                    )
                    log_info(f"Processed Response : {processed_response}")
                else:
                    # For clarification and out-of-context responses
                    if use_thinking:
                        thinking, llm_response, metadata = await llm_service.generate_response_with_thinking(
                            improved_prompt,
                            thinking_budget=thinking_budget,
                            stream=use_streaming,  # Always set streaming parameter explicitly
                            timeout=timeout
                        )
                        
                        # Log thinking for debugging
                        log_info(f"LLM thinking preview: {thinking[:100]}...")  # First 100 chars
                        thinking_content = thinking
                        has_redacted_thinking = metadata.get("has_redacted_thinking", False)
                        thinking_signature = metadata.get("signatures", [None])[0] if metadata.get("signatures") else None
                        
                        # Store thinking in session
                        background_tasks.add_task(
                            session_manager.add_to_thinking_history,
                            session_id,
                            request.query,
                            thinking_content,
                            has_redacted_thinking,
                            thinking_signature
                        )
                    else:
                        # For simpler responses without thinking
                        llm_response = await llm_service.generate_response(
                            improved_prompt, 
                            temperature=0.2 if getattr(request, 'retry_mode', False) else None,
                            stream=use_streaming,  # Always set streaming parameter explicitly
                            timeout=timeout
                        )
                    
                    # Process and validate response
                    processed_response = response_processor.process_response(
                        llm_response, 
                        intent,
                        session_id,
                        classification_source
                    )
                    
            except ValueError as e:
                # Handle specific error about long operations
                if "operations that may take longer than 10 minutes" in str(e):
                    log_info("Received 'operations that may take longer than 10 minutes' error. Retrying with explicit streaming.")
                    
                    # Retry with explicit streaming enabled
                    if intent in [ResponseType.ARCHITECTURE, ResponseType.EXPERT]:
                        log_info(f"Generating LLM Structured Response in Retry due to longer operations...")
                        llm_response_data = await llm_service.generate_structured_response(
                            improved_prompt, 
                            with_thinking=use_thinking,
                            thinking_budget=thinking_budget,
                            temperature=0.2 if getattr(request, 'retry_mode', False) else None,
                            stream=True,  # Force streaming
                            timeout=timeout
                        )
                        
                        if use_thinking and "thinking" in llm_response_data:
                            thinking_content = llm_response_data.pop("thinking", "")
                            has_redacted_thinking = llm_response_data.pop("has_redacted_thinking", False)
                            thinking_signature = llm_response_data.pop("signature", None) if "signature" in llm_response_data else None
                            
                            background_tasks.add_task(
                                session_manager.add_to_thinking_history,
                                session_id,
                                request.query,
                                thinking_content,
                                has_redacted_thinking,
                                thinking_signature
                            )
                        
                        processed_response = response_processor.process_response_from_json(
                            llm_response_data,
                            intent,
                            session_id,
                            classification_source
                        )
                    else:
                        if use_thinking:
                            thinking, llm_response, metadata = await llm_service.generate_response_with_thinking(
                                improved_prompt,
                                thinking_budget=thinking_budget,
                                stream=True,  # Force streaming
                                timeout=timeout
                            )
                            
                            thinking_content = thinking
                            has_redacted_thinking = metadata.get("has_redacted_thinking", False)
                            thinking_signature = metadata.get("signatures", [None])[0] if metadata.get("signatures") else None
                            
                            background_tasks.add_task(
                                session_manager.add_to_thinking_history,
                                session_id,
                                request.query,
                                thinking_content,
                                has_redacted_thinking,
                                thinking_signature
                            )
                        else:
                            llm_response = await llm_service.generate_response(
                                improved_prompt, 
                                temperature=0.2 if getattr(request, 'retry_mode', False) else None,
                                stream=True,  # Force streaming
                                timeout=timeout
                            )
                        
                        processed_response = response_processor.process_response(
                            llm_response, 
                            intent,
                            session_id,
                            classification_source
                        )
                else:
                    # For other ValueError exceptions, rethrow
                    raise
            except anthropic.APITimeoutError as e:
                log_info(f"API timeout error: {str(e)}. Retrying with extended timeout and streaming.")
                
                # Retry with extended timeout and explicit streaming
                if intent in [ResponseType.ARCHITECTURE, ResponseType.EXPERT]:
                    llm_response_data = await llm_service.generate_structured_response(
                        improved_prompt, 
                        with_thinking=use_thinking,
                        thinking_budget=thinking_budget,
                        temperature=0.2 if getattr(request, 'retry_mode', False) else None,
                        stream=True,  # Force streaming
                        timeout=max(timeout or 0, 600)  # Ensure at least 10 minutes timeout
                    )
                    
                    if use_thinking and "thinking" in llm_response_data:
                        thinking_content = llm_response_data.pop("thinking", "")
                        has_redacted_thinking = llm_response_data.pop("has_redacted_thinking", False)
                        thinking_signature = llm_response_data.pop("signature", None) if "signature" in llm_response_data else None
                        
                        background_tasks.add_task(
                            session_manager.add_to_thinking_history,
                            session_id,
                            request.query,
                            thinking_content,
                            has_redacted_thinking,
                            thinking_signature
                        )
                    
                    processed_response = response_processor.process_response_from_json(
                        llm_response_data,
                        intent,
                        session_id,
                        classification_source
                    )
                else:
                    if use_thinking:
                        thinking, llm_response, metadata = await llm_service.generate_response_with_thinking(
                            improved_prompt,
                            thinking_budget=thinking_budget,
                            stream=True,  # Force streaming
                            timeout=max(timeout or 0, 600)  # Ensure at least 10 minutes timeout
                        )
                        
                        thinking_content = thinking
                        has_redacted_thinking = metadata.get("has_redacted_thinking", False)
                        thinking_signature = metadata.get("signatures", [None])[0] if metadata.get("signatures") else None
                        
                        background_tasks.add_task(
                            session_manager.add_to_thinking_history,
                            session_id,
                            request.query,
                            thinking_content,
                            has_redacted_thinking,
                            thinking_signature
                        )
                    else:
                        llm_response = await llm_service.generate_response(
                            improved_prompt, 
                            temperature=0.2 if getattr(request, 'retry_mode', False) else None,
                            stream=True,  # Force streaming
                            timeout=max(timeout or 0, 600)  # Ensure at least 10 minutes timeout
                        )
                    
                    processed_response = response_processor.process_response(
                        llm_response, 
                        intent,
                        session_id,
                        classification_source
                    )
            
            # Add thinking to the processed response if requested
            if show_thinking and thinking_content:
                processed_response.thinking = thinking_content
                processed_response.has_redacted_thinking = has_redacted_thinking
            
            # Store classification metadata for learning
            classification_metadata = {
                "query": request.query,
                "intent": intent.value,
                "confidence": confidence,
                "classification_source": classification_source,
                "is_retry": getattr(request, 'retry_mode', False),
                "response_id": response_id,
                "timestamp": datetime.now().isoformat()
            }

            # Store the query and classification for future learning
            if hasattr(session_manager, 'add_classification_metadata'):
                background_tasks.add_task(
                    session_manager.add_classification_metadata,
                    session_id,
                    classification_metadata
                )
            
            
            # Prepare response data including response_id for feedback tracking
            response_data = {
                "response_type": processed_response.response_type,
                "message": processed_response.message,
                "has_thinking": bool(thinking_content),
                "classification_source": processed_response.classification_source,
                "confidence": processed_response.confidence,
                "response_id": response_id,  # Add unique ID for feedback reference
                "is_retry": getattr(request, 'retry_mode', False)

            }
            
            log_info(f"Response Data : {response_data}")
            
            # Now get the updated session data to check for changes in diagram
            updated_session_data = await session_manager.get_session(session_id)
            updated_diagram_state = updated_session_data.get("diagram_state", {})
            
            # Check if diagram state was changed by this interaction
            diagram_changed = False
            if processed_response.response_type == ResponseType.ARCHITECTURE:
                # For architecture responses, check if diagram was modified
                if processed_response.diagram_updates or processed_response.nodes_to_add or processed_response.edges_to_add or processed_response.elements_to_remove:
                    diagram_changed = True
                else:
                    # Compare original and updated diagram states to detect changes
                    original_nodes = len(original_diagram_state.get("nodes", []))
                    original_edges = len(original_diagram_state.get("edges", []))
                    updated_nodes = len(updated_diagram_state.get("nodes", []))
                    updated_edges = len(updated_diagram_state.get("edges", []))
                    
                    diagram_changed = (original_nodes != updated_nodes) or (original_edges != updated_edges)
            
            # Schedule background task to update conversation history with diagram state and change flag
            background_tasks.add_task(
                session_manager.add_to_conversation,
                session_id,
                request.query,
                response_data,
                updated_diagram_state if diagram_changed else None,
                diagram_changed
            )

            # Track metrics if we have a response learning service
            if response_learning and hasattr(response_learning, 'metrics'):
                try:
                    response_learning.metrics.total_responses += 1
                    background_tasks.add_task(
                        response_learning._save_metrics
                    )
                except Exception as e:
                    log_info(f"Error updating response metrics: {e}")
            
            # Create response object and include response_id
            response = DesignResponse(
                response=processed_response,
                show_thinking=show_thinking,
                response_id=response_id  # Include response_id in the response
            )
            log_info(f"Final Processed Response : {processed_response}")

            # Convert to dict for serialization
            response_dict = response.model_dump()

            # Copy the specific fields from the nested response to the top level
            if processed_response.response_type == ResponseType.ARCHITECTURE:
                # For architecture responses, include diagram updates and node/edge info
                response_dict["diagram_updates"] = processed_response.diagram_updates
                response_dict["nodes_to_add"] = processed_response.nodes_to_add
                response_dict["edges_to_add"] = processed_response.edges_to_add
                response_dict["elements_to_remove"] = processed_response.elements_to_remove
            elif processed_response.response_type == ResponseType.EXPERT:
                # For expert responses, include references and related concepts
                response_dict["references"] = processed_response.references
                response_dict["related_concepts"] = processed_response.related_concepts
            elif processed_response.response_type == ResponseType.CLARIFICATION:
                # For clarification responses, include questions
                response_dict["questions"] = processed_response.questions
            elif processed_response.response_type == ResponseType.OUT_OF_CONTEXT:
                # For out-of-context responses, include suggestion
                response_dict["suggestion"] = processed_response.suggestion

             # Update diagram state in DB if architecture was modified
            if processed_response.response_type == ResponseType.ARCHITECTURE and processed_response.diagram_updates:
                 # Fetch the latest state potentially modified by the LLM response processing
                 final_diagram_state = await session_manager.get_session(session_id)
                 background_tasks.add_task(
                      supabase_manager.update_project_data,
                      user_id=user_id, project_code=project_code,
                      diagram_state=final_diagram_state.get("diagram_state")
                 )
                 # Invalidate DFD data as AD changed
                 background_tasks.add_task(
                      supabase_manager.update_project_data,
                      user_id=user_id, project_code=project_code,
                      dfd_data=None, threat_model_id=None
                 )

            log_info(f"Final Processed Response: {processed_response}")
            log_info(f"Successfully processed design query, returning response type: {processed_response.response_type}")

            # Return a custom JSONResponse
            return JSONResponse(content=response_dict)
    
    except Exception as e:
        log_info(f"Error processing design query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing design query: {str(e)}")


def _determine_task_complexity(intent: ResponseType, query: str, diagram_state: Dict[str, Any]) -> str:
    """
    Determine the complexity of the task to guide thinking budget allocation.
    
    Args:
        intent: The classified intent
        query: The user's query
        diagram_state: Current state of the diagram
        
    Returns:
        String complexity level: "low", "medium", "high", or "very_high"
    """
    # Default complexity
    complexity = "medium"
    
    # Adjust based on intent - architecture changes are usually more complex
    if intent == ResponseType.ARCHITECTURE:
        complexity = "high"
    elif intent == ResponseType.EXPERT:
        complexity = "medium"
    elif intent == ResponseType.CLARIFICATION:
        complexity = "low"
    elif intent == ResponseType.OUT_OF_CONTEXT:
        complexity = "low"
    
    # Adjust for known complex tasks based on query length and content
    if len(query.split()) > 100:  # Very detailed query
        if complexity == "medium":
            complexity = "high"
        elif complexity == "high":
            complexity = "very_high"
    
    # Check for complex patterns in query
    complex_patterns = [
        r"compliance",
        r"security analysis",
        r"vulnerability",
        r"threat model",
        r"optimize",
        r"performance",
        r"scale",
        r"regulatory",
        r"compare",
        r"trade-offs",
        r"best practice",
        r"redesign",
        r"analyze",
        r"improve",
        r"recommendations",
        r"comprehensive"
    ]
    
    # Check for complex patterns in query
    for pattern in complex_patterns:
        if re.search(pattern, query, re.IGNORECASE):
            # Increase complexity for matching patterns
            if complexity == "low":
                complexity = "medium"
            elif complexity == "medium":
                complexity = "high"
            elif complexity == "high":
                complexity = "very_high"
            break
    
    # Adjust based on diagram complexity
    if diagram_state:
        node_count = len(diagram_state.get("nodes", []))
        edge_count = len(diagram_state.get("edges", []))
        
        if node_count + edge_count > 20:
            # For very complex diagrams, increase complexity one level
            if complexity == "low":
                complexity = "medium"
            elif complexity == "medium":
                complexity = "high"
            elif complexity == "high":
                complexity = "very_high"
    
    return complexity


@router.get("/thinking/{session_id}", response_model=List[Dict[str, Any]])
async def get_thinking_history(
    session_id: str,
    limit: int = Query(5, ge=1, le=20, description="Maximum number of thinking entries to return"),
    session_manager: SessionManager = Depends()
):
    """
    Get the thinking history for a specific session.
    
    Args:
        session_id: The unique session identifier
        limit: Maximum number of thinking entries to return
        
    Returns:
        List of thinking entries with associated metadata
    """
    try:
        return await session_manager.get_thinking_history(session_id, limit)
    except Exception as e:
        log_info(f"Error retrieving thinking history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving thinking history: {str(e)}")

async def _store_thinking_in_session(
    session_manager: SessionManager,
    session_id: str,
    query: str,
    thinking: str,
    has_redacted_thinking: bool = False
) -> None:
    """
    Store thinking process in session for debugging purposes.
    
    Args:
        session_manager: Session manager service
        session_id: The session ID
        query: The user's query
        thinking: The thinking process from the LLM
        has_redacted_thinking: Whether any part of thinking was redacted
    """
    try:
        # Get existing thinking_history array or create new one
        session_data = await session_manager.get_session(session_id)
        
        thinking_history = session_data.get("thinking_history", [])
        thinking_history.append({
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "thinking": thinking,
            "has_redacted_thinking": has_redacted_thinking
        })
        
        # Limit to last 10 thinking entries to prevent bloat
        if len(thinking_history) > 10:
            thinking_history = thinking_history[-10:]
            
        # Update session with new thinking_history
        await session_manager.update_session(
            session_id,
            thinking_history=thinking_history
        )
    except Exception as e:
        log_info(f"Failed to store thinking in session: {str(e)}")