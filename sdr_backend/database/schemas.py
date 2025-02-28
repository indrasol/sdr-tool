from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# Base Project Schema
class ProjectBase(BaseModel):
    name: str
    status: str = "None"
    user: str = "Current User"
    priority: str = "0-None"
    model_type: str = "Model With AI"
    description: Optional[str] = None
    tags: Optional[str] = None
    version: Optional[str] = "1.0"

# Schema for Project Creation
class ProjectCreate(ProjectBase):
    pass

# Schema for Project Update
class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    user: Optional[str] = None
    priority: Optional[str] = None
    model_type: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    version: Optional[str] = None

# Schema for Project Response
class Project(ProjectBase):
    project_id: str
    id: int
    created: datetime
    modified: datetime
    project_number: Optional[str] = None

    class Config:
        from_attributes = True