# routes/intent_routes.py
from fastapi import APIRouter, HTTPException
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



@router.post("/predict", response_model=IntentResponse)
async def predict_intent(request: IntentRequest):
    """
    Classify the intent of a user query.
    
    Args:
        request: The intent classification request
        
    Returns:
        IntentResponse with the classified intent
    """
    try:
        if not intent_classifier:
            raise HTTPException(
                status_code=503,
                detail="Intent classification service is not available"
            )
        
        # Classify the intent
        result = await intent_classifier.classify_intent(
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
        
        return response
        
    except Exception as e:
        log_info(f"Error in intent classification: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Intent classification failed: {str(e)}"
        )