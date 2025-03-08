# test_connection.py
import asyncio
import asyncpg
import ssl
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def test_direct_connection():
    """Test direct asyncpg connection to Supabase"""
    try:
        # Base URL without dialect
        base_url = "postgresql://postgres.yinltryamlaidmexpvnx:SecureTrack2025@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
        
        # Construct URL with asyncpg dialect
        url = f"postgresql+asyncpg{base_url[10:]}"
        
        # Create SSL context
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE  # For testing only
        
        # Create engine with SSL settings
        engine = create_async_engine(
            url,
            echo=True,
            connect_args={
                "ssl": ssl_context,
                "server_settings": {
                    "application_name": "SecureTrack"
                }
            }
        )
        
        async with engine.connect() as conn:
            result = await conn.execute(select(1))
            print("Connection successful:", result.scalar())
            
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Explicitly dispose the engine
        await engine.dispose()

asyncio.run(test_direct_connection())