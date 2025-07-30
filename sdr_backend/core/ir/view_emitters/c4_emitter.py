from __future__ import annotations

from typing import List

from core.ir.ir_types import IRGraph
from . import ViewEmitter
from utils.logger import log_info


class C4ContextEmitter(ViewEmitter):
    """Simplified C4-Context plantUML emitter (placeholder)."""

    view_id = "c4ctx"

    def emit(self, graph: IRGraph) -> str:
        log_info(f"C4 emitter: Converting IR graph with {len(graph.nodes)} nodes, {len(graph.edges)} edges")
        
        lines: List[str] = ["@startuml", "!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml", ""]

        # Process nodes with different treatment based on layer
        log_info("C4 emitter: Processing nodes as Persons and Systems")
        for n in graph.nodes:
            label = n.name.replace("\"", "\'")
            if n.layer == "edge":
                lines.append(f"Person({n.id}, \"{label}\")")
            else:
                lines.append(f"System({n.id}, \"{label}\")")

        # Process edges as relationships
        log_info("C4 emitter: Processing edges as relationships")
        lines.append("")
        for e in graph.edges:
            label = e.label or ""
            lines.append(f"Rel({e.source}, {e.target}, \"{label}\")")

        lines.append("@enduml")
        
        output = "\n".join(lines)
        log_info(f"C4 emitter: Generated {len(lines)} lines of PlantUML code")
        return output 