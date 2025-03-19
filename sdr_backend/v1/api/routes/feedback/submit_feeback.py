from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from typing import Dict, Any, List
from services.auth_handler import verify_token  # Authentication dependency
from core.llm.llm_gateway_v1 import LLMService
from core.intent_classification.intent_classifier_v1 import IntentClassifier
from core.prompt_engineering.prompt_builder import PromptBuilder
from services.response_processor import ResponseProcessor
from core.cache.session_manager import SessionManager
from services.response_handler import ResponseHandler
from models.response_models import ResponseType
from models.feedback_models import SimpleFeedback, FeedbackType, RetryRequest
from sdr_backend.models.request_models import DesignRequest
from services.feedback_handler import ResponseLearningService
from core.intent_classification.intent_classifier_v1 import IntentClassifier
from routes.model_with_ai.design import design_endpoint
from core.cache.session_manager import SessionManager
from models.response_models import DesignResponse
from datetime import datetime
import logging
from utils.logger import log_info
import re

# Initialize logger
# logger = logging.getLogger(__name__)


# Initialize the router
router = APIRouter()

response_learning = ResponseLearningService()
intent_classifier = IntentClassifier()
session_manager = SessionManager()

@router.post("/feedback", status_code=202)
async def submit_feedback(
    feedback: SimpleFeedback,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(verify_token)
) -> Dict[str, str]:
    """
    Submit simple thumbs up/down feedback on a response.
    
    Args:
        feedback: Simple feedback with thumbs up/down rating
        
    Returns:
        Status message
    """
    try:
        log_info(f"Processing feedback for query: {feedback.query[:50]}...")
        
        # Validate session belongs to user
        try:
            session_data = await session_manager.get_session(
                feedback.session_id, 
                expected_project_id=feedback.project_id,
                expected_user_id=current_user['id']
            )
        except HTTPException as e:
            if e.status_code == 404:
                raise HTTPException(status_code=404, detail="Session not found")
            elif e.status_code == 403:
                raise HTTPException(status_code=403, detail="Unauthorized access to session")
            else:
                raise
                
        # Find the original response to verify response_id
        response_found = False
        original_intent = None
        confidence = 0.7
        
        for entry in session_data.get("conversation_history", []):
            if entry.get("response", {}).get("response_id") == feedback.response_id:
                response_found = True
                if "response_type" in entry.get("response", {}):
                    original_intent = ResponseType(entry["response"]["response_type"])
                    confidence = entry["response"].get("confidence", 0.7)
                break
        
        if not response_found:
            raise HTTPException(status_code=404, detail="Response ID not found in session history")
        
        # Process based on feedback type
        if feedback.feedback_type == FeedbackType.THUMBS_UP:
            # For positive feedback, store as a good example
            background_tasks.add_task(
                response_learning.handle_positive_feedback,
                feedback.session_id,
                feedback.query,
                feedback.response_id
            )
            
            # If we have explicit confirmation that intent was correct, add that as positive feedback
            if feedback.intent_was_correct is True and original_intent:
                background_tasks.add_task(
                    intent_classifier.add_feedback,
                    feedback.query,
                    original_intent,
                    original_intent,  # Same intent as prediction = correct
                    confidence
                )
            
            # Store feedback record in session
            if hasattr(session_manager, 'add_intent_feedback'):
                background_tasks.add_task(
                    session_manager.add_intent_feedback,
                    feedback.session_id,
                    {
                        "query": feedback.query,
                        "response_id": feedback.response_id,
                        "feedback_type": feedback.feedback_type,
                        "intent_was_correct": True,
                        "timestamp": datetime.now().isoformat()
                    }
                )
            
        elif feedback.feedback_type == FeedbackType.THUMBS_DOWN:
            # For negative feedback, record the issue
            background_tasks.add_task(
                response_learning.handle_negative_feedback,
                feedback.session_id,
                feedback.query,
                feedback.response_id,
                feedback.reason
            )
            
            # If intent classification feedback is provided, process that too
            if feedback.intent_was_correct is False and feedback.correct_intent and original_intent:
                background_tasks.add_task(
                    intent_classifier.add_feedback,
                    feedback.query,
                    original_intent,         # What was predicted
                    feedback.correct_intent, # What was actually correct
                    confidence
                )
                
                # Store the fact that there was an intent correction
                if hasattr(session_manager, 'add_intent_feedback'):
                    background_tasks.add_task(
                        session_manager.add_intent_feedback,
                        feedback.session_id,
                        {
                            "query": feedback.query,
                            "response_id": feedback.response_id,
                            "feedback_type": feedback.feedback_type,
                            "intent_was_correct": False,
                            "original_intent": original_intent.value,
                            "correct_intent": feedback.correct_intent.value,
                            "reason": feedback.reason,
                            "timestamp": datetime.now().isoformat()
                        }
                    )
        
        return {"status": "success", "message": "Feedback received"}
    except HTTPException as e:
        # Re-raise HTTP exceptions with their status code
        raise
    except Exception as e:
        log_info(f"Error processing feedback: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing feedback: {str(e)}")


