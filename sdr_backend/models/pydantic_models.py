from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Literal, Optional, Tuple, Union, Dict, Any
import warnings
from datetime import datetime
class NodeContext(BaseModel):
    id: str
    type: str
    properties: dict
    position: Union[List[float], Tuple[float, float]]

class EdgeContext(BaseModel):
    id: str
    source: str
    target: str
    type: str

class DiagramContext(BaseModel):
    nodes: List[NodeContext] = []
    edges: List[EdgeContext] = []
    version: int = 1

class UserRequest(BaseModel):
    user_input: str = Field(
        ...,
        min_length=2,
        max_length=1000,
        description="User's natural language query",
        examples=["How should I secure my API gateway?"]
    )
    diagram_context: DiagramContext = Field(
        ...,
        description="Current state of the architecture diagram"
    )
    project_id: Optional[str] = Field(
        None,
        pattern=r"^proj-\d+$",
        description="Optional project identifier"
    )
    compliance_standards: List[str] = Field(
        [],
        description="Applicable compliance requirements",
        examples=["GDPR"]
    )

class BaseNodeProperties(BaseModel):
    """Base properties with common security attributes"""
    properties_type: str = Field( 
        ...,
        description="Type of the node",
        # discriminator=True
    )
    node_type: str = Field( 
        ...,
        description="Type of the node"
    )
    security_level: Literal["low", "medium", "high"] = "medium"
    encryption: bool = False
    access_control: List[str] = Field(
        default=["admin"],
        description="List of roles with access",
        examples=[["admin", "auditor"]]
    )
    compliance: List[str] = Field(
        default=[],
        description="Applicable compliance standards",
        examples=["GDPR", "HIPAA", "PCI-DSS"]
    )

# --- GenericNodeProperties as a fallback ---
class GenericNodeProperties(BaseNodeProperties):
    """Generic properties to handle unrecognized node types"""
    properties_type: Literal["generic"] = Field("generic") # Or you can use "unrecognized" or similar


class FirewallProperties(BaseNodeProperties):
    properties_type: Literal["firewall"] = Field("firewall")
    rules: List[str] = Field(
        ...,
        description="Firewall rule definitions",
        examples=["allow https from 0.0.0.0/0", "deny ssh except 10.0.0.0/8"]
    )
    log_retention_days: int = Field(
        30,
        ge=1,
        le=365,
        description="Days to retain firewall logs"
    )

class DatabaseProperties(BaseNodeProperties):
    properties_type: Literal["database"] = Field("database")
    # node_type: Literal["database"] = Field(
    #     "database"
    # )
    encryption_type: Literal["at-rest", "in-transit", "both"] = "both"
    backup_schedule: str = Field(
        "daily",
        pattern=r"^(daily|weekly|hourly)$",
        description="Backup schedule (daily, weekly, hourly)"
    )
    data_classification: Literal["public", "confidential", "secret"] = "confidential"

class APIProperties(BaseNodeProperties):
    properties_type: Literal["api"] = Field("api")
    authentication_required: bool = True
    rate_limiting_enabled: bool = True
    api_keys_rotation_days: int = Field(
        90,
        ge=30,
        le=365,
        description="Days to rotate API keys"
    )


class StorageProperties(BaseNodeProperties):
    properties_type: Literal["storage"] = Field("storage")
    storage_type: Literal["object", "block", "file"] = "object"
    redundancy_enabled: bool = True
    backup_retention_weeks: int = Field(
        4,
        ge=1,
        le=52,
        description="Weeks to retain storage backups"
    )

class NodeAction(BaseModel):
    action: Literal["add", "modify", "remove", "connect"]
    node_type: str = Field(
        ...,
        description="Type of the node"
    )
    node_id: str = Field(
        ...,
        pattern=r"^(node|connection)-\d+$",
        examples=["node-1", "node-42", "connection-1", "connection-2"]
    )
    properties: Union[
        FirewallProperties, 
        DatabaseProperties, 
        APIProperties, 
        StorageProperties, 
        GenericNodeProperties
        ] = Field(
        
        ...,
        description="Type-specific configuration properties",
        discriminator="properties_type"
        )
    # properties: BaseNodeProperties = Field(
    #     ...,
    #     description="Type-specific configuration properties",
    #     discriminator="properties_type" 
    #     )
    position: Tuple[float, float] = Field(
        ...,
        description="X,Y coordinates in diagram",
        examples=[[10.5, 20.3], [100.0, 50.0]]
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{
                "action": "add",
                "node_type": "firewall",
                "node_id": "node-1",
                "properties": {
                    "properties_type": "firewall",
                    "node_type": "firewall", 
                    "security_level": "high",
                    "encryption": True,
                    "access_control": ["admin", "security"],
                    "compliance": ["PCI-DSS"],
                    "rules": ["allow https from 0.0.0.0/0"],
                    "log_retention_days": 90
                },
                "position": [10.5, 20.3]
            }, {
                "action": "add",
                "node_type": "database",
                "node_id": "node-2",
                "properties": {
                    "properties_type": "database", 
                    "node_type": "database", 
                    "security_level": "high",
                    "encryption": True,
                    "access_control": ["dba"],
                    "compliance": ["GDPR"],
                    "encryption_type": "both",
                    "backup_schedule": "hourly",
                    "data_classification": "confidential"
                },
                "position": [50.0, 100.0]
            }]
        }
    )

    @field_validator("properties", mode="after")
    @classmethod
    def validate_properties(cls, value: BaseNodeProperties, info):
        properties_type = value.properties_type

        # --- Removed strict isinstance checks for specific types ---
        if properties_type in ["firewall", "database", "api", "storage"]:
            pass # Basic validation by Pydantic will still happen for these types

        elif properties_type == "generic" or properties_type == "unrecognized": # Example for generic or unrecognized types
            warnings.warn( # Improved warning message
                f"Warning: Processing with generic properties for node type: '{value.node_type}' and properties_type: '{properties_type}'. "
                "Specific property validation is skipped. Ensure properties are appropriate for this node type."
            )
        else: # For completely unknown types, still issue a warning, but allow processing as BaseNodeProperties
            warnings.warn( # Improved warning message for truly unrecognized types
                f"Warning: Unrecognized properties_type: '{properties_type}' for node type: '{value.node_type}'. "
                "Applying basic validation (BaseNodeProperties only). Consider extending system to handle this type."
            )
        return value

