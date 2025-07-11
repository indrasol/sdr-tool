from fastapi import APIRouter, HTTPException
from datetime import timedelta
from utils.logger import log_info
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from services.auth_handler import verify_token, verify_api_key
import re
import traceback


router = APIRouter()

@router.post("/get-email")
async def get_email(request_data: dict, api_key: str = Depends(verify_api_key)):
    username = request_data.get("username")
    try:
        supabase_client = get_supabase_client()
        def user_operation():
            return supabase_client.from_("users").select("email").eq("username", username).execute()
        user_response = await safe_supabase_operation(
            user_operation,
            "Failed to fetch email for the username"
        )
        log_info(f"User response: {user_response}")
        return {"message": "Email fetched successfully", "email": user_response.data[0].get("email")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch email for the username: {str(e)}")
    


@router.post("/login")
async def login(identifier: dict,current_user: dict = Depends(verify_token)):
    """
    Login endpoint that verifies the user by email or username.
    Returns the cleaned username (digits removed) along with other user data.

    Args:
        identifier: An email or username.
        current_user: Injected current user from token verification.

    Returns:
        A JSON response with an authentication message and cleaned username.
    """
    supabase_client = get_supabase_client()
    try:
        # Determine query field based on identifier pattern
        query_field = "email" if "@" in identifier.get("identifier") else "username"

        # Query the "users" table using a safe operation
        def user_operation():
            return supabase_client.from_("users").select("*").eq(query_field, identifier.get("identifier")).execute()

        user_response = await safe_supabase_operation(
            user_operation,
            "Failed to fetch user data during login"
        )
        log_info(f"User response: {user_response}")

        def user_tenant_operation():
            return supabase_client.from_("user_tenant_association").select("tenant_id").eq("user_id", user_response.data[0].get("id")).execute()

        user_tenant_response = await safe_supabase_operation(
            user_tenant_operation,
            "Failed to fetch user tenant data during login"
        )
        log_info(f"User tenant response: {user_tenant_response}")

        # If user not found in our "users" table yet (first login), auto-create
        if not user_response.data or len(user_response.data) == 0:
            # Fetch auth user info via Supabase admin
            try:
                auth_user = supabase_client.auth.admin.get_user_by_id(current_user["id"])
                email = auth_user.user.email if hasattr(auth_user, "user") else identifier.get("identifier")
            except Exception:
                email = identifier.get("identifier")

            new_user = {
                "id": current_user["id"],
                "username": identifier.get("identifier"),
                "email": email
            }
            def insert_user():
                return supabase_client.from_("users").insert(new_user).execute()
            await safe_supabase_operation(insert_user, "Failed to auto-create user on first login")
            user_response = {"data": [new_user]}

        if not user_tenant_response.data or len(user_tenant_response.data) == 0:
            raise HTTPException(status_code=401, detail="User tenant not found")

        # Get the user data and clean the username (remove digits)
        user_data = user_response.data[0]
        user_id = user_data.get("id", "")
        raw_username = user_data.get("username", "")
        email = user_data.get("email", "")
        tenant_data = user_tenant_response.data[0]
        tenant_id = tenant_data.get("tenant_id", "")
        cleaned_username = re.sub(r"\d+", "", raw_username)

        return {
            "message": "User authenticated",
            "formatted_username": cleaned_username,
            "username": raw_username,
            "email": email,
            "tenant_id": tenant_id,
            "user_id": user_id,
            "user": user_data
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        log_info(f"Unexpected error in login endpoint: {str(e)}")
        log_info(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal Server Error")