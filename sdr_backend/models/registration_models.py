
from pydantic import BaseModel


class RegisterRequest(BaseModel):
    tenant_name: str
    username: str
    email: str
    password: str
    confirm_password: str


class Token(BaseModel):
    access_token: str
    token_type: str