class EdgeProperties(BaseModel):
    """Properties for edge connections"""
    edge_type: str = Field(..., description="Type of connection (e.g., 'encrypted', 'secure_channel')")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    label: Optional[str] = Field(None, description="Connection label")
    properties: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional edge properties like protocol, encryption"
    )

class ArchitectureResponse(BaseModel):
    nodes: List[NodeAction] = Field(
        ...,
        max_items=10,
        description="List of node operations to perform"
    )
    edges: List[EdgeProperties] = Field(
        ...,
        max_items=10,
        description="List of connections between nodes"
    )
    explanation: str = Field(
        ...,
        min_length=50,
        max_length=1000,
        description="Detailed security rationale"
    )
    references: List[str] = Field(
        default=[],
        description="Security standards referenced",
        examples=["OWASP ASVS 4.0.3", "NIST SP 800-53"]
    )
    confidence: float = Field(
        ...,
        ge=0,
        le=1,
        description="Model confidence score",
        examples=[0.85, 0.92]
    )
    security_messages: List[Dict[str, str]] = Field( # Renamed from security_validation_errors to security_messages
        default=[],
        description="List of security validation messages (errors and warnings/info)"
    )
    timestamp: Optional[str] = Field(
        None,
        description="Timestamp of the response"
    )
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "timestamp": "2024-01-01 12:00:00Z",
                "nodes": [{
                    "action": "add",
                    "node_type": "firewall",
                    "node_id": "node-1",
                    "properties": {
                        "properties_type": "firewall", 
                        "node_type": "firewall", 
                        "security_level": "high",
                        "encryption": True,
                        "access_control": ["admin", "security"],
                        "compliance": ["PCI-DSS"],
                        "rules": ["allow https from 0.0.0.0/0"],
                        "log_retention_days": 90
                    },
                    "position": [10.5, 20.3]
                }, {
                    "action": "add",
                    "node_type": "database",
                    "node_id": "node-2",
                    "properties": {
                        "properties_type": "database", 
                        "node_type": "database", 
                        "security_level": "high",
                        "encryption": True,
                        "access_control": ["dba"],
                        "compliance": ["GDPR"],
                        "encryption_type": "both",
                        "backup_schedule": "hourly",
                        "data_classification": "confidential"
                    },
                    "position": [50.0, 100.0]
                }],
                "edges": [{
                    "edge_type": "encrypted",
                    "source": "node-1",
                    "target": "node-2",
                    "label": "HTTPS/TLS",
                    "properties": {
                        "protocol": "HTTPS",
                        "encryption": "TLS 1.3",
                        "security_controls": ["mTLS", "certificate_pinning"]
                    }
                }],
                "explanation": "Added perimeter firewall and secure database...",
                "references": ["NIST SP 800-41", "OWASP ASVS 4.0.3"],
                "confidence": 0.92,
                "security_messages": [
                    {
                        "severity": "CRITICAL", 
                        "message": "Firewall 'node-1' log retention must be at least 30 days for 'high' security."
                    },
                    {
                        "severity": "LOW", 
                        "message": "Consider adding a description to API 'node-3'."
                    }
                ]
            }
        }
    )



class ExpertResponse(BaseModel): # Define ExpertResponse model
    """
    Model for expert security advice response when node actions are not applicable.
    """
    timestamp: Optional[str] = Field(
        None,
        description="Timestamp of the response"
    )
    expert_message: str = Field(
        ...,
        min_length=50,
        max_length=2000,
        description="Expert security advice message in response to user query."
    )
    justification: str = Field(
        ...,
        min_length=50,
        max_length=2000,
        description="Justification for the expert advice"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "expert_message": "Common API security threats include injection attacks, broken authentication, and data breaches. To mitigate these, implement input validation, strong authentication mechanisms, and encryption.",
                "justification": "These threats are consistently ranked as top API vulnerabilities by OWASP and other security organizations. Input validation prevents injection attacks by ensuring data integrity. Strong authentication and encryption protect against broken authentication and data breaches, respectively. Refer to OWASP API Security Top 10 for more details."
            }
        }
    )

class SecurityAnalysisResponse(BaseModel):
    identified_gaps: List[str] = Field(
        ...,
        description="List of identified security gaps"
    )
    recommendations: List[str] = Field(
        ...,
        description="List of recommendations to address identified gaps"
    )

class ReportUpdate(BaseModel):
    content: str = Field(..., description="Updated markdown content for the report")
    editor: Optional[str] = Field(None, description="Name of the person making the edit")
    edit_comment: Optional[str] = Field(None, description="Comment about the changes made")

class ReportMetadata(BaseModel):
    last_modified: datetime
    version: int
    editor: Optional[str]
    edit_comment: Optional[str]