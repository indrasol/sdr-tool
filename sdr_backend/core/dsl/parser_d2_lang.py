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
from pathlib import Path
from typing import List

from utils.logger import log_info, log_error
from core.dsl.dsl_types import DSLDiagram, DSLNode, DSLEdge

# Where is the binary?
# Use the local binary in the tools directory
PROJECT_ROOT = Path(__file__).parent.parent.parent  # Go up to sdr_backend root
D2JSON_LOCAL_BIN = PROJECT_ROOT / "tools" / "cmd" / "d2json" / "d2json"

# Fallback strategy: try local binary first, then PATH
if D2JSON_LOCAL_BIN.exists() and os.access(D2JSON_LOCAL_BIN, os.X_OK):
    D2JSON_BIN = str(D2JSON_LOCAL_BIN)
    log_info(f"[d2lang] Using local d2json binary: {D2JSON_BIN}")
else:
    D2JSON_BIN = "d2json"  # Try system PATH
    log_info(f"[d2lang] Local binary not found, using system PATH d2json")

LAYOUT_ENGINE = "elk"            # "elk" for best quality; falls back internally

class D2LangParser:
    """Full-grammar D2 → DSLDiagram using the official compiler + ELK."""

    def parse(self, d2_text: str) -> DSLDiagram:
        if not d2_text.strip():
            raise ValueError("D2 source is empty")

        log_info("[d2lang] compiling with d2json …")
        try:
            proc = subprocess.run(
                [D2JSON_BIN, "--layout", LAYOUT_ENGINE],
                input=d2_text.encode(),
                check=True,
                capture_output=True,
                timeout=30  # 30 second timeout
            )
        except FileNotFoundError:
            log_error(f"[d2lang] d2json binary not found at: {D2JSON_BIN}")
            raise ValueError(f"D2 compiler not found. Please ensure d2json is installed or available at: {D2JSON_BIN}")
        except subprocess.TimeoutExpired:
            raise ValueError("D2 compilation timeout - diagram too complex")
        except subprocess.CalledProcessError as e:
            stderr = e.stderr.decode() if e.stderr else "Unknown error"
            raise ValueError(f"D2 compilation failed: {stderr}")

        try:
            data = json.loads(proc.stdout)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON from d2json: {e}")

        return self._to_dsl_diagram(data)

    # ── helpers ──────────────────────────────────────────
    @staticmethod
    def _to_dsl_diagram(data: dict) -> DSLDiagram:
        nodes: List[DSLNode] = []
        edges: List[DSLEdge] = []

        for n in data.get("nodes", []):
            try:
                # Validate required fields
                if "id" not in n:
                    raise ValueError("Node missing required 'id' field")
                if "label" not in n:
                    raise ValueError(f"Node {n['id']} missing required 'label' field")
                
                # Infer node type from node ID for better icon resolution
                node_id = str(n["id"])
                inferred_type = D2LangParser._infer_node_type(node_id)
                
                nodes.append(
                    DSLNode(
                        id=node_id,
                        type=inferred_type,     # Use inferred type instead of hardcoded "generic"
                        label=str(n["label"]),
                        x=float(n.get("x", 0)),
                        y=float(n.get("y", 0)),
                        width=float(n.get("width", 60)),
                        height=float(n.get("height", 36)),
                        properties={}  # Keep empty for additional metadata
                    )
                )
            except (ValueError, TypeError) as e:
                raise ValueError(f"Invalid node data: {e}")

        # Handle edges (might be null from d2json)
        edges_data = data.get("edges")
        if edges_data is not None:
            for e in edges_data:
                try:
                    # Validate required fields
                    if "Source" not in e:
                        raise ValueError("Edge missing required 'Source' field")
                    if "Target" not in e:
                        raise ValueError("Edge missing required 'Target' field")
                    
                    edges.append(
                        DSLEdge(
                            id=f"{e['Source']}->{e['Target']}",
                            source=str(e["Source"]),
                            target=str(e["Target"]),
                            label=str(e["Label"]) if e.get("Label") else None,
                            properties={},
                        )
                    )
                except (ValueError, TypeError) as e:
                    raise ValueError(f"Invalid edge data: {e}")

        log_info(f"[d2lang] parsed {len(nodes)} nodes / {len(edges)} edges")
        return DSLDiagram(nodes=nodes, edges=edges)
    
    @staticmethod
    def _infer_node_type(node_id: str) -> str:
        """
        Intelligently infer node type from node ID for better icon resolution.
        This maps node IDs to specific types that match our enhanced iconify registry.
        """
        node_lower = node_id.lower()
        
        # Direct mappings for specific node types
        specific_mappings = {
            'chat_service': 'chat_service',
            'leaderboard': 'leaderboard', 
            'analytics': 'analytics',
            'user_auth': 'user_auth',
            'payment_gateway': 'payment_gateway',
            'monitoring': 'monitoring',
            'encryption_service': 'encryption_service',
            'secrets_manager': 'secrets_manager',
            'audit_logs': 'audit_logs',
            'message_queue': 'message_queue',
            'matchmaking': 'matchmaking',
            'realtime_engine': 'realtime_engine',
            'game_server': 'game_server',
            'game_client': 'game_client',
        }
        
        # Check for direct matches first
        if node_lower in specific_mappings:
            return specific_mappings[node_lower]
        
        # Pattern-based inference for common cases
        if any(term in node_lower for term in ['_db', 'database', 'data_store']):
            return node_id  # Keep specific DB names like player_db, game_db
        
        if any(term in node_lower for term in ['cache', 'redis', 'memcache']):
            return node_id  # Keep specific cache names
        
        if any(term in node_lower for term in ['gateway', 'api', 'proxy']):
            return node_id  # Keep gateway types
        
        if any(term in node_lower for term in ['firewall', 'waf', 'security']):
            return node_id  # Keep security component names
        
        if any(term in node_lower for term in ['load_balancer', 'lb', 'balancer']):
            return 'load_balancer'
        
        if any(term in node_lower for term in ['cdn', 'content_delivery']):
            return 'cdn'
        
        if any(term in node_lower for term in ['client', 'user', 'browser', 'mobile']):
            return 'client'
        
        if node_lower.endswith('_service') or node_lower.endswith('service'):
            return node_id  # Keep specific service names
        
        # Default to the node_id itself for maximum specificity
        return node_id