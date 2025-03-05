# routers/router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.db_schema_models import User, Tenant, user_tenant_association
from core.db.connection_manager import get_db
from services.auth_handler import get_password_hash
from sqlalchemy import insert
import re

router = APIRouter()

@router.post("/sign_up")
async def register(
    tenant_name: str,
    username: str,
    email: str,
    password: str,
    confirm_password: str,
    db: AsyncSession = Depends(get_db)
):
    # Validate mandatory fields
    if not all([tenant_name.strip(), username.strip(), email.strip(), password.strip(), confirm_password.strip()]):
        raise HTTPException(status_code=400, detail="All fields are mandatory")

    # Validate email format
    email_pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if not re.match(email_pattern, email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Check password match
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    # Check for existing username
    result = await db.execute(select(User).where(User.username == username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username already registered")

    # Check for existing email
    result = await db.execute(select(User).where(User.email == email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if tenant exists or create a new one
    tenant = (await db.execute(select(Tenant).where(Tenant.name == tenant_name))).scalars().first()
    if not tenant:
        tenant = Tenant(name=tenant_name)
        db.add(tenant)
        await db.flush()  # Get tenant ID

    # Create new user
    hashed_password = get_password_hash(password)
    new_user = User(username=username, email=email, hashed_password=hashed_password)
    db.add(new_user)
    await db.flush()  # Get user ID

    # Associate user with tenant
    await db.execute(
        insert(user_tenant_association).values(user_id=new_user.id, tenant_id=tenant.id)
    )

    # Commit transaction
    await db.commit()

    return {"message": "Organization and User registered successfully"}