from __future__ import annotations

"""models/request_models_v2.py

Input contracts for the Design-Service v2 endpoints.
The API surface purposefully stays minimal in Phase-0/1 – we will
extend with pagination, pinned nodes, etc. later.
"""

from typing import Optional
from pydantic import BaseModel


class DesignGenerateRequestV2(BaseModel):
    project_id: str
    query: str
    # Provide a default value so the field becomes optional in Pydantic v2
    session_id: Optional[str] = None
