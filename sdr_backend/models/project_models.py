from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from constants import ProjectPriority, ProjectStatus

class ProjectData(BaseModel):
    name: str
    tenant_id: int
    description: Optional[str] = None
    status: str = "Not Started"
    priority: Optional[str] = None
    created_date: Optional[date] = None
    due_date: Optional[date] = None
    creator: Optional[str] = None
    domain: Optional[str] = None
    template_type: Optional[str] = None
    imported_file: Optional[str] = None
    team_id: Optional[int] = None


class UpdateProjectData(BaseModel):
    name: Optional[str]
    project_code : str
    tenant_id: Optional[int]
    description: Optional[str] = None
    status: Optional[str] = "Not Started"
    priority: Optional[str] = None
    created_date: Optional[date] = None
    due_date: Optional[date] = None
    creator: Optional[str] = None
    domain: Optional[str] = None
    team_id: Optional[int] = None

class FetchProjectsRequest(BaseModel):
    tenant_id: int
    status: Optional[ProjectStatus] = 'ALL',  # Enum for status filtering
    priority: Optional[ProjectPriority] = 'ALL',  # Enum for priority filtering
    sort_by: Optional[str] = "created_date",
    sort_order: Optional[str] = "desc",
    limit: int = 10,
    offset: int = 0,