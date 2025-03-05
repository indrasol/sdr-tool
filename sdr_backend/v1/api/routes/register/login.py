from fastapi import APIRouter, HTTPException
from datetime import timedelta
from utils.logger import log_info
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from core.db.connection_manager import get_db
from services.auth_handler import authenticate_user, create_access_token
from models.registration_models import Token
from sqlalchemy.ext.asyncio import AsyncSession



router = APIRouter()




ACCESS_TOKEN_EXPIRE_MINUTES = 30

@router.post("/login")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Log the incoming form data for debugging (avoid logging sensitive data in production)
        log_info(f"Form data received: username={form_data.username}, password=[REDACTED]")

        # Authenticate the user
        user = await authenticate_user(form_data.username, form_data.password, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Generate access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # Safely extract tenant IDs
        tenant_ids = [tenant.id for tenant in user.tenants] if user.tenants else []
        log_info(f"User tenant IDs: {tenant_ids}")

        access_token = create_access_token(
            data={"sub": user.username, "tenant_ids": tenant_ids},
            expires_delta=access_token_expires
        )
        log_info(f"Generated access token: {access_token}")
        
        # Prepare user data for response
        user_data = {
            "id": user.id,
            "name": user.username,
            "email": user.email,
        }

        # Return token and user data
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        }

    except HTTPException as e:
        # Re-raise HTTP exceptions (e.g., 401 Unauthorized) without rollback
        log_info(f"Authentication failed: {str(e)}")
        raise
    except Exception as e:
        # Handle unexpected errors with rollback for database consistency
        log_info(f"Login error: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during login",
            headers={"WWW-Authenticate": "Bearer"},
        )