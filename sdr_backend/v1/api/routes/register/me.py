from fastapi import APIRouter
from utils.logger import log_info
from fastapi import Depends
from services.auth_handler import get_current_user
from models.db_schema_models import User



router = APIRouter()

# Example protected endpoint
@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    log_info(f"Current user: {current_user}")
    return {"username": current_user.username}