import pytest

from core.ir.ir_types import IRGraph, IRNode, IREdge
from core.ir.enrich.simplified_grouping import assign_groups_by_kind
from utils.logger import log_info

def create_test_graph():
    """Create a test graph with nodes of various kinds."""
    nodes = [
        IRNode(
            id="client1",
            name="Web Client",
            kind="CLIENT",
            layer="CLIENT"
        ),
        IRNode(
            id="client2",
            name="Mobile Client",
            kind="CLIENT",
            layer="CLIENT"
        ),
        IRNode(
            id="api1",
            name="API Gateway",
            kind="EDGE_NETWORK",
            layer="EDGE_NETWORK"
        ),
        IRNode(
            id="auth1",
            name="Authentication Service",
            kind="IDENTITY",
            layer="IDENTITY"
        ),
        IRNode(
            id="auth2",
            name="Authorization Service",
            kind="IDENTITY",
            layer="IDENTITY"
        ),
        IRNode(
            id="service1",
            name="User Service",
            kind="SERVICE",
            layer="SERVICE",
            domain="user_domain"
        ),
        IRNode(
            id="service2",
            name="Order Service",
            kind="SERVICE",
            layer="SERVICE",
            domain="order_domain"
        ),
        IRNode(
            id="service3",
            name="Payment Service",
            kind="SERVICE",
            layer="SERVICE",
            domain="order_domain"
        ),
        IRNode(
            id="db1",
            name="User Database",
            kind="DATA",
            layer="DATA",
            domain="user_domain"
        ),
        IRNode(
            id="db2",
            name="Order Database",
            kind="DATA",
            layer="DATA",
            domain="order_domain"
        ),
    ]
    
    edges = [
        IREdge(id="e1", source="client1", target="api1"),
        IREdge(id="e2", source="client2", target="api1"),
        IREdge(id="e3", source="api1", target="auth1"),
        IREdge(id="e4", source="api1", target="service1"),
        IREdge(id="e5", source="api1", target="service2"),
        IREdge(id="e6", source="service1", target="db1"),
        IREdge(id="e7", source="service2", target="db2"),
        IREdge(id="e8", source="service3", target="db2"),
    ]
    
    return IRGraph(nodes=nodes, edges=edges, source_dsl="test_dsl")

def test_assign_groups_by_kind():
    """Test that groups are correctly created based on node kinds."""
    # Create a test graph
    graph = create_test_graph()
    
    # Apply grouping
    enriched = assign_groups_by_kind(graph)
    
    # Verify that groups were created
    assert len(enriched.groups) > 0, "No groups were created"
    
    # Check for specific groups
    groups_by_id = {g.id: g for g in enriched.groups}
    
    # Check for kind-based groups
    assert "kind_client" in groups_by_id, "CLIENT group not created"
    assert "kind_identity" in groups_by_id, "IDENTITY group not created"
    assert "kind_service" in groups_by_id, "SERVICE group not created"
    assert "kind_data" in groups_by_id, "DATA group not created"
    
    # Check that each group contains the correct nodes
    client_group = groups_by_id["kind_client"]
    assert len(client_group.member_node_ids) == 2, "CLIENT group should have 2 nodes"
    assert "client1" in client_group.member_node_ids, "client1 should be in CLIENT group"
    assert "client2" in client_group.member_node_ids, "client2 should be in CLIENT group"
    
    identity_group = groups_by_id["kind_identity"]
    assert len(identity_group.member_node_ids) == 2, "IDENTITY group should have 2 nodes"
    
    service_group = groups_by_id["kind_service"]
    assert len(service_group.member_node_ids) == 3, "SERVICE group should have 3 nodes"
    
    data_group = groups_by_id["kind_data"]
    assert len(data_group.member_node_ids) == 2, "DATA group should have 2 nodes"
    
    # Check for domain-based groups
    domain_groups = [g for g in enriched.groups if g.type == "bounded_context"]
    assert len(domain_groups) > 0, "No domain-based groups were created"
    
    log_info("Grouping test passed successfully")
    return True

def test_singleton_nodes():
    """Test that singleton nodes (only one of a kind) don't create groups."""
    nodes = [
        IRNode(id="client", name="Web Client", kind="CLIENT", layer="CLIENT"),
        IRNode(id="api", name="API Gateway", kind="EDGE_NETWORK", layer="EDGE_NETWORK"),
        IRNode(id="service1", name="Service 1", kind="SERVICE", layer="SERVICE"),
        IRNode(id="service2", name="Service 2", kind="SERVICE", layer="SERVICE"),
    ]
    
    edges = [
        IREdge(id="e1", source="client", target="api"),
        IREdge(id="e2", source="api", target="service1"),
        IREdge(id="e3", source="api", target="service2"),
    ]
    
    graph = IRGraph(nodes=nodes, edges=edges, source_dsl="test_dsl")
    
    # Apply grouping
    enriched = assign_groups_by_kind(graph)
    
    # Check that we don't have groups for singletons
    groups_by_id = {g.id: g for g in enriched.groups}
    
    # Should have SERVICE group but not CLIENT or EDGE_NETWORK
    assert "kind_service" in groups_by_id, "SERVICE group should exist"
    assert "kind_client" not in groups_by_id, "CLIENT group should not exist (singleton)"
    assert "kind_edge_network" not in groups_by_id, "EDGE_NETWORK group should not exist (singleton)"
    
    log_info("Singleton test passed successfully")
    return True

if __name__ == "__main__":
    print("Running simplified grouping tests...")
    test_assign_groups_by_kind()
    test_singleton_nodes()
    print("All tests passed!") 