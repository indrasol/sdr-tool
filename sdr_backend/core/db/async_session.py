from __future__ import annotations

"""core/db/async_session.py

Central place that exposes an *AsyncSession* factory for FastAPI
routes.  Keeps engine configuration in one location so Alembic and the
application share the same DATABASE_URL.
"""

import os
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from config.settings import SUPABASE_DATABASE_URL

DATABASE_URL = SUPABASE_DATABASE_URL
print("--------------------------------")
print(f"DATABASE_URL: {DATABASE_URL}")
print("--------------------------------")
# if not DATABASE_URL:
    # Fallback for local dev – an in-memory sqlite DB
    # DATABASE_URL = "sqlite+aiosqlite:///./dev.db"

# echo can be toggled via env var for SQL logging
engine = create_async_engine(
    DATABASE_URL,
    # echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    echo=False,
    future=True,
    pool_pre_ping=True,
)

async_session_factory = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# FastAPI dependency helper
async def get_db() -> AsyncIterator[AsyncSession]:
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close() 