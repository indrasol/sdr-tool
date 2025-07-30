from core.ir.enrich import IrEnricher
from core.ir.ir_builder import IRBuilder
from core.dsl.dsl_versioning_v2 import DSLDiagram, DSLNode, DSLEdge


def test_enrichment_pipeline():
    diagram = DSLDiagram(
        nodes=[
            DSLNode(id="n1", type="generic", label="Redis Cache"),
            DSLNode(id="n2", type="generic", label="Postgres DB"),
            DSLNode(id="n3", type="generic", label="Keycloak Auth"),
        ],
        edges=[DSLEdge(id="n1->n2", source="n1", target="n2")],
    )

    builder = IRBuilder()
    base_graph = builder.build(diagram)

    enricher = IrEnricher()
    enriched = enricher.run(base_graph)

    kinds = {n.id: n.kind for n in enriched.nodes}
    assert kinds["n1"] == "Cache"
    assert kinds["n2"].startswith("Database") or kinds["n2"] == "Database"
    assert kinds["n3"] == "Auth"

    # All nodes should now have metadata.icon and risk tags
    for n in enriched.nodes:
        assert "icon" in n.metadata
        assert n.risk_tags  # risk tag list non-empty

    # Edge protocol classification
    assert enriched.edges[0].protocol is not None

    # Trust zones created
    tz_groups = [g for g in enriched.groups if g.type == "trust_zone"]
    assert tz_groups, "No trust zones generated" 