@router.post("/retry", status_code=202)
async def retry_query(
    retry_request: RetryRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(verify_token)
) -> DesignResponse:
    """
    Retry a query with improved prompting.
    
    Args:
        retry_request: Details for retrying a query
        background_tasks: Background tasks for async operations
        current_user: Authenticated user information
        
    Returns:
        New response with improved approach
    """
    try:
        log_info(f"Processing retry for query: {retry_request.query[:50]}...")
        
        # Validate session belongs to user
        try:
            session_data = await session_manager.get_session(
                retry_request.session_id, 
                expected_project_id=retry_request.project_id,
                expected_user_id=current_user['id']
            )
        except HTTPException as e:
            if e.status_code == 404:
                raise HTTPException(status_code=404, detail="Session not found")
            elif e.status_code == 403:
                raise HTTPException(status_code=403, detail="Unauthorized access to session")
            else:
                raise
        
        # Record that this response needed a retry
        if hasattr(response_learning, 'record_retry'):
            background_tasks.add_task(
                response_learning.record_retry,
                retry_request.session_id,
                retry_request.query,
                retry_request.response_id
            )
        
        # Process same query but with retry mode enabled
        result = await design_endpoint(
            DesignRequest(
                project_id=retry_request.project_id,
                query=retry_request.query,
                session_id=retry_request.session_id,
                diagram_state=session_data.get("diagram_state"),
                retry_mode=True  # Signal that this is a retry
            ),
            background_tasks,
            show_thinking=True,
            current_user=current_user
        )
        
        return result
    except HTTPException as e:
        # Re-raise HTTP exceptions with their status code
        raise
    except Exception as e:
        log_info(f"Error processing retry: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing retry: {str(e)}")


@router.get("/intent-metrics", response_model=Dict[str, Any])
async def get_intent_metrics(
    current_user: dict = Depends(verify_token)
) -> Dict[str, Any]:
    """
    Get intent classification performance metrics.
    
    Returns:
        Dictionary of metrics about classification performance
    """
    try:
        return intent_classifier.get_metrics()
    except Exception as e:
        log_info(f"Error retrieving intent metrics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving metrics: {str(e)}")


@router.get("/response-metrics", response_model=Dict[str, Any])
async def get_response_metrics(
    current_user: dict = Depends(verify_token)
) -> Dict[str, Any]:
    """
    Get response quality metrics.
    
    Returns:
        Dictionary of metrics about response quality
    """
    try:
        if hasattr(response_learning, 'get_response_metrics'):
            return response_learning.get_response_metrics()
        else:
            return {"error": "Response metrics not available"}
    except Exception as e:
        log_info(f"Error retrieving response metrics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving metrics: {str(e)}")