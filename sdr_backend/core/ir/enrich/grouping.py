from __future__ import annotations

from typing import Dict, List

from core.ir.ir_types import IRGraph, IRGroup, IRNode

# Simple mapping layer -> trust zone label
_LAYER_TO_TZ = {
    "edge": "Public Edge",
    "security": "Security Boundary",
    "service": "Core Application",
    "data": "Data Layer",
    "ml": "Data Layer",  # merge into data layer for trust zone purposes
    "observability": "Observability",
    "external": "External Integrations",
}


def assign_groups(graph: IRGraph) -> IRGraph:
    tz_to_nodes: Dict[str, List[str]] = {}
    for n in graph.nodes:
        tz_name = _LAYER_TO_TZ.get(n.layer, "Core Application")
        tz_to_nodes.setdefault(tz_name, []).append(n.id)

    groups: List[IRGroup] = []
    for idx, (tz_name, node_ids) in enumerate(tz_to_nodes.items(), start=1):
        group_id = f"tz_{idx}"
        groups.append(
            IRGroup(
                id=group_id,
                name=tz_name,
                type="trust_zone",
                member_node_ids=node_ids,
            )
        )

    # ----- bounded contexts by domain -----
    dom_to_nodes: Dict[str, List[str]] = {}
    for n in graph.nodes:
        if n.domain:
            dom_to_nodes.setdefault(n.domain, []).append(n.id)

    for idx, (domain, node_ids) in enumerate(dom_to_nodes.items(), start=1):
        # skip singletons – only add bounded context if >1 nodes share domain
        if len(node_ids) < 2:
            continue
        group_id = f"bc_{idx}"
        groups.append(
            IRGroup(
                id=group_id,
                name=domain.title(),
                type="bounded_context",
                member_node_ids=node_ids,
            )
        )

    # Preserve existing groups (should be empty in Phase-2)
    all_groups = list(graph.groups) + groups
    return graph.copy(update={"groups": all_groups}) 