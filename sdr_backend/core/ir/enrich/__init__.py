"""IR enrichment pipeline – Phase-3

This package contains small, *pure* functions that take an ``IRGraph`` and
return a *new* graph with additional metadata filled in.  The pipeline is
kept deliberately functional (no in-place mutation) so that debugging and
rollback are trivial.

If any stage raises *ValidationError* (or a generic ``Exception``), the
pipeline logs the error and returns the **input** graph unchanged.  This
honours the backward-compatibility guarantee: the service will fall back to
the Phase-2 minimal graph instead of crashing.
"""

from __future__ import annotations

from typing import Callable, List

from pydantic import ValidationError

from core.ir.ir_types import IRGraph
from utils.logger import log_error, log_info

# ---------------------------------------------------------------------------
#  Import individual stages
# ---------------------------------------------------------------------------

from .label_normalizer import normalize_labels  # noqa: E402  (import after __future__)
from .taxonomy_mapper import assign_taxonomy  # noqa: E402  - NEW: Replace classifier.py
# from .classifier import classify_kinds  # noqa: E402 - REMOVED
# from .layer_assigner import assign_layers  # noqa: E402 - REMOVED
from .domain_inference import infer_domain  # noqa: E402
from .risk_tagger import tag_risks  # noqa: E402
from .edge_classifier import classify_edges  # noqa: E402
from .simplified_grouping import assign_groups_by_kind  # noqa: E402 - NEW: Replace grouping.py
# from .grouping import assign_groups  # noqa: E402 - REMOVED
# from .icon_mapper import resolve_icons  # noqa: E402 - REMOVED: Icons now come from taxonomy
# from core.ir.layout.add_layer_hints import add_layer_hints  # noqa: E402 - REMOVED: Layer hints now come from taxonomy
# from core.ir.layout.inject_service_clusters import inject_service_clusters  # noqa: E402 - REMOVED: No longer needed

# Simplified pipeline - order matters
STAGE_FUNCS: List[Callable[[IRGraph], IRGraph]] = [
    normalize_labels,     # N1: Normalize node labels
    assign_taxonomy,      # N2: NEW - Assign kind, layer, and iconify_id, svg_url from taxonomy
    infer_domain,         # N3: Infer domain (kept for backward compatibility)
    tag_risks,            # N4: Tag risks 
    classify_edges,       # N5: Classify edges
    assign_groups_by_kind # N6: NEW - Create groups by kind
]


class IrEnricher:
    """Execute the enrichment pipeline on an ``IRGraph`` instance."""
    
    def run(self, graph: IRGraph) -> IRGraph:
        """Run all enrichment stages in sequence.

        If any stage fails, the error is logged and the input graph is returned
        unchanged (fail-safe guarantee).
        """
        log_info(f"IR enrichment pipeline starting - input has {len(graph.nodes)} nodes, {len(graph.edges)} edges")
        
        current_graph = graph
        for i, stage_func in enumerate(STAGE_FUNCS):
            stage_name = stage_func.__name__
            log_info(f"IR enrichment pipeline stage {i+1}/{len(STAGE_FUNCS)}: {stage_name}")
            
            try:
                next_graph = stage_func(current_graph)
                log_info(f"IR enrichment stage {stage_name} completed successfully")
                current_graph = next_graph
            except ValidationError as ve:
                log_error(f"IR enrichment stage {stage_name} failed validation: {ve}")
                return graph  # backward-compat: return original unchanged
            except Exception as e:
                log_error(f"IR enrichment stage {stage_name} failed: {e}")
                return graph  # backward-compat: return original unchanged
        
        # Log summary of enrichment results
        node_kinds = set(node.kind for node in current_graph.nodes)
        node_layers = set(node.layer for node in current_graph.nodes)
        
        log_info(f"IR enrichment pipeline completed - identified node kinds: {node_kinds}")
        log_info(f"IR enrichment pipeline completed - identified layers: {node_layers}")
        log_info(f"IR enrichment pipeline completed - created {len(current_graph.groups)} groups")
        
        return current_graph 