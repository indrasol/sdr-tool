"""core/ir/layout/inject_service_clusters.py

Create *service_cluster* IRGroup objects that wrap semantically-related nodes so the
frontend can draw tight rectangles around them.  The enrichment pipeline already
adds layerIndex hints; here we combine kind + layerIndex to form human-friendly
clusters.

The function mutates the IR in-place for performance but also returns it so the
functional pipeline contract remains consistent.
"""
from __future__ import annotations

from collections import defaultdict
from typing import Dict, List

from core.ir.ir_types import IRGraph, IRGroup, IRNode

# Semantic buckets – these will be the titles of the clusters
_CLUSTER_RULES: Dict[str, List[str]] = {
    "Edge & Security": [
        "Client",
        "CDN",
        "Gateway",
        "WAF",
        "Firewall",
        "LB",
        "Auth",
    ],
    "Core Services": [
        "Service",
        "Microservice",
        "Job",
        "Function",
    ],
    "Data Stores": [
        "Database",
        "Cache",
        "BlobStore",
        "VectorStore",
    ],
    "Async & Analytics": [
        "Queue",
        "Topic",
        "EventBus",
        "Analytics",
        "Monitoring",
        "Logging",
    ],
    "External": [
        "ExternalService",
        "PaymentGateway",
    ],
}

# Build reverse lookup kind -> cluster_name
_KIND_TO_CLUSTER: Dict[str, str] = {}
for _cluster, _kinds in _CLUSTER_RULES.items():
    for k in _kinds:
        _KIND_TO_CLUSTER[k] = _cluster


def inject_service_clusters(ir: IRGraph) -> IRGraph:  # noqa: D401 – imperative name
    """Attach *service_cluster* IRGroup objects to *ir* based on node kind."""
    bucket: Dict[str, List[str]] = defaultdict(list)

    for n in ir.nodes:
        cluster = _KIND_TO_CLUSTER.get(n.kind)
        if cluster:
            bucket[cluster].append(n.id)

    if not bucket:
        return ir  # nothing to do

    groups: List[IRGroup] = []
    for name, ids in bucket.items():
        gid = f"cluster_{name.lower().replace(' ', '_')}"
        groups.append(
            IRGroup(
                id=gid,
                name=name,
                type="domain_cluster",
                member_node_ids=ids,
            )
        )

    ir.groups = list(ir.groups) + groups  # type: ignore[assign]
    return ir 