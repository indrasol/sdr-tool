from pydantic import BaseModel
from typing import Optional, List, Dict

class IntentRequest(BaseModel):
    """Request model for intent classification."""
    query: str
    session_id: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = None

class IntentResponse(BaseModel):
    """Response model for intent classification."""
    intent_type: str
    confidence: float
    query: str
    session_id: Optional[str] = None