import pytest

from core.ir.ir_types import IRGraph, IRNode
from core.ir.enrich.classifier import classify_kinds

@pytest.mark.parametrize("label,kind,sub", [
    ("Redis Cache", "Cache", "redis"),
    ("AWS Lambda", "Function", "lambda"),
    ("Kafka Broker", "Queue", "kafka"),
    ("Vector Store — Pinecone", "VectorStore", "pinecone"),
])

def test_classifier_basic(label, kind, sub):
    ir = IRGraph(nodes=[IRNode(id="1", name=label, kind="Service", layer="service")], edges=[], groups=[], annotations=[], source_dsl="")
    out = classify_kinds(ir)
    n = out.nodes[0]
    assert n.kind == kind and n.subkind == sub


def test_provider_meta_propagation():
    ir = IRGraph(nodes=[IRNode(id="1", name="DynamoDB", kind="Service", layer="service")], edges=[], groups=[], annotations=[], source_dsl="")
    out = classify_kinds(ir)
    meta = out.nodes[0].metadata
    assert meta.get("provider") == "aws" 