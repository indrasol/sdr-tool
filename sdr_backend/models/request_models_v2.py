from __future__ import annotations

"""models/request_models_v2.py

Input contracts for the Design-Service v2 endpoints.
The API surface purposefully stays minimal in Phase-0/1 – we will
extend with pagination, pinned nodes, etc. later.
"""

from typing import Annotated
from pydantic import BaseModel, Field, ConfigDict, constr

ProjectCode = Annotated[
    str,
    Field(strip_whitespace=True, min_length=3, max_length=64)
]

class DesignGenerateRequestV2(BaseModel):
    """
    Payload for POST /v2/design/generate

    * `project_id` – short code (slug) that identifies the workspace.
    * `query`      – the user’s natural-language prompt.
    * `session_id` – optional UUID to resume an existing chat session.
    """

    project_id: ProjectCode = Field(
        ...,
        examples=["PW6VSIR"],
        description="Unique project code / slug",
    )
    query: Annotated[str, Field(min_length=1, max_length=512, strip_whitespace=True)] = Field(
        ...,
        examples=["Add CloudFront in front of the ALB"],
        description="User’s natural-language request",
    )
    session_id: Annotated[str | None, Field(min_length=36, max_length=36)] = Field(
        None,
        examples=["0f4ca8f0-ded4-4e23-92f8-2d5f2a9649ba"],
        description="Existing chat session UUID (optional)",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "project_id": "PW6VSIR",
                "query": "Create a multi-region RAG architecture on AWS and GCP",
                "session_id": "0f4ca8f0-ded4-4e23-92f8-2d5f2a9649ba",
            }
        }
    )