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
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from models.response_models import DesignResponse, ResponseType
from models.request_models import DesignRequest
from models.response_models import ArchitectureResponse
from services.feedback_handler import ResponseLearningService
from datetime import datetime, timezone
from utils.logger import log_info
from v1.api.routes.model_with_ai.threat_model import generate_threat_model_endpoint
import anthropic
import re
import uuid
import json
import sys
from services.threat_modeling_service import ThreatModelingService
from services.supabase_manager import SupabaseManager
from models.threat_models import FullThreatModelResponse
from models.dfd_models import DFDSwitchRequest
import httpx

# In Python 3.11+, ExceptionGroup is built-in
if sys.version_info < (3, 11):
    from exceptiongroup import ExceptionGroup
# We can use the built-in ExceptionGroup in Python 3.11+



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


@router.post("/design")
async def design_endpoint(
    request: DesignRequest,
    background_tasks: BackgroundTasks,
    show_thinking: bool = Query(False, description="Parameter maintained for backwards compatibility"),
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
    llm_exceptions = []
    try:
        user_id = current_user["id"]
        project_code = request.project_id
        session_id = request.session_id
        query_lower = request.query.lower()

        # # Check role permissions
        # def fetch_role():
        #     return supabase.from_("roles").select("permissions").eq("user_id", current_user["id"]).eq("project_id", project["id"]).execute()
        # role_response = await safe_supabase_operation(fetch_role, "Failed to fetch role")
        # permissions = role_response.data[0]["permissions"] if role_response.data else {"view": True, "edit": False}

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
            # Call the threat model generation function directly
            try:
                # Ensure we have a valid session
                if not session_id:
                    session_id = await session_manager.create_project_session(current_user["id"], project_code)
                    
                # Get diagram state from session if not provided in request
                session_data = await session_manager.get_session(session_id)
                diagram_state = request.diagram_state or session_data.get("diagram_state", {})
                
                # Check if we already have a threat model in session
                threat_model = None
                diagram_changed = True
                
                if session_manager.redis_pool:
                    # Check if we have a cached threat model
                    cached_model, diagram_changed = await session_manager.get_threat_model(
                        session_id=session_id,
                        diagram_state=diagram_state
                    )
                    
                    # If diagram hasn't changed and we have a cached model, use it
                    if cached_model and not diagram_changed:
                        log_info(f"Using cached threat model for project {project_code}")
                        # Structure a FullThreatModelResponse from the cached data
                        threat_model = FullThreatModelResponse(**cached_model)
                
                # If no cached model or diagram changed, generate a new one
                if not threat_model or diagram_changed:
                    log_info(f"Generating new threat model for project {project_code}")
                    
                    # Create the request with session ID and diagram state
                    switch_request = DFDSwitchRequest(
                        session_id=session_id,
                        diagram_state=diagram_state,
                    )
                    
                    # Call threat model generation endpoint
                    async with httpx.AsyncClient() as client:
                        # Call the endpoint directly without going through network (internal call)
                        threat_model = await generate_threat_model_endpoint(
                            project_code=project_code,
                            request=switch_request,
                            current_user=current_user["id"]
                        )
                
                # Store the results in the session conversation history
                response_data = {
                    "response_type": "EXPERT",
                    "message": f"Threat model generated successfully for project {project_code}.",
                    "confidence": 0.95,
                    "threat_model_id": getattr(threat_model, "threat_model_id", None)
                }
                
                # Add to conversation history
                await session_manager.add_to_conversation(
                    session_id=session_id,
                    query=request.query,
                    response=response_data
                )
                
                # Return successful response
                return JSONResponse(
                    content={
                        "response_type": "EXPERT",
                        "message": f"Threat model generated successfully for project {project_code}.",
                        "threat_model": threat_model.model_dump() if hasattr(threat_model, "model_dump") else threat_model
                    },
                    status_code=200
                )
                
            except Exception as e:
                log_info(f"Error generating threat model: {str(e)}")
                # Return error message instead of falling back to background generation
                return JSONResponse(
                    content={
                        "response_type": "ERROR",
                        "message": f"Error generating threat model: {str(e)}",
                        "success": False
                    },
                    status_code=500
                )
        
        else:   
            # Continue with normal processing flow for all cases including DFD queries
            log_info(f"Processing design query for user: {current_user}, request : {request.query} , project: {request.project_id}")
            
            # Get or create session
            session_id = request.session_id
            if not session_id:
                log_info(f"Creating new session for user: {current_user}, project: {request.project_id}")
                session_id = await session_manager.create_project_session(current_user["id"], request.project_id)
            
            log_info(f"Session Id from Request : {request.session_id}")
            log_info(f"Session Id new : {session_id}")
            # Ensure session exists and fetch data
            session_data = await session_manager.get_session(session_id)
            if not session_data:
                # Session expired or invalid, create a new one
                log_info(f"Session {session_id} not found or expired, creating new session")
                session_id = await session_manager.create_project_session(current_user["id"], request.project_id)
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
            prompt = await prompt_builder.build_prompt_by_intent(
                intent, 
                request.query, 
                conversation_history, 
                diagram_state
            )

            log_info(f"Prompt : {prompt}")
            
            # Apply any learned improvements if in retry mode or based on similar queries
            # improved_prompt = base_prompt
            # if hasattr(response_learning, 'apply_prompt_improvements') and response_learning:
            #     try:
            #         improved_prompt = await response_learning.apply_prompt_improvements(
            #             request.query, intent, base_prompt
            #         )
            #         if improved_prompt != base_prompt:
            #             log_info("Applied prompt improvements based on feedback history")
            #     except Exception as e:
            #         log_info(f"Error applying prompt improvements: {e}")
            #         improved_prompt = base_prompt

            # Generate unique ID for the response (for feedback reference)
            response_id = str(uuid.uuid4())

            # timeout handling
            timeout =  300  # 5 minutes
            
            # For architecture responses and expert responses, we need structured data
            try:
                if intent in [ResponseType.ARCHITECTURE, ResponseType.EXPERT]:
                    # Use structured response
                    log_info(f"Generating Architecture / Expert  Response...")
                    llm_response = await llm_service.generate_llm_response(
                        prompt=prompt,
                        model_provider="anthropic",
                        model_name="claude-3.7-sonnet",
                        temperature=0.7,
                        timeout=timeout
                    )
                    log_info(f"LLM Response Data : {llm_response}")
                    
                    # Process the structured response with response processor
                    log_info(f"Processing Architecture / Expert Response...")
                    processed_response = await response_processor.process_response_from_json(
                        llm_response,
                        intent,
                        session_id,
                        classification_source
                    )
                    log_info(f"Processed Response : {processed_response}")
                else:
                    # For clarification and out-of-context responses
                    llm_response = await llm_service.generate_anthropic_response(
                        prompt=prompt,
                        model_provider="anthropic",
                        model_name="claude-3.7-sonnet",
                        temperature=0.5,
                        stream=False,
                        timeout=timeout
                    )
                    
                    # Process and validate response
                    processed_response = await response_processor.process_response(
                        llm_response, 
                        intent,
                        session_id,
                        classification_source
                    )
                    
            except ValueError as e:
                # Track exceptions for potential ExceptionGroup
                llm_exceptions.append(e)
                
            except anthropic.APITimeoutError as e:
                # Track exceptions for potential ExceptionGroup
                llm_exceptions.append(e)
            
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
                show_thinking=False,  # We're no longer sending thinking
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
    
    except HTTPException as http_exc:
        # Let FastAPI handle HTTP exceptions normally
        raise http_exc
    except Exception as e:
        # Check if we have accumulated exceptions that should be grouped
        if llm_exceptions:
            # Create an exception group if we have multiple exceptions from LLM calls
            if len(llm_exceptions) > 1:
                raise ExceptionGroup("Multiple LLM errors occurred", llm_exceptions) from e
            # Just raise the single exception normally
            
        log_info(f"Error processing design query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing design query: {str(e)}")

def _determine_task_complexity(intent: ResponseType, query: str, diagram_state: Dict[str, Any]) -> str:
    """
    Determine the complexity of the task to guide timeout and streaming settings.
    
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