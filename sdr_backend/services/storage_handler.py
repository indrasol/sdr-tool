# services/storage_utils.py

import base64
import mimetypes
from datetime import timedelta
from uuid import uuid4

from fastapi import HTTPException
from models.report_models import GenerateReportRequest

DIAGRAM_BUCKET = "report-diagram-snapshots"     # choose whatever name you created

async def upload_diagram_png_if_provided(
    req: GenerateReportRequest,
    supabase,
) -> str | None:
    """
    Expects either:
      • req.diagram_png  (a **pure Base64** string without data-URL header) **OR**
      • req.diagram_state  (front-end did not send PNG – we return None)

    If a PNG is present we:
      1. Create or reuse the private bucket.
      2. Upload the bytes under   <project>/<uuid>.png
      3. Generate a 7-day signed URL the FE can embed.

    Returns
    -------
    str | None   – signed URL or None if nothing to upload.
    """
    if not getattr(req, "diagram_png", None):
        return None

    # 0) Create bucket once (idempotent – Supabase just returns 409 if exists)
    try:
        supabase.storage().create_bucket(DIAGRAM_BUCKET, public=False)
    except Exception:
        pass  # bucket exists

    # 1) Decode
    try:
        binary = base64.b64decode(req.diagram_png)
    except Exception:
        raise HTTPException(400, "Invalid Base64 for diagram_png")

    # 2) Build path – keep per-project sub-folder to avoid clutter
    filename = f"{uuid4()}.png"
    path     = f"{req.project_code}/{filename}"

    # 3) Upload
    supabase.storage() \
        .from_(DIAGRAM_BUCKET) \
        .upload(path, binary, {"content-type": "image/png"})

    # 4) Signed URL (7 days)
    signed = (
        supabase.storage()
        .from_(DIAGRAM_BUCKET)
        .create_signed_url(path, expires_in=int(timedelta(days=365).total_seconds()))
        .json()
    )
    return signed["signedURL"]
