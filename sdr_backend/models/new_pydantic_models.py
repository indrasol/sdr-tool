from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class UserRequest(BaseModel):
    query: str 
    session_id: str 
    project_id: str

# Enums for fixed values
class ResponseType(str, Enum):
    architecture = "architecture"
    expert = "expert"
    error = "error"
    clarification = "clarification"

class Status(str, Enum):
    success = "success"
    warning = "warning"
    error = "error"

class Severity(str, Enum):
    low = "LOW"
    medium = "MEDIUM"
    high = "HIGH"
    critical = "CRITICAL"

# Security validation message
class SecurityMessage(BaseModel):
    severity: Severity
    message: str
    affected_components: Optional[List[str]] = None
    recommendation: Optional[str] = None

# Base model with common fields
class BaseResponse(BaseModel):
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.now)
    response_type: ResponseType
    status: Status = Status.success

# Node model for diagram elements
class Node(BaseModel):
    id: str
    name: str
    type: Optional[str] = None
    properties: Optional[Dict[str, str]] = None

# PartialNode for updates (allows updating specific fields)
class PartialNode(BaseModel):
    id: str
    name: Optional[str] = None
    type: Optional[str] = None
    properties: Optional[Dict[str, str]] = None

# Edge model for connections between nodes
class Edge(BaseModel):
    id: Optional[str] = None
    source: str
    target: str
    type: Optional[str] = None
    label: Optional[str] = None
    properties: Optional[Dict[str, str]] = None

# PartialEdge for updates (allows updating specific fields)
class PartialEdge(BaseModel):
    id: str
    source: Optional[str] = None
    target: Optional[str] = None
    type: Optional[str] = None
    label: Optional[str] = None
    properties: Optional[Dict[str, str]] = None

# ArchitectureResponse for diagram updates
class ArchitectureResponse(BaseResponse):
    response_type: ResponseType = ResponseType.architecture
    nodes_to_add: List[Node] = []
    nodes_to_update: List[PartialNode] = []
    nodes_to_remove: List[str] = []
    edges_to_add: List[Edge] = []
    edges_to_update: List[PartialEdge] = []
    edges_to_remove: List[str] = []
    explanation: Optional[str] = None
    security_messages: List[SecurityMessage] = []

# ExpertResponse for detailed expert content
class ExpertResponse(BaseResponse):
    response_type: ResponseType = ResponseType.expert
    title: Optional[str] = None
    content: str
    sections: Optional[List[Dict[str, str]]] = None
    references: Optional[List[str]] = None

# ErrorResponse for error handling
class ErrorResponse(BaseResponse):
    response_type: ResponseType = ResponseType.error
    status: Status = Status.error
    error_message: str
    details: Optional[Dict[str, Any]] = None

# ClarificationResponse for requesting more input
class ClarificationResponse(BaseResponse):
    response_type: ResponseType = ResponseType.clarification
    status: Status = Status.warning
    clarification_needed: str
    suggestions: Optional[List[str]] = None