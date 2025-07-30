from __future__ import annotations

"""Core Intermediate Representation (IR) type system.

These models intentionally live in their own module so that downstream
components (builder, enrichment stages, emitters) can import them without
pulling in heavier dependencies.  They are *version-locked* via the
``IRGraph.version`` field – breaking changes MUST bump the version and be
handled by an explicit migration path.

The field definitions below are copied from the Phase-1 specification with a
few *safe-default* adjustments:

* Lists and dictionaries use ``default_factory`` to avoid mutable default
  arguments.
* Optional leaf fields explicitly default to ``None`` so that Pydantic does
  not treat them as required.

No additional validation logic is introduced at this stage – that will be
implemented incrementally in later phases (classification & enrichment).
"""

from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field


class IRNode(BaseModel):
    """A single component/node in the architecture graph."""

    id: str
    name: str
    kind: Literal[
        "Client",
        "Gateway",
        "Auth",
        "Service",
        "Job",
        "Function",  # serverless compute (Lambda, Cloud Functions)
        "Queue",
        "Topic",
        "EventBus",  # event backbone (SNS / EventBridge)
        "Cache",
        "Database",
        "DataWarehouse",  # analytic/OLAP stores (Snowflake, BigQuery)
        "BlobStore",
        "Search",
        "MLModel",
        "FeatureStore",
        "VectorStore",
        "Monitoring",
        "Tracing",
        "Logging",
        "Alerting",  # incident response / paging systems
        "CDN",
        "WAF",
        "Firewall",
        "LB",
        "SecretStore",
        "CertAuthority",  # certificate / key issuance (ACM, Vault PKI)
        "ContainerPlatform",  # Kubernetes, ECS, Nomad clusters
        "ExternalService",
        "Analytics",
        "ETL",
        "Orchestrator",
    ]
    subkind: Optional[str] = None
    layer: Literal[
        "edge",
        "presentation",
        "service",
        "data",
        "ml",
        "observability",
        "security",
        "external",
    ]
    domain: Optional[str] = None
    tech_stack: List[str] = Field(default_factory=list)
    risk_tags: List[str] = Field(default_factory=list)
    # Reserved for IaC-style deployment metadata (e.g. region, replicas).
    deployment: Optional[Dict[str, Any]] = None
    group_ids: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    locked: bool = False
    pinned: bool = False


class IREdge(BaseModel):
    """A directed or bidirectional relationship between two nodes."""

    id: str
    source: str
    target: str
    label: Optional[str] = None
    protocol: Optional[str] = None
    transport: Optional[str] = None
    direction: Literal["uni", "bi"] = "uni"
    data_classification: Optional[str] = None
    authn: Optional[str] = None
    encryption: Optional[str] = None
    purpose: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class IRGroup(BaseModel):
    """Logical grouping of nodes (e.g., Bounded Context, Trust Zone)."""

    id: str
    name: str
    type: Literal[
        "trust_zone",
        "bounded_context",
        "domain_cluster",
        "layer_cluster",
    ]
    risk_level: Optional[str] = None
    controls: List[str] = Field(default_factory=list)
    member_node_ids: List[str]


class IRAnnotation(BaseModel):
    """Additional metadata attached to a node, edge, or group."""

    id: str
    target_id: str
    kind: Literal["threat", "note", "metric", "design_decision"]
    payload: Dict[str, Any]


class IRGraph(BaseModel):
    """Container object representing a full architecture graph."""

    nodes: List[IRNode]
    edges: List[IREdge]
    groups: List[IRGroup] = Field(default_factory=list)
    annotations: List[IRAnnotation] = Field(default_factory=list)
    version: str = "1.0.0"
    source_dsl: str
    build_meta: Dict[str, Any] = Field(default_factory=dict)

    model_config = {
        "validate_assignment": True,
        "extra": "forbid",  # tighten once schema stabilises
    } 