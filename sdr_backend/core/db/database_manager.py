from databases import Database
from typing import Dict, Any, List

class DatabaseManager:
    def __init__(self):
        pass  # No initialization needed since we use dependency injection for DB

    async def get_project_data(self, user_id: int, project_id: str, db: Database) -> Dict[str, Any]:
        """
        Retrieve project data for a given user and project.

        Args:
            user_id: The ID of the authenticated user.
            project_id: The ID of the project.
            db: Async database instance.

        Returns:
            Dict containing project data with conversation_history and diagram_state.

        Raises:
            ValueError: If the project does not exist or user does not have access.
        """
        query = """
            SELECT conversation_history, diagram_state 
            FROM projects 
            WHERE id = :project_id AND user_id = :user_id
        """
        values = {"project_id": project_id, "user_id": user_id}
        project = await db.fetch_one(query, values)

        if not project:
            raise ValueError(f"Project {project_id} not found for user {user_id}")

        return {
            "conversation_history": project["conversation_history"],
            "diagram_state": project["diagram_state"]
        }

    async def update_project_data(
        self,
        user_id: int,
        project_id: str,
        conversation_history: List[Dict[str, Any]] = None,
        diagram_state: Dict[str, Any] = None,
        db: Database = None
    ):
        """
        Update project data for a given user and project.

        Args:
            user_id: The ID of the authenticated user.
            project_id: The ID of the project.
            conversation_history: Updated conversation history (optional).
            diagram_state: Updated diagram state (optional).
            db: Async database instance.
        """
        # Check if the project exists
        check_query = "SELECT id FROM projects WHERE id = :project_id AND user_id = :user_id"
        project = await db.fetch_one(check_query, {"project_id": project_id, "user_id": user_id})

        if not project:
            raise ValueError(f"Project {project_id} not found for user {user_id}")

        # Prepare update query dynamically
        update_fields = []
        values = {"project_id": project_id, "user_id": user_id}

        if conversation_history is not None:
            update_fields.append("conversation_history = :conversation_history")
            values["conversation_history"] = conversation_history

        if diagram_state is not None:
            update_fields.append("diagram_state = :diagram_state")
            values["diagram_state"] = diagram_state

        if update_fields:
            update_query = f"""
                UPDATE projects
                SET {', '.join(update_fields)}
                WHERE id = :project_id AND user_id = :user_id
            """
            await db.execute(update_query, values)

    async def create_project(self, user_id: int, project_name: str, db: Database) -> int:
        """
        Create a new project for a user.

        Args:
            user_id: The ID of the authenticated user.
            project_name: The name of the new project.
            db: Async database instance.

        Returns:
            The ID of the newly created project.
        """
        query = """
            INSERT INTO projects (user_id, name, conversation_history, diagram_state)
            VALUES (:user_id, :name, :conversation_history, :diagram_state)
            RETURNING id
        """
        values = {
            "user_id": user_id,
            "name": project_name,
            "conversation_history": [],  # Default empty list
            "diagram_state": {"nodes": [], "edges": []}  # Default empty diagram
        }
        result = await db.fetch_one(query, values)
        return result["id"]

    async def get_user_projects(self, user_id: int, db: Database) -> List[Dict[str, Any]]:
        """
        Retrieve all projects for a given user.

        Args:
            user_id: The ID of the authenticated user.
            db: Async database instance.

        Returns:
            List of project metadata (id, name).
        """
        query = "SELECT id, name FROM projects WHERE user_id = :user_id"
        projects = await db.fetch_all(query, {"user_id": user_id})
        return [{"id": project["id"], "name": project["name"]} for project in projects]