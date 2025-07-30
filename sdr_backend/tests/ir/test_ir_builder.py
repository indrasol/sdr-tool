from core.ir.ir_builder import IRBuilder
from core.dsl.dsl_types import DSLDiagram, DSLNode, DSLEdge


def test_builder_minimal():
    diagram = DSLDiagram(
        nodes=[
            DSLNode(id="a", type="generic", label="Alpha"),
            DSLNode(id="b", type="generic", label="Beta"),
        ],
        edges=[DSLEdge(id="a->b", source="a", target="b", label="call")],
    )

    builder = IRBuilder()
    graph = builder.build(diagram, source_dsl="direction: right")

    assert len(graph.nodes) == 2
    assert graph.nodes[0].kind == "Service"
    assert graph.edges[0].label == "call"
    assert graph.source_dsl.startswith("direction:") 