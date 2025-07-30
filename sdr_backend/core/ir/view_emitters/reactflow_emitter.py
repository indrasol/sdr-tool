from __future__ import annotations

from typing import Any, Dict, List

from core.ir.ir_types import IRGraph, IRNode, IREdge, IRGroup
from . import ViewEmitter
from utils.logger import log_info, log_error


class ReactFlowEmitter(ViewEmitter):
    """Emit React-Flow compatible payload.

    – Nodes convert to {id, type, position, data}
    – Trust-zone / bounded-context groups become *layerGroup* nodes that wrap
      their members via ``parentNode``.
    """

    view_id = "reactflow"

    DEFAULT_SIZE = {"width": 172, "height": 36}

    def emit(self, graph: IRGraph) -> Dict[str, Any]:
        log_info(f"ReactFlow emitter: Converting IR graph with {len(graph.nodes)} nodes, {len(graph.edges)} edges, {len(graph.groups)} groups")
        
        rf_nodes: List[Dict[str, Any]] = []
        rf_edges: List[Dict[str, Any]] = []

        # 1) groups first so child nodes can reference parent
        log_info(f"ReactFlow emitter: Processing {len(graph.groups)} groups")
        group_meta = {g.id: g for g in graph.groups}
        for g in graph.groups:
            style = self._group_style(g)
            # bounding box will be updated later after positions; init padding
            rf_nodes.append(
                {
                    "id": g.id,
                    "type": "layerGroup",
                    "position": {"x": 0, "y": 0},  # will be laid out later
                    "data": {
                        "label": g.name,
                        "groupType": g.type,
                        "style": style,
                    },
                }
            )

        # 2) actual nodes
        log_info(f"ReactFlow emitter: Processing {len(graph.nodes)} nodes")
        for n in graph.nodes:
            parent_id = self._parent_for_node(n, group_meta)
            rf_nodes.append(
                {
                    "id": n.id,
                    "type": "default",  # FE maps icon internally
                    "position": {"x": 0, "y": 0},
                    "data": {
                        "label": n.name,
                        "kind": n.kind,
                        "subkind": n.subkind,
                        "icon": n.metadata.get("icon"),
                        "color": n.metadata.get("color"),
                        "shape": n.metadata.get("shape"),
                        "risk": (n.risk_tags[0] if n.risk_tags else None),
                    },
                    "parentNode": parent_id,
                }
            )

        # ----- adjust group bounding boxes after nodes processed -----
        child_positions: Dict[str, List[Dict[str, float]]] = {}
        for n in rf_nodes:
            parent = n.get("parentNode")
            if parent:
                child_positions.setdefault(parent, []).append(n["position"])

        for grp_node in rf_nodes:
            if grp_node["type"] != "layerGroup":
                continue
            children = child_positions.get(grp_node["id"], [])
            if not children:
                continue
            min_x = min(c["x"] for c in children)
            max_x = max(c["x"] for c in children)
            min_y = min(c["y"] for c in children)
            max_y = max(c["y"] for c in children)
            padding = 40
            grp_node["position"] = {"x": min_x - padding, "y": min_y - padding}
            grp_node["data"]["width"] = (max_x - min_x) + 2 * padding
            grp_node["data"]["height"] = (max_y - min_y) + 2 * padding

        # 3) edges
        log_info(f"ReactFlow emitter: Processing {len(graph.edges)} edges")
        for e in graph.edges:
            style = "solid" if e.purpose != "control" else "dashed"
            rf_edges.append(
                {
                    "id": e.id,
                    "source": e.source,
                    "target": e.target,
                    "label": e.label,
                    "data": {
                        "protocol": e.protocol,
                        "purpose": e.purpose,
                    },
                    "style": {"strokeDasharray": "6 6"} if style == "dashed" else {},
                }
            )

        log_info(f"ReactFlow emitter: Conversion complete - generated {len(rf_nodes)} nodes and {len(rf_edges)} edges")
        return {"nodes": rf_nodes, "edges": rf_edges}

    # ------------------------------------------------------------------
    #  helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _parent_for_node(node: IRNode, grp_index: Dict[str, IRGroup] | None):
        if not grp_index:
            return None
        for g in grp_index.values():
            if node.id in g.member_node_ids:
                return g.id
        return None

    @staticmethod
    def _group_style(group: IRGroup) -> Dict[str, str]:
        if group.type == "trust_zone":
            color_map = {"low": "#cbd5e1", "medium": "#fbbf24", "high": "#ef4444"}
            # pick highest severity among children (simplistic)
            risk = "low"
            return {
                "fill": "#f1f5f9",
                "strokeWidth": 2,
                "stroke": color_map.get(risk, "#cbd5e1"),
            }
        if group.type == "bounded_context":
            return {
                "fill": "#ffffff00",  # transparent
                "strokeDasharray": "4 4",
            }
        return {} 