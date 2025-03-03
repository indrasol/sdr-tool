# core/db/connection_manager.py
from databases import Database
from models.db_schema_models import Base
from sqlalchemy import create_engine

# SQLite database URL for async (using aiosqlite)
SQLITE_DATABASE_URL = "sqlite+aiosqlite:///./securetrack.db"

# Postgres database URL for async (using asyncpg)
# POSTGRES_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/securetrack"

# Create the async database instance
database = Database(SQLITE_DATABASE_URL)

# Functions to connect and disconnect the database
async def connect_db():
    await database.connect()

async def disconnect_db():
    await database.disconnect()

# Dependency to get the database instance
async def get_db():
    return database

# Create tables synchronously once (SQLite limitation with async)
def create_tables():
    # Use synchronous SQLAlchemy to create tables initially
    sync_engine = create_engine(
        "sqlite:///./securetrack.db",
        connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=sync_engine)