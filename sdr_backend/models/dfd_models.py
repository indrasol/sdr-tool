# dfd_models.py
from pydantic import BaseModel, Field
from typing import Dict, Optional, Any, List

class DFDGenerationRequest(BaseModel):
    """Request model for DFD generation."""
    project_id: str = Field(..., description="Unique identifier for the project")
    session_id: Optional[str] = Field(None, description="Session identifier if available")
    query: Optional[str] = Field(..., description="Natural language query from the user")
    diagram_state: Dict[str, Any] = Field(None, description="Current state of the architecture diagram")

class DFDGenerationResponse(BaseModel):
    """Response model for DFD generation."""
    success: bool = Field(..., description="Whether the DFD generation was successful")
    message: str = Field(..., description="Status message")
    dfd_model: Optional[Dict[str, Any]] = Field(None, description="Generated DFD model data")
    visualization: Optional[Dict[str, Any]] = Field(None, description="Visualization data for rendering")
    threat_model_id: Optional[str] = Field(None, description="ID of the generated threat model")
    error: Optional[str] = Field(None, description="Error message if any")

class DFDElement(BaseModel):
    id: str
    type: str # e.g., 'Actor', 'Server', 'Datastore'
    label: str
    properties: Dict[str, Any] = {} # e.g., OS, isHardened
    boundary_id: Optional[str] = None

class DFDDataFlow(BaseModel):
    id: str
    source: str
    target: str
    label: str
    properties: Dict[str, Any] = {} # e.g., protocol, isEncrypted, data_details

class DFDBoundary(BaseModel):
    id: str
    label: str
    element_ids: List[str] # IDs of elements within this boundary

class DFDThreat(BaseModel):
    id: str # e.g., the STRIDE category + index or pytm SID
    description: str
    severity: str
    target_element_id: str # ID of the DFDElement or DFDDataFlow it applies to
    target_element_type: str # 'element' or 'dataflow'
    # Add other relevant threat info: condition, mitigations, etc. from pytm

class DFDResponse(BaseModel):
    threat_model_id: str = Field(..., description="Unique identifier for this generated threat model version")
    nodes: List[DFDElement]
    edges: List[DFDDataFlow]
    boundaries: List[DFDBoundary]
    threats: List[DFDThreat]
    generated_at: str = Field(..., description="ISO timestamp when the model was generated")

class DFDSwitchRequest(BaseModel):
    diagram_state: Optional[Dict[str, Any]] = Field(None, description="Current state of the architecture diagram")
    session_id: Optional[str] = Field(None, description="Session identifier if available")

class DFDGenerationStartedResponse(BaseModel):
    """Response model when DFD generation starts asynchronously."""
    message: str = "DFD generation process started."
    project_code: str
    detail: str = "The threat model is being generated in the background. Check the DFD pane or retrieve the model shortly."