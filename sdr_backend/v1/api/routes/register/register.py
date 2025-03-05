# routers/router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.db_schema_models import User, Tenant, user_tenant_association
from core.db.connection_manager import get_db
from services.auth_handler import get_password_hash
from sqlalchemy import insert
import re
from models.registration_models import RegisterRequest
router = APIRouter()

@router.post("/register")
async def register(
    register_request: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    # Validate mandatory fields
    if not all([register_request.tenant_name.strip(), register_request.username.strip(), register_request.email.strip(), register_request.password.strip(), register_request.confirm_password.strip()]):
        raise HTTPException(status_code=400, detail="All fields are mandatory")

    # Validate email format
    email_pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if not re.match(email_pattern, register_request.email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Check password match
    if register_request.password != register_request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    # Check for existing username
    result = await db.execute(select(User).where(User.username == register_request.username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username already taken. Please choose a different username.")

    # Check for existing email
    result = await db.execute(select(User).where(User.email == register_request.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered") 

    # Check if tenant exists or create a new one
    tenant = (await db.execute(select(Tenant).where(Tenant.name == register_request.tenant_name))).scalars().first()
    if not tenant:
        tenant = Tenant(name=register_request.tenant_name)
        db.add(tenant)
        await db.flush()  # Get tenant ID

    # Create new user
    hashed_password = get_password_hash(register_request.password)
    new_user = User(username=register_request.username, email=register_request.email, hashed_password=hashed_password)
    db.add(new_user)
    await db.flush()  # Get user ID

    # Associate user with tenant
    await db.execute(
        insert(user_tenant_association).values(user_id=new_user.id, tenant_id=tenant.id)
    )

    # Commit transaction
    await db.commit()

    return {"message": "Organization and User registered successfully"}