from __future__ import annotations

"""core/ir/ir_builder.py

Phase-2 – minimal IR construction
--------------------------------
Takes the *syntactic* DSL representation (``DSLDiagram``) and converts it
into a semantically *unclassified* ``IRGraph``.  At this early stage we do
not attempt any enrichment – every node becomes a ``Service`` on the
``service`` layer and no groups or annotations are generated.

The main purpose is to prove the pipeline end-to-end so the IR JSON can be
stored in Postgres guarded behind the ``IR_BUILDER_MIN_ACTIVE`` flag.
"""

from typing import Any, Dict, List

from core.dsl.dsl_types import DSLDiagram, DSLNode, DSLEdge
from .ir_types import IRGraph, IRNode, IREdge


class IRBuilder:
    """Stateless helper building :class:`IRGraph` objects."""

    DEFAULT_KIND = "Service"
    DEFAULT_LAYER = "service"

    # ---------------------------------------------------------------------
    #  Public API
    # ---------------------------------------------------------------------

    def build(self, diagram: DSLDiagram, source_dsl: str = "") -> IRGraph:
        """Convert *diagram* (DSL) into an *IRGraph* without enrichment."""
        nodes: List[IRNode] = [self._node_from_dsl(n) for n in diagram.nodes]
        edges: List[IREdge] = [self._edge_from_dsl(e) for e in diagram.edges]

        return IRGraph(
            nodes=nodes,
            edges=edges,
            groups=[],
            annotations=[],
            source_dsl=source_dsl,
        )

    # ------------------------------------------------------------------
    #  Internals
    # ------------------------------------------------------------------

    def _node_from_dsl(self, n: DSLNode) -> IRNode:
        return IRNode(
            id=n.id,
            name=n.label,
            kind=self.DEFAULT_KIND,  # classification comes later
            layer=self.DEFAULT_LAYER,
        )

    def _edge_from_dsl(self, e: DSLEdge) -> IREdge:
        return IREdge(
            id=e.id,
            source=e.source,
            target=e.target,
            label=e.label,
        ) 