from __future__ import annotations
import re
from functools import lru_cache
from pathlib import Path
import os
from typing import List, Tuple, Dict, Any



from .taxonomy_client import (
    load_taxonomy,
    normalize_label,
    word_vote_lookup,
    slugify,
    _PRIMARY_BY_SLUG,
    _DNAME_BY_SLUG,
    _ALIAS_BY_SLUG,
)
from .fuzzy_match import fuzzy_best_match
from core.ir.ir_types import IRGraph, IRNode
from utils.logger import log_info

# Optional YAML overrides
import yaml

_PROJECT_ROOT = Path(__file__).resolve().parents[4]
_RULES_PATH = _PROJECT_ROOT / "resources" / "icon_rules.yaml"

_dynamic_rules: List[Tuple[re.Pattern[str], str, str | None]] = []
if _RULES_PATH.exists():
    try:
        raw = yaml.safe_load(_RULES_PATH.read_text("utf-8"))
        for section in ("exact", "contains", "regex"):
            for entry in raw.get(section, []):
                patt = entry["match"]
                if section == "exact":
                    pattern = re.compile(rf"^{re.escape(patt)}$", re.I)
                elif section == "contains":
                    toks = entry["match"] if isinstance(entry["match"], list) else [entry["match"]]
                    pattern = re.compile("|".join(fr"\b{re.escape(t)}\b" for t in toks), re.I)
                else:
                    pattern = re.compile(patt, re.I)

                pattern._meta = {k: entry.get(k) for k in ("provider", "technology", "iconify_id") if entry.get(k)}
                _dynamic_rules.append((pattern, entry.get("kind", "Service"), entry.get("subkind")))
    except Exception:
        pass

_PATTERN_RULES: List[Tuple[re.Pattern[str], str, str | None]] = _dynamic_rules + [
    (re.compile(r"\bredis\b", re.I),                       "Cache",           "redis"),
    (re.compile(r"\bpostgres|aurora|rds\b", re.I),         "Database",        "postgres"),
    (re.compile(r"\bmysql\b", re.I),                       "Database",        "mysql"),
    (re.compile(r"\bmongodb\b", re.I),                     "Database",        "mongodb"),
    (re.compile(r"\bkafka\b", re.I),                       "Queue",           "kafka"),
    (re.compile(r"\bs3|blob|object\s+storage\b", re.I),    "BlobStore",       "s3"),
    (re.compile(r"\bauth|keycloak|identity\b", re.I),      "Auth",            "generic"),
    (re.compile(r"\bcdn|cloudfront\b", re.I),              "CDN",             "generic"),
    (re.compile(r"\bml\s*model|inference|embedding\b", re.I), "MLModel",      "inference"),
    (re.compile(r"\bvector\s*store|pinecone|milvus\b", re.I), "VectorStore",  "generic"),
    (re.compile(r"\bqueue|sqs|pubsub\b", re.I),            "Queue",           "generic"),
    (re.compile(r"\bwaf|firewall\b", re.I),                "WAF",             "generic"),
]

# ---------------------------------------------------------------------------
#  Extra regex patterns with explicit icon metadata
# ---------------------------------------------------------------------------

# _siem_pat = re.compile(r"\bsiem\b", re.I)
# _siem_pat._meta = {"iconify_id": "mdi:shield-eye"}

# _micro_pat = re.compile(r"\bmicroservice\b", re.I)
# _micro_pat._meta = {"iconify_id": "mdi:cog"}

# _service_pat = re.compile(r"\bservice\b", re.I)
# _service_pat._meta = {"iconify_id": "mdi:cog"}

# # Extend pattern list with new entries
# _PATTERN_RULES.extend([
#     (_siem_pat, "Monitoring", "siem"),
#     (_micro_pat, "Service", "microservice"),
#     (_service_pat, "Service", "generic"),
# ])

_DEFAULT_KIND = "Service"

_TAXONOMY = load_taxonomy(force=True)
_FUZZY_KEYS = list(_TAXONOMY.keys())
# Provide a concise summary instead of dumping the entire taxonomy dict.
log_info(f"Taxonomy loaded with {len(_TAXONOMY)} entries.")

