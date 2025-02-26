from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator
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

    # Model validator to standardize security_level values
    @model_validator(mode='after')
    def normalize_security_level(self):
        if self.security_level:
            self.security_level = self.security_level.lower()
            # Map similar values to our standard values
            security_level_map = {
                'hi': 'high', 'critical': 'high', 'maximum': 'high',
                'med': 'medium', 'moderate': 'medium', 'normal': 'medium',
                'lo': 'low', 'minimal': 'low', 'minor': 'low'
            }
            if self.security_level in security_level_map:
                self.security_level = security_level_map[self.security_level]
            
            # Ensure it's one of our expected values
            if self.security_level not in ['low', 'medium', 'high']:
                warnings.warn(f"Unexpected security_level value '{self.security_level}', defaulting to 'medium'")
                self.security_level = 'medium'
        return self

# --- GenericNodeProperties as a fallback ---
class GenericNodeProperties(BaseNodeProperties):
    """Generic properties to handle unrecognized node types"""
    properties_type: str = Field(
        "generic",
        description="Generic properties type for fallback"
    ) 
    
    # Add any extra fields with field name = value to support any additional properties
    def __init__(self, **data):
        # Get the fields defined in the model
        model_fields = self.model_fields.keys()
        
        # Extract known fields
        known_data = {k: v for k, v in data.items() if k in model_fields}
        
        # Store extra fields as field attributes
        self.extra_fields = {k: v for k, v in data.items() if k not in model_fields}
        
        super().__init__(**known_data)
    
    def dict(self, *args, **kwargs):
        # Get the dict representation from parent
        result = super().dict(*args, **kwargs)
        
        # Add any extra fields
        if hasattr(self, 'extra_fields'):
            for key, value in self.extra_fields.items():
                result[key] = value
                
        return result


class FirewallProperties(BaseNodeProperties):
    properties_type: str = Field("firewall")
    rules: List[str] = Field(
        default=[],  # Make rules optional with default empty list
        description="Firewall rule definitions",
        examples=["allow https from 0.0.0.0/0", "deny ssh except 10.0.0.0/8"]
    )
    log_retention_days: int = Field(
        default=30,  # Make it optional with default
        ge=1,
        le=365,
        description="Days to retain firewall logs"
    )
    
    # Add validator to handle string log_retention_days
    @field_validator("log_retention_days", mode="before")
    @classmethod
    def validate_log_retention_days(cls, v):
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return 30
        return v

class DatabaseProperties(BaseNodeProperties):
    properties_type: str = Field("database")
    encryption_type: Optional[str] = Field(
        default="both",
        description="Type of encryption (at-rest, in-transit, both, etc.)"
    )
    backup_schedule: Optional[str] = Field(
        default="daily",
        description="Backup schedule (daily, weekly, hourly)"
    )
    data_classification: Optional[str] = Field(
        default="confidential",
        description="Data classification level"
    )
    
    # Model validator to normalize values
    @model_validator(mode='after')
    def normalize_database_fields(self):
        # Normalize encryption_type
        if self.encryption_type:
            self.encryption_type = self.encryption_type.lower()
            if self.encryption_type not in ['at-rest', 'in-transit', 'both']:
                if 'rest' in self.encryption_type:
                    self.encryption_type = 'at-rest'
                elif 'transit' in self.encryption_type:
                    self.encryption_type = 'in-transit'
                else:
                    self.encryption_type = 'both'
        
        # Normalize backup_schedule
        if self.backup_schedule:
            self.backup_schedule = self.backup_schedule.lower()
            if self.backup_schedule not in ['daily', 'weekly', 'hourly']:
                if 'day' in self.backup_schedule:
                    self.backup_schedule = 'daily'
                elif 'week' in self.backup_schedule:
                    self.backup_schedule = 'weekly'
                elif 'hour' in self.backup_schedule:
                    self.backup_schedule = 'hourly'
                else:
                    self.backup_schedule = 'daily'
        
        # Normalize data_classification
        if self.data_classification:
            self.data_classification = self.data_classification.lower()
            
            # Map similar values to standard values
            classification_map = {
                'sensitive': 'confidential',
                'protected': 'confidential',
                'private': 'confidential',
                'internal': 'confidential',
                'classified': 'secret',
                'restricted': 'secret',
                'top-secret': 'secret',
                'public-facing': 'public',
                'unrestricted': 'public',
                'open': 'public'
            }
            
            if self.data_classification in classification_map:
                self.data_classification = classification_map[self.data_classification]
            
            # Final validation
            if self.data_classification not in ['public', 'confidential', 'secret']:
                warnings.warn(f"Unexpected data_classification value '{self.data_classification}', defaulting to 'confidential'")
                self.data_classification = 'confidential'
        
        return self

class APIProperties(BaseNodeProperties):
    properties_type: str = Field("api")
    authentication_required: bool = True
    rate_limiting_enabled: bool = True
    api_keys_rotation_days: int = Field(
        default=90,
        description="Days to rotate API keys"
    )
    
    # Add validator to handle string api_keys_rotation_days
    @field_validator("api_keys_rotation_days", mode="before")
    @classmethod
    def validate_api_keys_rotation_days(cls, v):
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return 90
        return v


