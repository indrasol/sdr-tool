from __future__ import annotations
from enum import Enum
from typing import List, Optional, Union, Literal, Annotated
from pydantic import BaseModel, Field, HttpUrl, ConfigDict


# ──────────────────────────────────────────────────────────────────────────
#  Intent taxonomy
# ──────────────────────────────────────────────────────────────────────────

class IntentV2(str, Enum):
    DSL_CREATE   = "DSL_CREATE"
    DSL_UPDATE   = "DSL_UPDATE"
    VIEW_TOGGLE  = "VIEW_TOGGLE"
    EXPERT_QA    = "EXPERT_QA"
    CLARIFY      = "CLARIFY"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"


# ──────────────────────────────────────────────────────────────────────────
#  Diagram schema  (React-Flow compatible, fully typed)
# ──────────────────────────────────────────────────────────────────────────

class NodePosition(BaseModel):
    x: float
    y: float

class NodeData(BaseModel):
    label: Annotated[str, Field(min_length=1, max_length=80)]
    nodeType: Annotated[str, Field(min_length=1, max_length=32)]
    iconifyId: Optional[Annotated[str, Field(min_length=3, max_length=40)]]
    svgUrl: Optional[Annotated[str, Field(min_length=3, max_length=200)]]
    description: Optional[Annotated[str, Field(max_length=500)]]
    pinned: Optional[bool] = False
    validated: bool = True
    source: Literal["backend", "frontend_cleaned", "post_render_cleaned"]
    # Optional enrichment metadata for richer UI rendering
    provider: Optional[Annotated[str, Field(max_length=40)]] = None
    technology: Optional[Annotated[str, Field(max_length=40)]] = None
    color: Optional[Annotated[str, Field(max_length=10)]] = None
    shape: Optional[Annotated[str, Field(max_length=20)]] = None
    icon: Optional[Annotated[str, Field(max_length=40)]] = None
    layerIndex: Optional[int] = None

class RFNode(BaseModel):
    id: Annotated[str, Field(min_length=1, max_length=64)]
    type: Annotated[str, Field(min_length=1, max_length=32)] = "default"
    position: NodePosition
    data: NodeData
    width: Optional[int]
    height: Optional[int]

class RFEdge(BaseModel):
    id: Annotated[str, Field(min_length=1, max_length=64)]
    source: Annotated[str, Field(min_length=1, max_length=64)]
    target: Annotated[str, Field(min_length=1, max_length=64)]
    label: Optional[Annotated[str, Field(max_length=120)]]
    type: Literal["smoothstep", "default"] = "smoothstep"

class DiagramState(BaseModel):
    nodes: List[RFNode] = Field(default_factory=list)
    edges: List[RFEdge] = Field(default_factory=list)


# ──────────────────────────────────────────────────────────────────────────
#  Base envelope
# ──────────────────────────────────────────────────────────────────────────

class BaseResponseV2(BaseModel):
    intent: IntentV2
    message: Annotated[str, Field(min_length=1)]
    confidence: float = Field(..., ge=0.0, le=1.0)
    session_id: Optional[str]
    classification_source: Optional[str]


# ──────────────────────────────────────────────────────────────────────────
#  Variant-specific payloads
# ──────────────────────────────────────────────────────────────────────────

# – DSL mutation –
class DSLResponsePayload(BaseModel):
    diagram_id: Optional[int] = None
    version_id: int = Field(..., ge=1)
    diagram_state: DiagramState
    pinned_nodes: Optional[List[str]]
    available_views: Optional[List[str]] = None
    provider: Optional[str] = None  # Cloud provider: 'aws', 'azure', 'gcp', 'multi', or None


class DSLResponse(BaseResponseV2):
    intent: Literal[IntentV2.DSL_CREATE, IntentV2.DSL_UPDATE]
    payload: DSLResponsePayload


# – Expert Q&A –
class ReferenceItem(BaseModel):
    title: str
    url: HttpUrl

class ExpertQAResponse(BaseResponseV2):
    intent: Literal[IntentV2.EXPERT_QA]
    references: Optional[List[ReferenceItem]]


# – View toggle –
class ViewToggleResponse(BaseResponseV2):
    intent: Literal[IntentV2.VIEW_TOGGLE]
    target_view: Literal["AD", "DFD", "SEQUENCE"]
    diagram_state: Optional[DiagramState]


# – Clarify –
class ClarifyResponse(BaseResponseV2):
    intent: Literal[IntentV2.CLARIFY]
    questions: List[str]


# – Out of scope –
class OutOfScopeResponse(BaseResponseV2):
    intent: Literal[IntentV2.OUT_OF_SCOPE]
    suggestion: Optional[str]


# ──────────────────────────────────────────────────────────────────────────
#  Discriminated union wrapper
# ──────────────────────────────────────────────────────────────────────────

class DesignGenerateResponseV2(BaseModel):
    response: Union[
        DSLResponse,
        ExpertQAResponse,
        ViewToggleResponse,
        ClarifyResponse,
        OutOfScopeResponse,
    ]

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "response": {
                        "intent": "DSL_CREATE",
                        "message": "Created the base RAG architecture.",
                        "confidence": 0.94,
                        "session_id": "sess-123",
                        "classification_source": "pattern",
                        "payload": {
                            "version_id": 5,
                            "diagram_state": {
                                "nodes": [
                                    {
                                        "id": "user",
                                        "type": "default",
                                        "position": {"x": 10.0, "y": 30.0},
                                        "data": {
                                            "label": "User",
                                            "nodeType": "client",
                                            "iconifyId": "mdi:account",
                                            "description": "",
                                            "pinned": False,
                                            "validated": True,
                                            "source": "backend"
                                        }
                                    }
                                ],
                                "edges": []
                            },
                            "pinned_nodes": []
                        }
                    }
                }
            ]
        }
    )
