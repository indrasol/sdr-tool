from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union


class DFDElement(BaseModel):
    id: str
    type: str
    label: str
    properties: Optional[Dict[str, Any]] = None

class DFDEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None

class DFDBoundary(BaseModel):
    id: str
    label: str
    element_ids: List[str]
    properties: Optional[Dict[str, Any]] = None

class DFDModelResponse(BaseModel):
    elements: List[DFDElement]
    edges: List[DFDEdge]
    boundaries: List[DFDBoundary]

class ThreatItem(BaseModel):
    id: str
    description: str
    mitigation: str
    severity: Optional[str] = "MEDIUM"
    target_elements: Optional[List[str]] = None
    properties: Optional[Dict[str, Any]] = None

class ThreatsResponse(BaseModel):
    severity_counts: Dict[str, int] = Field(default_factory=lambda: {"HIGH": 0, "MEDIUM": 0, "LOW": 0})
    threats: List[ThreatItem]

class FullThreatModelResponse(BaseModel):
    threat_model_id: Optional[str] = None
    dfd_model: DFDModelResponse
    threats: ThreatsResponse
    generated_at: Optional[str] = None