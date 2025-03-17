import base64
from fastapi.security import OAuth2PasswordBearer
from fastapi import HTTPException, Header
from config.settings import SUPABASE_SECRET_KEY, SUPABASE_API_KEY
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from utils.logger import log_info
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from core.db.supabase_db import get_supabase_client, run_supabase_async, safe_supabase_operation
import traceback
import jwt
from fastapi import Depends
from fastapi.security import APIKeyHeader

app = FastAPI()

ALGORITHM = "HS256"


async def verify_token(authorization: str = Header(None)):
    """
    Get authenticated user based on JWT token.
    
    Args:
        Authorization header with token
        
    Returns:
        User data dictionary
        
    Raises:
        HTTPException: If authentication fails
    """
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Missing token")
    
        # log_info(f"Authorization: {authorization}")
        token = authorization.split(" ")[1]
        token = str(token)
        # log_info(f"Token: {token}")

        # log_info(f"SUPABASE_SECRET_KEY: {SUPABASE_SECRET_KEY}")

        # Ensure SUPABASE_SECRET_KEY is set and is a string
        if not SUPABASE_SECRET_KEY or not isinstance(SUPABASE_SECRET_KEY, str):
            # log_info(f"SUPABASE_SECRET_KEY is invalid: type={type(SUPABASE_SECRET_KEY)}, value={SUPABASE_SECRET_KEY}")
            raise HTTPException(status_code=500, detail="Server configuration error: Missing or invalid secret key")

        # Verify the JWT using the secret from environment variables
        try:
            # jwt_secret = base64.b64decode(SUPABASE_SECRET_KEY)
            payload = jwt.decode(token, SUPABASE_SECRET_KEY, algorithms=["HS256"], audience="authenticated")
            # log_info(f"Payload: {payload}")
        except ExpiredSignatureError:
            log_info("Token verification failed: Token expired")
            raise HTTPException(status_code=401, detail="Token expired")
        except InvalidTokenError as e:
            log_info(f"Token verification failed: Invalid token - {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid token")

        # Extract the Supabase user ID (assumed to be in the 'sub' claim)
        user_id = payload.get("sub")
        if not user_id:
            log_info("Token payload missing user ID")
            raise HTTPException(status_code=401, detail="Invalid token payload: Missing user ID")
        
        log_info(f"Token valid for Supabase user ID: {user_id}")

        # Use Supabase client to fetch the user data from your 'users' table
        # supabase = get_supabase_client()
        # log_info(f"Supabase: {supabase}")

        # def user_operation():
        #     return supabase.from_("auth.users").select("*").eq("id", user_id).execute()

        # user_response = await safe_supabase_operation(
        #     user_operation,
        #     "Failed to fetch user data"
        # )
        # log_info(f"User response: {user_response}")

        # if not user_response.data:
        #     log_info(f"User not found in database for Supabase ID: {user_id}")
        #     raise HTTPException(status_code=404, detail="User not found in database")

        return user_id

    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions
        raise http_exc
    except Exception as e:
        # Catch any unexpected exceptions, log them, and return a generic error
        log_info(f"Unexpected error in verify token authentication: {str(e)}")
        log_info(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Authentication system error")


api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
async def verify_api_key(api_key: str = Depends(api_key_header)):
    if api_key != SUPABASE_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key