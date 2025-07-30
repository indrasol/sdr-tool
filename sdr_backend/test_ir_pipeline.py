#!/usr/bin/env python
"""
Test script for the IR enrichment pipeline.

This script creates a sample graph, runs it through the enrichment pipeline,
and verifies that the enriched graph contains the expected data.
"""

import json
import sys
from typing import Dict, List, Any
from pathlib import Path

from core.ir.ir_types import IRGraph, IRNode, IREdge
from core.ir.enrich import IrEnricher
from utils.logger import log_info, log_error, configure_logging

# Configure logging
configure_logging(level="INFO")

def create_test_graph() -> IRGraph:
    """Create a sample graph for testing."""
    nodes = [
        IRNode(
            id="client",
            name="Web Client",
            kind="Service",  # Default kind that should be replaced
            layer="service"  # Should be replaced with new layer
        ),
        IRNode(
            id="api",
            name="API Gateway",
            kind="Service",
            layer="service"
        ),
        IRNode(
            id="auth",
            name="Authentication Service",
            kind="Service",
            layer="service"
        ),
        IRNode(
            id="users",
            name="User Microservice",
            kind="Service",
            layer="service"
        ),
        IRNode(
            id="orders",
            name="Order Processing Service",
            kind="Service",
            layer="service",
            domain="orders"
        ),
        IRNode(
            id="queue",
            name="Message Queue",
            kind="Service",
            layer="service"
        ),
        IRNode(
            id="db",
            name="PostgreSQL Database",
            kind="Service",
            layer="service",
            domain="users"
        ),
        IRNode(
            id="redis",
            name="Redis Cache",
            kind="Service",
            layer="service"
        ),
        IRNode(
            id="logging",
            name="Logging Service",
            kind="Service",
            layer="service"
        ),
    ]
    
    edges = [
        IREdge(id="e1", source="client", target="api"),
        IREdge(id="e2", source="api", target="auth"),
        IREdge(id="e3", source="api", target="users"),
        IREdge(id="e4", source="api", target="orders"),
        IREdge(id="e5", source="users", target="db"),
        IREdge(id="e6", source="orders", target="queue"),
        IREdge(id="e7", source="orders", target="db"),
        IREdge(id="e8", source="auth", target="redis"),
        IREdge(id="e9", source="users", target="logging"),
        IREdge(id="e10", source="orders", target="logging"),
    ]
    
    return IRGraph(nodes=nodes, edges=edges, source_dsl="test DSL")

def save_graph_json(graph: IRGraph, filename: str):
    """Save graph to JSON file for inspection."""
    output_dir = Path("./outputs")
    output_dir.mkdir(exist_ok=True)
    
    output_path = output_dir / filename
    
    # Convert to dict for better JSON serialization
    graph_dict = graph.model_dump()
    
    try:
        with open(output_path, "w") as f:
            json.dump(graph_dict, f, indent=2)
        log_info(f"Saved graph to {output_path}")
    except Exception as e:
        log_error(f"Failed to save graph: {e}")

def main():
    """Main test function."""
    log_info("Creating test graph...")
    graph = create_test_graph()
    
    # Save the original graph
    save_graph_json(graph, "original_graph.json")
    
    # Run the enrichment pipeline
    log_info("Running enrichment pipeline...")
    enricher = IrEnricher()
    enriched = enricher.run(graph)
    
    # Save the enriched graph
    save_graph_json(enriched, "enriched_graph.json")
    
    # Validate the enriched graph
    log_info("Validating enriched graph...")
    
    # Check that all nodes have kinds, layers, and layerIndex
    for node in enriched.nodes:
        log_info(f"Node {node.id}: kind={node.kind}, layer={node.layer}, "
                 f"layerIndex={node.metadata.get('layerIndex')}")
        
        if not node.kind or not node.layer:
            log_error(f"Node {node.id} is missing kind or layer")
            return False
        
        if "layerIndex" not in node.metadata:
            log_error(f"Node {node.id} is missing layerIndex in metadata")
            return False
    
    # Check that groups were created
    if not enriched.groups:
        log_error("No groups were created")
        return False
    
    log_info(f"Created {len(enriched.groups)} groups")
    for group in enriched.groups:
        log_info(f"Group {group.id}: type={group.type}, members={len(group.member_node_ids)}")
    
    log_info("Enrichment pipeline test completed successfully!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 