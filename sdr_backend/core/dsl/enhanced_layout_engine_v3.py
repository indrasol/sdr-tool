# core/dsl/enhanced_layout_engine_v3.py
"""
Enhanced Layout Engine V3 - Multi-Engine Support with Intelligent Fallback
========================================================================

Provides robust layout capabilities with:
- Multiple layout engines: ELK, Dagre, Basic positioning
- Automatic complexity detection and engine selection
- Intelligent fallback chain: ELK → Dagre → Basic
- Direction control for all engines (LR, TB, BT, RL)
- Performance monitoring and quality metrics
- Layout validation and repair

Usage:
    engine = EnhancedLayoutEngineV3()
    result = engine.layout(diagram, direction='LR', preferred_engine='auto')
"""

import json
import time
import subprocess
import tempfile
import os
from enum import Enum
from typing import Dict, List, Any, Optional, Tuple, NamedTuple
from dataclasses import dataclass
from utils.logger import log_info, log_error
from core.dsl.dsl_types import DSLDiagram, DSLNode, DSLEdge
from core.ir.layout.constraint_adapter import ir_to_dsl, ir_hash
from core.ir.layout import cache as ir_cache
from core.ir.ir_types import IRGraph
from collections import defaultdict


class LayoutEngine(Enum):
    """Available layout engines in order of preference."""
    ELK = "elk"
    DAGRE = "dagre" 
    BASIC = "basic"
    AUTO = "auto"  # Automatic selection based on complexity


class LayoutDirection(Enum):
    """Supported layout directions."""
    LEFT_TO_RIGHT = "LR"
    TOP_TO_BOTTOM = "TB"
    BOTTOM_TO_TOP = "BT"
    RIGHT_TO_LEFT = "RL"


@dataclass
class ComplexityMetrics:
    """Metrics for determining diagram complexity."""
    node_count: int
    edge_count: int
    layer_depth: int
    edge_density: float
    has_cycles: bool
    max_degree: int
    complexity_score: float
    
    def __str__(self) -> str:
        return f"ComplexityMetrics(nodes={self.node_count}, edges={self.edge_count}, " \
               f"layers={self.layer_depth}, density={self.edge_density:.2f}, " \
               f"cycles={self.has_cycles}, score={self.complexity_score:.2f})"


@dataclass  
class LayoutResult:
    """Result of layout operation with performance metrics."""
    diagram: DSLDiagram
    engine_used: LayoutEngine
    direction_used: LayoutDirection
    execution_time: float
    success: bool
    quality_score: float
    error_message: Optional[str] = None
    fallback_chain: Optional[List[LayoutEngine]] = None
    metrics: Optional[ComplexityMetrics] = None
    
    def __str__(self) -> str:
        status = "SUCCESS" if self.success else "FAILED"
        return f"LayoutResult({status}, engine={self.engine_used.value}, " \
               f"time={self.execution_time:.3f}s, quality={self.quality_score:.2f})"


