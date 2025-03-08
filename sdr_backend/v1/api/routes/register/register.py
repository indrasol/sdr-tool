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
        
        # Check if user already exists
        def check_user():
            return supabase.from_("users") \
                .select("*") \
                .eq("id", request_data.user_id) \
                .execute()
            
        user_response = await safe_supabase_operation(
            check_user,
            "Failed to check if user exists"
        )
        
        if user_response.data:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Check if user email already exists
        def check_user_email():
            return supabase.from_("users") \
                .select("*") \
                .eq("email", request_data.email) \
                .execute()
        
        user_email_response = await safe_supabase_operation(
            check_user_email,
            "Failed to check if user email exists"
        )

        if user_email_response.data:
            raise HTTPException(status_code=400, detail="User email already exists")

        # Check or create tenant (using organization_name)
        def check_tenant():
            return supabase.from_("tenants") \
                .select("*") \
                .eq("name", request_data.tenant_name) \
                .execute()
            
        tenant_response = await safe_supabase_operation(
            check_tenant,
            "Failed to check if tenant exists"
        )
        
        tenant_id = None
        if tenant_response.data:
            tenant_id = tenant_response.data[0]["id"]
        else:
            # Create new tenant
            def create_tenant():
                return supabase.from_("tenants") \
                    .insert({"name": request_data.tenant_name}) \
                    .execute()
                
            new_tenant_response = await safe_supabase_operation(
                create_tenant,
                "Failed to create tenant"
            )
            tenant_id = new_tenant_response.data[0]["id"]
            log_info(f"Created new tenant: {request_data.tenant_name} with ID: {tenant_id}")

        
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

        # Associate user with tenant using junction table
        def associate_user_tenant():
            return supabase.from_("user_tenant_association") \
                .insert({
                    "user_id": user_id,
                    "tenant_id": tenant_id
                }) \
                .execute()
            
        await safe_supabase_operation(
            associate_user_tenant,
            "Failed to associate user with tenant"
        )
        log_info(f"Associated user {user_id} with tenant {tenant_id}")

        return {"message": "User and tenant registered successfully"}
    except Exception as e:
        # Cleanup on failure
        if 'user_id' in locals():
            supabase.from_("users").delete().eq("id", user_id).execute()
            supabase.auth.admin.delete_user(user_id)  # Delete from auth.users
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")





@router.post("/cleanup-auth-user")
async def cleanup_auth_user(request_data: dict, api_key: str = Depends(verify_api_key)):
    user_id = request_data.get("user_id")
    try:
        supabase.auth.admin.delete_user(user_id)
        return {"message": "Auth user deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete auth user: {str(e)}")