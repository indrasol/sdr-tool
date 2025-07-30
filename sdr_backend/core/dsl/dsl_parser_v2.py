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
import os
import subprocess
import shutil
from pathlib import Path
from typing import List

# ── logger import with fallback ───────────────────────────────
try:
    from sdr_backend.utils.logger import log_info, log_error  # preferred absolute import
except ModuleNotFoundError:
    try:
        from ..utils.logger import log_info, log_error  # type: ignore
    except Exception:  # pragma: no cover
        def log_info(msg: str):
            print(msg)
        def log_error(msg: str):
            print(msg)

from core.dsl.dsl_types import DSLDiagram, DSLNode, DSLEdge

# ── configuration ────────────────────────────────────────────────────────────

LAYOUT_ENGINE = "elk"            # "elk" for best quality; falls back internally
D2JSON_TIMEOUT = 15              # timeout in seconds to prevent hanging


# ── helper to resolve the d2json binary path ─────────────────────────────────

def _find_d2json_binary() -> str:
    """Locate the d2json binary. Search in PATH first, then common project locations."""

    # 1) PATH lookup via shutil.which
    path = shutil.which("d2json")
    if path:
        log_info(f"[d2lang] Found d2json in PATH: {path}")
        return path

    # 2) Relative project paths
    base_dir = Path(__file__).resolve().parent.parent.parent  # sdr_backend/core/dsl → project root
    candidate_paths = [
        base_dir / "tools" / "cmd" / "d2json" / "d2json",
        base_dir / "sdr_backend" / "tools" / "cmd" / "d2json" / "d2json",
        Path.home() / "bin" / "d2json",
        Path("/usr/local/bin/d2json"),
    ]

    for p in candidate_paths:
        if p.exists() and os.access(p, os.X_OK):
            log_info(f"[d2lang] Found d2json at: {p}")
            return str(p)

    # If not found, raise clear error
    log_error("d2json binary not found. Ensure it is built and on PATH or in project tools.")
    raise FileNotFoundError("d2json binary not found")


# Resolve binary once at import time (raises if missing)
D2JSON_BIN = _find_d2json_binary()


class D2LangParser:
    """Full-grammar D2 → DSLDiagram using the official compiler + ELK."""

    def parse(self, d2_text: str) -> DSLDiagram:
        if not d2_text.strip():
            raise ValueError("D2 source is empty")

        log_info(f"[d2lang] compiling with d2json (timeout: {D2JSON_TIMEOUT}s)…")
        try:
            proc = subprocess.run(
                [D2JSON_BIN, "-timeout", str(D2JSON_TIMEOUT), "--layout", LAYOUT_ENGINE],
                input=d2_text.encode(),
                check=True,
                capture_output=True,
                timeout=D2JSON_TIMEOUT + 2  # Give process a little extra time beyond the binary's own timeout
            )
            data = json.loads(proc.stdout)
            return self._to_dsl_diagram(data)
        except subprocess.TimeoutExpired:
            log_error(f"d2json process timed out after {D2JSON_TIMEOUT} seconds")
            raise ValueError(f"D2 parsing timed out: Process took longer than {D2JSON_TIMEOUT} seconds")
        except subprocess.CalledProcessError as e:
            log_error(f"Error running d2json: {e.stderr}")
            raise ValueError(f"D2 parsing failed: {e.stderr}")
        except json.JSONDecodeError as e:
            log_error(f"Error parsing d2json output: {e}")
            raise ValueError(f"Invalid JSON from d2json: {e}")

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