from __future__ import annotations

from typing import List

from core.ir.ir_types import IRGraph, IRNode

_KIND_TO_LAYER = {
    # edge
    "Client": "edge",
    "CDN": "edge",
    "WAF": "edge",
    "Firewall": "edge",
    "LB": "edge",

    # security
    "Gateway": "security",
    "Auth": "security",
    "SecretStore": "security",
    "CertAuthority": "security",

    # service
    "Service": "service",
    "Job": "service",
    "Queue": "service",
    "Topic": "service",
    "EventBus": "service",
    "Orchestrator": "service",
    "Function": "service",

    # data
    "Database": "data",
    "Cache": "data",
    "BlobStore": "data",
    "Search": "data",
    "VectorStore": "data",
    "FeatureStore": "data",
    "DataWarehouse": "data",

    # ml
    "MLModel": "ml",

    # observability
    "Monitoring": "observability",
    "Tracing": "observability",
    "Logging": "observability",
    "Analytics": "observability",
    "Alerting": "observability",

    # external
    "ExternalService": "external",
}

_DEFAULT_LAYER = "service"


def assign_layers(graph: IRGraph) -> IRGraph:
    new_nodes: List[IRNode] = []
    for n in graph.nodes:
        layer = _KIND_TO_LAYER.get(n.kind, _DEFAULT_LAYER)
        new_nodes.append(n.copy(update={"layer": layer}))
    return graph.copy(update={"nodes": new_nodes}) 