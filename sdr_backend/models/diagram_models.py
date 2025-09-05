from typing import List, Dict, Any

from pydantic import BaseModel, Field


class DiagramRequest(BaseModel):
    """Request model carrying the natural-language query for diagram generation."""

    query: str = Field(..., description="Natural-language prompt describing the desired architecture diagram")


class Node(BaseModel):
    """Represents a single diagram node compatible with React Flow custom nodes."""

    id: str = Field(..., description="Unique identifier of the node")
    type: str = Field("custom", description="React Flow node type, defaults to 'custom'")
    data: Dict[str, Any] = Field(..., description="Arbitrary data for the node such as label, iconUrl, etc.")
    position: Dict[str, float] = Field(
        default_factory=lambda: {"x": 0.0, "y": 0.0},
        description="Initial position used by the frontend layout engine (in pixels)",
    )


class Edge(BaseModel):
    """Represents a connection between two nodes in the diagram."""

    id: str = Field(..., description="Unique identifier of the edge")
    source: str = Field(..., description="ID of the source node")
    target: str = Field(..., description="ID of the target node")
    label: str = Field(..., description="Label of the edge")
    
class Cluster(BaseModel):
    cluster_id: str = Field(..., description="Unique identifier of the cluster")
    cluster_label: str = Field(..., description="Label of the cluster")
    cluster_nodes: List[str] = Field(..., description="List of node IDs in the cluster")
    cluster_parent: List[str] = Field(default_factory=list, description="Parent cluster IDs (for nested clusters)")


class DiagramResponse(BaseModel):
    """Response model containing the graph nodes and edges ready for rendering on the frontend."""

    nodes: List[Node] = Field(default_factory=list, description="List of diagram nodes")
    edges: List[Edge] = Field(default_factory=list, description="List of diagram edges")
    clusters: List[Cluster]=Field(default_factory=list, description="List of diagram clusters")
