from __future__ import annotations

from typing import List

from core.ir.ir_types import IRGraph, IRNode

_HIGH_RISK = {
    "Auth",
    "SecretStore",
    "CertAuthority",
    "Database",
    "BlobStore",
    "ExternalService",
}
_MED_RISK = {
    "Queue",
    "Topic",
    "EventBus",
    "Cache",
    "VectorStore",
}


def tag_risks(graph: IRGraph) -> IRGraph:
    new_nodes: List[IRNode] = []
    for n in graph.nodes:
        tags = list(n.risk_tags)
        if n.kind in _HIGH_RISK and "high" not in tags:
            tags.append("high")
        elif n.kind in _MED_RISK and "medium" not in tags:
            tags.append("medium")
        new_nodes.append(n.copy(update={"risk_tags": tags}))
    return graph.copy(update={"nodes": new_nodes}) 