from __future__ import annotations

import re
from typing import List

from core.ir.ir_types import IRGraph, IREdge

_PROTOCOL_MAP = {
    "http": "HTTP",
    "https": "HTTPS",
    "grpc": "gRPC",
    "tcp": "TCP",
    "udp": "UDP",
    "sql": "SQL",
}

_PURPOSE_MAP = {
    "auth": "auth",
    "login": "auth",
    "metrics": "metrics",
    "event": "event",
    "data": "data",
}


def classify_edges(graph: IRGraph) -> IRGraph:
    new_edges: List[IREdge] = []
    for e in graph.edges:
        protocol = e.protocol
        purpose = e.purpose
        label_lower = (e.label or "").lower()
        for token, proto in _PROTOCOL_MAP.items():
            if token in label_lower:
                protocol = proto
                break
        for token, purp in _PURPOSE_MAP.items():
            if token in label_lower:
                purpose = purp
                break
        new_edges.append(e.copy(update={"protocol": protocol, "purpose": purpose}))

    return graph.copy(update={"edges": new_edges}) 