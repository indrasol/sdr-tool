# app/routers/templates.py

import random
import string
import logging
from datetime import datetime
from typing import Dict, List
from services.auth_handler import verify_token
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from models.request_models import SaveTemplateRequest, UpdateTemplateRequest
from models.response_models import SaveTemplateResponse, GetTemplateResponse, UpdateTemplateResponse
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from services.supabase_manager import SupabaseManager

router = APIRouter()

# Set up structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

supabase_manager = SupabaseManager()

# —– Utility: 4-char alphanumeric ID —–
async def generate_template_id(length: int = 4) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(random.choices(alphabet, k=length))


# —– Endpoint —–
@router.post(
    "/save_template",
    response_model=SaveTemplateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def save_template(
    req: SaveTemplateRequest,
    current_user: dict = Depends(verify_token),
):
    # (Optionally) check that current_user is member of req.tenant_id here...
    supabase = get_supabase_client()
    # Check Tenant user access
    check_tenant_access = lambda: supabase.from_("user_tenant_association").select("tenant_id").eq("user_id", current_user["id"]).execute()
    tenant_response = await safe_supabase_operation(check_tenant_access, "Failed to verify tenant access")
    user_tenant_ids = [item["tenant_id"] for item in tenant_response.data]

    if req.tenant_id not in user_tenant_ids:
        raise HTTPException(status_code=403, detail="Not authorized for this tenant")

    try:
        logger.info(f"Saving template: {req}")
        tpl_id = await supabase_manager.create_template(
            tenant_id=req.tenant_id,
            tenant_name=req.tenant_name,
            diagram_state=req.diagram_state,
            template_name=req.template_name,
            template_description=req.template_description,
            template_tags=req.template_tags,
            template_visibility=req.template_visibility,
        )
    except HTTPException as he:
        # bubble up HTTPExceptions
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error saving template: {e}"
        )

    return SaveTemplateResponse(
        success=True,
        template_id=tpl_id,
        message="Template saved successfully"
    )

@router.get(
    "/get_template",
    response_model=GetTemplateResponse,
    status_code=status.HTTP_200_OK,
)
async def get_template(
    template_id: str,
    tenant_id: int,
    current_user: dict = Depends(verify_token),
):
    # — Optional: enforce that user belongs to this tenant
    supabase = get_supabase_client()
     # Check Tenant user access
    check_tenant_access = lambda: supabase.from_("user_tenant_association").select("tenant_id").eq("user_id", current_user["id"]).execute()
    tenant_response = await safe_supabase_operation(check_tenant_access, "Failed to verify tenant access")
    user_tenant_ids = [item["tenant_id"] for item in tenant_response.data]

    if tenant_id not in user_tenant_ids:
        raise HTTPException(status_code=403, detail="Not authorized for this tenant")

    tpl = await supabase_manager.get_template(template_id=template_id, tenant_id=tenant_id)

    # Map the DB's `diagram_info` field to `diagram_state`
    return GetTemplateResponse(
        success=True,
        template_id=tpl["template_id"],
        tenant_id=tpl["tenant_id"],
        tenant_name=tpl["tenant_name"],
        diagram_state=tpl["diagram_info"],
        template_name=tpl["template_name"],
        template_description=tpl.get("template_description"),
        template_tags=tpl.get("template_tags") or [],
        template_visibility=tpl.get("template_visibility") or [],
        created_at=tpl["created_at"],
        updated_at=tpl["updated_at"],
    )

@router.put(
    "/update_template",
    response_model=UpdateTemplateResponse,
    status_code=status.HTTP_200_OK,
)
async def update_template(
    req: UpdateTemplateRequest,
    current_user: dict = Depends(verify_token),
):
    supabase = get_supabase_client()
     # Check Tenant user access
    check_tenant_access = lambda: supabase.from_("user_tenant_association").select("tenant_id").eq("user_id", current_user["id"]).execute()
    tenant_response = await safe_supabase_operation(check_tenant_access, "Failed to verify tenant access")
    user_tenant_ids = [item["tenant_id"] for item in tenant_response.data]

    if req.tenant_id not in user_tenant_ids:
        raise HTTPException(status_code=403, detail="Not authorized for this tenant")

    try:
        await supabase_manager.update_template(
            template_id=req.template_id,
            tenant_id=req.tenant_id,
            diagram_info=req.diagram_info,
            template_name=req.template_name,
            template_description=req.template_description,
            template_tags=req.template_tags,
            template_visibility=req.template_visibility,
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

    return UpdateTemplateResponse(
        success=True,
        template_id=req.template_id,
        updated_at=datetime.utcnow(),
        message="Template updated successfully"
    )