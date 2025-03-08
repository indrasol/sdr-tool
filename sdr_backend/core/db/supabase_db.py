from supabase import create_client, Client
from config.settings import SUPABASE_PROJECT_URL, SUPABASE_API_KEY
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from utils.logger import log_info
from functools import lru_cache
import asyncio
from concurrent.futures import ThreadPoolExecutor
# supabase: Client = create_client(SUPABASE_PROJECT_URL, SUPABASE_API_KEY)


# engine = create_engine(SUPABASE_URL)
# sessionlocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base = declarative_base()

# Global thread pool for running Supabase operations asynchronously
thread_pool = ThreadPoolExecutor()

# Initialize Supabase client
@lru_cache
def get_supabase_client():
    return create_client(SUPABASE_PROJECT_URL, SUPABASE_API_KEY)

# Helper to run Supabase operations asynchronously
async def run_supabase_async(func):
    return await asyncio.get_event_loop().run_in_executor(
        thread_pool, func
    )

# Helper for safer Supabase operations with error handling
async def safe_supabase_operation(operation, error_message="Supabase operation failed"):
    try:
        return await run_supabase_async(operation)
    except Exception as e:
        log_info(f"{error_message}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"{error_message}: {str(e)}")

