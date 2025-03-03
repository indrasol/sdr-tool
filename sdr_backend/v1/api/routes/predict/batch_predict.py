# routes/intent_routes.py
from fastapi import APIRouter, HTTPException
from typing import List
from core.intent_classification.intent_classifier import IntentClassifier
from utils.logger import log_info
from models.intent_classification_models import IntentRequest, IntentResponse



router = APIRouter()


# Initialize intent classifier
try:
    intent_classifier = IntentClassifier()
except Exception as e:
    log_info(f"Warning: Intent classifier initialization failed: {str(e)}")
    intent_classifier = None

@router.post("/batch_predict")
async def batch_predict_intent(requests: List[IntentRequest]):
    """
    Classify the intent of multiple user queries.
    
    Args:
        requests: List of intent classification requests
        
    Returns:
        List of intent classification results
    """
    try:
        if not intent_classifier:
            raise HTTPException(
                status_code=503,
                detail="Intent classification service is not available"
            )
        
        results = []
        for request in requests:
            # Classify the intent
            result = intent_classifier.classify_intent(
                query=request.query,
                conversation_history=request.conversation_history
            )
            
            # Create response
            response = IntentResponse(
                intent_type=result["intent_type"],
                confidence=result["confidence"],
                query=request.query,
                session_id=request.session_id
            )
            
            results.append(response)
        
        return results
        
    except Exception as e:
        log_info(f"Error in batch intent classification: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch intent classification failed: {str(e)}"
        )