# services/request_handler.py
from typing import Dict, Any
from models.new_pydantic_models import UserRequest
import json
from utils.logger import log_info
from fastapi import HTTPException, Depends

# Import dependencies
from core.cache.session_manager import SessionManager
from core.db.database_manager import DatabaseManager
from core.db.connection_manager import get_db
from core.intent_classification.intent_classifier import IntentClassifier
from databases import Database

# Initialize singletons
session_manager = SessionManager()

try:
    intent_classifier = IntentClassifier()
except Exception as e:
    log_info(f"Warning: Intent classifier initialization failed: {str(e)}")
    intent_classifier = None

async def preprocess_request(request: UserRequest, user_id: str, db: Database = Depends(get_db)) -> Dict[str, Any]:
    """
    Preprocess the user request using session data for context.

    Args:
        request: The user's request containing query, session_id, and project_id
        user_id: The authenticated user's ID (e.g., from JWT token)

    Returns:
        Dict containing processed request data with context

    Raises:
        HTTPException: If session or project validation fails
    """
    try:
        log_info(f"Preprocessing request for user: {user_id}, project: {request.project_id}, session: {request.session_id}")

        # Retrieve session data asynchronously and verify project_id
        session_data = await session_manager.get_session(request.session_id, request.project_id)

        log_info(f"session_data : {session_data}")
        
        # Verify user ownership
        if session_data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Session does not belong to user")

        # Extract conversation history and diagram state from session
        conversation_history = session_data["conversation_history"]
        diagram_state = session_data["diagram_state"]

        # Format conversation history for LLM context
        formatted_history = []
        for entry in conversation_history:
            formatted_history.append({"role": "user", "content": entry.get("user", "")})
            log_info(f"Conversation history : {conversation_history}")
            formatted_history.append({
                "role": "assistant",
                "content": json.dumps(entry.get("system", "")) if isinstance(entry.get("system"), dict) else entry.get("system", "")
            })

        # Classify intent if classifier is available
        intent_data = None
        if intent_classifier:
            try:
                intent_data = await intent_classifier.classify_intent(
                    query=request.query,
                    conversation_history=formatted_history,
                    diagram_state=diagram_state
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
            "project_id": request.project_id,
            "user_id": user_id,
            "conversation_history": formatted_history,
            "diagram_context": diagram_state,
            "intent": intent_data
        }

        log_info(f"Processed request: {json.dumps(processed_request)}")
        return processed_request

    except HTTPException as e:
        raise e
    except Exception as e:
        log_info(f"Error preprocessing request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")