from __future__ import annotations

"""constraint_adapter.py

Translate an *enriched* IRGraph into a minimal DSLDiagram structure with
ELK layer constraints so that the existing EnhancedLayoutEngineV3 can apply
ELK positioning while respecting architectural layers.

For Step-A we only attach the ``rank" metadata which ELK understands via
*layerConstraint* on the root graph.  Later we can fine-tune node/order
constraints.
"""

from typing import List
from hashlib import sha256

from core.ir.ir_types import IRGraph
from core.dsl.dsl_types import DSLDiagram, DSLNode, DSLEdge

# Ranking buckets per spec – smaller number = closer to top (left) in LR
_LAYER_RANK = {
    "edge": 0,
    "security": 1,
    "service": 2,
    "data": 3,
    "ml": 3,  # same bucket as data; ML sits beside data stores
    "observability": 4,
    "external": 4,
}


def ir_to_dsl(ir: IRGraph) -> DSLDiagram:
    """Down-cast IR into DSL so the layout engine can run unchanged."""
    nodes: List[DSLNode] = []
    for n in ir.nodes:
        # ------------------------------------------------------------------
        # Transfer core identity fields
        # ------------------------------------------------------------------
        meta = n.metadata or {}
        node_kwargs = {
            "id": n.id,
            "type": n.kind.lower(),
            "label": n.name,
            "properties": meta.copy(),  # keep full metadata for downstream consumers
        }

        # ------------------------------------------------------------------
        # 1) Preserve layout hints if they already exist (x / y / width / height)
        # ------------------------------------------------------------------
        for fld in ("x", "y", "width", "height"):
            if fld in meta:
                # pydantic StrictFloat accepts int or float → cast defensively
                node_kwargs[fld] = float(meta[fld])

        # ------------------------------------------------------------------
        # 2) Preserve resolved icon from enrichment pipeline
        # ------------------------------------------------------------------
        icon_id = meta.get("iconify_id") or meta.get("icon")
        if icon_id:
            node_kwargs["iconifyId"] = icon_id

        nodes.append(DSLNode(**node_kwargs))

    edges: List[DSLEdge] = []
    for e in ir.edges:
        edges.append(
            DSLEdge(
                id=e.id,
                source=e.source,
                target=e.target,
                label=e.label,
            )
        )

    diagram = DSLDiagram(nodes=nodes, edges=edges)

    # ----------------------------------------------------------------------
    # Preserve group information so callers can render layer containers.
    # DSLDiagram doesn’t define a formal groups field yet, but we attach it
    # dynamically – every downstream consumer already checks with
    # ``hasattr(diagram, "groups")`` before accessing.
    # ----------------------------------------------------------------------
    if ir.groups:
        diagram.groups = [g.model_copy(deep=True) for g in ir.groups]  # type: ignore[attr-defined]

    return diagram


def ir_hash(ir: IRGraph) -> str:
    """Return SHA-256 hash of IR graph for cache key."""
    data = ir.model_dump()
    return sha256(str(data).encode()).hexdigest() 