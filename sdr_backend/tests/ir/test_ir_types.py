import json
from typing import Any

from sdr_backend.core.ir.ir_types import (
    IRAnnotation,
    IREdge,
    IRGraph,
    IRGroup,
    IRNode,
)


def _sample_node(node_id: str = "n1", name: str = "Service A") -> dict[str, Any]:
    return {
        "id": node_id,
        "name": name,
        "kind": "Service",
        "layer": "service",
    }


def _sample_edge(edge_id: str = "e1") -> dict[str, Any]:
    return {
        "id": edge_id,
        "source": "n1",
        "target": "n2",
        "label": "HTTP",
    }


def _sample_group(group_id: str = "g1") -> dict[str, Any]:
    return {
        "id": group_id,
        "name": "TZ-1",
        "type": "trust_zone",
        "member_node_ids": ["n1", "n2"],
    }


def test_round_trip_node():
    node_data = _sample_node()
    node_obj = IRNode(**node_data)
    json_str = node_obj.model_dump_json()
    loaded = IRNode.parse_raw(json_str)
    assert node_obj == loaded


def test_round_trip_edge():
    edge_data = _sample_edge()
    edge_obj = IREdge(**edge_data)
    assert edge_obj == IREdge.parse_raw(edge_obj.model_dump_json())


def test_round_trip_graph():
    graph = IRGraph(
        nodes=[IRNode(**_sample_node()), IRNode(**_sample_node("n2", "Service B"))],
        edges=[IREdge(**_sample_edge())],
        groups=[IRGroup(**_sample_group())],
        annotations=[
            IRAnnotation(
                id="a1",
                target_id="n1",
                kind="note",
                payload={"text": "Important"},
            )
        ],
        source_dsl="diagram dsl v1",
    )
    dumped = graph.model_dump_json()
    loaded = IRGraph.parse_raw(dumped)
    assert graph == loaded


def test_schema_contains_required_fields():
    node_schema = IRNode.model_json_schema()
    for required in ["id", "name", "kind", "layer"]:
        assert required in node_schema["properties"]

    edge_schema = IREdge.model_json_schema()
    for required in ["id", "source", "target"]:
        assert required in edge_schema["properties"] 