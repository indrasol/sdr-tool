from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union


class Threat(BaseModel):
    id: str  # Unique identifier for the threat
    name: List[str]  # e.g., ["Spoofing", "Tampering"]
    description: Optional[str] = None
    severity: str  # e.g., "Low", "Medium", "High"
    mitigations: List[str]  # List of mitigation strategies

class BuildThreatPrompt(BaseModel):
    threats: List[Threat]  # List of identified threats        threats: List[Threat]  # List of identified threats

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

class DFDThreat(BaseModel):
    id: str
    description: str
    severity: str
    target_element_id: Optional[str] = None
    target_element_type: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None

class DFDDataFlow(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None

class DFDResponse(BaseModel):
    threat_model_id: str
    nodes: List[DFDElement]
    edges: List[DFDDataFlow]
    boundaries: List[DFDBoundary]
    threats: List[DFDThreat]
    generated_at: Optional[str] = None
    performance: Optional[Dict[str, Any]] = None