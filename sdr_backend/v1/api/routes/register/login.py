from fastapi import APIRouter, HTTPException
from datetime import timedelta
from utils.logger import log_info
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from core.db.connection_manager import get_db
from services.auth_handler import authenticate_user, create_access_token
from models.auth_models import Token
from databases import Database

router = APIRouter()




ACCESS_TOKEN_EXPIRE_MINUTES = 30

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Database = Depends(get_db)):
    
    # Log the incoming form data for debugging
    log_info(f"Form data received: {form_data.__dict__}")
    user = await authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Generate the access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}