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
import time
import datetime

app = FastAPI()

ALGORITHM = "HS256"


async def verify_token(authorization: str = Header(None), is_registration: bool = False):
    """
    Get authenticated user based on JWT token.
    
    Args:
        authorization: Authorization header with token
        is_registration: Whether this token verification is for registration endpoint
        
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

        # Log current server time for debugging
        current_timestamp = int(time.time())
        current_time = datetime.datetime.fromtimestamp(current_timestamp).strftime('%Y-%m-%d %H:%M:%S')
        log_info(f"Current server time: {current_time} (timestamp: {current_timestamp})")

        # Decode token payload without verification to check timestamps
        try:
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            token_iat = unverified_payload.get("iat", 0)
            token_exp = unverified_payload.get("exp", 0)
            token_iat_time = datetime.datetime.fromtimestamp(token_iat).strftime('%Y-%m-%d %H:%M:%S')
            token_exp_time = datetime.datetime.fromtimestamp(token_exp).strftime('%Y-%m-%d %H:%M:%S')
            
            log_info(f"Token iat: {token_iat_time} (timestamp: {token_iat})")
            log_info(f"Token exp: {token_exp_time} (timestamp: {token_exp})")
            log_info(f"Time difference: {token_iat - current_timestamp} seconds")
        except Exception as e:
            log_info(f"Could not decode token payload for time comparison: {str(e)}")

        # log_info(f"SUPABASE_SECRET_KEY: {SUPABASE_SECRET_KEY}")

        # Ensure SUPABASE_SECRET_KEY is set and is a string
        if not SUPABASE_SECRET_KEY or not isinstance(SUPABASE_SECRET_KEY, str):
            # log_info(f"SUPABASE_SECRET_KEY is invalid: type={type(SUPABASE_SECRET_KEY)}, value={SUPABASE_SECRET_KEY}")
            raise HTTPException(status_code=500, detail="Server configuration error: Missing or invalid secret key")

        # Verify the JWT using the secret from environment variables
        # log_info(f"Secret Key : {SUPABASE_SECRET_KEY}")
        try:
            # jwt_secret = base64.b64decode(SUPABASE_SECRET_KEY)
            payload = jwt.decode(token, SUPABASE_SECRET_KEY, algorithms=["HS256"], audience="authenticated", options={"leeway": 10, "verify_iat":False})
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
        supabase = get_supabase_client()
        # log_info(f"Supabase: {supabase}")

        def user_operation():
            return supabase.from_("users").select("*").eq("id", user_id).execute()

        user_response = await safe_supabase_operation(
            user_operation,
            "Failed to fetch user data"
        )
        # log_info(f"User response: {user_response}")

        # For registration endpoint, we allow users that exist in Auth but not in our database
        if is_registration and not user_response.data:
            log_info(f"User not found in database, but allowed for registration endpoint: {user_id}")
            # Return minimal user data for registration process
            return {"id": user_id}

        if not user_response.data:
            log_info(f"User not found in database for Supabase ID: {user_id}")
            raise HTTPException(status_code=404, detail="User not found in database")

        # Get user data
        user_data = user_response.data[0]
        
        # Fetch tenant ID from user_tenant_association table
        def user_tenant_operation():
            return supabase.from_("user_tenant_association").select("tenant_id").eq("user_id", user_id).execute()

        user_tenant_response = await safe_supabase_operation(
            user_tenant_operation,
            "Failed to fetch user tenant data"
        )
        
        # Extract tenant ID if available
        tenant_id = None
        if user_tenant_response.data and len(user_tenant_response.data) > 0:
            tenant_id = user_tenant_response.data[0].get("tenant_id")
            log_info(f"Found tenant ID for user {user_id}: {tenant_id}")
        else:
            log_info(f"No tenant ID found for user {user_id}")
            
        # Fetch team ID from team_members table (default to the first one found)
        def user_team_operation():
            return supabase.from_("team_members").select("team_id").eq("user_id", user_id).execute()
            
        user_team_response = await safe_supabase_operation(
            user_team_operation,
            "Failed to fetch user team data"
        )
        
        # Extract team ID if available (use the first one as default)
        team_id = None
        if user_team_response.data and len(user_team_response.data) > 0:
            team_id = user_team_response.data[0].get("team_id")
            log_info(f"Found team ID for user {user_id}: {team_id}")
        else:
            log_info(f"No team ID found for user {user_id}")

        # Return a dictionary with user_id, username, tenant_id and team_id
        return {
            "id": user_id,
            "username": user_data["username"],
            "tenantId": tenant_id,  # Match the camelCase used in frontend
            "teamId": team_id       # Match the camelCase used in frontend
        }

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
