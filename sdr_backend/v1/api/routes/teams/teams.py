import asyncio
from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Path, Query
from fastapi.responses import JSONResponse
from services.auth_handler import verify_token
from services.supabase_manager import SupabaseManager
from typing import Optional, Dict, Any, List
from models.team_models import TeamData, TeamMemberData, UpdateTeamData, UpdateTeamMemberData
from utils.logger import log_info
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from datetime import datetime, timezone
import logging

router = APIRouter()

# Initialize SupabaseManager
supabase_manager = SupabaseManager()

# Set up structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [User:%(user_id)s Team:%(team_id)s] - %(message)s'
)
logger = logging.getLogger(__name__)

# Create a new team
@router.post("/teams")
async def create_team(
    team: TeamData,
    current_user: dict = Depends(verify_token)
):
    """
    Create a new team for the authenticated user under a tenant.

    Args:
        team: Team data from the request body.
        current_user: Authenticated user details from token.

    Returns:
        dict: Team details

    Raises:
        HTTPException: For authorization or creation errors.
    """
    log_info(f"Creating team: {team.name} for user: {current_user['id']}")

    # Check Tenant user access
    supabase = get_supabase_client()
    check_tenant_access = lambda: supabase.from_("user_tenant_association").select("tenant_id").eq("user_id", current_user["id"]).execute()
    tenant_response = await safe_supabase_operation(check_tenant_access, "Failed to verify tenant access")

    # Normalize tenant IDs to strings for reliable comparison
    user_tenant_ids = {str(item.get("tenant_id")) for item in tenant_response.data}
    team_tenant_id = str(team.tenant_id)

    if team_tenant_id not in user_tenant_ids:
        log_info(
            f"Tenant authorization failed – team_tenant_id={team_tenant_id}, user_tenant_ids={user_tenant_ids}"
        )
        raise HTTPException(status_code=403, detail="Not authorized for this tenant")

    try:
        team_id = await supabase_manager.create_team(
            user_id=current_user["id"],
            name=team.name,
            tenant_id=team.tenant_id,
            description=team.description,
            is_private=team.is_private,
            avatar_url=team.avatar_url
        )
        
        # Fetch the created team to return full details
        created_team = await supabase_manager.get_team(team_id, current_user["id"])
        
        return created_team
    except HTTPException as he:
        raise he
    except Exception as e:
        log_info(f"Error creating team: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create team: {str(e)}")

# Get all teams for the user
@router.get("/teams")
async def get_teams(
    tenant_id: int,
    include_private: bool = False,
    current_user: dict = Depends(verify_token)
) -> Dict[str, Any]:
    """
    Retrieve teams for the authenticated user in a tenant.
    """
    try:
        # If include_private is true, get all teams the user is a member of in the tenant
        if include_private:
            teams = await supabase_manager.get_user_teams(
                user_id=current_user["id"],
                tenant_id=tenant_id
            )
        else:
            # Otherwise get all public teams in the tenant
            teams = await supabase_manager.get_tenant_teams(
                tenant_id=tenant_id,
                user_id=current_user["id"],
                include_private=include_private
            )
        
        return {"teams": teams}
    except Exception as e:
        log_info(f"Error retrieving teams: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve teams: {str(e)}")

# Get a specific team
@router.get("/teams/{team_id}")
async def get_team(
    team_id: int = Path(..., description="The ID of the team to retrieve"),
    current_user: dict = Depends(verify_token)
):
    """Retrieve a specific team by its ID."""
    try:
        team = await supabase_manager.get_team(team_id, current_user["id"])
        return team
    except HTTPException as he:
        raise he
    except Exception as e:
        log_info(f"Error retrieving team: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve team: {str(e)}")

# Update a team
@router.put("/teams/{team_id}")
async def update_team(
    update_data: UpdateTeamData,
    team_id: int = Path(..., description="The ID of the team to update"),
    current_user: dict = Depends(verify_token)
):
    """Update a team's information."""
    try:
        # Convert Pydantic model to dict, excluding None values
        update_dict = update_data.dict(exclude_unset=True)
        if not update_dict:
            raise HTTPException(status_code=400, detail="No update data provided")
            
        updated_team = await supabase_manager.update_team(
            team_id=team_id,
            user_id=current_user["id"],
            update_data=update_dict
        )
        
        return updated_team
    except HTTPException as he:
        raise he
    except Exception as e:
        log_info(f"Error updating team: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update team: {str(e)}")

# Delete a team
@router.delete("/teams/{team_id}")
async def delete_team(
    team_id: int = Path(..., description="The ID of the team to delete"),
    current_user: dict = Depends(verify_token)
):
    """Delete a team (only the owner can do this)."""
    try:
        await supabase_manager.delete_team(team_id, current_user["id"])
        return {"message": "Team deleted successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        log_info(f"Error deleting team: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete team: {str(e)}")

# Get team members
@router.get("/teams/{team_id}/members")
async def get_team_members(
    team_id: int = Path(..., description="The ID of the team"),
    current_user: dict = Depends(verify_token)
):
    """Get all members of a team."""
    try:
        members = await supabase_manager.get_team_members(team_id, current_user["id"])
        return {"members": members}
    except HTTPException as he:
        raise he
    except Exception as e:
        log_info(f"Error retrieving team members: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve team members: {str(e)}")

# Add a team member
@router.post("/teams/{team_id}/members")
async def add_team_member(
    member_data: TeamMemberData,
    team_id: int = Path(..., description="The ID of the team"),
    current_user: dict = Depends(verify_token)
):
    """Add a user to a team."""
    try:
        # Validate team_id in path matches team_id in body
        if member_data.team_id != team_id:
            raise HTTPException(status_code=400, detail="Team ID mismatch between path and body")
            
        member = await supabase_manager.add_team_member(
            team_id=team_id,
            user_id=current_user["id"],
            member_id=member_data.user_id,
            role=member_data.role,
            permissions=member_data.permissions
        )
        
        return member
    except HTTPException as he:
        raise he
    except Exception as e:
        log_info(f"Error adding team member: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add team member: {str(e)}")

# Update a team member
@router.put("/teams/{team_id}/members/{member_id}")
async def update_team_member(
    update_data: UpdateTeamMemberData,
    team_id: int = Path(..., description="The ID of the team"),
    member_id: str = Path(..., description="The ID of the member to update"),
    current_user: dict = Depends(verify_token)
):
    """Update a team member's role or permissions."""
    try:
        # Convert Pydantic model to dict, excluding None values
        update_dict = update_data.dict(exclude_unset=True)
        if not update_dict:
            raise HTTPException(status_code=400, detail="No update data provided")
            
        updated_member = await supabase_manager.update_team_member(
            team_id=team_id,
            user_id=current_user["id"],
            member_id=member_id,
            update_data=update_dict
        )
        
        return updated_member
    except HTTPException as he:
        raise he
    except Exception as e:
        log_info(f"Error updating team member: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update team member: {str(e)}")

# Remove a team member
@router.delete("/teams/{team_id}/members/{member_id}")
async def remove_team_member(
    team_id: int = Path(..., description="The ID of the team"),
    member_id: str = Path(..., description="The ID of the member to remove"),
    current_user: dict = Depends(verify_token)
):
    """Remove a user from a team."""
    try:
        await supabase_manager.remove_team_member(
            team_id=team_id,
            user_id=current_user["id"],
            member_id=member_id
        )
        
        return {"message": "Member removed successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        log_info(f"Error removing team member: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to remove team member: {str(e)}") 