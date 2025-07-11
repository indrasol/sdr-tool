from __future__ import annotations

"""services/notification_manager.py

Centralised notification fan-out for Design-Service v2.
Keeps an in-memory mapping of WebSocket connections per user and offers a
single *add_notification()* helper that both inserts the Notification row
into Postgres **and** pushes the event to all live WebSocket clients.

This avoids every route re-implementing WebSocket bookkeeping.
"""

from typing import Dict, Set, Any
from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from models.db_schema_models_v2 import Notification
from utils.logger import log_info


class NotificationManager:
    """Singleton-style manager for WebSocket notification pushes."""

    def __init__(self) -> None:
        # user_id -> set[WebSocket]
        self._clients: Dict[str, Set[WebSocket]] = {}

    # ------------------------------------------------------------------
    #  WebSocket lifecycle helpers
    # ------------------------------------------------------------------

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        """Register and accept a new websocket for *user_id*."""
        await websocket.accept()
        self._clients.setdefault(user_id, set()).add(websocket)
        log_info(f"[notif] WS connect u={user_id} – {len(self._clients[user_id])} sockets")

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        """Remove a websocket; called on close/error."""
        conns = self._clients.get(user_id)
        if conns and websocket in conns:
            conns.discard(websocket)
            log_info(f"[notif] WS disconnect u={user_id} – {len(conns)} left")
            if not conns:
                # house-keeping: drop empty sets
                self._clients.pop(user_id, None)

    async def _push(self, user_id: str, message: Dict[str, Any]) -> None:
        """Send *message* JSON to all open sockets of *user_id*."""
        conns = list(self._clients.get(user_id, set()))
        for ws in conns:
            try:
                await ws.send_json(message)
            except WebSocketDisconnect:
                self.disconnect(user_id, ws)
            except Exception as e:
                log_info(f"[notif] push failed – dropping socket: {e}")
                self.disconnect(user_id, ws)

    # ------------------------------------------------------------------
    #  Public convenience – create + broadcast
    # ------------------------------------------------------------------

    async def add_notification(
        self,
        db: AsyncSession,
        user_id: str,
        project_id: str | None,
        notif_type: str,
        payload_json: Dict[str, Any] | None = None,
    ) -> None:
        """Persist and broadcast a notification event."""

        try:
            notif = Notification(
                user_id=user_id,
                project_id=project_id,
                type=notif_type,
                payload_json=payload_json or {},
            )
            db.add(notif)
            await db.commit()
        except Exception as e:
            log_info(f"[notif] DB insert failed – proceeding with push only: {e}")

        await self._push(user_id, {"type": notif_type, "payload": payload_json or {}})


# Global singleton -----------------------------------------------------------
notification_manager = NotificationManager() 