from __future__ import annotations

"""crossing_reducer.py – simple greedy sibling-swap algorithm.

The algorithm operates *within each layer rank*: nodes are sorted by their
current X coordinate (left → right).  We iterate over adjacent pairs and
swap them if doing so reduces the number of edge crossings between the two
layers they connect to.  One pass tends to remove most crossings for small
ranks.

The implementation is intentionally simple and fast; we run it *after* ELK
produces a layer-constrained layout.
"""

from typing import Dict, List, Tuple

from core.dsl.dsl_types import DSLDiagram, DSLNode, DSLEdge


def _count_crossings(edges: List[Tuple[int, int]]) -> int:
    """Return number of crossings in a list of edge index pairs."""
    crossings = 0
    for i in range(len(edges)):
        a1, a2 = edges[i]
        for j in range(i + 1, len(edges)):
            b1, b2 = edges[j]
            if (a1 - b1) * (a2 - b2) < 0:  # lines cross
                crossings += 1
    return crossings


def reduce_crossings(diagram: DSLDiagram) -> DSLDiagram:
    nodes_by_id: Dict[str, DSLNode] = {n.id: n for n in diagram.nodes}

    # Build layer buckets by Y (assumes LR layout). Use integer layer rank by div 200 spacing.
    layers: Dict[int, List[DSLNode]] = {}
    for n in diagram.nodes:
        rank = int(n.y // 200)
        layers.setdefault(rank, []).append(n)

    new_nodes: List[DSLNode] = list(diagram.nodes)

    for rank, bucket in layers.items():
        # sort bucket by current X
        bucket.sort(key=lambda n: n.x)
        id_to_index = {n.id: idx for idx, n in enumerate(bucket)}

        # build edge list indexes between this layer and next
        edges_out = [e for e in diagram.edges if e.source in id_to_index]
        if not edges_out:
            continue

        optimal = bucket.copy()
        improved = True
        while improved:
            improved = False
            for i in range(len(optimal) - 1):
                a, b = optimal[i], optimal[i + 1]
                # compute crossings if we swap
                idx_map = {n.id: idx for idx, n in enumerate(optimal)}
                current_edges = [(idx_map[e.source], idx_map[e.target]) for e in edges_out if e.target in idx_map]
                base = _count_crossings(current_edges)

                # swap
                optimal[i], optimal[i + 1] = optimal[i + 1], optimal[i]
                idx_map_swapped = {n.id: idx for idx, n in enumerate(optimal)}
                swapped_edges = [(idx_map_swapped[e.source], idx_map_swapped[e.target]) for e in edges_out if e.target in idx_map_swapped]
                new_cross = _count_crossings(swapped_edges)

                if new_cross < base:
                    improved = True  # keep swap
                else:
                    # revert
                    optimal[i], optimal[i + 1] = optimal[i + 1], optimal[i]

        # update x positions according to optimal ordering (keep spacing)
        spacing = 200
        for idx, node in enumerate(optimal):
            node.x = idx * spacing + 50  # re-centre a bit

    return diagram.copy(update={"nodes": new_nodes}) 