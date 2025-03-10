# services/request_handler.py
from typing import Dict, Any
from models.new_pydantic_models import UserRequest
import json
from utils.logger import log_info
from fastapi import HTTPException, Depends

# Import dependencies
from core.cache.session_manager import SessionManager
from services.supabase_manager import SupabaseManager
from core.intent_classification.intent_classifier import IntentClassifier

# Initialize singletons
session_manager = SessionManager()
supabase_manager = SupabaseManager()


try:
    intent_classifier = IntentClassifier()
except Exception as e:
    log_info(f"Warning: Intent classifier initialization failed: {str(e)}")
    intent_classifier = None

async def preprocess_request(request: UserRequest, user_id: str) -> Dict[str, Any]:
    """
    Preprocess the user request using session data for context.

    Args:
        request: The user's request containing query, session_id, and project_code
        user_id: The authenticated user's ID

    Returns:
        Dict containing processed request data with context

    Raises:
        HTTPException: If session or project validation fails
    """
    try:
        log_info(f"Preprocessing request for user {user_id}, session {request.session_id}")

        # Initialize the processed request with the base data
        processed_request = {
            "query": request.query,
            "session_id": request.session_id,
            "project_id": request.project_id if hasattr(request, 'project_id') else None,
            "user_id": user_id,
            "conversation_history": [],
            "diagram_context": {"nodes": [], "edges": []}
        }
        
        # If session exists, load conversation history and context from cache
        if request.session_id:
            session_data = await session_manager.get_session_async(request.session_id)
            if session_data:
                processed_request["conversation_history"] = session_data.get("conversation_history", [])
                processed_request["diagram_context"] = session_data.get("diagram_state", {"nodes": [], "edges": []})
        
        # If project_code exists but data not in session, load from database
        if not processed_request["conversation_history"] and request.project_code:
            try:
                project_data = await supabase_manager.get_project_data(
                    user_id=user_id,
                    project_code=request.project_code
                )
                processed_request["conversation_history"] = project_data.get("conversation_history", [])
                processed_request["diagram_context"] = project_data.get("diagram_state", {"nodes": [], "edges": []})
            except ValueError as e:
                log_info(f"Error retrieving project data: {str(e)}")
                # Continue processing even if project data retrieval fails

        # Classify intent if classifier is available
        intent_data = None
        if intent_classifier:
            try:
                intent_data = await intent_classifier.classify_intent(
                    query=request.query,
                    conversation_history=processed_request["conversation_history"],
                    diagram_state=processed_request["diagram_context"]
                )
                log_info(f"Intent classification result: {intent_data}")
            except Exception as intent_error:
                log_info(f"Intent classification error (using fallback): {str(intent_error)}")
                intent_data = IntentClassifier.get_fallback_classification()
                intent_data["query"] = request.query
        else:
            log_info("Intent classifier not available, using fallback")
            intent_data = {
                "intent_type": "expert_advice",
                "confidence": 0.0,
                "query": request.query
            }

        # Create processed request
        processed_request = {
            "query": request.query,
            "session_id": request.session_id,
            "project_id": request.project_code,
            "user_id": user_id,
            "conversation_history": processed_request["conversation_history"],
            "diagram_context": processed_request["diagram_context"],
            "intent": intent_data
        }

        log_info(f"Processed request: {json.dumps(processed_request)}")
        return processed_request

    except HTTPException as e:
        raise e
    except Exception as e:
        log_info(f"Error preprocessing request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")