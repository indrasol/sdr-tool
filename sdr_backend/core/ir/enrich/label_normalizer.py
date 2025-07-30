from __future__ import annotations

import re
from typing import List

from core.ir.ir_types import IRGraph, IRNode

_NORMALIZE_RE = re.compile(r"\s+")


def normalize_labels(graph: IRGraph) -> IRGraph:
    """Trim + collapse whitespace in node names, keep a copy in metadata."""

    new_nodes: List[IRNode] = []
    for n in graph.nodes:
        cleaned = _NORMALIZE_RE.sub(" ", n.name.strip())
        meta = dict(n.metadata)
        if n.name != cleaned:
            meta["orig_label"] = n.name
        new_nodes.append(n.copy(update={"name": cleaned, "metadata": meta}))

    return graph.copy(update={"nodes": new_nodes}) 