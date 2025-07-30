#!/usr/bin/env python3
"""
Cloud Icons Integration Test

This script tests the integration between the taxonomy mapper,
cloud resource mapper, and frontend icon rendering.
"""

import json
import asyncio
from typing import Dict, Any, List

from core.ir.ir_types import IRGraph, IRNode, IREdge
from core.ir.enrich import IrEnricher
from core.ir.enrich.cloud_resource_mapper import CloudResourceMapper
from core.ir.enrich.taxonomy_mapper import TaxonomyMapper
from utils.logger import log_info, configure_logging

# Configure logging
configure_logging(level="INFO")

# Sample nodes with cloud resources
TEST_NODES = [
    {
        "id": "client",
        "name": "Web Client",
        "kind": "Service",
        "layer": "service"
    },
    {
        "id": "aws-lambda",
        "name": "AWS Lambda",
        "kind": "Service",
        "layer": "service"
    },
    {
        "id": "aws-dynamodb",
        "name": "DynamoDB",
        "kind": "Service",
        "layer": "service"
    },
    {
        "id": "aws-s3",
        "name": "S3 Bucket",
        "kind": "Service",
        "layer": "service"
    },
    {
        "id": "auth-service",
        "name": "Authentication Service",
        "kind": "Service",
        "layer": "service",
        "metadata": {
            "provider": "aws"
        }
    },
    {
        "id": "azure-functions",
        "name": "Azure Functions",
        "kind": "Service",
        "layer": "service"
    },
    {
        "id": "gcp-cloud-storage",
        "name": "GCP Storage",
        "kind": "Service", 
        "layer": "service"
    }
]

# Sample edges
TEST_EDGES = [
    {
        "id": "e1",
        "source": "client",
        "target": "aws-lambda"
    },
    {
        "id": "e2",
        "source": "aws-lambda", 
        "target": "aws-dynamodb"
    },
    {
        "id": "e3",
        "source": "auth-service",
        "target": "aws-dynamodb"
    },
    {
        "id": "e4",
        "source": "aws-lambda",
        "target": "aws-s3"
    },
    {
        "id": "e5",
        "source": "client",
        "target": "azure-functions"
    },
    {
        "id": "e6",
        "source": "client",
        "target": "gcp-cloud-storage"
    }
]

def create_test_graph() -> IRGraph:
    """Create a test graph with cloud resources."""
    nodes = [IRNode(**n) for n in TEST_NODES]
    edges = [IREdge(**e) for e in TEST_EDGES]
    return IRGraph(nodes=nodes, edges=edges, source_dsl="test_dsl")

def test_cloud_resource_mapper():
    """Test that the cloud resource mapper correctly identifies cloud resources."""
    mapper = CloudResourceMapper()
    
    # Test AWS resources
    aws_result = mapper.map_cloud_resource("aws-lambda")
    assert aws_result["kind"] == "COMPUTE", "AWS Lambda should be classified as COMPUTE"
    assert aws_result["metadata"]["iconifyId"] == "custom:aws-lambda", "AWS Lambda should have custom icon"
    
    # Test Azure resources
    azure_result = mapper.map_cloud_resource("azure-functions")
    assert azure_result["kind"] == "COMPUTE", "Azure Functions should be classified as COMPUTE"
    assert azure_result["metadata"]["iconifyId"] == "custom:azure-functions", "Azure Functions should have custom icon"
    
    # Test GCP resources
    gcp_result = mapper.map_cloud_resource("gcp-cloud-functions")
    assert gcp_result["kind"] == "COMPUTE", "GCP Cloud Functions should be classified as COMPUTE"
    assert gcp_result["metadata"]["iconifyId"] == "custom:gcp-cloud-functions", "GCP Functions should have custom icon"
    
    print("✅ Cloud Resource Mapper Test: PASSED")
    return True

def test_taxonomy_mapper_integration():
    """Test that the taxonomy mapper integrates with cloud resource mapper."""
    mapper = TaxonomyMapper()
    
    # Create a node with cloud resource ID
    node = IRNode(
        id="aws-lambda",
        name="AWS Lambda",
        kind="Service",
        layer="service"
    )
    
    # Find the best match
    result = mapper.find_best_taxonomy_match(node)
    
    # Verify it was identified as a cloud resource
    assert result.get("cloud") is True, "Node should be identified as a cloud resource"
    assert result.get("kind") == "COMPUTE", "AWS Lambda should be classified as COMPUTE"
    assert result.get("iconify_id") == "custom:aws-lambda", "AWS Lambda should have custom icon"
    
    print("✅ Taxonomy Mapper Integration Test: PASSED")
    return True

def test_enrichment_pipeline():
    """Test the full enrichment pipeline with cloud resources."""
    # Create a test graph
    graph = create_test_graph()
    
    # Run the enrichment pipeline
    enricher = IrEnricher()
    enriched = enricher.run(graph)
    
    # Check that AWS Lambda was properly enriched
    aws_lambda = next((n for n in enriched.nodes if n.id == "aws-lambda"), None)
    assert aws_lambda is not None, "AWS Lambda node should exist"
    assert aws_lambda.kind == "COMPUTE", f"AWS Lambda should be COMPUTE but got {aws_lambda.kind}"
    assert aws_lambda.metadata.get("layerIndex") == 5, f"AWS Lambda should have layerIndex 5 but got {aws_lambda.metadata.get('layerIndex')}"
    assert aws_lambda.metadata.get("iconifyId") == "custom:aws-lambda", f"AWS Lambda should have custom icon but got {aws_lambda.metadata.get('iconifyId')}"
    
    # Check that Azure Functions was properly enriched
    azure_functions = next((n for n in enriched.nodes if n.id == "azure-functions"), None)
    assert azure_functions is not None, "Azure Functions node should exist"
    assert azure_functions.kind == "COMPUTE", f"Azure Functions should be COMPUTE but got {azure_functions.kind}"
    assert azure_functions.metadata.get("layerIndex") == 5, f"Azure Functions should have layerIndex 5 but got {azure_functions.metadata.get('layerIndex')}"
    
    # Check that Authentication Service with AWS provider was properly enriched
    auth_service = next((n for n in enriched.nodes if n.id == "auth-service"), None)
    assert auth_service is not None, "Auth Service node should exist"
    assert auth_service.metadata.get("provider") == "aws", f"Auth Service should have AWS provider but got {auth_service.metadata.get('provider')}"
    
    print("✅ Enrichment Pipeline Test: PASSED")
    return True

def dump_enriched_graph():
    """Run the enrichment pipeline and dump the results for inspection."""
    # Create a test graph
    graph = create_test_graph()
    
    # Run the enrichment pipeline
    enricher = IrEnricher()
    enriched = enricher.run(graph)
    
    # Convert to dict for JSON serialization
    result = enriched.model_dump()
    
    # Write to file
    with open("cloud_test_output.json", "w") as f:
        json.dump(result, f, indent=2)
    
    print(f"Enriched graph written to cloud_test_output.json with {len(enriched.nodes)} nodes and {len(enriched.edges)} edges")
    return True

if __name__ == "__main__":
    print("Running Cloud Icons Integration Test...")
    test_cloud_resource_mapper()
    test_taxonomy_mapper_integration()
    test_enrichment_pipeline()
    dump_enriched_graph()
    print("\n✅ All tests passed successfully!") 