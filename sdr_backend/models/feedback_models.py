from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from models.response_models import ResponseType


from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from models.response_models import ResponseType


class FeedbackRating(str, Enum):
    """Rating enum for response feedback."""
    EXCELLENT = "excellent"
    GOOD = "good"
    NEUTRAL = "neutral"
    POOR = "poor"
    INCORRECT = "incorrect"


class FeedbackCategory(str, Enum):
    """Categories for response feedback."""
    RELEVANCE = "relevance"         # Was the response relevant to the query?
    ACCURACY = "accuracy"           # Was the information accurate?
    COMPLETENESS = "completeness"   # Was the response complete?
    CLARITY = "clarity"             # Was the response clear and understandable?
    USEFULNESS = "usefulness"       # Was the response useful for the task?
    TECHNICAL = "technical"         # Was the technical content appropriate?
    SECURITY = "security"           # Was the security advice appropriate?

class FeedbackType(str, Enum):
    """Simple feedback types for thumbs up/down interface."""
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"


class SimpleFeedback(BaseModel):
    """Model for simple thumbs up/down feedback."""
    session_id: str = Field(..., description="Session identifier")
    project_id: str = Field(..., description="Project identifier")
    query: str = Field(..., description="The original query")
    response_id: str = Field(..., description="Unique identifier for the response")
    feedback_type: FeedbackType = Field(..., description="Thumbs up or thumbs down")
    intent_was_correct: Optional[bool] = Field(None, description="Whether intent classification was correct")
    correct_intent: Optional[ResponseType] = Field(None, description="The correct intent if misclassified")
    reason: Optional[str] = Field(None, description="Optional reason for negative feedback")


class RetryRequest(BaseModel):
    """Model for simple thumbs up/down feedback."""
    session_id: str = Field(..., description="Session identifier")
    project_id: str = Field(..., description="Project identifier")
    query: str = Field(..., description="The original query")
    response_id: str = Field(..., description="Unique identifier for the response")

class ResponseExample(BaseModel):
    """Model for storing exemplary responses."""
    query: str = Field(..., description="The original query")
    intent: ResponseType = Field(..., description="The intent classification")
    response: Dict[str, Any] = Field(..., description="The complete response data")
    rating: FeedbackRating = Field(..., description="The quality rating of this response")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")
    feedback_count: int = Field(default=1, description="Number of positive feedback instances")
    created_at: str = Field(..., description="Timestamp when this example was created")
    last_used: Optional[str] = Field(None, description="Timestamp when last used for improvement")

class ResponseFeedback(BaseModel):
    """Model for submitting feedback on the complete response."""
    session_id: str = Field(..., description="Session identifier")
    query: str = Field(..., description="The original query")
    response_id: str = Field(..., description="Unique identifier for the response")
    overall_rating: FeedbackRating = Field(..., description="Overall rating of the response")
    category_ratings: Optional[Dict[FeedbackCategory, FeedbackRating]] = Field(
        None, description="Optional ratings for specific categories"
    )
    improvement_needed: Optional[str] = Field(None, description="How the response could be improved")
    corrected_response: Optional[str] = Field(None, description="User-provided corrected response")
    intent_was_correct: Optional[bool] = Field(None, description="Whether the intent classification was correct")
    correct_intent: Optional[ResponseType] = Field(None, description="The correct intent if misclassified")
    tags: Optional[List[str]] = Field(None, description="User-provided tags for categorization")

class ResponseMetrics(BaseModel):
    """Model for tracking response quality metrics."""
    total_responses: int = Field(default=0, description="Total number of responses generated")
    feedback_received: int = Field(default=0, description="Number of feedback instances received")
    rating_distribution: Dict[FeedbackRating, int] = Field(
        default_factory=lambda: {rating: 0 for rating in FeedbackRating}, 
        description="Distribution of ratings"
    )
    category_ratings: Dict[FeedbackCategory, Dict[FeedbackRating, int]] = Field(
        default_factory=lambda: {
            category: {rating: 0 for rating in FeedbackRating} 
            for category in FeedbackCategory
        },
        description="Ratings by category"
    )
    intent_accuracy: Dict[ResponseType, Dict[str, float]] = Field(
        default_factory=dict,
        description="Accuracy metrics by intent type"
    )
    common_improvement_tags: Dict[str, int] = Field(
        default_factory=dict,
        description="Frequency of improvement tags"
    )