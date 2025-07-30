from __future__ import annotations

"""Lightweight wrapper around RapidFuzz to provide a single **fuzzy_best_match**
function that works even when the optional *rapidfuzz* dependency is missing.

The helper is intentionally self-contained so other modules can import it
without pulling additional heavy dependencies when fuzzy matching is not
required.
"""

from rapidfuzz import process, fuzz

# ---------------------------------------------------------------------------
#  Fuzzy matching helper
# ---------------------------------------------------------------------------

__all__ = ["fuzzy_best_match"]


def fuzzy_best_match(query: str, choices: list[str], threshold: int = 85):
    if not choices:
        return None, 0
    res = process.extractOne(query, choices, scorer=fuzz.token_sort_ratio)
    if not res:
        return None, 0
    key, score, _ = res
    return (key, score) if score >= threshold else (None, score)
