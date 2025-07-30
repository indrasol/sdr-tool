from __future__ import annotations

"""core/cache/session_manager_v2.py

Light-weight Redis session store for Design-Service v2.
Only stores minimal state required by the front-end between requests –
all heavy data (diagram JSON, conversation, etc.) now lives in Postgres
or Supabase.

Schema (JSON per key ``session:{session_id}``)
------------------------------------------------
{
  "session_id"      : str,             # UUID32
  "project_id"      : str,             # project_code (P123…)
  "last_version_id" : int | null,      # latest Diagram.version persisted
  "pinned_nodes"    : list[str],       # array of node IDs client pinned
  "last_intent"     : str | null,      # last IntentV2 string
  "created_at"      : iso str,
  "last_updated"    : iso str,
  "conversation_history" : list        # array of conversation entries
}

TTL is managed via ``SESSION_EXPIRY`` env (24h default).
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

import redis.asyncio as redis

from utils.logger import log_info
from config.settings import REDIS_HOST, REDIS_PORT, REDIS_DB, REDIS_PASSWORD, SESSION_EXPIRY


class SessionManagerV2:
    """Minimal async Redis session manager for v2 flow."""

    def __init__(
        self,
        redis_host: str = REDIS_HOST,
        redis_port: int = REDIS_PORT,
        redis_db: int = REDIS_DB,
        redis_password: str | None = REDIS_PASSWORD,
    ):
        self.redis_url = f"redis://:{redis_password}@{redis_host}:{redis_port}/{redis_db}"
        self._pool: redis.Redis | None = None

    # ------------------------------------------------------------------
    #  Redis connection helpers
    # ------------------------------------------------------------------

    async def _ensure(self):
        if self._pool is None:
            self._pool = redis.from_url(self.redis_url, decode_responses=True)
            log_info(f"SessionManagerV2 connected to Redis at {self.redis_url}")

    # ------------------------------------------------------------------
    #  CRUD helpers
    # ------------------------------------------------------------------

    async def create_session(self, project_id: str) -> str:
        """Create and store a new session context."""
        await self._ensure()
        session_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        payload = {
            "session_id": session_id,
            "project_id": project_id,
            "last_version_id": None,
            "pinned_nodes": [],
            "last_intent": None,
            "created_at": now,
            "last_updated": now,
            "conversation_history": []
        }
        await self._pool.setex(f"session:{session_id}", SESSION_EXPIRY, json.dumps(payload))
        return session_id

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        await self._ensure()
        raw = await self._pool.get(f"session:{session_id}")
        if not raw:
            return None
        return json.loads(raw)

    async def _update(self, session_id: str, mutator):
        await self._ensure()
        key = f"session:{session_id}"
        raw = await self._pool.get(key)
        if not raw:
            raise KeyError("Session not found")
        data = json.loads(raw)
        # Handle both sync and async mutators
        if hasattr(mutator, '__call__'):
            result = mutator(data)
            # If it's a coroutine, await it
            if hasattr(result, '__await__'):
                await result
        data["last_updated"] = datetime.now(timezone.utc).isoformat()
        await self._pool.setex(key, SESSION_EXPIRY, json.dumps(data))

    # Public update helpers

    async def set_last_version(self, session_id: str, version: int):
        def mut(d):  # Regular function, not async
            d["last_version_id"] = version
        await self._update(session_id, mut)

    async def set_pinned_nodes(self, session_id: str, node_ids: List[str]):
        def mut(d):  # Regular function, not async
            d["pinned_nodes"] = node_ids
        await self._update(session_id, mut)

    async def set_last_intent(self, session_id: str, intent: str):
        def mut(d):  # Regular function, not async
            d["last_intent"] = intent
        await self._update(session_id, mut)

    # ------------------------------------------------------------------
    #  Conversation History Helpers - NEW
    # ------------------------------------------------------------------

    async def append_conversation_entry(self, session_id: str, role: str, content: str):
        """Append a new conversation entry to the session history."""
        now_iso = datetime.now(timezone.utc).isoformat()
        entry = {
            "role": role,
            "content": content,
            "timestamp": now_iso
        }
        
        def mut(d):
            if "conversation_history" not in d:
                d["conversation_history"] = []
            d["conversation_history"].append(entry)
        
        await self._update(session_id, mut)
    
    async def get_conversation_history(self, session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get the last N conversation entries."""
        session_data = await self.get_session(session_id)
        if not session_data or "conversation_history" not in session_data:
            return []
        
        history = session_data.get("conversation_history", [])
        return history[-limit:] if limit > 0 else history

    async def ensure_session(self, session_id: str = None, project_id: str = None) -> str:
        """Ensure a session exists, creating one if needed."""
        if session_id:
            session = await self.get_session(session_id)
            if session:
                return session_id
        
        if not project_id:
            raise ValueError("project_id required when creating a new session")
        
        return await self.create_session(project_id)

    # ------------------------------------------------------------------
    #  DSL Cache helpers (per-project, keyed by SHA1 of query)
    # ------------------------------------------------------------------

    _DSL_CACHE_TTL = 1800  # 30 minutes

    async def _dsl_cache_key(self, project_id: str, query_hash: str) -> str:
        return f"dsl_cache:{project_id}:{query_hash}"

    async def cache_dsl(self, project_id: str, query: str, data: Dict[str, Any]):
        """Cache rendered diagram (DSL + JSON) for the given query."""
        import hashlib, json as _json
        await self._ensure()
        h = hashlib.sha1(query.strip().lower().encode()).hexdigest()
        key = await self._dsl_cache_key(project_id, h)
        await self._pool.setex(key, self._DSL_CACHE_TTL, _json.dumps(data))

    async def get_cached_dsl(self, project_id: str, query: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached diagram for query if exists and not expired."""
        import hashlib, json as _json
        await self._ensure()
        h = hashlib.sha1(query.strip().lower().encode()).hexdigest()
        key = await self._dsl_cache_key(project_id, h)
        raw = await self._pool.get(key)
        if raw:
            try:
                return _json.loads(raw)
            except Exception:
                return None
        return None

    # ------------------------------------------------------------------
    #  TTL helper
    # ------------------------------------------------------------------

    async def extend_ttl(self, session_id: str, ttl: int = SESSION_EXPIRY):
        await self._ensure()
        await self._pool.expire(f"session:{session_id}", ttl) 