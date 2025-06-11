from pydantic import BaseModel, Field
from typing import Dict, Optional, Any, List, Literal
from enum import Enum
from datetime import datetime


class ResponseType(str, Enum):
    """Enum for the different types of responses the API can provide."""
    ARCHITECTURE = "ArchitectureResponse"
    EXPERT = "ExpertResponse"
    CLARIFICATION = "ClarificationResponse"
    OUT_OF_CONTEXT = "OutOfContextResponse"
    DFD = "DFDResponse"


class BaseResponse(BaseModel):
    """Base model for all response types."""
    response_type: ResponseType
    message: str = Field(..., description="Response message for the user")
    confidence: float = Field(..., description="Confidence score for the response", ge=0, le=1)
    session_id: str = Field(..., description="Session identifier")
    thinking: Optional[str] = Field(None, description="The model's reasoning process")
    has_redacted_thinking: Optional[bool] = Field(False, description="Whether any thinking was redacted")
    classification_source: Optional[str] = Field(None, description="Source of classification (pattern, vector, llm)")


class ArchitectureResponse(BaseResponse):
    """Response model for architecture-related queries."""
    response_type: Literal[ResponseType.ARCHITECTURE] = ResponseType.ARCHITECTURE
    diagram_updates: Optional[Dict[str, Any]] = Field(None, description="Updates to be applied to the diagram")
    nodes_to_add: Optional[List[Dict[str, Any]]] = Field(None, description="New nodes to add to the diagram")
    edges_to_add: Optional[List[Dict[str, Any]]] = Field(None, description="New edges to add to the diagram")
    elements_to_remove: Optional[List[str]] = Field(None, description="Elements to remove from the diagram")


class ExpertResponse(BaseResponse):
    """Response model for expert knowledge queries."""
    response_type: Literal[ResponseType.EXPERT] = ResponseType.EXPERT
    references: Optional[List[Dict[str, str]]] = Field(None, description="Reference sources for the information")
    related_concepts: Optional[List[str]] = Field(None, description="Related security concepts")


class ClarificationResponse(BaseResponse):
    """Response model for queries requiring clarification."""
    response_type: Literal[ResponseType.CLARIFICATION] = ResponseType.CLARIFICATION
    questions: List[str] = Field(..., description="Follow-up questions to clarify user intent")


class OutOfContextResponse(BaseResponse):
    """Response model for out-of-context queries."""
    response_type: Literal[ResponseType.OUT_OF_CONTEXT] = ResponseType.OUT_OF_CONTEXT
    suggestion: Optional[str] = Field(None, description="Suggestion for relevant query")


class DesignResponse(BaseModel):
    """Union model for all possible response types."""
    response: BaseResponse
    show_thinking: Optional[bool] = Field(True, description="Whether to show thinking in the UI")
    response_id: Optional[str] = Field(None, description="Unique identifier for feedback reference")


class SaveTemplateResponse(BaseModel):
    success: bool
    template_id: str
    message: str

class GetTemplateResponse(BaseModel):
    success: bool
    template_id: str
    tenant_id: int
    tenant_name: str
    diagram_state: Dict               # alias for diagram_info in DB
    template_name: str
    template_description: Optional[str]
    template_tags: List[str]
    template_visibility: List[str]
    created_at: datetime
    updated_at: datetime


class UpdateTemplateResponse(BaseModel):
    success: bool
    template_id: str
    updated_at: datetime
    message: str