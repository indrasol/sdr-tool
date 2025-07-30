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
from typing import Dict, Any, List
import tempfile
from pathlib import Path

# ── logger import with fallback ───────────────────────────────
try:
    from sdr_backend.utils.logger import log_info, log_error  # preferred absolute import
except ModuleNotFoundError:  # when project root not on PYTHONPATH
    try:
        from ..utils.logger import log_info, log_error  # type: ignore
    except Exception:  # pragma: no cover – final fallback
        def log_info(msg: str):
            print(msg)
        def log_error(msg: str):
            print(msg)

from .dsl_types import DSLDiagram, DSLNode, DSLEdge

# Default timeout for d2json process in seconds
D2JSON_TIMEOUT = 15

class D2LangParser:
    """Parse D2 language source into internal DSLDiagram representation."""
    
    def __init__(self):
        """Initialize the parser with paths to required tools."""
        # Find d2json binary
        self.d2json_path = self._find_d2json_binary()
        log_info(f"D2 Parser initialized with d2json path: {self.d2json_path}")

    def _find_d2json_binary(self) -> str:
        """Find the d2json binary, searching in multiple locations."""
        # Check if d2json is in PATH
        try:
            result = subprocess.run(["which", "d2json"], capture_output=True, text=True)
            if result.returncode == 0:
                path = result.stdout.strip()
                log_info(f"Found d2json in PATH: {path}")
                return path
        except Exception:
            pass  # Continue to other methods
        
        # Check in the project directory
        base_dir = Path(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
        possible_paths = [
            base_dir / "tools" / "cmd" / "d2json" / "d2json",
            base_dir / "sdr_backend" / "tools" / "cmd" / "d2json" / "d2json",
            Path("/usr/local/bin/d2json"),
            Path("/usr/bin/d2json"),
        ]
        
        for path in possible_paths:
            if path.exists() and os.access(path, os.X_OK):
                log_info(f"Found d2json at: {path}")
                return str(path)
        
        # If not found, raise clear error
        log_error("d2json binary not found! Please install d2json or ensure it's in the project path.")
        raise FileNotFoundError("d2json binary not found. Required for D2 language parsing.")
        
    def parse(self, d2_source: str) -> DSLDiagram:
        """Parse D2 language source into structured DSLDiagram."""
        log_info("Parsing D2 language source into DSLDiagram")
        
        # Create a temporary file for the D2 source
        with tempfile.NamedTemporaryFile(mode="w+", suffix=".d2", delete=False) as temp:
            temp.write(d2_source)
            temp_path = temp.name

        try:
            # Run d2json on the temp file WITH TIMEOUT
            log_info(f"Running d2json on temporary file {temp_path} with {D2JSON_TIMEOUT}s timeout")
            
            # Add timeout to prevent hanging
            result = subprocess.run(
                [self.d2json_path, "-timeout", str(D2JSON_TIMEOUT), temp_path],
                capture_output=True,
                text=True,
                check=True,
                timeout=D2JSON_TIMEOUT + 2  # Give process a little extra time beyond the binary's own timeout
            )
            
            # Parse the JSON output
            d2_json = json.loads(result.stdout)
            log_info(f"[d2lang] parsed {len(d2_json.get('nodes', []))} nodes / {len(d2_json.get('edges', []))} edges")
            
            return self._convert_to_dsl_diagram(d2_json)
        except subprocess.TimeoutExpired:
            log_error(f"d2json process timed out after {D2JSON_TIMEOUT} seconds")
            raise ValueError(f"D2 parsing timed out: Process took longer than {D2JSON_TIMEOUT} seconds")
        except subprocess.CalledProcessError as e:
            log_error(f"Error running d2json: {e.stderr}")
            raise ValueError(f"D2 parsing failed: {e.stderr}")
        except json.JSONDecodeError as e:
            log_error(f"Error parsing d2json output: {e}")
            raise ValueError(f"Invalid JSON from d2json: {e}")
        finally:
            # Clean up the temp file
            os.unlink(temp_path)
    
    def _convert_to_dsl_diagram(self, d2_json: Dict[str, Any]) -> DSLDiagram:
        """Convert d2json output to DSLDiagram structure."""
        # Extract nodes
        nodes: List[DSLNode] = []
        for node in d2_json.get("nodes", []):
            nodes.append(DSLNode(
                id=node["id"],
                type="default",
                label=node.get("label", node["id"]),
                x=node.get("x", 0),
                y=node.get("y", 0),
                width=node.get("width", 100),
                height=node.get("height", 50),
                properties={}
            ))
        
        # Extract edges
        edges: List[DSLEdge] = []
        for edge in d2_json.get("edges", []):
            edges.append(DSLEdge(
                id=f"{edge['Source']}->{edge['Target']}",
                source=edge["Source"],
                target=edge["Target"],
                label=edge.get("Label", ""),
                properties={}
            ))
        
        return DSLDiagram(nodes=nodes, edges=edges)