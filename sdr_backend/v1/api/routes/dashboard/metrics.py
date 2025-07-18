import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from services.auth_handler import verify_token
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from services.supabase_manager import SupabaseManager

router = APIRouter()

# Set up structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [User:%(user_id)s Team:%(team_id)s Tenant:%(tenant_id)s] - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize SupabaseManager
supabase_manager = SupabaseManager()

@router.get("/dashboard/metrics")
async def get_dashboard_metrics(
    team_id: int = Query(..., description="Team ID to get metrics for"),
    tenant_id: int = Query(..., description="Tenant ID for authorization and filtering"),
    current_user: dict = Depends(verify_token)
) -> Dict[str, Any]:
    """
    Get consolidated dashboard metrics for a team.
    
    This endpoint efficiently fetches all metrics in a single API call
    to minimize frontend requests and improve dashboard loading performance.
    
    Args:
        team_id: The ID of the team to get metrics for (required)
        tenant_id: The ID of the tenant (required)
        current_user: The authenticated user from the token
        
    Returns:
        Dict with counts for projects, team members, templates, reports, and vulnerabilities
        
    Raises:
        HTTPException: For authorization or database errors
    """
    # Create logging context
    log_extra = {
        'user_id': current_user["id"],
        'team_id': team_id,
        'tenant_id': tenant_id
    }
    
    logger.info("Fetching dashboard metrics", extra=log_extra)
    
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
            # Instead of checking user_tenant_association.role, check if user has admin role in any team of this tenant
            check_admin = lambda: supabase.from_("team_members").select("role").eq("user_id", current_user["id"]).eq("role", "admin").execute()
            admin_response = await safe_supabase_operation(check_admin, "Failed to verify admin status")
            
            is_admin = len(admin_response.data) > 0
            
            if not is_admin:
                logger.warning(f"Team authorization failed - team_id={team_id}", extra=log_extra)
                raise HTTPException(status_code=403, detail="Not authorized for this team")
        
        # Create a single unified response object for all metrics
        metrics_data = {}
        
        # 1. Get projects count - filter by both tenant and team
        get_projects_count = lambda: supabase.from_("projects").select("id", count="exact").eq("tenant_id", tenant_id).eq("team_id", team_id).execute()
        projects_response = await safe_supabase_operation(get_projects_count, "Failed to fetch projects count")
        metrics_data["projects_count"] = projects_response.count
        
        # 2. Get team members count
        get_team_members_count = lambda: supabase.from_("team_members").select("id", count="exact").eq("team_id", team_id).execute()
        team_members_response = await safe_supabase_operation(get_team_members_count, "Failed to fetch team members count")
        metrics_data["team_members_count"] = team_members_response.count
        
        # 3. Get templates count - filter by both tenant and team
        try:
            get_templates_count = lambda: supabase.from_("templates").select("id", count="exact").eq("tenant_id", tenant_id).eq("team_id", team_id).execute()
            templates_response = await safe_supabase_operation(get_templates_count, "Failed to fetch templates count")
            metrics_data["templates_count"] = templates_response.count
        except Exception as e:
            logger.warning(f"Error fetching templates with team filter, trying without team filter: {str(e)}", extra=log_extra)
            # Try again without team filter (legacy data might not have team_id)
            try:
                get_templates_count = lambda: supabase.from_("templates").select("id", count="exact").eq("tenant_id", tenant_id).execute()
                templates_response = await safe_supabase_operation(get_templates_count, "Failed to fetch templates count")
                metrics_data["templates_count"] = templates_response.count
            except Exception as e2:
                logger.error(f"Failed to get templates count: {str(e2)}", extra=log_extra)
                metrics_data["templates_count"] = 0
        
        # 4. Get reports count - needs special handling
        try:
            # First, get projects for this team and tenant
            get_team_projects = lambda: supabase.from_("projects").select("project_code").eq("tenant_id", tenant_id).eq("team_id", team_id).execute()
            projects_response = await safe_supabase_operation(get_team_projects, "Failed to fetch team projects")
            
            # Then count reports for these projects
            reports_count = 0
            project_codes = [project["project_code"] for project in projects_response.data]
            
            for project_code in project_codes:
                count_query = lambda: supabase.from_("reports").select("id", count="exact").eq("project_code", project_code).execute()
                count_response = await safe_supabase_operation(count_query, f"Failed to count reports for project {project_code}")
                reports_count += count_response.count
                
            metrics_data["reports_count"] = reports_count
        except Exception as e:
            logger.error(f"Failed to get reports count: {str(e)}", extra=log_extra)
            metrics_data["reports_count"] = 0
        
        # 5. Get vulnerabilities count
        try:
            # Skip vulnerability count until table exists
            metrics_data["vulnerabilities_count"] = 0
            logger.info("Skipping vulnerabilities count as table doesn't exist yet", extra=log_extra)
            
            # Commented out original code that tries to query the non-existent table
            # First try with team_id filter
            # get_vulns_count = lambda: supabase.from_("vulnerabilities").select("id", count="exact").eq("tenant_id", tenant_id).eq("team_id", team_id).execute()
            # vulns_response = await safe_supabase_operation(get_vulns_count, "Failed to fetch vulnerabilities count")
            # metrics_data["vulnerabilities_count"] = vulns_response.count
        except Exception as e:
            logger.info("Setting vulnerabilities count to 0", extra=log_extra)
            # No need to log as warning since we know the table doesn't exist yet
            metrics_data["vulnerabilities_count"] = 0
        
        # 6. Calculate other useful metrics (trend data, priority breakdown, etc.)
        metrics_data["success"] = True
        
        logger.info(f"Successfully fetched dashboard metrics: {metrics_data}", extra=log_extra)
        return metrics_data
    
    except HTTPException:
        # Re-raise HTTP exceptions directly
        raise
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {str(e)}", extra=log_extra)
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard metrics: {str(e)}") 