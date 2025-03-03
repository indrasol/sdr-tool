
from fastapi import APIRouter, HTTPException
from utils.logger import log_info
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from core.db.connection_manager import get_db
from services.auth_handler import get_password_hash
from models.db_schema_models import User
from databases import Database


router = APIRouter()


# Register a new user
@router.post("/sign_up")
async def register(username: str, password: str, db: Database = Depends(get_db)):
    # Check if username already exists
    query = "SELECT * FROM users WHERE username = :username"
    existing_user = await db.fetch_one(query=query, values={"username": username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(password)
    
    # Insert the new user into the database
    insert_query = "INSERT INTO users (username, hashed_password) VALUES (:username, :hashed_password)"
    await db.execute(query=insert_query, values={"username": username, "hashed_password": hashed_password})

    return {"message": "User created successfully"}