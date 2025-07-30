from __future__ import annotations

from functools import lru_cache
import json
import os
from pathlib import Path
from typing import Dict, List, Tuple

from core.ir.ir_types import IRGraph, IRNode
from utils.logger import log_error, log_info

# ---------------------------------------------------------------------------
# Registry loader (theme overlay)
# ---------------------------------------------------------------------------
_PROJECT_ROOT = Path(__file__).resolve().parents[3]  # up to repo root
_REGISTRY_BASENAME = _PROJECT_ROOT / "resources" / "icon_registry.json"

def _load_registry(theme: str | None = None) -> Dict[str, Dict[str, str]]:
    reg: Dict[str, Dict[str, str]] = {}
    try:
        with _REGISTRY_BASENAME.open(encoding="utf-8") as fp:
            reg = json.load(fp)
    except Exception as exc:
        log_error(f"[IconMapper] base registry load failed: {exc}")

    # Optional theme overlay
    if theme:
        themed_file = _REGISTRY_BASENAME.with_name(f"icon_registry.{theme}.json")
        if themed_file.exists():
            try:
                with themed_file.open(encoding="utf-8") as fp:
                    themed = json.load(fp)
                reg.update(themed)  # overwrite
            except Exception as exc:
                log_info(f"[IconMapper] theme '{theme}' failed to load: {exc}")
    # Case-fold all keys once for insensitive match
    return {k.lower(): v for k, v in reg.items()}

_ICON_REGISTRY = _load_registry(os.getenv("ICON_THEME"))
_DEFAULT_ICON   = {  # never missing
    "iconify_id": "mdi:cube-outline",
    "colorOverride": "#9ca3af",
    "shape": "rounded-rect",
}

# ---------------------------------------------------------------------------
#  Helper to resolve one (kind, subkind)  →  dict
# ---------------------------------------------------------------------------
@lru_cache(maxsize=512)
def _resolve(kind: str, subkind: str | None) -> Dict[str, str]:
    k_low = kind.lower()
    s_low = (subkind or "").lower()

    candidate_keys: Tuple[str, ...] = tuple(filter(bool, (
        f"{k_low}:{s_low}" if s_low else "",        # exact subkind
        f"{k_low}:generic",                         # generic of kind
        f"{k_low}:default",                         # optional variant
        "default",
    )))

    for key in candidate_keys:
        if key in _ICON_REGISTRY:
            entry = _ICON_REGISTRY[key].copy()
            # migrate legacy "icon" → "iconify_id"
            if "icon" in entry and "iconify_id" not in entry:
                entry["iconify_id"] = entry.pop("icon")
            return entry

    # log once per unknown kind for ops visibility
    if not _resolve.__dict__.get("_warned", set()):
        _resolve._warned = set()
    if k_low not in _resolve._warned:
        log_info(f"[IconMapper] no registry match for kind '{kind}'")
        _resolve._warned.add(k_low)

    return _DEFAULT_ICON.copy()

# ---------------------------------------------------------------------------
#  Public enrichment function
# ---------------------------------------------------------------------------
def resolve_icons(ir: IRGraph) -> IRGraph:
    new_nodes: List[IRNode] = []

    for node in ir.nodes:
        # Existing metadata coming from earlier stages (classifier / taxonomy).
        existing = dict(node.metadata)

        # Fallback registry lookup based on (kind, subkind).  This returns
        # sensible defaults like iconify_id="mdi:cube-outline" for completely
        # unknown kinds.
        fallback = _resolve(node.kind, node.subkind)

        # Merge *without* clobbering values supplied by the taxonomy dictionary
        # (iconify_id, colorOverride, shape …).  Existing keys win.
        merged = {**fallback, **existing}

        new_nodes.append(node.model_copy(update={"metadata": merged}))

    return ir.model_copy(update={"nodes": new_nodes})