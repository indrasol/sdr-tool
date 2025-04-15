from pydantic import BaseModel, Field
from typing import Dict, Optional, Any, List


class DesignRequest(BaseModel):
    """
    Model for design API requests that processes user queries.
    """
    project_id: str = Field(..., description="Unique identifier for the project")
    query: str = Field(..., description="Natural language query from the user")
    diagram_state: Optional[Dict[str, Any]] = Field(None, description="Current state of the architecture diagram")
    session_id: Optional[str] = Field(None, description="Session identifier if available")
    retry_mode: Optional[bool] = Field(None, description="Whether to retry the request")
    view_mode: Optional[str] = Field("AD", description="Current view mode (AD or DFD)")


class SaveProjectRequest(BaseModel):
    session_id: str
    diagram_state: Optional[Dict[str, Any]] = None
    project_code: Optional[str] = None