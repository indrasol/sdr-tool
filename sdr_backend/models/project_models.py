from pydantic import BaseModel
from typing import Optional
from datetime import date

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