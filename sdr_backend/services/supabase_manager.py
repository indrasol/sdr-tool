import string
from fastapi import HTTPException
from typing import Dict, Any, List, Optional
from datetime import date, datetime, timezone, timedelta
import random
from utils.logger import log_info
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from constants import ProjectPriority, ProjectStatus

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
        user_id: str,
        project_code: str,
        conversation_history: List[Dict[str, Any]] = None,
        diagram_state: Dict[str, Any] = None,
        # pytm_model_code: Optional[str] = None,
        dfd_data: Dict[str, Any] = None,
        threat_model_id: Optional[str] = None,
    ):
        """
        Update project data for a given user and project.

        Args:
            user_id: The ID of the authenticated user.
            project_code: The unique code of the project (e.g., "P123").
            conversation_history: Updated conversation history (optional).
            diagram_state: Updated diagram state (optional)

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
        # if pytm_model_code is not None:
        #     update_data["pytm_model_code"] = pytm_model_code
        if dfd_data is not None:
            update_data["dfd_data"] = dfd_data
        if threat_model_id is not None:
            update_data["threat_model_id"] = threat_model_id
        
        def update_project():
            return self.supabase.from_("projects").update(update_data).eq("project_code", project_code).eq("user_id", user_id).execute()
            
        await safe_supabase_operation(
            update_project,
            f"Failed to update project: {project_code}"
        )
        log_info(f"Updated project {project_code} for user {user_id}")
    
    async def create_project(
        self,
        user_id: str, 
        name: str,  
        tenant_id: int,
        creator: str,
        description: Optional[str] = None,
        status: ProjectStatus = ProjectStatus.NOT_STARTED,
        priority: ProjectPriority = ProjectPriority.ALL,
        created_date: Optional[date] = None,
        due_date: Optional[date] = None,
        domain: Optional[str] = None,
        template_type: Optional[str] = None,
        imported_file: Optional[str] = None,
        version: int = 0,
        team_id: Optional[int] = None
    ) -> str:
        """
        Create a new project in Supabase with robust validation and unique project code.

        Args:
            user_id: The authenticated user's ID (string UUID).
            name: The project name (required).
            tenant_id: The tenant ID (required).
            description: Optional project description.
            status: Project status as an enum (defaults to "Not Started").
            priority: Optional project priority as an enum.
            created_date: Optional creation date (defaults to today).
            due_date: Optional due date.
            creator: The creator's name (required).
            domain: Optional domain URL.
            template_type: Optional project approach/template type.
            imported_file: Optional imported file path.
            version: Initial version number (default 0).
            team_id: Optional team ID to associate project with.

        Returns:
            str: The unique project_code (e.g., "PABC1234").

        Raises:
            HTTPException: For validation errors or database failures.
        """
        # Additional validation (Pydantic handles basics)
        if not name.strip():
            raise HTTPException(status_code=400, detail="Project name cannot be empty")
        if not creator.strip():
            raise HTTPException(status_code=400, detail="Creator name cannot be empty")
        if due_date and created_date and due_date < created_date:
            raise HTTPException(status_code=400, detail="Due date must be after created date")

        # Generate a unique project_code (e.g., "PABC1234")
        while True:
            project_code = "P" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
            check_code = lambda: self.supabase.from_("projects").select("project_code").eq("project_code", project_code).execute()
            project_check = await safe_supabase_operation(check_code, "Failed to check project code uniqueness")
            if not project_check.data:
                break

        log_info(f"Generated project code: {project_code}")

        try:
            # Default created_date to today if not provided
            created_date = created_date or date.today()
            created_date_str = created_date.isoformat()
            due_date_str = due_date.isoformat() if due_date else None
            log_info(f"Status : {status}")
            log_info(f"Priority : {priority}")
            log_info(f"Team ID : {team_id}")

            # Convert status string to enum if needed
            if isinstance(status, str):
                try:
                    status = ProjectStatus[status]
                except KeyError:
                    status_key = status.upper().replace(' ', '_')
                    try:
                        status = ProjectStatus[status_key]
                    except KeyError:
                        status = ProjectStatus.NOT_STARTED

            # Convert priority string to enum if needed
            if isinstance(priority, str):
                try:
                    priority = ProjectPriority[priority]
                except KeyError:
                    priority_key = priority.upper().replace(' ', '_')
                    try:
                        priority = ProjectPriority[priority_key]
                    except KeyError:
                        priority = ProjectPriority.MEDIUM
            log_info(f"Status : {status.name}")
            log_info(f"priority : {priority.name}")
            
            # Convert date strings to date objects if needed
            if isinstance(created_date, str):
                created_date = datetime.strptime(created_date, "%Y-%m-%d").date()
            
            if isinstance(due_date, str):
                due_date = datetime.strptime(due_date, "%Y-%m-%d").date()

            project_data = {
                "user_id": user_id,
                "name": name,
                "tenant_id": tenant_id,
                "project_code": project_code,
                "description": description,
                "status": status.name,
                "priority": priority.name if priority else None,
                "created_date": created_date_str,
                "due_date": due_date_str,
                "creator": creator,
                "domain": domain,
                "template_type": template_type,
                "imported_file": imported_file,
                "version": version,
                "team_id": team_id,
                # Only include if needed by GET or schema
                "conversation_history": [],
                "diagram_state": {"nodes": [], "edges": []}
            }

            log_info(f"Inserting project data: {project_data}")
            create_project = lambda: self.supabase.from_("projects").insert(project_data).execute()
            await safe_supabase_operation(create_project, "Failed to create project")

            log_info(f"Created project {project_code} for user {user_id}")
            return project_code

        except ValueError as ve:
            log_info(f"Validation error: {str(ve)}")
            raise HTTPException(status_code=400, detail=f"Invalid data: {str(ve)}")
        except Exception as e:
            log_info(f"Error creating project: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

    async def get_user_projects(
        self,
        user_id: str,
        tenant_id: int,
        status: Optional[ProjectStatus] = None,
        priority: Optional[ProjectPriority] = None,
        sort_by: Optional[str] = "created_date",
        sort_order: Optional[str] = "desc",
        project_code_filter: Optional[str] = None,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Fetch projects for a user with optional filters, using enums for status and priority.
        """
        
        # log_info(f"user_id inside fetch_projects : {user_id}")
        query = self.supabase.from_("projects").select("*").eq("user_id", user_id)


        # Apply filters based on provided parameters
        if tenant_id is not None:
            query = query.eq("tenant_id", tenant_id)
        if status is not None:
            query = query.eq("status", status.name)
        if priority is not None:
            query = query.eq("priority", priority.name)
        if project_code_filter:
            query = query.eq("project_code", project_code_filter)

        # Apply sorting
        if sort_by and sort_order:
            query = query.order(sort_by, desc=(sort_order.lower() == "desc"))

        # Apply pagination
        query = query.range(offset, offset + limit - 1)

        # Execute the query safely (assuming safe_supabase_operation is defined elsewhere)
        def fetch_projects():
            return query.execute()

        projects_response = await safe_supabase_operation(
            fetch_projects,
            "Failed to fetch user projects"
        )

        if projects_response.data is None or not projects_response.data:
            return []

        # Convert each project to a dictionary for the response
        return [self._project_to_dict(project) for project in projects_response.data]

    def _project_to_dict(self, project: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert a project from the database to a dictionary for JSON response.
        Handles enum validation and date formatting.
        """
        created_date = project.get("created_date")
        due_date = project.get("due_date")
        created_at = project.get("created_at")
        updated_at = project.get("updated_at")

        # Format dates to ISO strings
        if isinstance(created_date, (date, datetime)):
            created_date = created_date.isoformat()
        if isinstance(due_date, (date, datetime)):
            due_date = due_date.isoformat()
        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()
        if isinstance(updated_at, datetime):
            updated_at = updated_at.isoformat()

        # Validate and convert status and priority to enums, with fallback for invalid values
        try:
            status_enum = ProjectStatus(project["status"])
        except ValueError:
            status_enum = None  # Fallback for legacy or invalid data
        try:
            priority_enum = ProjectPriority(project["priority"])
        except ValueError:
            priority_enum = None  # Fallback for legacy or invalid data

        return {
            "id": project["project_code"],
            "name": project["name"],
            "description": project["description"],
            "status": status_enum.value if status_enum else project["status"],
            "priority": priority_enum.value if priority_enum else project["priority"],
            "created_date": created_date,
            "due_date": due_date,
            "creator": project["creator"],
            "assigned_to": project["assigned_to"],
            "assigned_to": project.get("assigned_to"),
            "domain": project["domain"],
            "template_type": project["template_type"],
            "imported_file": project["imported_file"],
            "tenant_id": project["tenant_id"],
            "created_at": created_at,
            "updated_at": updated_at,
            "conversation_history": project.get("conversation_history", []),
            "diagram_state": project.get("diagram_state", {"nodes": [], "edges": []}),
            # "pytm_model_code": project.get("pytm_model_code"),
            "dfd_data": project.get("dfd_data"),
            "threat_model_id": project.get("threat_model_id")
        }
    
    # —– Template —–
    def _generate_template_id(self, length: int = 4) -> str:
        """Generate a unique ID like 'T4G7Z' (T + 4 alphanumeric chars)."""
        suffix = ''.join(random.choices(string.digits, k=length))
        return f"T{suffix}"

    async def create_template(
        self,
        tenant_id: int,
        tenant_name: str,
        diagram_state: Dict[str, Any],
        template_name: str,
        template_description: Optional[str] = None,
        template_tags: Optional[List[str]] = None,
        template_visibility: Optional[List[str]] = None,
    ) -> str:
        """
        Insert a new template record into Supabase, generating
        a unique 4-char template_id.
        Returns the template_id.
        """
        # — generate & check uniqueness (retry up to 5x) —
        template_id = self._generate_template_id()
        for _ in range(5):
            check = lambda: self.supabase \
                .from_("templates") \
                .select("template_id") \
                .eq("template_id", template_id) \
                .execute()
            resp = await safe_supabase_operation(check, "Failed checking template_id")
            if not resp.data:
                break
            template_id = self._generate_template_id()
        else:
            raise HTTPException(
                status_code=500,
                detail="Could not generate unique template_id"
            )

        # — prepare payload —
        now = datetime.now(timezone.utc).isoformat()
        payload = {
            "template_id": template_id,
            "tenant_id": tenant_id,
            "tenant_name": tenant_name,
            "diagram_state": diagram_state,
            "template_name": template_name,
            "template_description": template_description,
            "template_tags": template_tags or [],
            "template_visibility": template_visibility or [],
            "created_at": now,
        }

        # — insert into Supabase —
        insert_op = lambda: self.supabase.from_("templates").insert(payload).execute()
        await safe_supabase_operation(insert_op, "Failed to create template")

        return template_id
    
    async def get_template(
        self,
        template_id: str,
        tenant_id: int
    ) -> Dict[str, Any]:
        """
        Fetch a single template by its public ID and tenant.
        Raises HTTPException(404) if not found.
        """
        def fetch():
            return (
                self.supabase
                .from_("templates")
                .select("*")
                .eq("template_id", template_id)
                .eq("tenant_id", tenant_id)
                .single()
                .execute()
            )

        resp = await safe_supabase_operation(fetch, f"Failed to fetch template {template_id}")
        if not resp.data:
            raise HTTPException(status_code=404, detail="Template not found")
        return resp.data
    
    async def update_template(
        self,
        template_id: str,
        tenant_id: int,
        diagram_info: Optional[Dict[str, Any]] = None,
        template_name: Optional[str] = None,
        template_description: Optional[str] = None,
        template_tags: Optional[List[str]] = None,
        template_visibility: Optional[List[str]] = None,
    ) -> None:
        """
        Partially update a template. Raises 404 if not found.
        """
        # 1️⃣ Ensure it exists (and belongs to tenant)
        def fetch():
            return (
                self.supabase
                    .from_("templates")
                    .select("template_id")
                    .eq("template_id", template_id)
                    .eq("tenant_id", tenant_id)
                    .execute()
            )
        resp = await safe_supabase_operation(fetch, f"Failed to fetch template {template_id}")
        if not resp.data:
            raise HTTPException(status_code=404, detail="Template not found")

        # 2️⃣ Build update payload
        update_data: Dict[str, Any] = {}
        if diagram_info is not None:
            update_data["diagram_info"] = diagram_info
        if template_name is not None:
            update_data["template_name"] = template_name
        if template_description is not None:
            update_data["template_description"] = template_description
        if template_tags is not None:
            update_data["template_tags"] = template_tags
        if template_visibility is not None:
            update_data["template_visibility"] = template_visibility

        if not update_data:
            # nothing to update
            raise HTTPException(status_code=400, detail="No updatable fields provided")

        # always bump updated_at
        update_data["updated_at"] = datetime.utcnow().isoformat()

        # 3️⃣ Perform the update
        def do_update():
            return (
                self.supabase
                    .from_("templates")
                    .update(update_data)
                    .eq("template_id", template_id)
                    .eq("tenant_id", tenant_id)
                    .execute()
            )
        upd_resp = await safe_supabase_operation(do_update, f"Failed to update template {template_id}")
        if upd_resp.error:
            raise HTTPException(status_code=500, detail=f"DB error: {upd_resp.error.message}")

    # Teams API Methods
    async def create_team(
        self,
        user_id: str,
        name: str,
        tenant_id: int,
        description: Optional[str] = None,
        is_private: bool = False,
        avatar_url: Optional[str] = None
    ) -> int:
        """
        Create a new team in the database.
        
        Args:
            user_id: The ID of the user creating the team (will become owner)
            name: Team name
            tenant_id: The tenant ID
            description: Optional team description
            is_private: Whether the team is private
            avatar_url: Optional URL to team avatar image
            
        Returns:
            int: The team ID
            
        Raises:
            HTTPException: For validation errors or database failures
        """
        # Additional validation
        if not name.strip():
            raise HTTPException(status_code=400, detail="Team name cannot be empty")
        
        # Create team record
        team_data = {
            "name": name,
            "description": description,
            "tenant_id": tenant_id,
            "created_by": user_id,
            "is_private": is_private,
            "avatar_url": avatar_url,
        }
        
        def create_team_op():
            return self.supabase.from_("teams").insert(team_data).execute()
        
        team_response = await safe_supabase_operation(create_team_op, "Failed to create team")
        
        if not team_response.data:
            raise HTTPException(status_code=500, detail="Failed to create team")
        
        team_id = team_response.data[0]["id"]
        
        # Add creator as team owner
        owner_data = {
            "team_id": team_id,
            "user_id": user_id,
            "role": "owner",
            "permissions": {"view": True, "edit": True, "admin": True}
        }
        
        def add_team_owner():
            return self.supabase.from_("team_members").insert(owner_data).execute()
        
        await safe_supabase_operation(add_team_owner, "Failed to add team owner")
        
        return team_id
    
    async def get_team(self, team_id: int, user_id: str) -> Dict[str, Any]:
        """
        Get a team by ID with permission checking.
        
        Args:
            team_id: The team ID
            user_id: The requesting user's ID
            
        Returns:
            Dict with team details
            
        Raises:
            HTTPException: If team not found or user doesn't have access
        """
        # First check if user is a member of this team
        def check_membership():
            return self.supabase.from_("team_members").select("*").eq("team_id", team_id).eq("user_id", user_id).execute()
        
        membership = await safe_supabase_operation(check_membership, "Failed to check team membership")
        
        # If not a member, check if the team is public and in user's tenant
        if not membership.data:
            # Get user's tenants
            def get_user_tenants():
                return self.supabase.from_("user_tenant_association").select("tenant_id").eq("user_id", user_id).execute()
            
            tenant_response = await safe_supabase_operation(get_user_tenants, "Failed to get user tenants")
            user_tenant_ids = [item["tenant_id"] for item in tenant_response.data]
            
            # Check if team exists and is public in user's tenant
            def check_public_team():
                return self.supabase.from_("teams").select("*").eq("id", team_id).eq("is_private", False).in_("tenant_id", user_tenant_ids).execute()
            
            team_response = await safe_supabase_operation(check_public_team, "Failed to get team")
            
            if not team_response.data:
                raise HTTPException(status_code=404, detail="Team not found or access denied")
            
            return team_response.data[0]
        
        # User is a member, get full team details
        def get_team():
            return self.supabase.from_("teams").select("*").eq("id", team_id).execute()
        
        team_response = await safe_supabase_operation(get_team, "Failed to get team")
        
        if not team_response.data:
            raise HTTPException(status_code=404, detail="Team not found")
        
        return team_response.data[0]
    
    async def get_user_teams(self, user_id: str, tenant_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get all teams that a user is a member of.
        
        Args:
            user_id: The user's ID
            tenant_id: Optional tenant ID filter
            
        Returns:
            List of team objects
        """
        # First get all teams the user is a member of
        def get_user_team_ids():
            return self.supabase.from_("team_members").select("team_id").eq("user_id", user_id).execute()
        
        team_ids_response = await safe_supabase_operation(get_user_team_ids, "Failed to get user team IDs")
        
        if not team_ids_response.data:
            return []
        
        team_ids = [item["team_id"] for item in team_ids_response.data]
        
        # Get team details with optional tenant filter
        query = self.supabase.from_("teams").select("*").in_("id", team_ids)
        
        if tenant_id is not None:
            query = query.eq("tenant_id", tenant_id)
            
        def get_teams():
            return query.execute()
        
        teams_response = await safe_supabase_operation(get_teams, "Failed to get teams")
        
        if not teams_response.data:
            return []
        
        return teams_response.data
    
    async def get_tenant_teams(self, tenant_id: int, user_id: str, include_private: bool = False) -> List[Dict[str, Any]]:
        """
        Get all teams in a tenant.
        
        Args:
            tenant_id: The tenant ID
            user_id: The requesting user's ID
            include_private: Whether to include private teams (user must be a member)
            
        Returns:
            List of team objects
        """
        # If including private teams, get user's team memberships
        user_team_ids = []
        if include_private:
            def get_user_team_ids():
                return self.supabase.from_("team_members").select("team_id").eq("user_id", user_id).execute()
            
            team_ids_response = await safe_supabase_operation(get_user_team_ids, "Failed to get user team IDs")
            user_team_ids = [item["team_id"] for item in team_ids_response.data]
        
        # Build query to get teams in tenant
        # If include_private is False, only get public teams
        # If include_private is True, get public teams and private teams user is a member of
        if include_private and user_team_ids:
            # Get public teams OR private teams user is a member of
            query = self.supabase.from_("teams").select("*").eq("tenant_id", tenant_id).or_(f"is_private.eq.false,id.in.({','.join(map(str, user_team_ids))})")
        else:
            # Get only public teams
            query = self.supabase.from_("teams").select("*").eq("tenant_id", tenant_id).eq("is_private", False)
        
        def get_teams():
            return query.execute()
        
        teams_response = await safe_supabase_operation(get_teams, "Failed to get tenant teams")
        
        if not teams_response.data:
            return []
        
        return teams_response.data
    
    async def update_team(
        self,
        team_id: int,
        user_id: str,
        update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update a team's information.
        
        Args:
            team_id: The team ID
            user_id: The requesting user's ID (must be owner or admin)
            update_data: Dict with fields to update
            
        Returns:
            Updated team object
            
        Raises:
            HTTPException: If team not found or user doesn't have permission
        """
        # Check user's role in the team
        def check_permission():
            return self.supabase.from_("team_members").select("role,permissions").eq("team_id", team_id).eq("user_id", user_id).execute()
        
        permission_response = await safe_supabase_operation(check_permission, "Failed to check team permissions")
        
        if not permission_response.data:
            raise HTTPException(status_code=403, detail="You are not a member of this team")
        
        member = permission_response.data[0]
        
        # Check if user is owner, admin, or has admin permission
        is_owner = member["role"] == "owner"
        is_admin = member["role"] == "admin" or (member["permissions"] and member["permissions"].get("admin", False))
        
        if not (is_owner or is_admin):
            raise HTTPException(status_code=403, detail="You don't have permission to update this team")
        
        # Update team
        def update_team_op():
            return self.supabase.from_("teams").update(update_data).eq("id", team_id).execute()
        
        team_response = await safe_supabase_operation(update_team_op, "Failed to update team")
        
        if not team_response.data:
            raise HTTPException(status_code=404, detail="Team not found")
        
        return team_response.data[0]
    
    async def delete_team(self, team_id: int, user_id: str) -> None:
        """
        Delete a team (only owner can delete).
        
        Args:
            team_id: The team ID
            user_id: The requesting user's ID (must be owner)
            
        Raises:
            HTTPException: If team not found or user is not owner
        """
        # Check if user is team owner
        def check_owner():
            return self.supabase.from_("team_members").select("role").eq("team_id", team_id).eq("user_id", user_id).eq("role", "owner").execute()
        
        owner_check = await safe_supabase_operation(check_owner, "Failed to check team ownership")
        
        if not owner_check.data:
            raise HTTPException(status_code=403, detail="Only team owners can delete teams")
        
        # Delete team (cascade will handle team_members)
        def delete_team_op():
            return self.supabase.from_("teams").delete().eq("id", team_id).execute()
        
        await safe_supabase_operation(delete_team_op, "Failed to delete team")
    
    async def add_team_member(
        self,
        team_id: int,
        user_id: str,  # The requesting user (must be owner or admin)
        member_id: str,  # The user to add
        role: str = "member",
        permissions: Dict[str, bool] = None
    ) -> Dict[str, Any]:
        """
        Add a user to a team.
        
        Args:
            team_id: The team ID
            user_id: The requesting user's ID (must be owner or admin)
            member_id: The ID of the user to add
            role: The role to assign (owner, admin, member, guest)
            permissions: Custom permissions dictionary
            
        Returns:
            The created team member record
            
        Raises:
            HTTPException: For permission errors or if the user is already a member
        """
        # Check user's role in the team
        def check_permission():
            return self.supabase.from_("team_members").select("role,permissions").eq("team_id", team_id).eq("user_id", user_id).execute()
        
        permission_response = await safe_supabase_operation(check_permission, "Failed to check team permissions")
        
        if not permission_response.data:
            raise HTTPException(status_code=403, detail="You are not a member of this team")
        
        member = permission_response.data[0]
        
        # Check if user is owner, admin, or has admin permission
        is_owner = member["role"] == "owner"
        is_admin = member["role"] == "admin" or (member["permissions"] and member["permissions"].get("admin", False))
        
        if not (is_owner or is_admin):
            raise HTTPException(status_code=403, detail="You don't have permission to add team members")
        
        # Check if the user to add is already a member
        def check_existing():
            return self.supabase.from_("team_members").select("id").eq("team_id", team_id).eq("user_id", member_id).execute()
        
        existing = await safe_supabase_operation(check_existing, "Failed to check existing membership")
        
        if existing.data:
            raise HTTPException(status_code=400, detail="User is already a member of this team")
        
        # Assign default permissions based on role if not specified
        if permissions is None:
            if role == "owner":
                permissions = {"view": True, "edit": True, "admin": True}
            elif role == "admin":
                permissions = {"view": True, "edit": True, "admin": True}
            elif role == "member":
                permissions = {"view": True, "edit": True, "admin": False}
            else:  # guest
                permissions = {"view": True, "edit": False, "admin": False}
        
        # Add team member
        member_data = {
            "team_id": team_id,
            "user_id": member_id,
            "role": role,
            "permissions": permissions
        }
        
        def add_member():
            return self.supabase.from_("team_members").insert(member_data).execute()
        
        member_response = await safe_supabase_operation(add_member, "Failed to add team member")
        
        if not member_response.data:
            raise HTTPException(status_code=500, detail="Failed to add team member")
        
        return member_response.data[0]
    
    async def update_team_member(
        self,
        team_id: int,
        user_id: str,  # The requesting user (must be owner or admin)
        member_id: str,  # The user to update
        update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update a team member's role or permissions.
        
        Args:
            team_id: The team ID
            user_id: The requesting user's ID (must be owner or admin)
            member_id: The ID of the member to update
            update_data: Dict with fields to update (role, permissions)
            
        Returns:
            Updated team member record
            
        Raises:
            HTTPException: For permission errors or if trying to demote the owner
        """
        # Check user's role in the team
        def check_permission():
            return self.supabase.from_("team_members").select("role,permissions").eq("team_id", team_id).eq("user_id", user_id).execute()
        
        permission_response = await safe_supabase_operation(check_permission, "Failed to check team permissions")
        
        if not permission_response.data:
            raise HTTPException(status_code=403, detail="You are not a member of this team")
        
        requester = permission_response.data[0]
        is_owner = requester["role"] == "owner"
        is_admin = requester["role"] == "admin" or (requester["permissions"] and requester["permissions"].get("admin", False))
        
        # Check target member's current role
        def check_target():
            return self.supabase.from_("team_members").select("role").eq("team_id", team_id).eq("user_id", member_id).execute()
        
        target_response = await safe_supabase_operation(check_target, "Failed to check target member")
        
        if not target_response.data:
            raise HTTPException(status_code=404, detail="Member not found in team")
        
        target = target_response.data[0]
        
        # Cannot modify team owner unless you are the owner
        if target["role"] == "owner" and not is_owner:
            raise HTTPException(status_code=403, detail="Only team owners can modify the owner role")
        
        # Cannot modify admin unless you are owner or admin
        if target["role"] == "admin" and not (is_owner or is_admin):
            raise HTTPException(status_code=403, detail="You don't have permission to modify admin roles")
        
        # Update team member
        def update_member():
            return self.supabase.from_("team_members").update(update_data).eq("team_id", team_id).eq("user_id", member_id).execute()
        
        member_response = await safe_supabase_operation(update_member, "Failed to update team member")
        
        if not member_response.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        return member_response.data[0]
    
    async def remove_team_member(
        self,
        team_id: int,
        user_id: str,  # The requesting user (must be owner or admin)
        member_id: str  # The user to remove
    ) -> None:
        """
        Remove a user from a team.
        
        Args:
            team_id: The team ID
            user_id: The requesting user's ID (must be owner or admin)
            member_id: The ID of the user to remove
            
        Raises:
            HTTPException: For permission errors or if trying to remove the owner
        """
        # Check user's role in the team
        def check_permission():
            return self.supabase.from_("team_members").select("role,permissions").eq("team_id", team_id).eq("user_id", user_id).execute()
        
        permission_response = await safe_supabase_operation(check_permission, "Failed to check team permissions")
        
        if not permission_response.data:
            raise HTTPException(status_code=403, detail="You are not a member of this team")
        
        requester = permission_response.data[0]
        is_owner = requester["role"] == "owner"
        is_admin = requester["role"] == "admin" or (requester["permissions"] and requester["permissions"].get("admin", False))
        
        if not (is_owner or is_admin):
            raise HTTPException(status_code=403, detail="You don't have permission to remove team members")
        
        # Check target member's current role
        def check_target():
            return self.supabase.from_("team_members").select("role").eq("team_id", team_id).eq("user_id", member_id).execute()
        
        target_response = await safe_supabase_operation(check_target, "Failed to check target member")
        
        if not target_response.data:
            raise HTTPException(status_code=404, detail="Member not found in team")
        
        target = target_response.data[0]
        
        # Cannot remove team owner
        if target["role"] == "owner":
            raise HTTPException(status_code=403, detail="Cannot remove the team owner")
        
        # Only owner can remove admins
        if target["role"] == "admin" and not is_owner:
            raise HTTPException(status_code=403, detail="Only team owners can remove admin members")
        
        # Remove team member
        def remove_member():
            return self.supabase.from_("team_members").delete().eq("team_id", team_id).eq("user_id", member_id).execute()
        
        await safe_supabase_operation(remove_member, "Failed to remove team member")
    
    async def get_team_members(self, team_id: int, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all members of a team.
        
        Args:
            team_id: The team ID
            user_id: The requesting user's ID (must have access to team)
            
        Returns:
            List of team member objects with user details
            
        Raises:
            HTTPException: If team not found or user doesn't have access
        """
        # Check if user has access to this team
        team = await self.get_team(team_id, user_id)  # This will raise 404 if not accessible
        
        # Get team members with user details
        def get_members():
            # Join team_members with users to get user details
            return self.supabase.from_("team_members").select("*, users(id, username, email)").eq("team_id", team_id).execute()
        
        members_response = await safe_supabase_operation(get_members, "Failed to get team members")
        
        if not members_response.data:
            return []
        
        return members_response.data