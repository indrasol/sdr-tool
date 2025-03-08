from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, Any, List, Optional
from models.db_schema_models import Project, User
from fastapi import Depends, HTTPException
from services.auth_handler import get_current_user
import random
from datetime import date
from utils.logger import log_info


class DatabaseManager:
    async def get_project_data(self, user_id: int, project_code: str, db: AsyncSession) -> Dict[str, Any]:
        """
        Retrieve project data for a given user and project.

        Args:
            user_id: The ID of the authenticated user.
            project_code: The unique code of the project (e.g., "P123").
            db: AsyncSession instance.

        Returns:
            Dict containing project data with conversation_history and diagram_state.

        Raises:
            ValueError: If the project does not exist or user does not have access.
        """
        stmt = select(Project).where(Project.project_code == project_code, Project.user_id == user_id)
        result = await db.execute(stmt)
        project = result.scalars().first()

        if not project:
            raise ValueError(f"Project {project_code} not found for user {user_id}")

        return {
            "conversation_history": project.conversation_history,
            "diagram_state": project.diagram_state
        }

    async def update_project_data(
        self,
        user_id: int,
        project_code: str,
        conversation_history: List[Dict[str, Any]] = None,
        diagram_state: Dict[str, Any] = None,
        db: AsyncSession = None
    ):
        """
        Update project data for a given user and project.

        Args:
            user_id: The ID of the authenticated user.
            project_code: The unique code of the project (e.g., "P123").
            conversation_history: Updated conversation history (optional).
            diagram_state: Updated diagram state (optional).
            db: AsyncSession instance.

        Raises:
            ValueError: If the project does not exist or user does not have access.
        """
        stmt = select(Project).where(Project.project_code == project_code, Project.user_id == user_id)
        result = await db.execute(stmt)
        project = result.scalars().first()

        if not project:
            raise ValueError(f"Project {project_code} not found for user {user_id}")

        if conversation_history is not None:
            project.conversation_history = conversation_history
        if diagram_state is not None:
            project.diagram_state = diagram_state

        await db.commit()
        await db.refresh(project)

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
        imported_file: Optional[str] = None,
        db: AsyncSession = None
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
            db: AsyncSession instance.

        Returns:
            The unique project_code (e.g., "P123") of the created project.

        Raises:
            HTTPException: If project creation fails due to database errors.
        """
        # Generate a unique project_code (e.g., "P123")
        while True:
            random_number = random.randint(100, 999)  # Random 3-digit number (100–999)
            project_code = f"P{random_number}"
            stmt = select(Project).where(Project.project_code == project_code)
            result = await db.execute(stmt)
            if not result.scalars().first():
                break  # Unique project_code found
        log_info(f"Generated project code: {project_code}")
        try:
            new_project = Project(
                user_id=user_id,
                name=project_name,
                tenant_id=tenant_id,
                project_code=project_code,
                description=project_description,
                status=status,
                priority=priority,
                created_date=created_date,
                due_date=due_date,
                creator=creator,
                domain=domain,
                template_type=template_type,
                imported_file=imported_file,
                conversation_history=[],
                diagram_state={"nodes": [], "edges": []}
            )
            db.add(new_project)
            await db.commit()
            await db.refresh(new_project)
            return new_project.project_code
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

    async def get_user_projects(self, user_id: int, tenant_id: Optional[int] = None, db: AsyncSession = None) -> List[Dict[str, Any]]:
        """
        Retrieve all projects for a given user, optionally filtered by tenant.

        Args:
            user_id: The ID of the authenticated user.
            tenant_id: Optional tenant ID to filter projects.
            db: AsyncSession instance.

        Returns:
            List of project metadata including project_id (project_code), name, etc.
        """
        stmt = select(Project).where(Project.user_id == user_id)
        if tenant_id is not None:
            stmt = stmt.where(Project.tenant_id == tenant_id)
        result = await db.execute(stmt)
        projects = result.scalars().all()
        return [project.to_dict() for project in projects]