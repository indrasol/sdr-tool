from fastapi import HTTPException
from typing import Dict, Any, List, Optional
from datetime import date
import random
from utils.logger import log_info
from core.db.supabase_db import get_supabase_client, safe_supabase_operation

class SupabaseManager:
    def __init__(self):
        self.supabase = get_supabase_client()
        
    async def get_project_data(self, user_id: int, project_code: str) -> Dict[str, Any]:
        """
        Retrieve project data for a given user and project.

        Args:
            user_id: The ID of the authenticated user.
            project_code: The unique code of the project (e.g., "P123").

        Returns:
            Dict containing project data with conversation_history and diagram_state.

        Raises:
            ValueError: If the project does not exist or user does not have access.
        """
        def fetch_project():
            return self.supabase.from_("projects").select("*").eq("project_code", project_code).eq("user_id", user_id).execute()
            
        project_response = await safe_supabase_operation(
            fetch_project,
            f"Failed to fetch project data for {project_code}"
        )
        
        if not project_response.data:
            raise ValueError(f"Project {project_code} not found for user {user_id}")
        
        project = project_response.data[0]
        return {
            "conversation_history": project["conversation_history"],
            "diagram_state": project["diagram_state"]
        }
    
    async def update_project_data(
        self,
        user_id: int,
        project_code: str,
        conversation_history: List[Dict[str, Any]] = None,
        diagram_state: Dict[str, Any] = None
    ):
        """
        Update project data for a given user and project.

        Args:
            user_id: The ID of the authenticated user.
            project_code: The unique code of the project (e.g., "P123").
            conversation_history: Updated conversation history (optional).
            diagram_state: Updated diagram state (optional).

        Raises:
            ValueError: If the project does not exist or user does not have access.
        """
        def check_project():
            return self.supabase.from_("projects").select("*").eq("project_code", project_code).eq("user_id", user_id).execute()
            
        project_response = await safe_supabase_operation(
            check_project,
            f"Failed to fetch project for update: {project_code}"
        )
        
        if not project_response.data:
            raise ValueError(f"Project {project_code} not found for user {user_id}")
        
        update_data = {}
        if conversation_history is not None:
            update_data["conversation_history"] = conversation_history
        if diagram_state is not None:
            update_data["diagram_state"] = diagram_state
        
        def update_project():
            return self.supabase.from_("projects").update(update_data).eq("project_code", project_code).eq("user_id", user_id).execute()
            
        await safe_supabase_operation(
            update_project,
            f"Failed to update project: {project_code}"
        )
        log_info(f"Updated project {project_code} for user {user_id}")
    
    async def create_project(
        self,
        user_id: int,
        project_name: str,
        tenant_id: int,
        project_description: Optional[str] = None,
        status: str = "Not Started",
        priority: Optional[str] = None,
        created_date: Optional[date] = None,
        due_date: Optional[date] = None,
        creator: Optional[str] = None,
        domain: Optional[str] = None,
        template_type: Optional[str] = None,
        imported_file: Optional[str] = None
    ) -> str:
        """
        Create a new project associated with a tenant for the authenticated user.

        Args:
            user_id: The ID of the authenticated user.
            project_name: The name of the project.
            tenant_id: The ID of the tenant.
            project_description: Optional description of the project.
            status: The status of the project.
            priority: The priority of the project.
            created_date: The creation date of the project.
            due_date: The due date of the project.
            creator: The creator of the project.
            domain: The domain of the project.
            template_type: The template type of the project.
            imported_file: The imported file for the project.

        Returns:
            The unique project_code (e.g., "P123") of the created project.

        Raises:
            HTTPException: If project creation fails.
        """
        # Generate a unique project_code
        while True:
            random_number = random.randint(100, 999)
            project_code = f"P{random_number}"
            
            def check_code():
                return self.supabase.from_("projects").select("project_code").eq("project_code", project_code).execute()
                
            project_check = await safe_supabase_operation(
                check_code,
                "Failed to check project code uniqueness"
            )
            
            if not project_check.data:
                break
        
        log_info(f"Generated project code: {project_code}")
        
        try:
            # Convert date objects to strings for JSON serialization if needed
            created_date_str = created_date.isoformat() if created_date else None
            due_date_str = due_date.isoformat() if due_date else None
            
            project_data = {
                "user_id": user_id,
                "name": project_name,
                "tenant_id": tenant_id,
                "project_code": project_code,
                "description": project_description,
                "status": status,
                "priority": priority,
                "created_date": created_date_str,
                "due_date": due_date_str,
                "creator": creator,
                "domain": domain,
                "template_type": template_type,
                "imported_file": imported_file,
                "conversation_history": [],
                "diagram_state": {"nodes": [], "edges": []}
            }
            
            def create_project():
                return self.supabase.from_("projects").insert(project_data).execute()
                
            await safe_supabase_operation(
                create_project,
                "Failed to create project"
            )
            
            log_info(f"Created project {project_code} for user {user_id}")
            return project_code
        except Exception as e:
            log_info(f"Error creating project: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")
    
    async def get_user_projects(self, user_id: int, tenant_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Retrieve all projects for a given user, optionally filtered by tenant.

        Args:
            user_id: The ID of the authenticated user.
            tenant_id: Optional tenant ID to filter projects.

        Returns:
            List of project metadata including project_id (project_code), name, etc.
        """
        query = self.supabase.from_("projects").select("*").eq("user_id", user_id)
        
        if tenant_id is not None:
            query = query.eq("tenant_id", tenant_id)
        
        def fetch_projects():
            return query.execute()
            
        projects_response = await safe_supabase_operation(
            fetch_projects,
            "Failed to fetch user projects"
        )
        
        return [self._project_to_dict(project) for project in projects_response.data]
    
    def _project_to_dict(self, project):
        """Convert project to a dictionary for JSON response."""
        # Handle potential date strings for ISO formatting
        created_date = project.get("created_date")
        due_date = project.get("due_date")
        created_at = project.get("created_at")
        updated_at = project.get("updated_at")
        
        return {
            "id": project["project_code"],
            "name": project["name"],
            "description": project["description"],
            "status": project["status"],
            "priority": project["priority"],
            "created_date": created_date,
            "due_date": due_date,
            "creator": project["creator"],
            "domain": project["domain"],
            "template_type": project["template_type"],
            "imported_file": project["imported_file"],
            "tenant_id": project["tenant_id"],
            "created_at": created_at,
            "updated_at": updated_at,
            "conversation_history": project.get("conversation_history", []),
            "diagram_state": project.get("diagram_state", {"nodes": [], "edges": []})
        }