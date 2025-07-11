# core/dsl/validators.py
from __future__ import annotations
import re
from typing import Tuple
from core.dsl.dsl_types import DSLDiagram, DSLNode

# ROBUST FIX: Allow common business/technical label characters
SAFE_LABEL_RE = re.compile(r"^[\w &():.,\-/+#@]{1,80}$")  # Allow alphanumeric, spaces, ampersand, parentheses, punctuation
SAFE_ICON_RE  = re.compile(r"^[\w:-]{1,40}$")         # Iconify ids

class DiagramValidator:
    """Guarantees the JSON we store & send to the FE is squeaky-clean."""

    def validate(self, d: DSLDiagram) -> Tuple[bool, list[str]]:
        errors: list[str] = []

        for n in d.nodes:
            # Validate label - check for data URLs first (more specific)
            if "data:" in n.label.lower():
                errors.append(f"node {n.id}: label embeds data URL")
            elif not SAFE_LABEL_RE.fullmatch(n.label):
                errors.append(f"node {n.id}: illegal label \"{n.label[:20]}…\"")

            # Validate iconifyId if present (check top-level field)
            if n.iconifyId and not SAFE_ICON_RE.fullmatch(n.iconifyId):
                errors.append(f"node {n.id}: illegal iconifyId \"{n.iconifyId}\"")

            # Validate iconifyId in properties (for backward compatibility)
            icon_in_props = n.properties.get("iconifyId")
            if icon_in_props and not SAFE_ICON_RE.fullmatch(icon_in_props):
                errors.append(f"node {n.id}: illegal iconifyId in properties \"{icon_in_props}\"")

        return len(errors) == 0, errors