# Log each taxonomy entry's key along with the first five key-value pairs of its data.
# This prevents overwhelming the logs while still surfacing useful information for debugging.
# for _token, _row in _TAXONOMY.items():
#     # Extract the first five items (or fewer if the row is smaller).
#     _row_preview = {k: _row[k] for k in list(_row.keys())[:5]}
#     log_info(f"{_token}: {_row_preview}")


# Head noun shortcuts for ultra-generic labels
_HEAD_MAP: Dict[str, Tuple[str, str | None]] = {
    "balancer": ("LB", "generic"),
    "firewall": ("WAF", "generic"),
    "gateway":  ("Gateway", "generic"),
    "queue":    ("Queue", "generic"),
    "topic":    ("Topic", "generic"),
    "cdn":      ("CDN", "generic"),
    "cache":    ("Cache", "generic"),
    "metrics":  ("Monitoring", "generic"),
    "monitoring": ("Monitoring", "generic"),
    "tracing":  ("Tracing", "generic"),
    "logging":  ("Logging", "generic"),
    "auth":     ("Auth", "generic"),
    "database": ("Database", "generic"),
    "db":       ("Database", "generic"),
}

# ---------------------------------------------------------------------------
#  New helper structures / regex
# ---------------------------------------------------------------------------

# Common cloud-provider prefixes used in taxonomy tokens (e.g., aws-waf)
_PROVIDER_PREFIX = re.compile(r"^(aws|gcp|azure|google|oci|alibaba|ibm)[-_]", re.I)


def _row_to_kind(row: Dict[str, Any]) -> Tuple[str, str | None, Dict]:
    """Return (kind, subkind, metadata) tuple from taxonomy row.

    Builds meta dict with BOTH snake_case 'iconify_id' (legacy) and camelCase
    'iconifyId' for the FE. Adds a debug log when an iconifyId is present.
    """
    meta: Dict[str, Any] = {}
    if row.get("provider"):
        meta["provider"] = row["provider"]
    if row.get("technology"):
        meta["technology"] = row["technology"]
    if row.get("iconify_id"):
        meta["iconifyId"]  = row["iconify_id"]     # frontend key
        log_info(f"[classifier] iconifyId set -> {row['iconify_id']}")

    return row.get("kind", _DEFAULT_KIND), row.get("subkind"), meta


