# routers/router.py
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.db_schema_models import User, Tenant, UserTenantAssociation
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from sqlalchemy import insert
import re
from models.registration_models import RegisterRequest
from utils.logger import log_info
from services.auth_handler import verify_token, verify_api_key
from config.settings import SUPABASE_SECRET_KEY
from fastapi.security import APIKeyHeader

router = APIRouter()




supabase = get_supabase_client()

# Helper function to get or create tenant
async def get_or_create_tenant(tenant_name):
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
    current_user: dict = Depends(verify_token)
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
        
       # Check if user already exists - checking both user and email in one query
        def check_user_exists():
            return supabase.from_("users") \
                .select("id, email") \
                .or_(f"id.eq.{request_data.user_id},email.eq.{request_data.email}") \
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
                if user["email"] == request_data.email:
                    raise HTTPException(status_code=400, detail="User email already exists")
        
        # Check or create tenant (using organization_name)
       # Check if tenant exists or create a new one
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
        supabase.auth.admin.delete_user(user_id)
        return {"message": "Auth user deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete auth user: {str(e)}")