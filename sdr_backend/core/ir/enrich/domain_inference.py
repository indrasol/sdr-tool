from __future__ import annotations

import re
from typing import Dict, List

from core.ir.ir_types import IRGraph, IRNode

_DOMAIN_PATTERNS: Dict[str, re.Pattern[str]] = {
    "auth": re.compile(r"auth|login|identity|token", re.I),
    "payment": re.compile(r"payment|billing|invoice|stripe|paypal", re.I),
    "user": re.compile(r"user|account|profile", re.I),
    "order": re.compile(r"order|checkout|cart", re.I),
    "inventory": re.compile(r"inventory|stock", re.I),
    "analytics": re.compile(r"analytics|metric|tracking", re.I),
}


def infer_domain(graph: IRGraph) -> IRGraph:
    new_nodes: List[IRNode] = []
    for n in graph.nodes:
        domain = n.domain
        if not domain:  # only set if not provided
            for name, pattern in _DOMAIN_PATTERNS.items():
                if pattern.search(n.name):
                    domain = name
                    break
        new_nodes.append(n.copy(update={"domain": domain}))
    return graph.copy(update={"nodes": new_nodes}) 