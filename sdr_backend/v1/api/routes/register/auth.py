from fastapi import HTTPException, Header
from fastapi import FastAPI
from utils.logger import log_info
import traceback
from services.auth_handler import verify_token
from fastapi import APIRouter

app = FastAPI()



router = APIRouter()

@router.get("/authenticate")
async def authenticate_user(authorization: str = Header(None, alias="Authorization")):
    """
    Get authenticated user based on JWT token.
    
    Args:
        Authorization header with token
        
    Returns:
        User data dictionary
        
    Raises:
        HTTPException: If authentication fails
    """
    try:
        return await verify_token(authorization)
    except Exception as e:
        # Catch any unexpected exceptions, log them, and return a generic error
        log_info(f"Unexpected error in authenticate_user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Authentication system error : {str(e)}")

