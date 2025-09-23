# routers/router.py
from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import supabase
from models.db_schema_models import User, Tenant, UserTenantAssociation
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from sqlalchemy import insert
import re
from models.registration_models import RegisterRequest
from utils.logger import log_info
from services.auth_handler import verify_token, verify_api_key
from config.settings import SUPABASE_SECRET_KEY
from fastapi.security import APIKeyHeader
from functools import partial
import asyncio

router = APIRouter()

# Create a custom verify function specifically for registration
import jwt
from fastapi import Header, HTTPException
from config.settings import SUPABASE_SECRET_KEY
from utils.logger import log_info

async def registration_verify_token(authorization: str = Header(None)):
    """
    Verify JWT token for registration endpoint only.
    
    Args:
        authorization: Authorization header with token
        
    Returns:
        Dict with user ID
        
    Raises:
        HTTPException: If authentication fails
    """
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Missing token")
    
        # Extract token from header
        token = authorization.split(" ")[1]
        
        # Verify the JWT token
        try:
            payload = jwt.decode(
                token, 
                SUPABASE_SECRET_KEY, 
                algorithms=["HS256"], 
                audience="authenticated", 
                options={"leeway": 10, "verify_iat": False}
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
            
        # Extract user ID
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload: Missing user ID")
            
        log_info(f"Registration token valid for user ID: {user_id}")
        
        # Return minimal user data needed for registration
        return {"id": user_id}
        
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        log_info(f"Registration token verification error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication system error")




# Helper function to get or create tenant
async def get_or_create_tenant(tenant_name):
    supabase = get_supabase_client()
    def check_tenant():
        return supabase.from_("tenants") \
            .select("id") \
            .eq("name", tenant_name) \
            .execute()
        
    tenant_response = await safe_supabase_operation(
        check_tenant,
        "Failed to check if tenant exists"
    )
    
    if tenant_response.data:
        return tenant_response.data[0]["id"]
    
    # Create new tenant
    def create_tenant():
        return supabase.from_("tenants") \
            .insert({"name": tenant_name}) \
            .execute()
        
    new_tenant_response = await safe_supabase_operation(
        create_tenant,
        "Failed to create tenant"
    )
    
    tenant_id = new_tenant_response.data[0]["id"]
    log_info(f"Created new tenant: {tenant_name} with ID: {tenant_id}")
    
    return tenant_id

@router.post("/register")
async def register(
    request_data: RegisterRequest,
    current_user: dict = Depends(registration_verify_token)
):
    """
    Register a new user after Supabase authentication and associate with tenant.

    Args:
        request_data: Contains user_id, tenant_name, email, username.
        current_user: Verified user from the token.

    Returns:
        Success message.
    """
    try :
        
        log_info(f"Entered register try block")
        log_info(f"request_data : {request_data}")
        supabase = get_supabase_client()
       # Check if user already exists - checking both user and email in one query
        def check_user_exists():
            return supabase.from_("users") \
                .select("id, username, email") \
                .eq("id", request_data.user_id) \
                .execute()
            
        user_response = await safe_supabase_operation(
            check_user_exists,
            "Failed to check if user exists"
        )
        
        if user_response.data:
            # Determine which condition was matched
            for user in user_response.data:
                if user["id"] == request_data.user_id:
                    raise HTTPException(status_code=400, detail="User already exists")
                if user["username"] == request_data.username:
                    raise HTTPException(status_code=400, detail="Username already taken. Please choose a different one")
                if user["email"] == request_data.email:
                    raise HTTPException(status_code=400, detail="Email already registered! Register with a different email")
        
        # Check or create tenant (using organization_name)
        tenant_id = await get_or_create_tenant(request_data.tenant_name)
        log_info(f"Using tenant with ID: {tenant_id}")

        
        # Create user with provided details
        new_user_data = {
            "id": request_data.user_id,
            "username": request_data.username,
            "email": request_data.email
        }
        
        def create_user():
            return supabase.from_("users") \
                .insert(new_user_data) \
                .execute()
            
        new_user_response = await safe_supabase_operation(
            create_user,
            "Failed to create user"
        )

        log_info(f"new_user_response : {new_user_response}")
        
        user_id = new_user_response.data[0]["id"]
        log_info(f"Created new user with ID: {user_id}")

        # Check if association already exists before inserting
        def check_association():
            return supabase.from_("user_tenant_association") \
                .select("*") \
                .eq("user_id", user_id) \
                .eq("tenant_id", tenant_id) \
                .execute()
                
        association_response = await safe_supabase_operation(
            check_association,
            "Failed to check user-tenant association"
        )
        
        if not association_response.data:
            # Associate user with tenant - explicitly excluding the id column
            def associate_user_tenant():
                return supabase.from_("user_tenant_association") \
                    .insert({
                        "user_id": user_id,
                        "tenant_id": tenant_id
                        #Returnign Minimal for better performance
                    }, returning="minimal") \
                    .execute()
                
            await safe_supabase_operation(
                associate_user_tenant,
                "Failed to associate user with tenant"
            )
            log_info(f"Associated user {user_id} with tenant {tenant_id}")

        return {"message": "User and tenant registered successfully"}
    except Exception as e:
        # Cleanup on failure - more robust error handling
        try:
            if 'user_id' in locals():
                log_info(f"Cleaning up failed registration for user {user_id}")
                # Delete from users table
                supabase.from_("users").delete().eq("id", user_id).execute()
                # Delete from auth.users
                supabase.auth.admin.delete_user(user_id)
        except Exception as cleanup_error:
            log_info(f"Error during cleanup: {str(cleanup_error)}")
            
        # Re-raise the original exception with more details
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")





@router.post("/cleanup-auth-user")
async def cleanup_auth_user(request_data: dict, api_key: str = Depends(verify_api_key)):
    user_id = request_data.get("user_id")
    try:
        supabase.auth.admin.delete_user(user_id)  # pyright: ignore[reportUndefinedVariable]
        return {"message": "Auth user deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete auth user: {str(e)}")

# -----------------------------
# Helper: cleanup unconfirmed users after 1 h
# -----------------------------


async def _cleanup_unconfirmed_user(user_id: str):
    """Remove auth and DB records for users who never confirmed e-mail."""
    # Wait 1 hour (3600 s)
    await asyncio.sleep(3600)

    supabase_client = get_supabase_client()

    try:
        # Check if the auth user has confirmed their e-mail yet
        auth_user_resp = supabase_client.auth.admin.get_user_by_id(user_id)
        # Different SDK versions expose the field differently; try both.
        confirmed_at = getattr(auth_user_resp.user, "email_confirmed_at", None)
        if confirmed_at is None and isinstance(auth_user_resp.user, dict):
            confirmed_at = auth_user_resp.user.get("email_confirmed_at")

        if confirmed_at:
            # User confirmed – nothing to do
            log_info(f"User {user_id} confirmed email. Cleanup not required.")
            return

        log_info(f"User {user_id} did NOT confirm email within 1 h – cleaning up.")

        # Delete from user_tenant_association first (FK constraint)
        try:
            supabase_client.from_("user_tenant_association").delete().eq("user_id", user_id).execute()
        except Exception:
            pass

        # Delete from users table
        try:
            supabase_client.from_("users").delete().eq("id", user_id).execute()
        except Exception:
            pass

        # Delete from auth.users
        try:
            supabase_client.auth.admin.delete_user(user_id)
        except Exception:
            pass
    except Exception as e:
        # Log but do not raise, since this is a background task
        log_info(f"Cleanup task error for user {user_id}: {str(e)}")

# -----------------------------
# Pending-registration endpoint
# -----------------------------


@router.post("/register/pending")
async def register_pending(
    request_data: RegisterRequest,
    api_key: str = Depends(verify_api_key),
):
    """Create DB records for a user whose e-mail is still unconfirmed.

    Called right after `supabase.auth.signUp()` when no JWT session exists.
    Protected via the X-API-Key header so only our front-end can call it.
    """
    try:
        log_info("Entered register_pending endpoint")

        # 1) Ensure tenant exists
        tenant_id = await get_or_create_tenant(request_data.tenant_name)

        # 2) Insert the user row if it doesn't exist yet
        new_user_data = {
            "id": request_data.user_id,
            "username": request_data.username,
            "email": request_data.email,
        }

        def insert_user():
            return supabase.from_("users").upsert(new_user_data).execute()

        await safe_supabase_operation(insert_user, "Failed to insert pending user")

        # 3) Upsert association row
        def upsert_assoc():
            return (
                supabase.from_("user_tenant_association")  # pyright: ignore[reportUndefinedVariable]
                .upsert({"user_id": request_data.user_id, "tenant_id": tenant_id})
                .execute()
            )

        await safe_supabase_operation(upsert_assoc, "Failed to upsert user-tenant association")

        # 4) Schedule cleanup task (detached, won't block server shutdown)
        asyncio.create_task(_cleanup_unconfirmed_user(request_data.user_id))

        return {"message": "Pending registration stored. Please confirm e-mail within 1 hour."}
    except Exception as e:
        log_info(f"Error in register_pending: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Pending registration failed: {str(e)}")