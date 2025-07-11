from __future__ import annotations

"""types/dsl_types.py

Canonical schema for diagram data returned by Design-Service v2.
We leverage Pydantic so validators can re-use these classes across
parser, layout and versioning modules.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, StrictStr, StrictInt, StrictFloat

class DSLNode(BaseModel):
    id: StrictStr = Field(..., description="Stable node identifier")
    type: StrictStr = Field("generic", description="High-level category used for theming")
    label: StrictStr = Field(..., max_length=80, description="Human label shown in the UI")

    # Most layouts always provide these ─ keep them top-level for convenience
    x: StrictFloat = 0
    y: StrictFloat = 0
    width: StrictFloat = 60
    height: StrictFloat = 36

    # Optional visual helpers
    iconifyId: Optional[StrictStr] = Field(
        None, max_length=40, description="Iconify glyph id, validated separately"
    )

    # Free-form extras live here so schemas stay forward-compatible
    properties: Dict[str, Any] = Field(default_factory=dict)
# class DSLNode(BaseModel):
#     """A single element in the D2 diagram."""

#     id: str = Field(..., description="Unique node identifier (stable across versions)")
#     type: str = Field(..., description="Node type / shape e.g. client, process, datastore")
#     label: str = Field(..., description="Human-readable label rendered on the canvas")
#     properties: Dict[str, Any] = Field(
#         default_factory=dict,
#         description="Additional metadata (layer, position, trust_zone, etc.)",
#     )

class DSLEdge(BaseModel):
    id: StrictStr
    source: StrictStr
    target: StrictStr
    label: Optional[StrictStr] = None
    properties: Dict[str, Any] = Field(default_factory=dict)


class DSLDiagram(BaseModel):
    nodes: List[DSLNode] = Field(default_factory=list)
    edges: List[DSLEdge] = Field(default_factory=list)
# class DSLEdge(BaseModel):
#     """Directed connector between two nodes."""

#     id: str = Field(..., description="Unique edge identifier")
#     source: str = Field(..., description="Source node id")
#     target: str = Field(..., description="Target node id")
#     label: Optional[str] = Field(None, description="Optional edge label")
#     properties: Dict[str, Any] = Field(default_factory=dict, description="Custom metadata")


# class DSLDiagram(BaseModel):
#     """Complete diagram used by the front-end renderer."""

#     nodes: List[DSLNode] = Field(default_factory=list)
#     edges: List[DSLEdge] = Field(default_factory=list) 