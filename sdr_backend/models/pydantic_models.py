from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Literal, Optional, Tuple, Union


class BaseNodeProperties(BaseModel):
    """Base properties with common security attributes"""
    node_type: Literal["firewall", "database", "api", "storage"]
    # node_type: Literal["firewall", "database"] = Field(
    #     ...,
    #     description="Type of the node",
    #     discriminator=True
    # )
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

class FirewallProperties(BaseNodeProperties):
    node_type: Literal["firewall"] = Field("firewall")
    # node_type: Literal["firewall"] = Field(
    #     "firewall"
    # )
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
    node_type: Literal["database"] = Field("database")
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
    node_type: Literal["api"] = Field("api")
    authentication_required: bool = True
    rate_limiting_enabled: bool = True
    api_keys_rotation_days: int = Field(
        90,
        ge=30,
        le=365,
        description="Days to rotate API keys"
    )


class StorageProperties(BaseNodeProperties):
    node_type: Literal["storage"] = Field("storage")
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
    node_type: Literal["firewall", "database", "api", "storage"]
    node_id: str = Field(
        ...,
        pattern=r"^node-\d+$",
        examples=["node-1", "node-42"]
    )
    properties: Union[FirewallProperties, DatabaseProperties, APIProperties, StorageProperties] = Field(
        ...,
        description="Type-specific configuration properties",
        # discriminator="node_type"
        )
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
        node_type = info.data.get("node_type")
        
        if node_type == "firewall":
            if not isinstance(value, FirewallProperties):
                raise ValueError("Firewall nodes require firewall-specific properties")
            if len(value.rules) == 0:
                raise ValueError("Firewall must have at least one rule")
                
        elif node_type == "database":
            if not isinstance(value, DatabaseProperties):
                raise ValueError("Database nodes require database-specific properties")
            if value.encryption_type not in ["at-rest", "both"]:
                raise ValueError("Database requires at-rest encryption")
        
        return value


class ArchitectureResponse(BaseModel):
    actions: List[NodeAction] = Field(
        ...,
        max_items=10,
        description="List of node operations to perform"
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
    security_messages: List[str] = Field( # Renamed from security_validation_errors to security_messages
        default=[],
        description="List of security validation messages (errors and warnings/info)"
    )
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "actions": [{
                    "action": "add",
                    "node_type": "firewall",
                    "node_id": "node-1",
                    "properties": {
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
                "explanation": "Added perimeter firewall and secure database...",
                "references": ["NIST SP 800-41", "OWASP ASVS 4.0.3"],
                "confidence": 0.92,
                "security_messages": ["Severity: CRITICAL - Firewall 'node-1' log retention must be at least 30 days for 'high' security.", "Severity: LOW - Consider adding a description to API 'node-3'."] # Example with both error and warning
            }
        }
    )


class NodeContext(BaseModel):
    id: str
    type: Literal["firewall", "database", "api", "storage"]
    properties: dict
    position: Tuple[float, float]

class DiagramContext(BaseModel):
    nodes: List[NodeContext] = []
    edges: List[Tuple[str, str]] = []
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