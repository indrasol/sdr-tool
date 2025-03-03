# core/cache/session_manager.py
# import redis.asyncio as aioredis
import aioredis
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional, Any
from fastapi import HTTPException
from utils.logger import log_info

class SessionManager:
    def __init__(self, redis_host: str = "localhost", redis_port: int = 6379, redis_db: int = 0):
        """Initialize the session manager with Redis connection settings."""
        self.redis_url = f"redis://{redis_host}:{redis_port}/{redis_db}"
        self.redis_pool = None  # Initialized in connect()

    async def connect(self):
        """Connect to Redis asynchronously."""
        self.redis_pool = await aioredis.from_url(self.redis_url, decode_responses=True)

    async def disconnect(self):
        """Disconnect from Redis."""
        if self.redis_pool:
            await self.redis_pool.close()

    async def create_project_session(self, user_id: str, project_id: str, project_data: Dict[str, Any]) -> str:
        """
        Create a new session for a specific project and user.
        
        Args:
            user_id: The authenticated user's ID
            project_id: The project's ID
            project_data: Initial project data from the database
        
        Returns:
            str: Unique session ID
        """
        session_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)

        session_data = {
            "user_id": user_id,
            "project_id": project_id,
            "created_at": timestamp,
            "last_updated": timestamp,
            "conversation_history": project_data.get("conversation_history", []),
            "diagram_state": project_data.get("diagram_state", {"nodes": [], "edges": []})
        }

        await self.redis_pool.setex(
            f"session:{session_id}",
            86400,  # 24-hour TTL
            json.dumps(session_data)
        )
        return session_id

    async def get_session(self, session_id: str, expected_project_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieve session data, optionally verifying the project ID.
        
        Args:
            session_id: The unique session identifier
            expected_project_id: Project ID to verify against (optional)
        
        Returns:
            Dict containing session data
        
        Raises:
            HTTPException: If session is invalid or project ID mismatches
        """
        
        log_info("Entering get session...")
        session_data_str = await self.redis_pool.get(f"session:{session_id}")
        log_info(f"session data str : {session_data_str}")
        if not session_data_str:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found or expired")

        session_data = json.loads(session_data_str)
        if expected_project_id and session_data["project_id"] != expected_project_id:
            raise HTTPException(status_code=403, detail="Session does not match project")
        return session_data

    async def update_session(self, session_id: str, user_query: Optional[str] = None,
                             system_response: Optional[Dict[str, Any]] = None,
                             diagram_state: Optional[Dict[str, Any]] = None) -> None:
        """
        Update session data with new conversation entry and/or diagram state.
        """
        session_data = await self.get_session(session_id)
        session_data["last_updated"] = datetime.now().isoformat()

        if user_query and system_response:
            conversation_entry = {
                "timestamp": datetime.now().isoformat(),
                "user": user_query,
                "system": system_response
            }
            session_data["conversation_history"].append(conversation_entry)

        if diagram_state is not None:
            session_data["diagram_state"] = diagram_state

        try:
            await self.redis_pool.setex(
                f"session:{session_id}",
                86400,
                json.dumps(session_data)
            )
        except Exception as e:
            raise RuntimeError(f"Failed to update session {session_id}: {str(e)}")

    async def extend_session_ttl(self, session_id: str, ttl_seconds: int = 86400) -> None:
        """
        Extend the time-to-live (TTL) of a session.
        
        Args:
            session_id: The unique session identifier
            ttl_seconds: New TTL in seconds (default 24 hours)
        
        Raises:
            HTTPException: If session does not exist
        """
        if not await self.redis_pool.exists(f"session:{session_id}"):
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found or expired")
        await self.redis_pool.expire(f"session:{session_id}", ttl_seconds)

    async def delete_session(self, session_id: str) -> None:
        """
        Delete a session from Redis.
        
        Args:
            session_id: The unique session identifier
        """
        await self.redis_pool.delete(f"session:{session_id}")