def _best_alias_match(raw_label: str, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Select row whose token shares most words with the raw label."""
    raw_words = set(re.findall(r"[a-z0-9]+", raw_label.lower()))
    best_row = rows[0]
    best_score = -1
    for r in rows:
        tok_words = set(re.findall(r"[a-z0-9]+", r["token"].lower()))
        score = len(raw_words & tok_words)
        if score > best_score:
            best_score = score
            best_row = r
    return best_row

# ---------------------------------------------------------------------------
# Candidate slug generator
# ---------------------------------------------------------------------------

def _candidate_slugs(slug: str) -> List[str]:
    """Return list of slugs to try in priority order: full slug then each part."""
    parts = [p for p in slug.split("-") if p]
    log_info(f"Candidate slugs for {slug} -> {parts}")
    return [slug] + parts



def _classify(label_lc: str) -> tuple[str, str | None, dict]:
    """Classify a label using a tiered, deterministic lookup sequence."""

    slug, _ = normalize_label(label_lc)

    db_ctx = bool(re.search(r"\b(database|db)\b", label_lc))

    # Detect explicit "microservice" references to bias classification towards the
    # dedicated "Microservice" kind. Mirrors the existing database context flag.
    microservice_ctx = bool(re.search(r"\bmicroservice\b", label_lc))

    # Determine if we must enforce a particular kind for the remainder of the
    # classification pipeline.
    required_kind = "Database" if db_ctx else ("Microservice" if microservice_ctx else None)

    # -------------------------------------------------------------------
    # 1-3) Try deterministic exact matches for slug and each constituent word
    # -------------------------------------------------------------------
    for cand in _candidate_slugs(slug):
        # 1. canonical token match
        row = (_PRIMARY_BY_SLUG.get(cand) or _PRIMARY_BY_SLUG.get(_PROVIDER_PREFIX.sub("", cand)))
        if row and (required_kind is None or row.get("kind") == required_kind):
            log_info(f"[classifier] token-exact hit for '{label_lc}' via '{cand}' -> token='{row['token']}'")
            return _row_to_kind(row)

        # 2. display-name match
        row = _DNAME_BY_SLUG.get(cand)
        if row and (required_kind is None or row.get("kind") == required_kind):
            log_info(f"[classifier] display-name hit for '{label_lc}' via '{cand}' -> token='{row['token']}'")
            return _row_to_kind(row)

        # 3. alias match
        alias_rows = _ALIAS_BY_SLUG.get(cand)
        if alias_rows:
            row = _best_alias_match(label_lc, alias_rows)
            if required_kind is None or row.get("kind") == required_kind:
                log_info(f"[classifier] alias-exact hit for '{label_lc}' via '{cand}' -> token='{row['token']}'")
                return _row_to_kind(row)

    # 4) Word-vote heuristics
    row = word_vote_lookup(label_lc)
    if row and (required_kind is None or row.get("kind") == required_kind):
        log_info(f"[classifier] word-vote hit for '{label_lc}' -> token='{row['token']}'")
        return _row_to_kind(row)

    # 5) Fuzzy best match (expensive)
    key, score = fuzzy_best_match(slug, _FUZZY_KEYS)
    if key:
        row = _TAXONOMY[key]
        if required_kind is None or row.get("kind") == required_kind:
            log_info(f"[classifier] fuzzy hit for '{label_lc}' -> token='{row['token']}', score={score}")
            return _row_to_kind(row)

    # 6) Regex fallback rules
    for pattern, knd, subk in _PATTERN_RULES:
        if pattern.search(label_lc):
            if required_kind and knd != required_kind:
                continue
            log_info(f"[classifier] regex-fallback hit for '{label_lc}' -> pattern='{pattern.pattern}'")
            meta = getattr(pattern, "_meta", {})
            return knd, subk, meta

    default_kind = required_kind or _DEFAULT_KIND
    log_info(f"[classifier] no match for '{label_lc}', defaulting to {default_kind}")
    return default_kind, None, {}


def classify_kinds(graph: IRGraph) -> IRGraph:
    """Classify every node in the graph, ensuring the taxonomy cache is always up-to-date.

    The tech_taxonomy table can change at any time.  To guarantee classifiers see the
    most recent data, we *always* re-pull the taxonomy before processing a graph.
    Because `load_taxonomy(force=True)` performs an internal checksum comparison
    and reuses the disk cache when nothing has changed, the overhead for repeated
    calls is minimal while still ensuring correctness when updates do occur.
    """

    global _TAXONOMY, _FUZZY_KEYS

    # Force reload.  The taxonomy client will hit Supabase only when its checksum
    # differs from the local cache, so this is safe to call every time.
    _TAXONOMY = load_taxonomy(force=True)
    _FUZZY_KEYS = list(_TAXONOMY.keys())

    # When debugging taxonomy resolution, it can be helpful to see log lines
    # from _classify() on every invocation.  Because _classify() is
    # memoised with @lru_cache this normally happens only once per unique
    # label.  Flip DEBUG_CLASSIFIER_CACHE_CLEAR=1 to disable the cache
    # temporarily.
    # if _DEBUG_CLEAR_CACHE:
    #     _classify.cache_clear()
    #     log_info("[classifier] Cleared _classify LRU cache (debug mode)")

    new_nodes: List[IRNode] = []
    for n in graph.nodes:
        if n.kind != _DEFAULT_KIND:
            new_nodes.append(n)
            continue

        kind, subkind, meta = _classify(n.name.lower())
        upd = {"kind": kind, "subkind": subkind}
        if meta:
            md = dict(n.metadata)
            md.update(meta)
            upd["metadata"] = md
        new_nodes.append(n.model_copy(update=upd))

    return graph.model_copy(update={"nodes": new_nodes})
