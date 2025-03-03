from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from typing import Optional
from sqlalchemy.orm import Session
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from fastapi.openapi.models import OAuth2 as OAuth2Model
from fastapi.security import OAuth2
from models.db_schema_models import User
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from core.db.connection_manager import get_db
from config.settings import JWT_SECRET_KEY
from fastapi import FastAPI
from databases import Database # async database library
from utils.logger import log_info
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

app = FastAPI()
# JWT configuration
SECRET_KEY = JWT_SECRET_KEY  # Replace with a secure, random key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/routes/login")


# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Synchronous methods (CPU-bound)
# Generate a JWT access token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Verify a plain password against a hashed password
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# Hash a password
def get_password_hash(password: str):
    return pwd_context.hash(password)

# Async methods (I/O-bound: database operations)
async def authenticate_user(username: str, password: str, db: Database = Depends(get_db)):
    query = "SELECT * FROM users WHERE username = :username"
    user = await db.fetch_one(query, values={"username": username})
    if not user or not verify_password(password, user["hashed_password"]):
        return None
    return user


# Dependency to get the current user from the token
async def get_current_user(token: str = Depends(oauth2_scheme), db: Database = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        log_info("Entered get_current_user...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        log_info(f"Payload : {payload}")
        username: str = payload.get("sub")
        log_info(f"username : {username}")
        if username is None:
            raise credentials_exception
    except ExpiredSignatureError:
        log_info("Token has expired")
        raise credentials_exception
    except InvalidTokenError as e:
        log_info(f"Invalid token: {str(e)}")
        raise credentials_exception
    except JWTError as e:
        log_info(f"JWTError: {str(e)}")
        raise credentials_exception
    query = "SELECT * FROM users WHERE username = :username"
    user = await db.fetch_one(query, {"username": username})
    if user is None:
        raise credentials_exception
    return user