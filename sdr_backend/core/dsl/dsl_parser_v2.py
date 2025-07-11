"""
core/dsl/parser_d2lang.py
─────────────────────────
Invokes the *d2* binary to parse & lay out DSL text and returns our
canonical `DSLDiagram` (pydantic) object.

Why a subprocess?
• Official D2 is written in Go; no native Python bindings exist.
• The CLI can already emit JSON + ELK positions in one call.

Public API
----------
validate(dsl: str)           -> (ok: bool, errors: list[str])
parse(dsl: str, algo="elk")  -> DSLDiagram
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import List

from utils.logger import log_info
from core.dsl.dsl_types import DSLDiagram, DSLNode, DSLEdge

# Where is the binary?
D2JSON_BIN = "d2json"            # assumes it’s on PATH (Dockerfile installs it)
LAYOUT_ENGINE = "elk"            # "elk" for best quality; falls back internally

class D2LangParser:
    """Full-grammar D2 → DSLDiagram using the official compiler + ELK."""

    def parse(self, d2_text: str) -> DSLDiagram:
        if not d2_text.strip():
            raise ValueError("D2 source is empty")

        log_info("[d2lang] compiling with d2json …")
        proc = subprocess.run(
            [D2JSON_BIN, "--layout", LAYOUT_ENGINE],
            input=d2_text.encode(),
            check=True,
            capture_output=True,
        )
        data = json.loads(proc.stdout)

        return self._to_dsl_diagram(data)

    # ── helpers ──────────────────────────────────────────
    @staticmethod
    def _to_dsl_diagram(data: dict) -> DSLDiagram:
        nodes: List[DSLNode] = []
        edges: List[DSLEdge] = []

        for n in data.get("nodes", []):
            nodes.append(
                DSLNode(
                    id=n["id"],
                    type="generic",          # refined later by validators
                    label=n["label"],
                    properties=dict(
                        position={"x": n["x"], "y": n["y"]},
                        width=n["width"],
                        height=n["height"],
                    ),
                )
            )

        for e in data.get("edges", []):
            edges.append(
                DSLEdge(
                    id=f"{e['Source']}->{e['Target']}",
                    source=e["Source"],
                    target=e["Target"],
                    label=e.get("Label") or None,
                    properties={},
                )
            )

        log_info(f"[d2lang] parsed {len(nodes)} nodes / {len(edges)} edges")
        return DSLDiagram(nodes=nodes, edges=edges)