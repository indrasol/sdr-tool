import aioredis
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional, Any, List, AsyncContextManager, AsyncIterator
from contextlib import asynccontextmanager
from fastapi import HTTPException
from utils.logger import log_info
from config.settings import REDIS_DB, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, SESSION_EXPIRY


class SessionManager:
    def __init__(self, redis_host: str = REDIS_HOST, redis_port: int = REDIS_PORT, redis_db: int = REDIS_DB, redis_password = REDIS_PASSWORD):
        """Initialize the session manager with Redis connection settings."""
        log_info(f"Redis host : {REDIS_HOST}")
        self.redis_url = f"redis://:{redis_password}@{redis_host}:{redis_port}"
        self.redis_pool = None  # Initialized in connect()
        log_info(f"Redis url : {redis_host}")
        log_info(f"Redis url : {redis_port}")
        log_info(f"Redis url : {redis_db}")

    async def connect(self):
        """Connect to Redis asynchronously."""
        if not self.redis_pool:
            try:
                log_info(f"Redis URL : {self.redis_url}")
                self.redis_pool = await aioredis.from_url(self.redis_url, decode_responses=True)
                log_info(f"Connected to Redis at {self.redis_url}")
            except Exception as e:
                raise RuntimeError(f"Failed to connect to Redis: {str(e)}")

    async def disconnect(self):
        """Disconnect from Redis."""
        if self.redis_pool:
            await self.redis_pool.close()
            self.redis_pool = None
            log_info("Disconnected from Redis")

    async def create_project_session(self, user_id: str, project_id: str) -> str:
        """
        Create a new session for a specific project and user.
        
        Args:
            user_id: The authenticated user's ID
            project_id: The project's ID
        
        Returns:
            str: Unique session ID
        """
        if not self.redis_pool:
            await self.connect()
            
        session_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()

        session_data = {
            "user_id": user_id,
            "project_id": project_id,
            "created_at": timestamp,
            "last_updated": timestamp,
            "conversation_history": [],
            "diagram_state": {},
            "thinking_history": [],           # extended thinking support
            "thinking_signatures": {},        # Store thinking signatures for multi-turn conversations
            "redacted_thinking_count": 0,      # Track occurrences of redacted thinking
            "classification_metadata": [],    # Store classification data for analysis
            "feedback_history": []            # Track feedback for continuous learning
        }

        try:
            await self.redis_pool.setex(
                f"session:{session_id}",
                SESSION_EXPIRY,  # 24-hour TTL
                json.dumps(session_data)
            )
            log_info(f"Created session {session_id} for user {user_id} and project {project_id}")
            return session_id
        except Exception as e:
            log_info(f"Error creating session: {str(e)}")
            raise RuntimeError(f"Failed to create session: {str(e)}")

    async def get_session(self, session_id: str, expected_project_id: Optional[str] = None, 
                         expected_user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Retrieve session data, optionally verifying the project ID and user ID.
        
        Args:
            session_id: The unique session identifier
            expected_project_id: Project ID to verify against (optional)
            expected_user_id: User ID to verify against (optional)
        
        Returns:
            Dict containing session data
        
        Raises:
            HTTPException: If session is invalid or project/user ID mismatches
        """
        if not self.redis_pool:
            await self.connect()
            
        log_info(f"Retrieving session {session_id}")
        session_data_str = await self.redis_pool.get(f"session:{session_id}")
        
        if not session_data_str:
            log_info(f"Session {session_id} not found or expired")
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found or expired")

        try:
            session_data = json.loads(session_data_str)
            
            # Validate required fields
            required_fields = ["user_id", "project_id", "conversation_history", "diagram_state"]
            for field in required_fields:
                if field not in session_data:
                    log_info(f"Session {session_id} is missing required field: {field}")
                    raise HTTPException(status_code=400, detail=f"Invalid session format: missing {field}")
            
            # Add thinking fields if they don't exist (for backward compatibility)
            if "thinking_history" not in session_data:
                session_data["thinking_history"] = []
            if "thinking_signatures" not in session_data:
                session_data["thinking_signatures"] = {}
            if "redacted_thinking_count" not in session_data:
                session_data["redacted_thinking_count"] = 0
            
            # Verify project ID if specified
            if expected_project_id and session_data["project_id"] != expected_project_id:
                log_info(f"Session project ID mismatch: expected {expected_project_id}, got {session_data['project_id']}")
                raise HTTPException(status_code=403, detail="Session does not match project")
                
            # Verify user ID if specified
            if expected_user_id and session_data["user_id"] != expected_user_id:
                log_info(f"Session user ID mismatch: expected {expected_user_id}, got {session_data['user_id']}")
                raise HTTPException(status_code=403, detail="Session does not match user")
                
            return session_data
        except json.JSONDecodeError:
            log_info(f"Failed to parse session data as JSON: {session_data_str[:100]}...")
            raise HTTPException(status_code=500, detail="Invalid session data format")

    async def add_to_conversation(self, session_id: str, query: str, response: Dict[str, Any]) -> bool:
        """
        Add a query-response pair to the conversation history.
        
        Args:
            session_id: The unique session identifier
            query: The user's query
            response: The system's response data
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.redis_pool:
            await self.connect()
            
        try:
            session_data = await self.get_session(session_id)
            
            # Add to conversation history
            conversation = session_data.get("conversation_history", [])
            conversation.append({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "query": query,
                "response": response
            })
            
            # Limit conversation history to last 20 exchanges to prevent bloat
            if len(conversation) > 20:
                conversation = conversation[-20:]
            
            # Update session with new conversation history
            session_data["conversation_history"] = conversation
            session_data["last_updated"] = datetime.now(timezone.utc).isoformat()
            
            # Update in Redis
            await self.redis_pool.setex(
                f"session:{session_id}",
                SESSION_EXPIRY,
                json.dumps(session_data)
            )
            
            return True
        except Exception as e:
            log_info(f"Error adding to conversation: {str(e)}")
            return False
    
    async def add_to_thinking_history(
        self, 
        session_id: str, 
        query: str, 
        thinking: str, 
        has_redacted_thinking: bool = False,
        signature: Optional[str] = None
    ) -> bool:
        """
        Add a thinking entry to the thinking history.
        
        Args:
            session_id: The unique session identifier
            query: The user's query that triggered this thinking
            thinking: The thinking content
            has_redacted_thinking: Whether any part of thinking was redacted
            signature: Optional thinking signature for multi-turn conversations
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.redis_pool:
            await self.connect()
            
        try:
            session_data = await self.get_session(session_id)
            
            # Ensure thinking_history exists
            if "thinking_history" not in session_data:
                session_data["thinking_history"] = []
                
            # Add entry to thinking history
            thinking_entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "query": query,
                "thinking": thinking,
                "has_redacted_thinking": has_redacted_thinking
            }
            
            session_data["thinking_history"].append(thinking_entry)
            
            # Update redacted thinking counter if needed
            if has_redacted_thinking:
                session_data["redacted_thinking_count"] = session_data.get("redacted_thinking_count", 0) + 1
            
            # Store signature if provided
            if signature:
                # Store by query timestamp for retrieval 
                session_data["thinking_signatures"][thinking_entry["timestamp"]] = signature
            
            # Limit thinking history to most recent 10 entries to prevent bloat
            if len(session_data["thinking_history"]) > 10:
                # Get timestamps to remove
                removed_timestamps = [entry["timestamp"] for entry in session_data["thinking_history"][:-10]]
                # Remove associated signatures
                for timestamp in removed_timestamps:
                    if timestamp in session_data["thinking_signatures"]:
                        del session_data["thinking_signatures"][timestamp]
                # Keep only the most recent 10 entries
                session_data["thinking_history"] = session_data["thinking_history"][-10:]
            
            # Update last_updated
            session_data["last_updated"] = datetime.now(timezone.utc).isoformat()
            
            # Update in Redis
            await self.redis_pool.setex(
                f"session:{session_id}",
                SESSION_EXPIRY,
                json.dumps(session_data)
            )
            
            return True
        except Exception as e:
            log_info(f"Error adding to thinking history: {str(e)}")
            return False
    
    async def get_thinking_history(self, session_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get the thinking history for a session.
        
        Args:
            session_id: The unique session identifier
            limit: Maximum number of thinking entries to return
            
        Returns:
            List of thinking entries, most recent first
            
        Raises:
            HTTPException: If session is not found
        """
        session_data = await self.get_session(session_id)
        history = session_data.get("thinking_history", [])
        
        # Return most recent entries first
        return list(reversed(history[-limit:]))
    
    async def get_thinking_signatures(self, session_id: str) -> Dict[str, str]:
        """
        Get the thinking signatures for a session.
        
        Args:
            session_id: The unique session identifier
            
        Returns:
            Dict mapping timestamps to signatures
            
        Raises:
            HTTPException: If session is not found
        """
        session_data = await self.get_session(session_id)
        return session_data.get("thinking_signatures", {})
    
    async def update_diagram_state(self, session_id: str, diagram_state: Dict[str, Any]) -> bool:
        """
        Update the diagram state in the session.
        
        Args:
            session_id: The unique session identifier
            diagram_state: The new diagram state
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.redis_pool:
            await self.connect()
            
        try:
            session_data = await self.get_session(session_id)
            
            # Validate diagram state structure
            if not isinstance(diagram_state, dict):
                raise ValueError("Invalid diagram state format")
                
            # Ensure nodes and edges exist
            if "nodes" not in diagram_state:
                diagram_state["nodes"] = []
            if "edges" not in diagram_state:
                diagram_state["edges"] = []
            
            # Update diagram state
            session_data["diagram_state"] = diagram_state
            session_data["last_updated"] = datetime.now(timezone.utc).isoformat()
            
            # Update in Redis
            await self.redis_pool.setex(
                f"session:{session_id}",
                SESSION_EXPIRY,
                json.dumps(session_data)
            )
            
            return True
        except Exception as e:
            log_info(f"Error updating diagram state: {str(e)}")
            return False
    
    async def update_session(
        self, 
        session_id: str, 
        user_query: Optional[str] = None,
        system_response: Optional[Dict[str, Any]] = None,
        diagram_state: Optional[Dict[str, Any]] = None,
        thinking_data: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Update session data with new conversation entry, diagram state, and/or thinking data.
        
        Args:
            session_id: The unique session identifier
            user_query: User's query message
            system_response: System's response to the query
            diagram_state: New diagram state to save
            thinking_data: Thinking data including content, signature, etc.
            
        Raises:
            HTTPException: If session update fails
        """
        if not self.redis_pool:
            await self.connect()
            
        try:
            session_data = await self.get_session(session_id)
            current_time = datetime.now(timezone.utc).isoformat()
            session_data["last_updated"] = current_time

            # Add conversation entry if both query and response are provided
            if user_query and system_response:
                conversation_entry = {
                    "timestamp": current_time,
                    "user": user_query,
                    "system": system_response
                }
                
                # Initialize conversation_history if it doesn't exist
                if "conversation_history" not in session_data:
                    session_data["conversation_history"] = []
                    
                # Limit conversation history to most recent 50 exchanges
                session_data["conversation_history"].append(conversation_entry)
                if len(session_data["conversation_history"]) > 50:
                    session_data["conversation_history"] = session_data["conversation_history"][-50:]

            # Add thinking data if provided
            if thinking_data and isinstance(thinking_data, dict):
                # Initialize thinking_history if it doesn't exist
                if "thinking_history" not in session_data:
                    session_data["thinking_history"] = []
                
                thinking_entry = {
                    "timestamp": current_time,
                    "query": user_query or "",
                    "thinking": thinking_data.get("thinking", ""),
                    "has_redacted_thinking": thinking_data.get("has_redacted_thinking", False)
                }
                
                session_data["thinking_history"].append(thinking_entry)
                
                # Update redacted thinking counter if needed
                if thinking_data.get("has_redacted_thinking", False):
                    session_data["redacted_thinking_count"] = session_data.get("redacted_thinking_count", 0) + 1
                
                # Store signature if provided
                if "signature" in thinking_data:
                    # Ensure thinking_signatures exists
                    if "thinking_signatures" not in session_data:
                        session_data["thinking_signatures"] = {}
                    
                    session_data["thinking_signatures"][current_time] = thinking_data["signature"]
                
                # Limit thinking history to most recent 10 entries to prevent bloat
                if len(session_data["thinking_history"]) > 10:
                    # Get timestamps to remove
                    removed_timestamps = [entry["timestamp"] for entry in session_data["thinking_history"][:-10]]
                    # Remove associated signatures
                    for timestamp in removed_timestamps:
                        if "thinking_signatures" in session_data and timestamp in session_data["thinking_signatures"]:
                            del session_data["thinking_signatures"][timestamp]
                    # Keep only the most recent 10 entries
                    session_data["thinking_history"] = session_data["thinking_history"][-10:]

            # Update diagram state if provided
            if diagram_state is not None:
                # Validate diagram state structure
                if not isinstance(diagram_state, dict):
                    raise HTTPException(status_code=400, detail="Invalid diagram state format")
                    
                # Ensure nodes and edges exist
                if "nodes" not in diagram_state:
                    diagram_state["nodes"] = []
                if "edges" not in diagram_state:
                    diagram_state["edges"] = []
                    
                session_data["diagram_state"] = diagram_state

            # Save updated session
            await self.redis_pool.setex(
                f"session:{session_id}",
                SESSION_EXPIRY,
                json.dumps(session_data)
            )
            log_info(f"Updated session {session_id}")
            
        except Exception as e:
            log_info(f"Failed to update session {session_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to update session: {str(e)}")

    async def extend_session_ttl(self, session_id: str, ttl_seconds: int = SESSION_EXPIRY) -> None:
        """
        Extend the time-to-live (TTL) of a session.
        
        Args:
            session_id: The unique session identifier
            ttl_seconds: New TTL in seconds (default from settings)
        
        Raises:
            HTTPException: If session does not exist
        """
        if not self.redis_pool:
            await self.connect()
            
        if not await self.redis_pool.exists(f"session:{session_id}"):
            log_info(f"Session {session_id} not found for TTL extension")
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found or expired")
            
        await self.redis_pool.expire(f"session:{session_id}", ttl_seconds)
        log_info(f"Extended TTL for session {session_id} to {ttl_seconds} seconds")

    async def delete_session(self, session_id: str) -> None:
        """
        Delete a session from Redis.
        
        Args:
            session_id: The unique session identifier
            
        Returns:
            None
            
        Raises:
            HTTPException: If deletion fails
        """
        if not self.redis_pool:
            await self.connect()
            
        try:
            deleted = await self.redis_pool.delete(f"session:{session_id}")
            if deleted:
                log_info(f"Deleted session {session_id}")
            else:
                log_info(f"Session {session_id} not found for deletion")
        except Exception as e:
            log_info(f"Error deleting session {session_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")
    
    async def add_classification_metadata(self, session_id: str, metadata: Dict[str, Any]) -> bool:
        """
        Add classification metadata to the session for analysis and continuous learning.
        
        Args:
            session_id: The unique session identifier
            metadata: Classification metadata to store
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.redis_pool:
            await self.connect()
            
        try:
            session_data = await self.get_session(session_id)
            
            # Ensure classification_metadata exists
            if "classification_metadata" not in session_data:
                session_data["classification_metadata"] = []
                
            # Add metadata entry
            session_data["classification_metadata"].append(metadata)
            
            # Limit metadata history to most recent 50 entries to prevent bloat
            if len(session_data["classification_metadata"]) > 50:
                session_data["classification_metadata"] = session_data["classification_metadata"][-50:]
            
            # Update last_updated
            session_data["last_updated"] = datetime.now(timezone.utc).isoformat()
            
            # Update in Redis
            await self.redis_pool.setex(
                f"session:{session_id}",
                SESSION_EXPIRY,
                json.dumps(session_data)
            )
            
            return True
        except Exception as e:
            log_info(f"Error adding classification metadata: {str(e)}")
            return False
    
    async def add_intent_feedback(self, session_id: str, feedback: Dict[str, Any]) -> bool:
        """
        Add user feedback on intent classification for continuous learning.
        
        Args:
            session_id: The unique session identifier
            feedback: Feedback information containing predicted and correct intents
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.redis_pool:
            await self.connect()
            
        try:
            session_data = await self.get_session(session_id)
            
            # Ensure feedback_history exists
            if "feedback_history" not in session_data:
                session_data["feedback_history"] = []
                
            # Add timestamp to feedback
            feedback["timestamp"] = datetime.now(timezone.utc).isoformat()
            
            # Add feedback entry
            session_data["feedback_history"].append(feedback)
            
            # Limit feedback history to most recent 20 entries to prevent bloat
            if len(session_data["feedback_history"]) > 20:
                session_data["feedback_history"] = session_data["feedback_history"][-20:]
            
            # Update last_updated
            session_data["last_updated"] = datetime.now(timezone.utc).isoformat()
            
            # Update in Redis
            await self.redis_pool.setex(
                f"session:{session_id}",
                SESSION_EXPIRY,
                json.dumps(session_data)
            )
            
            return True
        except Exception as e:
            log_info(f"Error adding intent feedback: {str(e)}")
            return False
    
    async def get_classification_metadata(self, session_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get the classification metadata for a session.
        
        Args:
            session_id: The unique session identifier
            limit: Maximum number of metadata entries to return
            
        Returns:
            List of classification metadata, most recent first
            
        Raises:
            HTTPException: If session is not found
        """
        session_data = await self.get_session(session_id)
        metadata = session_data.get("classification_metadata", [])
        
        # Return most recent entries first
        return list(reversed(metadata[-limit:]))
    
    async def get_intent_feedback_history(self, session_id: str) -> List[Dict[str, Any]]:
        """
        Get the intent feedback history for a session.
        
        Args:
            session_id: The unique session identifier
            
        Returns:
            List of feedback entries, most recent first
            
        Raises:
            HTTPException: If session is not found
        """
        session_data = await self.get_session(session_id)
        feedback = session_data.get("feedback_history", [])
        
        # Return most recent entries first
        return list(reversed(feedback))

            
    @asynccontextmanager
    async def session_context(self, session_id: str, expected_project_id: Optional[str] = None) -> AsyncIterator[Dict[str, Any]]:
        """
        Context manager for working with a session that automatically extends TTL.
        
        Args:
            session_id: The unique session identifier
            expected_project_id: Optional project ID to verify
            
        Yields:
            Dict containing session data
            
        Example:
            async with session_manager.session_context("session-id") as session:
                # Work with session data
                print(session["conversation_history"])
        """
        if not self.redis_pool:
            await self.connect()
            
        session_data = await self.get_session(session_id, expected_project_id)
        try:
            yield session_data
        finally:
            # Extend TTL after working with the session
            await self.extend_session_ttl(session_id)
    
    async def get_conversation_history(self, session_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get the conversation history for a session.
        
        Args:
            session_id: The unique session identifier
            limit: Maximum number of conversation entries to return (default 20)
            
        Returns:
            List of conversation entries, most recent first
            
        Raises:
            HTTPException: If session is not found
        """
        session_data = await self.get_session(session_id)
        history = session_data.get("conversation_history", [])
        
        # Return most recent entries first
        return list(reversed(history[-limit:]))