class EnhancedLayoutEngineV3:
    """
    Advanced layout engine with multi-engine support and intelligent fallback.
    
    Features:
    - Automatic complexity detection and engine selection
    - Robust fallback chain with graceful degradation
    - Performance monitoring and quality assessment
    - Direction control for all layout engines
    - Layout validation and repair capabilities
    """
    
    def __init__(self):
        self.node_spacing = 150
        self.layer_spacing = 200
        self.min_node_width = 120
        self.min_node_height = 60
        
        # Complexity thresholds for engine selection
        self.elk_threshold = 2.0      # Use ELK for complex diagrams
        self.dagre_threshold = 1.0    # Use Dagre for medium diagrams
        # Basic layout for simple diagrams (< 1.0)
        
        # Performance tracking
        self.layout_history: List[LayoutResult] = []
        self.engine_performance: Dict[LayoutEngine, List[float]] = {
            LayoutEngine.ELK: [],
            LayoutEngine.DAGRE: [],
            LayoutEngine.BASIC: []
        }
    
    def layout(
        self,
        diagram: DSLDiagram,
        direction: LayoutDirection = LayoutDirection.LEFT_TO_RIGHT,
        preferred_engine: LayoutEngine = LayoutEngine.AUTO,
        max_retries: int = 3
    ) -> LayoutResult:
        """
        Apply layout to diagram with intelligent engine selection and fallback.
        
        Args:
            diagram: Input diagram to layout
            direction: Layout direction preference
            preferred_engine: Preferred layout engine or AUTO for automatic selection
            max_retries: Maximum retry attempts per engine
            
        Returns:
            LayoutResult with positioned diagram and performance metrics
        """
        start_time = time.time()

        if not diagram.nodes:
            log_info("No nodes to layout – nothing to do")
            return LayoutResult(
                diagram=diagram,
                engine_used=LayoutEngine.ELK,
                direction_used=direction,
                execution_time=time.time() - start_time,
                success=True,
                quality_score=1.0,
            )

        # ------------------------------------------------------------------
        #  Engine order: ELK first → Dagre second.  No complexity heuristics.
        # ------------------------------------------------------------------
        if preferred_engine == LayoutEngine.AUTO:
            selected_engines = [LayoutEngine.ELK, LayoutEngine.DAGRE]
        else:
            # Always ensure dagre is the fallback if preferred fails.
            selected_engines = [preferred_engine]
            if preferred_engine != LayoutEngine.DAGRE:
                selected_engines.append(LayoutEngine.DAGRE)

        log_info(
            "Layout engine attempt order (no complexity heuristics): "
            f"{[e.value for e in selected_engines]}"
        )
        
        # Try each engine in the fallback chain
        last_error = None
        for engine in selected_engines:
            log_info(f"Attempting layout with {engine.value} engine")

            # Run the engine inside a try/except so we can handle unexpected crashes
            try:
                result = self._layout_with_engine(diagram, engine, direction)
            except Exception as e:
                # A low-level exception escaped _layout_with_engine; treat as failure.
                log_error(f"Engine {engine.value} raised exception: {e}")
                last_error = str(e)
                continue

            # Record timing even if the engine ultimately fails – helps diagnostics
            self._record_performance(engine, result.execution_time)

            if result.success:
                # Validate layout quality (without complexity we still check basic metrics)
                quality_score = self._assess_layout_quality(result.diagram, None)  # metrics optional
                result.quality_score = quality_score
                # metrics no longer used – keep None to avoid confusion
                result.fallback_chain = selected_engines

                # --- IR-aware crossing reduction (post ELK) ---
                try:
                    from core.ir.layout.crossing_reducer import reduce_crossings
                    result.diagram = reduce_crossings(result.diagram)
                except Exception as e:
                    log_error(f"crossing reducer failed: {e}")

                self.layout_history.append(result)

                log_info(f"Layout successful: {result}")
                return result
            else:
                # Capture the error message for later reporting and continue to next engine
                last_error = result.error_message or "unknown error"
                log_error(
                    f"Engine {engine.value} reported failure. Reason: {last_error}. Trying next fallback if any."
                )
                continue
        
        # All engines failed – propagate error (no Basic fallback)
        log_error(f"All layout engines failed. Last error: {last_error}")
        raise RuntimeError(f"All layout engines failed: {last_error}")
    
    def layout_ir(
        self,
        ir_graph: IRGraph,
        direction: LayoutDirection = LayoutDirection.LEFT_TO_RIGHT,
    ) -> DSLDiagram:
        """Position nodes based on IR layer ranks with caching.

        Returns a **DSLDiagram** ready for emission/rendering. Uses direct
        IR → ELK conversion for cleaner, more efficient layouts.
        """
        from core.ir.layout.ir_to_elk import IRLayoutEngine
        from core.ir.layout.crossing_reducer import reduce_crossings

        key = ir_hash(ir_graph)
        cached = ir_cache.get(key)
        if cached:
            return cached  # already a positioned DSLDiagram

        # Use our new direct IR to ELK approach
        try:
            # Convert direction enum to string
            dir_str = "right"
            if direction == LayoutDirection.TOP_TO_BOTTOM:
                dir_str = "down"
            elif direction == LayoutDirection.RIGHT_TO_LEFT:
                dir_str = "left"
            elif direction == LayoutDirection.BOTTOM_TO_TOP:
                dir_str = "up"
            
            # Apply direct IR to ELK layout
            ir_layout = IRLayoutEngine()
            positioned = ir_layout.layout_ir(ir_graph, direction=dir_str)
            
            # Apply crossing reduction as a post-process
            try:
                positioned = reduce_crossings(positioned)
            except Exception as e:
                log_error(f"crossing reducer failed: {e}")
            
            # Cache the result
            ir_cache.set(key, positioned)
            return positioned
        
        except Exception as e:
            log_error(f"Direct IR layout failed: {e}")
            
            # Fall back to old approach as a safety measure
            log_info("Falling back to traditional DSL conversion approach")
            dsl_input = ir_to_dsl(ir_graph)

            layout_result = self.layout(
                dsl_input,
                direction=direction,
                preferred_engine=LayoutEngine.ELK,
            )

            positioned = layout_result.diagram
            ir_cache.set(key, positioned)
            return positioned
    
    def _analyze_complexity(self, diagram: DSLDiagram) -> ComplexityMetrics:
        """Analyze diagram complexity to determine optimal layout engine."""
        nodes = diagram.nodes
        edges = diagram.edges
        
        node_count = len(nodes)
        edge_count = len(edges)
        
        # Calculate edge density
        max_possible_edges = node_count * (node_count - 1) / 2 if node_count > 1 else 1
        edge_density = edge_count / max_possible_edges if max_possible_edges > 0 else 0.0
        
        # Estimate layer depth using topological analysis
        layer_depth = self._estimate_layer_depth(nodes, edges)
        
        # Check for cycles
        has_cycles = self._detect_cycles(nodes, edges)
        
        # Calculate maximum node degree
        node_degrees = {}
        for edge in edges:
            node_degrees[edge.source] = node_degrees.get(edge.source, 0) + 1
            node_degrees[edge.target] = node_degrees.get(edge.target, 0) + 1
        max_degree = max(node_degrees.values()) if node_degrees else 0
        
        # Calculate overall complexity score
        complexity_score = self._calculate_complexity_score(
            node_count, edge_count, edge_density, layer_depth, has_cycles, max_degree
        )
        
        return ComplexityMetrics(
            node_count=node_count,
            edge_count=edge_count,
            layer_depth=layer_depth,
            edge_density=edge_density,
            has_cycles=has_cycles,
            max_degree=max_degree,
            complexity_score=complexity_score
        )
    
    def _calculate_complexity_score(
        self,
        node_count: int,
        edge_count: int,
        edge_density: float,
        layer_depth: int,
        has_cycles: bool,
        max_degree: int
    ) -> float:
        """Calculate overall complexity score for engine selection."""
        score = 0.0
        
        # Node count factor (logarithmic scaling)
        if node_count > 0:
            score += min(2.0, (node_count / 20.0))
        
        # Edge density factor
        score += edge_density * 1.5
        
        # Layer depth factor
        score += min(1.0, layer_depth / 5.0)
        
        # Cycle penalty
        if has_cycles:
            score += 0.5
        
        # High degree penalty
        if max_degree > 5:
            score += min(1.0, (max_degree - 5) / 10.0)
        
        return score
    
    def _select_engines_by_complexity(self, metrics: ComplexityMetrics) -> List[LayoutEngine]:
        """Select layout engines – Basic engine disabled. Always try ELK ➜ DAGRE."""
        # Regardless of complexity we always prefer ELK and fall back to DAGRE.
        return [LayoutEngine.ELK, LayoutEngine.DAGRE]
    
    def _get_fallback_chain(self, preferred: LayoutEngine) -> List[LayoutEngine]:
        """Return fallback chain – Basic engine removed."""
        # Always attempt ELK first, then DAGRE. BASIC is no longer considered.
        return [LayoutEngine.ELK, LayoutEngine.DAGRE]
    
    def _layout_with_engine(
        self,
        diagram: DSLDiagram,
        engine: LayoutEngine,
        direction: LayoutDirection
    ) -> LayoutResult:
        """Apply layout using specific engine."""
        start_time = time.time()
        
        try:
            if engine == LayoutEngine.ELK:
                positioned_diagram = self._layout_with_elk(diagram, direction)
            elif engine == LayoutEngine.DAGRE:
                positioned_diagram = self._layout_with_dagre(diagram, direction)
            elif engine == LayoutEngine.BASIC:
                positioned_diagram = self._layout_with_basic(diagram, direction)
            else:
                raise ValueError(f"Unknown layout engine: {engine}")
            
            execution_time = time.time() - start_time
            
            return LayoutResult(
                diagram=positioned_diagram,
                engine_used=engine,
                direction_used=direction,
                execution_time=execution_time,
                success=True,
                quality_score=0.0  # Will be calculated later
            )
            
        except Exception as e:
            execution_time = time.time() - start_time
            return LayoutResult(
                diagram=diagram,
                engine_used=engine,
                direction_used=direction,
                execution_time=execution_time,
                success=False,
                quality_score=0.0,
                error_message=str(e)
            )
    
    def _layout_with_elk(self, diagram: DSLDiagram, direction: LayoutDirection) -> DSLDiagram:
        """Layout using ELK algorithm via D2."""
        return self._layout_with_d2(diagram, "elk", direction)
    
    def _layout_with_dagre(self, diagram: DSLDiagram, direction: LayoutDirection) -> DSLDiagram:
        """Layout using Dagre algorithm via D2."""
        return self._layout_with_d2(diagram, "dagre", direction)
    
    def _layout_with_d2(
        self,
        diagram: DSLDiagram,
        algorithm: str,
        direction: LayoutDirection,
    ) -> DSLDiagram:
        """Layout using project-local *d2json* binary (always JSON)."""

        d2json_bin = self._find_d2json_binary()

        # Convert diagram to D2 source so d2json can lay it out.
        d2_content = self._diagram_to_d2(diagram, direction)

        # Write to temp file for the binary to read.
        with tempfile.NamedTemporaryFile(mode="w", suffix=".d2", delete=False) as f:
            f.write(d2_content)
            temp_file = f.name

        try:
            cmd = [
                d2json_bin,
                "--layout",
                algorithm,
                temp_file,
            ]

            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=30,
                    check=True,
                )
            except subprocess.CalledProcessError as cpe:
                err_msg = (
                    f"d2json {algorithm} exited with {cpe.returncode}. "
                    f"stderr: {cpe.stderr.strip()[:300]}"
                )
                raise RuntimeError(err_msg) from cpe

            # Parse JSON emitted by d2json
            try:
                layout_data = json.loads(result.stdout)
            except json.JSONDecodeError as jde:
                raise RuntimeError(
                    f"d2json {algorithm} produced invalid JSON: {jde} – first 200 chars: {result.stdout[:200]}"
                ) from jde

            return self._d2_json_to_diagram(layout_data, diagram)
        finally:
            try:
                os.unlink(temp_file)
            except OSError:
                pass

    # ------------------------------------------------------------------
    #  d2json binary resolution (copied from dsl_parser_v2)
    # ------------------------------------------------------------------

    @staticmethod
    def _find_d2json_binary() -> str:
        """Locate the *d2json* binary used across the backend."""
        import shutil
        from pathlib import Path

        # 1) PATH lookup
        path = shutil.which("d2json")
        if path:
            return path

        # 2) Common project-relative locations
        base_dir = Path(__file__).resolve().parent.parent.parent.parent  # project root
        candidate_paths = [
            base_dir / "tools" / "cmd" / "d2json" / "d2json",
            base_dir / "sdr_backend" / "tools" / "cmd" / "d2json" / "d2json",
            Path.home() / "bin" / "d2json",
            Path("/usr/local/bin/d2json"),
            Path("/usr/bin/d2json"),
        ]

        for p in candidate_paths:
            if p.is_file() and os.access(p, os.X_OK):
                return str(p)

        raise FileNotFoundError(
            "d2json binary not found – ensure it is built and on PATH or under tools/cmd/d2json."
        )
    
    def _layout_with_basic(self, diagram: DSLDiagram, direction: LayoutDirection) -> DSLDiagram:
        """Basic grid-based layout implementation."""
        positioned_diagram = DSLDiagram(
            nodes=diagram.nodes.copy(),
            edges=diagram.edges.copy()
        )
        
        nodes = positioned_diagram.nodes
        
        if not nodes:
            return positioned_diagram
        
        # Calculate grid dimensions
        node_count = len(nodes)
        if direction in [LayoutDirection.LEFT_TO_RIGHT, LayoutDirection.RIGHT_TO_LEFT]:
            # Horizontal layout - more columns
            cols = max(1, int(node_count ** 0.7))
            rows = (node_count + cols - 1) // cols
        else:
            # Vertical layout - more rows
            rows = max(1, int(node_count ** 0.7))
            cols = (node_count + rows - 1) // rows
        
        # Position nodes
        for idx, node in enumerate(nodes):
            if direction == LayoutDirection.LEFT_TO_RIGHT:
                row = idx // cols
                col = idx % cols
                x = 100 + col * (self.min_node_width + self.node_spacing)
                y = 100 + row * (self.min_node_height + self.layer_spacing)
            elif direction == LayoutDirection.RIGHT_TO_LEFT:
                row = idx // cols
                col = cols - 1 - (idx % cols)
                x = 100 + col * (self.min_node_width + self.node_spacing)
                y = 100 + row * (self.min_node_height + self.layer_spacing)
            elif direction == LayoutDirection.TOP_TO_BOTTOM:
                col = idx // rows
                row = idx % rows
                x = 100 + col * (self.min_node_width + self.node_spacing)
                y = 100 + row * (self.min_node_height + self.layer_spacing)
            else:  # BOTTOM_TO_TOP
                col = idx // rows
                row = rows - 1 - (idx % rows)
                x = 100 + col * (self.min_node_width + self.node_spacing)
                y = 100 + row * (self.min_node_height + self.layer_spacing)
            
            node.x = float(x)
            node.y = float(y)
            node.width = max(float(getattr(node, 'width', self.min_node_width)), self.min_node_width)
            node.height = max(float(getattr(node, 'height', self.min_node_height)), self.min_node_height)
        
        return positioned_diagram
    
    def _diagram_to_d2(self, diagram: DSLDiagram, direction: LayoutDirection) -> str:
        """Convert DSLDiagram to D2 format **with layer clusters**.

        Nodes that carry ``properties['layerIndex']`` are emitted inside a
        dedicated cluster (``layer_<idx>``).  This gives ELK concrete layer
        constraints so the final layout preserves left-to-right swim lanes.
        """
        lines: List[str] = []

        # Add ELK global options for better spacing and edge routing
        lines.append("layout: elk")
        lines.append("elk.algorithm: layered")
        lines.append("elk.direction: right")
        lines.append("elk.edgeRouting: ORTHOGONAL")

        # --- Node placement & crossing minimisation (mirror frontend) ---
        lines.append("elk.layered.nodePlacement.strategy: NETWORK_SIMPLEX")
        lines.append("elk.layered.nodePlacement.bk.fixedAlignment: BALANCED")
        lines.append("elk.layered.crossingMinimization.semiInteractive: true")
        lines.append("elk.layered.crossingMinimization.strategy: LAYER_SWEEP")

        # --- Spacing parameters ---
        lines.append("elk.spacing.nodeNode: 100")
        lines.append("elk.layered.spacing.nodeNodeBetweenLayers: 300")
        lines.append("elk.spacing.edgeNode: 40")
        lines.append("elk.spacing.edgeEdge: 25")

        # --- Layering / cycle breaking ---
        lines.append("elk.layered.layering.strategy: NETWORK_SIMPLEX")
        lines.append("elk.layered.cycleBreaking.strategy: GREEDY")
        lines.append("elk.layered.considerModelOrder.strategy: NODES_AND_EDGES")

        # --- Port & edge aesthetics ---
        lines.append("elk.portConstraints: FIXED_SIDE")
        lines.append("elk.layered.unnecessaryBendpoints: true")
        lines.append("elk.layered.edgeLabels.sideSelection: SMART_DOWN")

        # --- Hierarchy & compaction ---
        lines.append("elk.hierarchyHandling: INCLUDE_CHILDREN")
        lines.append("elk.layered.nodePlacement.favorStraightEdges: true")
        lines.append("elk.layered.compaction.postCompaction.strategy: LEFT")

        # --- Padding & component separation ---
        lines.append("elk.padding: [top=80,left=100,bottom=80,right=100]")
        lines.append("elk.separateConnectedComponents: true")
        lines.append("elk.layered.thoroughness: 50")
        lines.append("")
        # ------------------------------------------------------------------
        #  1) Global direction setting
        # ------------------------------------------------------------------
        direction_map = {
            LayoutDirection.LEFT_TO_RIGHT: "right",
            LayoutDirection.TOP_TO_BOTTOM: "down",
            LayoutDirection.BOTTOM_TO_TOP: "up",
            LayoutDirection.RIGHT_TO_LEFT: "left",
        }
        lines.append(f"direction: {direction_map[direction]}")
        lines.append("")

        # ------------------------------------------------------------------
        #  2) Bucket nodes by *layerIndex* for clustered emission
        # ------------------------------------------------------------------
        layer_to_nodes: defaultdict[int, List[DSLNode]] = defaultdict(list)
        ungrouped: List[DSLNode] = []
        for node in diagram.nodes:
            layer_idx = None
            # ``properties`` may be absent; guard defensively.
            if hasattr(node, "properties") and isinstance(node.properties, dict):
                layer_idx = node.properties.get("layerIndex")
            if layer_idx is None:
                ungrouped.append(node)
            else:
                try:
                    layer_to_nodes[int(layer_idx)].append(node)
                except (TypeError, ValueError):
                    ungrouped.append(node)

        # ------------------------------------------------------------------
        #  3) Helper to escape labels
        # ------------------------------------------------------------------
        def _node_line(n: DSLNode, indent: str = "") -> str:
            label = self._escape_d2_string(n.label if n.label else n.id)
            layer_opt = ""
            if hasattr(n, "properties") and isinstance(n.properties, dict):
                li = n.properties.get("layerIndex")
                if isinstance(li, (int, float)):
                    layer_opt = f" {{ layerIndex: {int(li)} }}"
            return f"{indent}{n.id}: \"{label}\"{layer_opt}"

        # ------------------------------------------------------------------
        #  4) Emit clustered nodes first (sorted by layer index)
        # ------------------------------------------------------------------
        for layer_idx, nodes_in_layer in sorted(layer_to_nodes.items()):
            lines.append(f"cluster layer_{layer_idx} {{")
            lines.append("  direction: right")  # ensure horizontal inside cluster
            # Optional visual hint – caller CSS can style .layer
            lines.append("  class: layer")
            for n in nodes_in_layer:
                lines.append(_node_line(n, indent="  "))
            lines.append("}")
            lines.append("")

        # ------------------------------------------------------------------
        #  5) Emit any nodes without layerIndex at root level
        # ------------------------------------------------------------------
        for n in ungrouped:
            lines.append(_node_line(n))

        lines.append("")

        # ------------------------------------------------------------------
        #  6) Emit edges
        # ------------------------------------------------------------------
        for edge in diagram.edges:
            if edge.label:
                lbl = self._escape_d2_string(edge.label)
                lines.append(f'{edge.source} -> {edge.target}: "{lbl}"')
            else:
                lines.append(f"{edge.source} -> {edge.target}")

        return "\n".join(lines)

    # ------------------------------------------------------------------
    #  Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _escape_d2_string(value: str) -> str:
        """Escape characters that break D2 syntax (quote, backslash, newlines)."""
        if value is None:
            return ""
        # Replace backslashes first to avoid double-escaping
        s = value.replace("\\", "\\\\")
        s = s.replace("\n", "\\n")
        s = s.replace("\"", "\\\"")
        return s
    
    def _d2_json_to_diagram(self, json_data: Dict, original_diagram: DSLDiagram) -> DSLDiagram:
        """Convert D2 JSON output back to DSLDiagram."""
        positioned_diagram = DSLDiagram(
            nodes=original_diagram.nodes.copy(),
            edges=original_diagram.edges.copy()
        )
        
        # Update node positions from D2 output
        nodes_by_id = {node.id: node for node in positioned_diagram.nodes}
        
        for node_data in json_data.get("nodes", []):
            node_id = node_data.get("id")
            if node_id in nodes_by_id:
                node = nodes_by_id[node_id]
                node.x = float(node_data.get("x", 0))
                node.y = float(node_data.get("y", 0))
                node.width = float(node_data.get("width", self.min_node_width))
                node.height = float(node_data.get("height", self.min_node_height))
        
        return positioned_diagram
    
    def _create_basic_layout(self, diagram: DSLDiagram, direction: LayoutDirection) -> LayoutResult:
        """Create basic layout as ultimate fallback."""
        start_time = time.time()
        
        try:
            positioned_diagram = self._layout_with_basic(diagram, direction)
            execution_time = time.time() - start_time
            
            return LayoutResult(
                diagram=positioned_diagram,
                engine_used=LayoutEngine.BASIC,
                direction_used=direction,
                execution_time=execution_time,
                success=True,
                quality_score=0.5  # Basic layout gets medium quality score
            )
        except Exception as e:
            execution_time = time.time() - start_time
            return LayoutResult(
                diagram=diagram,
                engine_used=LayoutEngine.BASIC,
                direction_used=direction,
                execution_time=execution_time,
                success=False,
                quality_score=0.0,
                error_message=f"Basic layout failed: {e}"
            )
    
    def _assess_layout_quality(self, diagram: DSLDiagram, metrics: Optional[Any]) -> float:
        """Assess the quality of a layout result."""
        if not diagram.nodes:
            return 1.0
        
        quality_score = 1.0
        
        # Check for overlapping nodes
        overlap_penalty = self._calculate_overlap_penalty(diagram.nodes)
        quality_score -= overlap_penalty * 0.3
        
        # Check for reasonable spacing
        spacing_score = self._calculate_spacing_score(diagram.nodes)
        quality_score *= spacing_score
        
        # Check for alignment
        alignment_score = self._calculate_alignment_score(diagram.nodes)
        quality_score *= alignment_score
        
        return max(0.0, min(1.0, quality_score))
    
    def _calculate_overlap_penalty(self, nodes: List[DSLNode]) -> float:
        """Calculate penalty for overlapping nodes."""
        if len(nodes) < 2:
            return 0.0
        
        overlaps = 0
        total_pairs = 0
        
        for i, node1 in enumerate(nodes):
            for node2 in nodes[i+1:]:
                total_pairs += 1
                
                # Check if nodes overlap
                x1, y1 = node1.x, node1.y
                w1, h1 = getattr(node1, 'width', self.min_node_width), getattr(node1, 'height', self.min_node_height)
                x2, y2 = node2.x, node2.y
                w2, h2 = getattr(node2, 'width', self.min_node_width), getattr(node2, 'height', self.min_node_height)
                
                if (x1 < x2 + w2 and x1 + w1 > x2 and y1 < y2 + h2 and y1 + h1 > y2):
                    overlaps += 1
        
        return overlaps / total_pairs if total_pairs > 0 else 0.0
    
    def _calculate_spacing_score(self, nodes: List[DSLNode]) -> float:
        """Calculate score based on node spacing consistency."""
        if len(nodes) < 2:
            return 1.0
        
        distances = []
        for i, node1 in enumerate(nodes):
            for node2 in nodes[i+1:]:
                dx = node2.x - node1.x
                dy = node2.y - node1.y
                distance = (dx*dx + dy*dy) ** 0.5
                distances.append(distance)
        
        if not distances:
            return 1.0
        
        # Calculate coefficient of variation
        mean_distance = sum(distances) / len(distances)
        variance = sum((d - mean_distance) ** 2 for d in distances) / len(distances)
        std_dev = variance ** 0.5
        
        cv = std_dev / mean_distance if mean_distance > 0 else 1.0
        
        # Lower CV is better (more consistent spacing)
        return max(0.1, 1.0 - min(1.0, cv))
    
    def _calculate_alignment_score(self, nodes: List[DSLNode]) -> float:
        """Calculate score based on node alignment."""
        if len(nodes) < 3:
            return 1.0
        
        # Check for horizontal and vertical alignment
        x_positions = [node.x for node in nodes]
        y_positions = [node.y for node in nodes]
        
        # Count nodes that are well-aligned
        x_groups = self._group_similar_values(x_positions, tolerance=10.0)
        y_groups = self._group_similar_values(y_positions, tolerance=10.0)
        
        # Score based on how well nodes align
        max_x_group = max(len(group) for group in x_groups) if x_groups else 1
        max_y_group = max(len(group) for group in y_groups) if y_groups else 1
        
        alignment_ratio = max(max_x_group, max_y_group) / len(nodes)
        return alignment_ratio
    
    def _group_similar_values(self, values: List[float], tolerance: float) -> List[List[float]]:
        """Group values that are within tolerance of each other."""
        if not values:
            return []
        
        sorted_values = sorted(values)
        groups = []
        current_group = [sorted_values[0]]
        
        for value in sorted_values[1:]:
            if abs(value - current_group[-1]) <= tolerance:
                current_group.append(value)
            else:
                groups.append(current_group)
                current_group = [value]
        
        groups.append(current_group)
        return groups
    
    def _estimate_layer_depth(self, nodes: List[DSLNode], edges: List[DSLEdge]) -> int:
        """Estimate the number of layers in the diagram using topological analysis."""
        if not nodes or not edges:
            return 1
        
        # Build adjacency list
        graph = {node.id: [] for node in nodes}
        in_degree = {node.id: 0 for node in nodes}
        
        for edge in edges:
            if edge.source in graph and edge.target in graph:
                graph[edge.source].append(edge.target)
                in_degree[edge.target] += 1
        
        # Topological sort to find layer depth
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        layers = 0
        
        while queue:
            next_queue = []
            layers += 1
            
            for node_id in queue:
                for neighbor in graph[node_id]:
                    in_degree[neighbor] -= 1
                    if in_degree[neighbor] == 0:
                        next_queue.append(neighbor)
            
            queue = next_queue
        
        return max(1, layers)
    
    def _detect_cycles(self, nodes: List[DSLNode], edges: List[DSLEdge]) -> bool:
        """Detect if the graph contains cycles."""
        if not nodes or not edges:
            return False
        
        # Build adjacency list
        graph = {node.id: [] for node in nodes}
        for edge in edges:
            if edge.source in graph and edge.target in graph:
                graph[edge.source].append(edge.target)
        
        # DFS to detect cycles
        white = set(node.id for node in nodes)
        gray = set()
        black = set()
        
        def has_cycle(node_id):
            if node_id in black:
                return False
            if node_id in gray:
                return True
            
            gray.add(node_id)
            white.discard(node_id)
            
            for neighbor in graph.get(node_id, []):
                if has_cycle(neighbor):
                    return True
            
            gray.discard(node_id)
            black.add(node_id)
            return False
        
        for node_id in list(white):
            if has_cycle(node_id):
                return True
        
        return False
    
    def _record_performance(self, engine: LayoutEngine, execution_time: float):
        """Record performance metrics for engine."""
        self.engine_performance[engine].append(execution_time)
        
        # Keep only recent performance data
        if len(self.engine_performance[engine]) > 100:
            self.engine_performance[engine] = self.engine_performance[engine][-50:]
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics for all engines."""
        stats = {}
        
        for engine, times in self.engine_performance.items():
            if times:
                stats[engine.value] = {
                    "count": len(times),
                    "avg_time": sum(times) / len(times),
                    "min_time": min(times),
                    "max_time": max(times),
                    "success_rate": len([t for t in times if t > 0]) / len(times)
                }
            else:
                stats[engine.value] = {
                    "count": 0,
                    "avg_time": 0.0,
                    "min_time": 0.0,
                    "max_time": 0.0,
                    "success_rate": 0.0
                }
        
        # Overall statistics
        total_layouts = len(self.layout_history)
        successful_layouts = len([r for r in self.layout_history if r.success])
        
        stats["overall"] = {
            "total_layouts": total_layouts,
            "successful_layouts": successful_layouts,
            "success_rate": successful_layouts / total_layouts if total_layouts > 0 else 0.0,
            "avg_quality": sum(r.quality_score for r in self.layout_history) / total_layouts if total_layouts > 0 else 0.0
        }
        
        return stats
    
    def reset_performance_stats(self):
        """Reset all performance statistics."""
        self.layout_history.clear()
        for engine in self.engine_performance:
            self.engine_performance[engine].clear()
        log_info("Performance statistics reset") 