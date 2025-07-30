"""Add synthetic IRGroup objects representing swim-lane containers.

Prerequisite: every node has ``metadata['layerIndex']`` set (e.g. via
``add_layer_hints``).  The function mutates the graph *in place* and returns
it so the functional pipeline contract stays intact.
"""
from __future__ import annotations

from collections import defaultdict
from typing import Dict, List

from core.ir.ir_types import IRGraph, IRGroup


def inject_layer_groups(ir: IRGraph) -> IRGraph:
    layer_to_nodes: Dict[int, List[str]] = defaultdict(list)
    for n in ir.nodes:
        layer = n.metadata.get("layerIndex")
        if layer is not None:
            layer_to_nodes[int(layer)].append(n.id)

    if not layer_to_nodes:
        return ir

    groups: List[IRGroup] = []
    for layer, ids in sorted(layer_to_nodes.items()):
        gid = f"layer_{layer}"
        groups.append(
            IRGroup(
                id=gid,
                name=f"Layer {layer}",
                type="layer_cluster",
                member_node_ids=ids,
            )
        )

    new_groups = list(ir.groups) + groups
    return ir.copy(update={"groups": new_groups}) 