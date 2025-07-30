import pytest
from pydantic import ValidationError

from core.ir.ir_types import IRGraph, IRNode, IREdge
from core.ir.enrich.taxonomy_mapper import assign_taxonomy
from utils.logger import log_info

def create_test_graph():
    """Create a simple test graph with various node types."""
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
            id="db",
            name="Database",
            kind="Service",
            layer="service"
        ),
        IRNode(
            id="redis",
            name="Redis Cache",
            kind="Service",
            layer="service"
        ),
        IRNode(
            id="queue",
            name="Message Queue",
            kind="Service",
            layer="service"
        ),
    ]
    
    edges = [
        IREdge(id="e1", source="client", target="api"),
        IREdge(id="e2", source="api", target="auth"),
        IREdge(id="e3", source="api", target="db"),
        IREdge(id="e4", source="auth", target="db"),
        IREdge(id="e5", source="api", target="redis"),
        IREdge(id="e6", source="api", target="queue"),
    ]
    
    return IRGraph(nodes=nodes, edges=edges, source_dsl="test_dsl")

def test_assign_taxonomy():
    """Test that taxonomy assignment works correctly."""
    # Create a test graph
    graph = create_test_graph()
    
    # Apply taxonomy assignment
    enriched = assign_taxonomy(graph)
    
    # Verify that all nodes have been enriched
    for node in enriched.nodes:
        log_info(f"Node {node.id}: kind={node.kind}, layer={node.layer}, layerIndex={node.metadata.get('layerIndex')}")
        
        # Check that each node has a layer value
        assert node.layer is not None, f"Node {node.id} missing layer"
        
        # Check that each node has layerIndex in metadata
        assert "layerIndex" in node.metadata, f"Node {node.id} missing layerIndex"
        
        # Check that specific nodes got the right treatment
        if node.id == "client":
            assert "CLIENT" in node.layer or node.metadata.get("layerIndex") == 0, "Client node not properly classified"
        
        if node.id == "api":
            assert "EDGE_NETWORK" in node.layer or node.metadata.get("layerIndex") == 1, "API Gateway not properly classified"
        
        if node.id == "auth":
            assert "IDENTITY" in node.layer or node.metadata.get("layerIndex") == 2, "Auth service not properly classified"
        
        if node.id == "db":
            assert "DATA" in node.layer or node.metadata.get("layerIndex") == 6, "Database not properly classified"
    
    # Success if we got here
    log_info("Taxonomy assignment test passed")
    return True

def test_error_handling():
    """Test that the taxonomy mapper handles errors gracefully."""
    # Create an invalid graph (missing required fields)
    try:
        invalid_graph = IRGraph(nodes=[
            IRNode(id="invalid", name="", kind="", layer="")  # Missing required fields
        ], edges=[], source_dsl="")
        
        # Try to apply taxonomy assignment
        result = assign_taxonomy(invalid_graph)
        
        # Should not raise exception, but should handle the error
        assert result is not None, "Taxonomy mapper should handle invalid nodes gracefully"
        
    except ValidationError:
        # If validation error occurs, that's a failure of our error handling
        pytest.fail("Taxonomy mapper should handle ValidationError gracefully")
    
    log_info("Error handling test passed")
    return True

if __name__ == "__main__":
    print("Running taxonomy mapper tests...")
    test_assign_taxonomy()
    test_error_handling()
    print("All tests passed!") 