from __future__ import annotations

"""v1/api/routes/notifications.py

WebSocket endpoint that streams notification events to the front-end.
Connect with  `ws(s)://<host>/v1/ws/notifications/{user_id}` from the
client.  Messages are JSON structures:  { type, payload }.
"""

from fastapi import APIRouter, WebSocket, Depends
from fastapi.websockets import WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.notification_manager import notification_manager
from core.db.async_session import async_session_factory
from models.db_schema_models_v2 import Notification

router = APIRouter()


@router.get("/notifications/{user_id}", summary="List recent notifications")
async def list_notifications(user_id: str, limit: int = 20):
    """Return the last *limit* notifications for *user_id* (default 20).

    This helper exists mainly so the Notifications API shows up in the
    OpenAPI docs – the real-time channel is still the WebSocket below.
    """
    async with async_session_factory() as db:
        res = await db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        notifs = res.scalars().all()

    return [
        {
            "id": n.id,
            "type": n.type,
            "payload": n.payload_json,
            "is_read": bool(n.is_read),
            "created_at": n.created_at,
        }
        for n in notifs
    ]


@router.websocket("/ws/notifications/{user_id}")
async def notifications_ws(websocket: WebSocket, user_id: str):
    await notification_manager.connect(user_id, websocket)
    try:
        while True:
            # Keep the connection open; optional ping/pong or waiting for client msg
            await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(user_id, websocket)
    except Exception:
        notification_manager.disconnect(user_id, websocket) 