from pydantic import BaseModel, Field
from typing import Dict, Optional, Any, List


class TeamData(BaseModel):
    """Model for creating a new team"""
    name: str
    tenant_id: int
    description: Optional[str] = None
    is_private: Optional[bool] = False
    avatar_url: Optional[str] = None


class TeamMemberData(BaseModel):
    """Model for adding a team member"""
    team_id: int
    user_id: str
    role: str = "member"  # owner, admin, member, guest
    permissions: Dict[str, bool] = Field(default_factory=lambda: {"view": True, "edit": False, "admin": False})


class UpdateTeamData(BaseModel):
    """Model for updating team information"""
    name: Optional[str] = None
    description: Optional[str] = None
    is_private: Optional[bool] = None
    avatar_url: Optional[str] = None


class UpdateTeamMemberData(BaseModel):
    """Model for updating team member information"""
    role: Optional[str] = None  # owner, admin, member, guest
    permissions: Optional[Dict[str, bool]] = None 