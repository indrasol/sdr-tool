# # core/db/connection_manager.py
# from databases import Database
# # from models.db_schema_models import Base
# from models.db_schema_models import *
# from sqlalchemy import create_engine
# from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
# from sqlalchemy.orm import sessionmaker
# from config.settings import SUPABASE_URL
# import asyncpg
# from sqlalchemy.dialects.postgresql.asyncpg import AsyncAdapt_asyncpg_cursor


# # SQLite database URL for async (using aiosqlite)
# # SQLITE_DATABASE_URL = "sqlite+aiosqlite:///./securetrack.db"

# # Postgres database URL - async (using asyncpg)
# SUPABASE_URL = "postgresql://postgres.yinltryamlaidmexpvnx:SecureTrack2025@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# # Create an async engine
# engine = create_async_engine(SUPABASE_URL, echo=True) # In prod echo to be set to False

# # Create an async session factory
# async_session = sessionmaker(
#     engine, class_=AsyncSession, expire_on_commit=False
# )


# # Dependency to provide a session for each request
# async def get_db():
#     async with async_session() as session:
#         yield session

# async def create_tables():
#     async with engine.begin() as conn:
#         await conn.run_sync(Base.metadata.create_all)


# create_tables()
# # # Create the async database instance
# # database = Database(SQLITE_DATABASE_URL)





# # Functions to connect and disconnect the database
# # async def connect_db():
# #     await database.connect()

# # async def disconnect_db():
# #     await database.disconnect()


# # Dependency to get the database instance
# # async def get_db():
# #     return database

# # # Create tables synchronously once (SQLite limitation with async)
# # def create_tables():
# #     # Use synchronous SQLAlchemy to create tables initially
# #     sync_engine = create_engine(
# #         "sqlite:///./securetrack.db",
# #         connect_args={"check_same_thread": False}
# #     )
# #     Base.metadata.create_all(bind=sync_engine)