from fastapi import APIRouter, HTTPException
from datetime import timedelta
from utils.logger import log_info
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from core.db.connection_manager import get_db
from services.auth_handler import authenticate_user, create_access_token
from models.auth_models import Token
from sqlalchemy.ext.asyncio import AsyncSession



router = APIRouter()




ACCESS_TOKEN_EXPIRE_MINUTES = 30

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)):
    
    try:
        # Log the incoming form data for debugging
        log_info(f"Form data received: username={form_data.username}, password=[REDACTED]")
        
        user = await authenticate_user(form_data.username, form_data.password, db)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # Get tenant IDs safely
        tenant_ids = []
        if user.tenants:
            tenant_ids = [tenant.id for tenant in user.tenants]
        
        log_info(f"Before Access Token: {tenant_ids}")
        
        access_token = create_access_token(
            data={"sub": user.username, "tenant_ids": tenant_ids},
            expires_delta=access_token_expires
        )
        
        log_info(f"After Access Token: {access_token}")
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        log_info(f"Login error: {str(e)}")
        await db.rollback()
        raise