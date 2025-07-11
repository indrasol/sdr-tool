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
  "last_updated"    : iso str
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
    #  TTL helper
    # ------------------------------------------------------------------

    async def extend_ttl(self, session_id: str, ttl: int = SESSION_EXPIRY):
        await self._ensure()
        await self._pool.expire(f"session:{session_id}", ttl) 