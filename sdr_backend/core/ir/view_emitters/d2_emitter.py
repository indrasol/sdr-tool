from __future__ import annotations

from typing import List

from core.ir.ir_types import IRGraph
from . import ViewEmitter
from utils.logger import log_info


class D2Emitter(ViewEmitter):
    """Very lightweight IR → D2 diagram emitter (Phase-4 placeholder)."""

    view_id = "d2"

    def emit(self, graph: IRGraph) -> str:  # returns D2 source
        log_info(f"D2 emitter: Converting IR graph with {len(graph.nodes)} nodes, {len(graph.edges)} edges")
        
        lines: List[str] = ["direction: right\n"]

        # Process all nodes
        log_info("D2 emitter: Processing nodes")
        for n in graph.nodes:
            label = n.name.replace("\"", "\'")
            lines.append(f"{n.id}: \"{label}\"")

        # Process all edges
        log_info("D2 emitter: Processing edges")
        for e in graph.edges:
            label = f" : \"{e.label}\"" if e.label else ""
            lines.append(f"{e.source} -> {e.target}{label}")

        output = "\n".join(lines)
        log_info(f"D2 emitter: Generated {len(lines)} lines of D2 code")
        return output 