"""core/ir/layout/ir_to_elk.py

Direct conversion of IR to ELK layout with layer-based positioning.
This streamlined approach:

1. Uses IR directly without complex transformations
2. Leverages layer hints added by add_layer_hints.py
3. Generates clean, deterministic layouts for diagrams with 20-500 nodes

The IR → ELK → ReactFlow pipeline is simpler and more maintainable than 
DSL → ELK → DSL → ReactFlow transformations.
"""
from __future__ import annotations

import json
import subprocess
import tempfile
import os
from pathlib import Path
from typing import Dict, Any, Optional
from utils.logger import log_info, log_error

from core.ir.ir_types import IRGraph
from core.dsl.dsl_types import DSLDiagram, DSLNode, DSLEdge


class IRLayoutEngine:
    """Direct IR to ELK layout engine for clean architectural diagrams."""

    def __init__(self):
        """Initialize the IR layout engine."""
        self.node_spacing = 100
        self.layer_spacing = 300
        self.min_node_width = 172
        self.min_node_height = 36
        
        # Find d2json binary
        self.d2json_path = self._find_d2json_binary()
    
    def layout_ir(self, ir_graph: IRGraph, direction: str = "right") -> DSLDiagram:
        """Apply ELK layout to an IR graph and return positioned DSLDiagram.
        
        Args:
            ir_graph: Input IR graph with layer hints
            direction: Layout direction ('right', 'down', 'left', 'up')
            
        Returns:
            DSLDiagram with positioned nodes ready for frontend rendering
        """
        # Convert IR to D2 with layer constraints
        d2_source = self._ir_to_d2(ir_graph, direction)
        
        # Use d2json to apply ELK layout
        layout_data = self._run_d2json_layout(d2_source)
        
        # Convert layout result to DSLDiagram
        return self._layout_to_dsl_diagram(layout_data, ir_graph)
    
    def _ir_to_d2(self, ir_graph: IRGraph, direction: str) -> str:
        """Convert IR to D2 source with ELK layer constraints."""
        lines = []
        
        # Add ELK global options
        lines.append("layout: elk")
        lines.append("elk.algorithm: layered")
        lines.append(f"elk.direction: {direction}")
        lines.append("elk.edgeRouting: ORTHOGONAL")
        
        # Enhanced node placement for strict adherence to layers
        lines.append("elk.layered.nodePlacement.strategy: NETWORK_SIMPLEX")
        lines.append("elk.layered.nodePlacement.bk.fixedAlignment: BALANCED")
        lines.append("elk.layered.crossingMinimization.semiInteractive: true")
        lines.append("elk.layered.crossingMinimization.strategy: LAYER_SWEEP")
        
        # Increased spacing for clearer separation
        lines.append(f"elk.spacing.nodeNode: {self.node_spacing + 20}")
        lines.append(f"elk.layered.spacing.nodeNodeBetweenLayers: {self.layer_spacing}")
        lines.append("elk.spacing.edgeNode: 50")
        lines.append("elk.spacing.edgeEdge: 35")
        
        # Enhanced layering strategies for better organization
        lines.append("elk.layered.layering.strategy: NETWORK_SIMPLEX")
        lines.append("elk.layered.cycleBreaking.strategy: DEPTH_FIRST")
        lines.append("elk.layered.considerModelOrder.strategy: NODES_AND_EDGES")
        
        # Enforce strict layering to prevent nodes jumping between layers
        lines.append("elk.layered.layering.layerConstraint: STRICT")
        lines.append("elk.layered.layering.nodePromotion: true")
        lines.append("elk.layered.nodePlacement.favorStraightEdges: true")
        
        # Port & edge aesthetics
        lines.append("elk.portConstraints: FIXED_SIDE")
        lines.append("elk.layered.unnecessaryBendpoints: true")
        lines.append("elk.layered.edgeLabels.sideSelection: SMART_DOWN")
        
        # Hierarchy & compaction
        lines.append("elk.hierarchyHandling: INCLUDE_CHILDREN")
        lines.append("elk.layered.compaction.postCompaction.strategy: LEFT")
        lines.append("elk.layered.highDegreeNodes.treatment: true")
        lines.append("elk.layered.highDegreeNodes.threshold: 4")
        
        # Padding & component separation
        lines.append("elk.padding: [top=120,left=150,bottom=120,right=150]")
        lines.append("elk.separateConnectedComponents: true")
        lines.append("elk.layered.thoroughness: 75")
        lines.append("elk.aspectRatio: 2.0")  # Favor horizontal layouts
        lines.append("")
        
        # Direction setting
        lines.append(f"direction: {direction}")
        lines.append("")
        
        # Group nodes by layerIndex
        layer_nodes = {}
        ungrouped_nodes = []
        
        for node in ir_graph.nodes:
            layer_idx = node.metadata.get("layerIndex")
            if layer_idx is not None:
                if layer_idx not in layer_nodes:
                    layer_nodes[layer_idx] = []
                layer_nodes[layer_idx].append(node)
            else:
                ungrouped_nodes.append(node)
        
        # Add nodes in layer clusters with explicit constraints
        for layer_idx, nodes in sorted(layer_nodes.items()):
            lines.append(f"cluster layer_{layer_idx} {{")
            lines.append(f"  direction: {direction}")
            lines.append("  class: layer")
            lines.append(f"  layerConstraint: {layer_idx}")  # Explicit layer constraint
            
            for node in nodes:
                node_label = self._escape_d2_string(node.name)
                lines.append(f'  {node.id}: "{node_label}" {{ layerIndex: {layer_idx} }}')
            
            lines.append("}")
            lines.append("")
        
        # Add ungrouped nodes with auto layer assignment
        for node in ungrouped_nodes:
            node_label = self._escape_d2_string(node.name)
            lines.append(f'{node.id}: "{node_label}"')
        
        lines.append("")
        
        # Add edges with orthogonal style for cleaner routing
        for edge in ir_graph.edges:
            if edge.label:
                edge_label = self._escape_d2_string(edge.label)
                lines.append(f'{edge.source} -> {edge.target}: "{edge_label}"')
            else:
                lines.append(f"{edge.source} -> {edge.target}")
        
        return "\n".join(lines)
    
    def _run_d2json_layout(self, d2_source: str) -> Dict:
        """Run d2json with ELK layout on the D2 source."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".d2", delete=False) as tmp:
            tmp.write(d2_source)
            tmp_path = tmp.name
        
        try:
            cmd = [self.d2json_path, "--layout", "elk", tmp_path]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=30)
            
            # Parse JSON output
            return json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            log_error(f"d2json layout failed: {e.stderr}")
            raise RuntimeError(f"ELK layout failed: {e.stderr}")
        except json.JSONDecodeError as e:
            log_error(f"Invalid JSON from d2json: {e}")
            raise RuntimeError(f"Invalid layout data: {e}")
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
    
    def _layout_to_dsl_diagram(self, layout_data: Dict, ir_graph: IRGraph) -> DSLDiagram:
        """Convert d2json layout output to DSLDiagram."""
        # Create nodes with positions from layout
        nodes = []
        nodes_by_id = {node["id"]: node for node in layout_data.get("nodes", [])}
        
        for ir_node in ir_graph.nodes:
            # Get position from layout
            layout_node = nodes_by_id.get(ir_node.id, {})
            x = float(layout_node.get("x", 0))
            y = float(layout_node.get("y", 0))
            width = float(layout_node.get("width", self.min_node_width))
            height = float(layout_node.get("height", self.min_node_height))
            
            # Create DSL node
            node = DSLNode(
                id=ir_node.id,
                type=ir_node.kind.lower(),
                label=ir_node.name,
                x=x,
                y=y,
                width=width,
                height=height,
                properties={
                    "description": "",
                    **ir_node.metadata,
                    "layerIndex": ir_node.metadata.get("layerIndex")
                }
            )
            
            # Add icon if present
            iconify_id = ir_node.metadata.get("iconify_id") or ir_node.metadata.get("icon")
            if iconify_id:
                node.iconifyId = iconify_id
            
            nodes.append(node)
        
        # Create edges
        edges = []
        for ir_edge in ir_graph.edges:
            edge = DSLEdge(
                id=ir_edge.id,
                source=ir_edge.source,
                target=ir_edge.target,
                label=ir_edge.label,
                properties={}
            )
            edges.append(edge)
        
        # Create diagram
        diagram = DSLDiagram(nodes=nodes, edges=edges)
        
        # Add groups if present
        if ir_graph.groups:
            diagram.groups = ir_graph.groups
        
        return diagram
    
    @staticmethod
    def _escape_d2_string(value: str) -> str:
        """Escape characters that break D2 syntax."""
        if value is None:
            return ""
        s = str(value).replace("\\", "\\\\")
        s = s.replace("\n", "\\n")
        s = s.replace("\"", "\\\"")
        return s
    
    @staticmethod
    def _find_d2json_binary() -> str:
        """Find the d2json binary in the project or system."""
        import shutil
        
        # First check PATH
        path = shutil.which("d2json")
        if path:
            return path
        
        # Check common locations
        base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
        possible_paths = [
            base_dir / "tools" / "cmd" / "d2json" / "d2json",
            base_dir / "sdr_backend" / "tools" / "cmd" / "d2json" / "d2json",
            Path.home() / "bin" / "d2json",
            Path("/usr/local/bin/d2json"),
            Path("/usr/bin/d2json")
        ]
        
        for p in possible_paths:
            if p.is_file() and os.access(p, os.X_OK):
                return str(p)
        
        raise FileNotFoundError("d2json binary not found - required for ELK layout") 