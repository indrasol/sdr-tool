from pydantic import BaseModel, Field
from typing import List, Dict, Any

class DesignGraph(BaseModel):
    """Request model carrying architecture graph used to derive data flow"""
    project_id: str = Field(..., description="Unique identifier for the project")
    nodes: List[Dict[str, Any]] = Field(default_factory=list, description="List of diagram nodes")
    edges: List[Dict[str, Any]] = Field(default_factory=list, description="List of diagram edges")

class DataFlowResponse(BaseModel):
    mermaid_code: str = Field(..., description="Generated Mermaid sequence diagram code") 