class StorageProperties(BaseNodeProperties):
    properties_type: str = Field("storage")
    storage_type: Optional[str] = Field(
        default="object",
        description="Type of storage (object, block, file)"
    )
    redundancy_enabled: bool = True
    backup_retention_weeks: int = Field(
        default=4,
        description="Weeks to retain storage backups"
    )
    
    # Add validators to normalize storage_type and backup_retention_weeks
    @model_validator(mode='after')
    def normalize_storage_fields(self):
        # Normalize storage_type
        if self.storage_type:
            self.storage_type = self.storage_type.lower()
            if self.storage_type not in ['object', 'block', 'file']:
                # Try to map to standard types
                if 'obj' in self.storage_type:
                    self.storage_type = 'object'
                elif 'bloc' in self.storage_type:
                    self.storage_type = 'block'
                elif 'file' in self.storage_type or 'nas' in self.storage_type:
                    self.storage_type = 'file'
                else:
                    self.storage_type = 'object'  # Default
        return self
    
    @field_validator("backup_retention_weeks", mode="before")
    @classmethod
    def validate_backup_retention_weeks(cls, v):
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return 4
        return v
    

class NodeAction(BaseModel):
    action: str = Field(
        ...,
        description="Action to perform (add, modify, remove, connect)"
    )
    node_type: str = Field(
        ...,
        description="Type of the node"
    )
    node_id: str = Field(
        ...,
        description="ID of the node"
    )
    properties: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Type-specific configuration properties"
    )
    position: Union[List[float], Tuple[float, float]] = Field(
        ...,
        description="X,Y coordinates in diagram"
    )

    # Add validator to standardize action field
    @field_validator("action", mode="before")
    @classmethod
    def validate_action(cls, v):
        if isinstance(v, str):
            v = v.lower()
            # Map variations to standard actions
            action_map = {
                'create': 'add', 'insert': 'add', 'new': 'add',
                'update': 'modify', 'change': 'modify', 'edit': 'modify',
                'delete': 'remove', 'erase': 'remove',
                'link': 'connect', 'join': 'connect'
            }
            if v in action_map:
                return action_map[v]
            if v not in ['add', 'modify', 'remove', 'connect']:
                warnings.warn(f"Unexpected action value '{v}', defaulting to 'add'")
                return 'add'
        return v

    # Process the properties to match expected model structure
    @model_validator(mode='after')
    def process_properties(self):
        if not self.properties:
            # Create default properties based on node_type
            self.properties = {
                "properties_type": self.node_type if self.node_type in ["firewall", "database", "api", "storage"] else "generic",
                "node_type": self.node_type
            }
            return self
            
        # Ensure properties has properties_type
        if "properties_type" not in self.properties:
            # Try to determine properties_type from node_type
            if self.node_type in ["firewall", "database", "api", "storage"]:
                self.properties["properties_type"] = self.node_type
            else:
                self.properties["properties_type"] = "generic"
        
        # Ensure properties has node_type
        if "node_type" not in self.properties:
            self.properties["node_type"] = self.node_type
            
        return self

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
        description="List of node operations to perform"
    )
    edges: List[EdgeProperties] = Field(
        default=[],  # Make edges optional with default
        description="List of connections between nodes"
    )
    explanation: str = Field(
        ...,
        min_length=10,  # Reduced min length for flexibility
        description="Detailed security rationale"
    )
    references: List[str] = Field(
        default=[],
        description="Security standards referenced"
    )
    confidence: float = Field(
        default=0.8,  # Default confidence level
        description="Model confidence score"
    )
    security_messages: List[Dict[str, str]] = Field(
        default=[],
        description="List of security validation messages"
    )
    timestamp: Optional[str] = Field(
        default=None,
        description="Timestamp of the response"
    )
    
    # Add validator to handle confidence as string
    @field_validator("confidence", mode="before")
    @classmethod
    def validate_confidence(cls, v):
        if isinstance(v, str):
            try:
                return float(v)
            except ValueError:
                return 0.8
        return v
    
    # Add validator to convert security_messages from various formats
    @field_validator("security_messages", mode="before")
    @classmethod
    def validate_security_messages(cls, v):
        if isinstance(v, str):
            # If it's a string, convert to a list with a single message
            return [{"severity": "INFO", "message": v}]
        elif isinstance(v, list):
            # Process each item in the list
            result = []
            for item in v:
                if isinstance(item, str):
                    result.append({"severity": "INFO", "message": item})
                elif isinstance(item, dict):
                    if "severity" not in item or "message" not in item:
                        # Try to extract severity and message
                        severity = item.get("severity", item.get("level", "INFO"))
                        message = item.get("message", item.get("text", str(item)))
                        result.append({"severity": severity, "message": message})
                    else:
                        result.append(item)
            return result
        return v


class ExpertResponse(BaseModel):
    """
    Model for expert security advice response when node actions are not applicable.
    """
    timestamp: Optional[str] = Field(
        default=None,
        description="Timestamp of the response"
    )
    expert_message: str = Field(
        ...,
        min_length=10,  # Reduced for flexibility
        description="Expert security advice message"
    )
    justification: Union[str, List[str]] = Field(
        ...,
        description="Justification for the expert advice"
    )
    security_messages: Optional[List[Dict[str, str]]] = Field(
        default=None,
        description="Optional security messages"
    )
    recommended_next_steps: Optional[Union[str, List[str]]] = Field(
        default=None,
        description="Optional recommended next steps"
    )
    references: Optional[List[str]] = Field(
        default=None,
        description="Optional references"
    )
    confidence: Optional[float] = Field(
        default=None,
        description="Optional confidence score"
    )
    
    # Add validator to normalize justification format
    @field_validator("justification", mode="after")
    @classmethod
    def normalize_justification(cls, v):
        if isinstance(v, list):
            return "\n".join(v)
        return v
    
    # Add validator to handle recommended_next_steps format
    @field_validator("recommended_next_steps", mode="after")
    @classmethod
    def normalize_recommended_next_steps(cls, v):
        if isinstance(v, list):
            return "\n".join(v)
        return v

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