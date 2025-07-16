import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from services.auth_handler import verify_token
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from services.supabase_manager import SupabaseManager
from datetime import datetime, timedelta

router = APIRouter()

# Set up structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [User:%(user_id)s Team:%(team_id)s Tenant:%(tenant_id)s] - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize SupabaseManager
supabase_manager = SupabaseManager()

@router.get("/dashboard/recent-reports")
async def get_recent_reports(
    team_id: int = Query(..., description="Team ID to get reports for"),
    tenant_id: int = Query(..., description="Tenant ID for authorization and filtering"),
    current_user: dict = Depends(verify_token)
) -> Dict[str, Any]:
    """
    Get recent reports from the last 5 days.
    
    This endpoint fetches reports created in the last 5 days for projects
    belonging to the specified team.
    
    Args:
        team_id: The ID of the team to get reports for (required)
        tenant_id: The ID of the tenant (required)
        current_user: The authenticated user from the token
        
    Returns:
        Dict with a list of recent reports containing report name and created date
        
    Raises:
        HTTPException: For authorization or database errors
    """
    # Create logging context
    log_extra = {
        'user_id': current_user["id"],
        'team_id': team_id,
        'tenant_id': tenant_id
    }
    
    logger.info("Fetching recent reports", extra=log_extra)
    
    try:
        # Check tenant access (standard pattern across endpoints)
        supabase = get_supabase_client()
        check_tenant_access = lambda: supabase.from_("user_tenant_association").select("tenant_id").eq("user_id", current_user["id"]).execute()
        tenant_response = await safe_supabase_operation(check_tenant_access, "Failed to verify tenant access")
        
        # Normalize tenant IDs to strings for reliable comparison (Supabase may return ints or strings)
        user_tenant_ids = {str(item.get("tenant_id")) for item in tenant_response.data}
        req_tenant_id = str(tenant_id)
        
        if req_tenant_id not in user_tenant_ids:
            logger.warning(f"Tenant authorization failed - tenant_id={tenant_id}", extra=log_extra)
            raise HTTPException(status_code=403, detail="Not authorized for this tenant")
        
        # Check team access (user must be a member or admin of the team)
        check_team_access = lambda: supabase.from_("team_members").select("team_id").eq("user_id", current_user["id"]).eq("team_id", team_id).execute()
        team_response = await safe_supabase_operation(check_team_access, "Failed to verify team access")
        
        if not team_response.data:
            # Try checking if user is tenant admin (can access any team in tenant)
            check_admin = lambda: supabase.from_("team_members").select("role").eq("user_id", current_user["id"]).eq("role", "admin").execute()
            admin_response = await safe_supabase_operation(check_admin, "Failed to verify admin status")
            
            is_admin = len(admin_response.data) > 0
            
            if not is_admin:
                logger.warning(f"Team authorization failed - team_id={team_id}", extra=log_extra)
                raise HTTPException(status_code=403, detail="Not authorized for this team")
        
        # First, get projects for this team and tenant
        get_team_projects = lambda: supabase.from_("projects").select("project_code").eq("tenant_id", tenant_id).eq("team_id", team_id).execute()
        projects_response = await safe_supabase_operation(get_team_projects, "Failed to fetch team projects")
        
        # Calculate date 5 days ago
        five_days_ago = datetime.utcnow() - timedelta(days=5)
        five_days_ago_iso = five_days_ago.isoformat()
        
        # Get reports for all team projects from the last 5 days
        recent_reports = []
        project_codes = [project["project_code"] for project in projects_response.data]
        
        for project_code in project_codes:
            # Get reports for this project created in the last 5 days
            get_recent_reports = lambda: supabase.from_("reports").select("id,name,created_at,project_code").eq("project_code", project_code).gte("created_at", five_days_ago_iso).order("created_at", desc=True).execute()
            reports_response = await safe_supabase_operation(get_recent_reports, f"Failed to fetch recent reports for project {project_code}")
            
            if reports_response.data:
                recent_reports.extend(reports_response.data)
        
        # Sort all reports by created_at (newest first)
        recent_reports.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Format the response
        response = {
            "success": True,
            "recent_reports": recent_reports
        }
        
        logger.info(f"Successfully fetched {len(recent_reports)} recent reports", extra=log_extra)
        return response
    
    except HTTPException:
        # Re-raise HTTP exceptions directly
        raise
    except Exception as e:
        logger.error(f"Error fetching recent reports: {str(e)}", extra=log_extra)
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent reports: {str(e)}") 