import aioredis
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional, Any, List, AsyncContextManager, AsyncIterator, Tuple
from contextlib import asynccontextmanager
from fastapi import HTTPException
from utils.logger import log_info
from config.settings import REDIS_DB, REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, SESSION_EXPIRY
from core.db.supabase_db import get_supabase_client, safe_supabase_operation


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
        This will create the session in both Redis and Supabase.
        
        Args:
            user_id: The authenticated user's ID
            project_id: The project's ID
        
        Returns:
            str: Unique session ID
        """
        if not self.redis_pool:
            await self.connect()
            
        # Generate a unique session ID
        session_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()

        # Create Redis session data
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
            # 1. Create the session in Redis
            await self.redis_pool.setex(
                f"session:{session_id}",
                SESSION_EXPIRY,  # 24-hour TTL
                json.dumps(session_data)
            )
            
            # 2. Also persist session metadata in Supabase for long-term tracking
            supabase = get_supabase_client()
            
            def create_session_record():
                return supabase.from_("sessions").insert({
                    "session_id": session_id,
                    "user_id": user_id,
                    "project_id": project_id,
                    "created_at": timestamp,
                    "last_accessed": timestamp,
                    "is_active": True
                }).execute()
                
            await safe_supabase_operation(
                create_session_record,
                f"Failed to create session record in Supabase for session {session_id}"
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
            log_info(f"Session {session_id} not found or expired in Redis")
            
            # Attempt to check if this is a valid session in Supabase
            try:
                supabase = get_supabase_client()
                
                def check_session():
                    return supabase.from_("sessions").select("*").eq("session_id", session_id).eq("is_active", True).execute()
                
                session_check = await safe_supabase_operation(
                    check_session,
                    f"Failed to check session {session_id} in Supabase"
                )
                
                if session_check.data and len(session_check.data) > 0:
                    log_info(f"Session {session_id} found in Supabase but expired in Redis. Recreating Redis session.")
                    
                    session_record = session_check.data[0]
                    user_id = session_record["user_id"]
                    project_id = session_record["project_id"]
                    
                    # Create a fresh Redis session
                    fresh_session_data = {
                        "user_id": user_id,
                        "project_id": project_id,
                        "created_at": session_record["created_at"],
                        "last_updated": datetime.now(timezone.utc).isoformat(),
                        "conversation_history": [],  # Empty as we'll reload this from DB
                        "diagram_state": {},  # Empty as we'll reload this from DB
                        "thinking_history": [],
                        "thinking_signatures": {},
                        "redacted_thinking_count": 0,
                        "classification_metadata": [],
                        "feedback_history": []
                    }
                    
                    await self.redis_pool.setex(
                        f"session:{session_id}",
                        SESSION_EXPIRY,
                        json.dumps(fresh_session_data)
                    )
                    
                    # Update last_accessed in Supabase
                    def update_last_accessed():
                        return supabase.from_("sessions").update({
                            "last_accessed": datetime.now(timezone.utc).isoformat()
                        }).eq("session_id", session_id).execute()
                    
                    await safe_supabase_operation(
                        update_last_accessed,
                        f"Failed to update last_accessed for session {session_id}"
                    )
                    
                    return fresh_session_data
                else:
                    log_info(f"Session {session_id} not found in Supabase")
                    raise HTTPException(status_code=404, detail=f"Session {session_id} not found or expired")
            except HTTPException:
                raise
            except Exception as e:
                log_info(f"Error checking session in Supabase: {str(e)}")
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
            
            # Log conversation history info for debugging
            conversation_history = session_data.get("conversation_history", [])
            if conversation_history:
                log_info(f"Session {session_id} has {len(conversation_history)} messages in conversation history")
                # Check if we have id-based messages or old format
                has_ids = any("id" in msg for msg in conversation_history if isinstance(msg, dict))
                log_info(f"Conversation format - Has IDs: {has_ids}")
            
            # Update last_accessed in Supabase
            try:
                supabase = get_supabase_client()
                
                def update_last_accessed():
                    return supabase.from_("sessions").update({
                        "last_accessed": datetime.now(timezone.utc).isoformat()
                    }).eq("session_id", session_id).execute()
                
                await safe_supabase_operation(
                    update_last_accessed,
                    f"Failed to update last_accessed for session {session_id}"
                )
            except Exception as e:
                # Non-critical error, just log it
                log_info(f"Failed to update last_accessed for session {session_id} in Supabase: {str(e)}")
                
            return session_data
        except json.JSONDecodeError:
            log_info(f"Failed to parse session data as JSON: {session_data_str[:100]}...")
            raise HTTPException(status_code=500, detail="Invalid session data format")

    async def add_to_conversation(self, session_id: str, query: str, response: Dict[str, Any], diagram_state: Optional[Dict[str, Any]] = None, changed: bool = False) -> bool:
        """
        Add a query-response pair to the conversation history.
        
        Args:
            session_id: The unique session identifier
            query: The user's query
            response: The system's response data
            diagram_state: Current diagram state after applying changes (optional)
            changed: Flag indicating if the diagram was modified (optional)
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.redis_pool:
            await self.connect()
            
        try:
            session_data = await self.get_session(session_id)
            
            # Add to conversation history
            conversation = session_data.get("conversation_history", [])
            
            # Get the current conversation length for logging
            original_length = len(conversation)
            
            # Generate unique message IDs for the conversation pair
            last_id = 0
            if conversation and isinstance(conversation[-1], dict) and "id" in conversation[-1]:
                last_id = conversation[-1]["id"]
            
            # User message with ID
            user_message = {
                "id": last_id + 1,
                "role": "user",
                "content": query,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            # AI response with ID, diagram state and changed flag
            ai_response = {
                "id": last_id + 2,
                "role": "assistant",
                "content": response.get("message", ""),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            # Add diagram state and changed flag if provided
            if diagram_state:
                ai_response["diagram_state"] = diagram_state
                ai_response["changed"] = changed
            
            # Log every message addition to debug communication history issues
            log_info(f"Adding user message {user_message['id']} to session {session_id}: {query[:30]}...")
            log_info(f"Adding AI response {ai_response['id']} to session {session_id}: {ai_response['content'][:30]}...")
            
            # Add both messages to conversation history
            conversation.append(user_message)
            conversation.append(ai_response)
            
            # Ensure sorted order by ID
            conversation.sort(key=lambda x: x.get("id", 0) if isinstance(x, dict) and "id" in x else 0)
            
            # Limit conversation history to last 20 exchanges to prevent bloat
            if len(conversation) > 40:  # 20 exchanges = 40 messages
                original_length = len(conversation)
                conversation = conversation[-40:]
                log_info(f"Trimmed conversation history from {original_length} to {len(conversation)} messages")
            
            # Update session with new conversation history
            session_data["conversation_history"] = conversation
            session_data["last_updated"] = datetime.now(timezone.utc).isoformat()
            
            # Log the change in conversation length
            log_info(f"Session {session_id} conversation history: {original_length} -> {len(conversation)} messages")
            
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
        Extend the time-to-live (TTL) of a session in Redis and update last_accessed in Supabase.
        
        Args:
            session_id: The unique session identifier
            ttl_seconds: New TTL in seconds (default from settings)
        
        Raises:
            HTTPException: If session does not exist
        """
        if not self.redis_pool:
            await self.connect()
            
        if not await self.redis_pool.exists(f"session:{session_id}"):
            log_info(f"Session {session_id} not found in Redis for TTL extension")
            
            # Check if session exists in Supabase
            try:
                supabase = get_supabase_client()
                
                def check_session():
                    return supabase.from_("sessions").select("*").eq("session_id", session_id).eq("is_active", True).execute()
                
                session_check = await safe_supabase_operation(
                    check_session,
                    f"Failed to check session {session_id} in Supabase"
                )
                
                if not session_check.data or len(session_check.data) == 0:
                    raise HTTPException(status_code=404, detail=f"Session {session_id} not found or expired")
                
                # Session exists in Supabase but not in Redis - this will be handled by get_session
                log_info(f"Session {session_id} found in Supabase but not in Redis. Will be recreated when accessed.")
                return
            except HTTPException:
                raise
            except Exception as e:
                log_info(f"Error checking session in Supabase: {str(e)}")
                raise HTTPException(status_code=404, detail=f"Session {session_id} not found or expired")
            
        # Extend Redis TTL
        await self.redis_pool.expire(f"session:{session_id}", ttl_seconds)
        
        # Update last_accessed in Supabase
        try:
            supabase = get_supabase_client()
            
            def update_last_accessed():
                return supabase.from_("sessions").update({
                    "last_accessed": datetime.now(timezone.utc).isoformat()
                }).eq("session_id", session_id).execute()
            
            await safe_supabase_operation(
                update_last_accessed,
                f"Failed to update last_accessed for session {session_id}"
            )
            
            log_info(f"Extended TTL for session {session_id} to {ttl_seconds} seconds and updated last_accessed")
        except Exception as e:
            # Non-critical error, just log it
            log_info(f"Failed to update last_accessed for session {session_id} in Supabase: {str(e)}")
            log_info(f"Extended TTL for session {session_id} to {ttl_seconds} seconds in Redis only")

    async def delete_session(self, session_id: str) -> None:
        """
        Delete a session from both Redis and mark it as inactive in Supabase.
        
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
            # Delete from Redis
            deleted = await self.redis_pool.delete(f"session:{session_id}")
            if deleted:
                log_info(f"Deleted session {session_id} from Redis")
            else:
                log_info(f"Session {session_id} not found in Redis for deletion")
            
            # Mark as inactive in Supabase
            supabase = get_supabase_client()
            
            def mark_inactive():
                return supabase.from_("sessions").update({
                    "is_active": False
                }).eq("session_id", session_id).execute()
            
            await safe_supabase_operation(
                mark_inactive,
                f"Failed to mark session {session_id} as inactive in Supabase"
            )
            
            log_info(f"Marked session {session_id} as inactive in Supabase")
        except Exception as e:
            log_info(f"Error deleting session {session_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")

    async def get_active_sessions_for_user(self, user_id: str, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all active sessions for a user, optionally filtered by project.
        
        Args:
            user_id: The user ID to get sessions for
            project_id: Optional project ID to filter by
            
        Returns:
            List of session records from Supabase
        """
        try:
            supabase = get_supabase_client()
            
            def get_sessions():
                query = supabase.from_("sessions").select("*").eq("user_id", user_id).eq("is_active", True)
                if project_id:
                    query = query.eq("project_id", project_id)
                return query.order("last_accessed", desc=True).execute()
            
            sessions_response = await safe_supabase_operation(
                get_sessions,
                f"Failed to get active sessions for user {user_id}"
            )
            
            return sessions_response.data or []
        except Exception as e:
            log_info(f"Error getting active sessions for user {user_id}: {str(e)}")
            return []

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

    async def store_threat_model(self, session_id: str, threat_model: Dict[str, Any], diagram_state: Dict[str, Any]) -> bool:
        """
        Store a generated threat model in the session cache.
        
        Args:
            session_id: The session identifier
            threat_model: The threat model data to store
            diagram_state: The diagram state used to generate the threat model
            
        Returns:
            bool: Whether the operation succeeded
        """
        try:
            if not self.redis_pool:
                await self.connect()
                if not self.redis_pool:
                    log_info(f"Cannot store threat model: Redis pool not available")
                    return False
            
            # Check if session exists
            session_exists = await self.redis_pool.exists(f"session:{session_id}")
            if not session_exists:
                log_info(f"Cannot store threat model: Session {session_id} not found")
                return False
            
            # Store threat model with 30 minute TTL
            threat_model_key = f"threat_model:{session_id}"
            threat_model_json = json.dumps(threat_model)
            await self.redis_pool.setex(
                threat_model_key,
                3600,  # 30 minutes TTL
                threat_model_json
            )
            
            # Store diagram hash for future comparisons
            if diagram_state:
                log_info(f"Storing diagram hash for session {session_id}")
                log_info(f"Diagram state has {len(diagram_state.get('nodes', []))} nodes and {len(diagram_state.get('edges', []))} edges")
                
                # Sanitize the diagram state to ensure consistent hashing
                clean_diagram_state = self._sanitize_diagram_state(diagram_state)
                
                # Serialize the diagram state consistently for hashing
                serialized_diagram = json.dumps(clean_diagram_state, sort_keys=True)
                diagram_hash = hashlib.md5(serialized_diagram.encode()).hexdigest()
                diagram_hash_key = f"diagram_hash:{session_id}"
                
                log_info(f"Generated diagram hash: {diagram_hash}")
                
                await self.redis_pool.setex(
                    diagram_hash_key,
                    3600,  # 30 minutes TTL
                    diagram_hash
                )
            else:
                log_info(f"No diagram state provided to store hash for session {session_id}")
            
            # Extend session TTL
            await self.extend_session_ttl(session_id)
            
            log_info(f"Stored threat model in session {session_id}")
            return True
            
        except Exception as e:
            log_info(f"Error storing threat model in session: {str(e)}")
            return False
            
    def _sanitize_diagram_state(self, diagram_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize diagram state to ensure consistent hashing.
        Removes UI-specific and transient properties.
        
        Args:
            diagram_state: The original diagram state
            
        Returns:
            A cleaned diagram state with only essential properties
        """
        if not diagram_state:
            return {}
            
        # Clean nodes - keep only essential properties
        clean_nodes = []
        for node in diagram_state.get("nodes", []):
            if not node or not isinstance(node, dict):
                continue
                
            clean_node = {
                "id": node.get("id"),
                "type": node.get("type"),
                "position": node.get("position", {})
            }
            
            # Extract essential data properties
            node_data = node.get("data", {})
            if node_data and isinstance(node_data, dict):
                clean_node["data"] = {
                    "label": node_data.get("label"),
                    "description": node_data.get("description"),
                    "nodeType": node_data.get("nodeType")
                }
            
            clean_nodes.append(clean_node)
            
        # Clean edges - keep only essential properties
        clean_edges = []
        for edge in diagram_state.get("edges", []):
            if not edge or not isinstance(edge, dict):
                continue
                
            clean_edge = {
                "id": edge.get("id"),
                "source": edge.get("source"),
                "target": edge.get("target"),
                "type": edge.get("type")
            }
            
            # Only include label if it exists
            if "label" in edge:
                clean_edge["label"] = edge.get("label")
                
            clean_edges.append(clean_edge)
            
        return {
            "nodes": clean_nodes,
            "edges": clean_edges
        }
            
    async def get_threat_model(self, session_id: str, diagram_state: Optional[Dict[str, Any]] = None) -> Tuple[Optional[Dict[str, Any]], bool]:
        """
        Retrieve a stored threat model from the session cache.
        Also checks if the diagram has changed since the threat model was generated.
        
        Args:
            session_id: The session identifier
            diagram_state: Current diagram state to compare with stored hash (optional)
            
        Returns:
            Tuple[Optional[Dict[str, Any]], bool]: The threat model and whether diagram has changed
                - First element is the threat model or None if not found
                - Second element is True if diagram has changed, False otherwise
        """
        try:
            if not self.redis_pool:
                await self.connect()
                if not self.redis_pool:
                    log_info(f"Cannot retrieve threat model: Redis pool not available")
                    return None, True
            
            # Check if session exists
            session_exists = await self.redis_pool.exists(f"session:{session_id}")
            if not session_exists:
                log_info(f"Cannot retrieve threat model: Session {session_id} not found")
                return None, True
            
            # Get threat model from cache
            threat_model_key = f"threat_model:{session_id}"
            cached_model = await self.redis_pool.get(threat_model_key)
            
            if not cached_model:
                log_info(f"No threat model found in session {session_id}")
                return None, True
            
            # Parse the cached model
            threat_model = json.loads(cached_model)
            
            # Check if diagram has changed, if diagram_state is provided
            diagram_changed = True
            
            if diagram_state:
                # Get stored diagram hash
                diagram_hash_key = f"diagram_hash:{session_id}"
                stored_hash = await self.redis_pool.get(diagram_hash_key)
                
                log_info(f"Comparing diagram hashes for session {session_id}")
                log_info(f"Diagram state provided: {bool(diagram_state)} with {len(diagram_state.get('nodes', []))} nodes and {len(diagram_state.get('edges', []))} edges")
                
                if stored_hash:
                    # Sanitize the current diagram state
                    clean_diagram_state = self._sanitize_diagram_state(diagram_state)
                    
                    # Generate hash of current diagram
                    current_hash = hashlib.md5(json.dumps(clean_diagram_state, sort_keys=True).encode()).hexdigest()
                    
                    # Handle the stored hash correctly based on its type
                    stored_hash_str = stored_hash
                    if hasattr(stored_hash, 'decode'):
                        stored_hash_str = stored_hash.decode('utf-8')
                    
                    log_info(f"Stored hash: {stored_hash_str}")
                    log_info(f"Current hash: {current_hash}")
                    log_info(f"Hashes match: {stored_hash_str == current_hash}")
                    
                    # If hashes match, diagram hasn't changed
                    if stored_hash_str == current_hash:
                        log_info(f"Diagram has not changed...")
                        diagram_changed = False
                        log_info(f"Diagram unchanged for session {session_id}")
                    else:
                        log_info(f"Diagram has changed for session {session_id}")
                else:
                    log_info(f"No stored hash found for session {session_id}")
            else:
                log_info(f"No diagram state provided for comparison in session {session_id}")
            
            # Extend session TTL
            await self.extend_session_ttl(session_id)
            
            return threat_model, diagram_changed
            
        except Exception as e:
            log_info(f"Error retrieving threat model from session: {str(e)}")
            return None, True
