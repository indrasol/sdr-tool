from __future__ import annotations
import os, re, time, json, hashlib, tempfile
from pathlib import Path
from typing import Dict, Any, Iterable, Tuple, List
from functools import lru_cache
import threading

from core.db.supabase_db import get_supabase_client
from utils.logger import log_info, log_error

# ----------------------- CONFIG ---------------------------------
CACHE_TTL_SEC = int(os.getenv("TAXONOMY_REFRESH_SEC", "3600"))   # Default 1 hour expiry
CACHE_DIR = Path(os.getenv("TAXONOMY_CACHE_DIR", "~/.cache/tech_taxonomy")).expanduser()
CACHE_DIR.mkdir(parents=True, exist_ok=True)
DISK_CACHE_FILE = CACHE_DIR / "taxonomy_cache.json"
PAGE_SIZE = 1000  # fallback paging size
MEMORY_CACHE_SIZE = 50000  # LRU cache size for frequently accessed items
# ---------------------------------------------------------------

STOPWORDS: set[str] = {"service","services","server","engine","api","db","database",
                       "system","app","apps","module","component"}

_slug_re = re.compile(r"[^a-z0-9]+")

# Thread-safe lock for cache updates
_cache_lock = threading.RLock()

def slugify(label: str) -> str:
    return _slug_re.sub("-", label.lower()).strip("-")

def normalize_label(s: str) -> Tuple[str, str]:
    base = re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()
    tokens = [t for t in base.split()]
    slug = "-".join(tokens) if tokens else slugify(s)
    core = tokens[-1] if tokens else slug
    return slug, core

# -------- internal mutable caches -------------
_CACHE: Dict[str, Dict[str, Any]] | None = None
_WORD_INDEX: Dict[str, List[str]] = {}   # word -> [slug keys]
_ROW_BY_TOKEN: Dict[str, Dict[str, Any]] = {}
_CACHE_TIME = 0.0
_CACHE_CHECKSUM = ""
# ----- new deterministic lookup tables -------------------------------------
# Canonical token slug  -> row (highest confidence)
_PRIMARY_BY_SLUG: Dict[str, Dict[str, Any]] = {}
# Display-name slug     -> row (medium confidence)
_DNAME_BY_SLUG: Dict[str, Dict[str, Any]] = {}
# Alias slug            -> list[rows] (lowest confidence, may have collisions)
_ALIAS_BY_SLUG: Dict[str, List[Dict[str, Any]]] = {}

# In-memory LRU cache for frequently accessed lookups
@lru_cache(maxsize=MEMORY_CACHE_SIZE)
def _cached_lookup(key: str, lookup_type: str) -> Dict[str, Any] | List[Dict[str, Any]] | None:
    """
    LRU cache for frequent lookups to avoid dictionary access overhead.
    
    Args:
        key: The lookup key (usually a slug)
        lookup_type: One of "primary", "dname", "alias" or "row_by_token"
        
    Returns:
        The cached value or None
    """
    if lookup_type == "primary":
        return _PRIMARY_BY_SLUG.get(key)
    elif lookup_type == "dname":
        return _DNAME_BY_SLUG.get(key)
    elif lookup_type == "alias":
        return _ALIAS_BY_SLUG.get(key)
    elif lookup_type == "row_by_token":
        return _ROW_BY_TOKEN.get(key)
    return None

def _row_keys(row: Dict[str, Any]) -> Iterable[str]:
    """All primary lookup keys for a row."""
    keys = {
        slugify(row["token"]),
        slugify(row.get("display_name") or row["token"]),
    }
    for alias in (row.get("aliases") or []):
        keys.add(slugify(alias))
    # core token
    _, core = normalize_label(row.get("display_name") or row["token"])
    keys.add(core)
    return keys

def _index_words(row: Dict[str, Any]):
    """Add all meaningful words from token/display_name/aliases to WORD_INDEX."""
    texts = [row["token"], row.get("display_name") or ""] + (row.get("aliases") or [])
    words = set()
    for txt in texts:
        for w in re.findall(r"[a-z0-9]+", txt.lower()):
            if w and w not in STOPWORDS:
                words.add(w)
    slug_main = slugify(row["token"])
    for w in words:
        _WORD_INDEX.setdefault(w, []).append(slug_main)

def _build_indexes(rows: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Construct deterministic indexes ordered by confidence.

    1. _PRIMARY_BY_SLUG – exact token match (cannot be shadowed)
    2. _DNAME_BY_SLUG   – exact display-name match
    3. _ALIAS_BY_SLUG   – exact alias match (may map to multiple rows)

    A flattened dict is returned for legacy callers that still expect the
    previous behaviour, but canonical tokens always win in that view.
    """
    # Use the lock to ensure thread safety during index rebuilding
    with _cache_lock:
        # Reset all sub-indexes first
        _PRIMARY_BY_SLUG.clear()
        _DNAME_BY_SLUG.clear()
        _ALIAS_BY_SLUG.clear()
        _WORD_INDEX.clear()
        _ROW_BY_TOKEN.clear()

        # Clear the LRU cache
        _cached_lookup.cache_clear()

        for row in rows:
            # Canonical token ➜ primary index
            tok_slug = slugify(row["token"])
            _PRIMARY_BY_SLUG[tok_slug] = row
            _ROW_BY_TOKEN[row["token"]] = row

            # Display name ➜ secondary index
            dname = row.get("display_name") or ""
            if dname:
                _DNAME_BY_SLUG[slugify(dname)] = row

            # Aliases ➜ tertiary index (many-to-one)
            for alias in (row.get("aliases") or []):
                _ALIAS_BY_SLUG.setdefault(slugify(alias), []).append(row)

            # Word-level index for fuzzy / vote lookup
            _index_words(row)

        # ------------------------------------------------------------------
        # Flatten all indexes back into a single dict for backward-compatibility
        # Canonical tokens are added last so they always override weaker signals.
        # ------------------------------------------------------------------
        flat: Dict[str, Dict[str, Any]] = {}

        # 3) aliases (lowest confidence) – pick the first row if multiple rows collide
        for slug, rows_lst in _ALIAS_BY_SLUG.items():
            flat.setdefault(slug, rows_lst[0])

        # 2) display-names
        flat.update(_DNAME_BY_SLUG)

        # 1) canonical tokens – strongest signal wins final shadowing write
        flat.update(_PRIMARY_BY_SLUG)

        log_info(
            f"[taxonomy] index built – primary={len(_PRIMARY_BY_SLUG)}, "
            f"display={len(_DNAME_BY_SLUG)}, alias={len(_ALIAS_BY_SLUG)}, "
            f"word_keys={len(_WORD_INDEX)}"
        )

        return flat

# ---------------- RPC + Fallback download -----------------------

def _rpc_pull() -> Tuple[List[Dict[str, Any]], str]:
    """Try RPC first; return (rows, checksum)."""
    sb = get_supabase_client()
    try:
        resp = sb.rpc("export_taxonomy_json", {}).execute()
        payload = resp.data or {}
        rows = payload.get("rows") or []
        checksum = payload.get("checksum") or ""
        
        # Debug logging to verify svg_url is present
        if rows and len(rows) > 0:
            sample_row = rows[0]
            has_svg_url = 'svg_url' in sample_row
            log_info(f"[taxonomy] RPC pull sample row keys: {list(sample_row.keys())}")
            log_info(f"[taxonomy] RPC pull has svg_url field: {has_svg_url}")
            
        if rows:
            return rows, checksum
    except Exception as e:
        log_error(f"[taxonomy] RPC export failed: {e}")
    return [], ""


def _paged_pull() -> List[Dict[str, Any]]:
    sb = get_supabase_client()
    start = 0
    out: List[Dict[str, Any]] = []
    while True:
        resp = (
            sb.table("tech_taxonomy")
              .select("token,display_name,aliases,kind,subkind,provider,iconify_id,technology,svg_url,updated_at",
                      count="exact")
              .range(start, start + PAGE_SIZE - 1)
              .execute()
        )
        chunk = resp.data or []
        out.extend(chunk)
        if len(chunk) < PAGE_SIZE:
            break
        start += PAGE_SIZE
    return out

def _load_from_disk() -> Tuple[List[Dict[str, Any]], str]:
    """Load rows + checksum from disk cache. Return (rows, checksum)."""
    if not DISK_CACHE_FILE.exists():
        return [], ""

    try:
        with DISK_CACHE_FILE.open("r", encoding="utf-8") as fh:
            obj = json.load(fh)
        return obj.get("rows", []), obj.get("checksum", "")
    except Exception as e:
        log_error(f"[taxonomy] disk cache load failed: {e}")
        return [], ""

def _save_to_disk(rows: List[Dict[str, Any]], checksum: str):
    try:
        # ensure dir still exists (in case it's been removed)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)

        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=CACHE_DIR,
            delete=False,
            prefix="taxonomy_cache_",
            suffix=".json"
        ) as tmp:
            json.dump({"rows": rows, "checksum": checksum}, tmp)
            tmp_path = Path(tmp.name)

        # Atomic replace
        tmp_path.replace(DISK_CACHE_FILE)

    except Exception as e:
        log_error(f"[taxonomy] disk cache save failed: {e}")

def _pull_taxonomy() -> Dict[str, Dict[str, Any]]:
    global _CACHE_CHECKSUM

    # 1) Try RPC
    rows, checksum = _rpc_pull()

    # 2) if RPC empty, fallback to paged
    if not rows:
        log_info("[taxonomy] RPC pull failed, falling back to paged pull")
        rows = _paged_pull()
        checksum = hashlib.md5(",".join(sorted(f"{r['token']}{r.get('updated_at','')}" for r in rows)).encode()).hexdigest()

    # Verify that the rows have svg_url field
    if rows and len(rows) > 0:
        sample_row = rows[0]
        has_svg_url = 'svg_url' in sample_row
        
        # If svg_url is missing in the rows fetched from RPC/paged pull, don't use disk cache
        if not has_svg_url:
            log_info("[taxonomy] SVG URLs missing in fetched data, skipping disk cache")
            # Force build fresh indexes even if checksum matches
            disk_sum = None
        else:
            # Normal flow - compare checksums
            disk_sum = None
            if DISK_CACHE_FILE.exists():
                log_info("[taxonomy] Disk cache found, checking checksum")
                _, disk_sum = _load_from_disk()
    else:
        disk_sum = None
    
    # 3) Compare checksum with disk cache; if same, reuse disk to avoid rebuild. (optional)
    if disk_sum and disk_sum == checksum:
        log_info("[taxonomy] Disk cache checksum matches, using cached data")
        rows, _ = _load_from_disk()
        
        # Double-check that loaded rows have svg_url
        if rows and len(rows) > 0 and 'svg_url' not in rows[0]:
            log_info("[taxonomy] Cached data doesn't have svg_url, discarding and using fresh data")
            # Get fresh rows again if cached data doesn't have svg_url
            rows, checksum = _rpc_pull()
            if not rows:
                rows = _paged_pull()
                checksum = hashlib.md5(",".join(sorted(f"{r['token']}{r.get('updated_at','')}" for r in rows)).encode()).hexdigest()

    # 4) Build indexes
    index = _build_indexes(rows)

    # 5) persist disk cache
    _save_to_disk(rows, checksum)
    _CACHE_CHECKSUM = checksum
    log_info(f"[taxonomy] loaded {len(rows)} rows, checksum={checksum}, index_keys={len(index)} word_keys={len(_WORD_INDEX)}")

    # sanity-check: expected dataset size
    if len(rows) < 1000:
        log_info(f"[taxonomy] WARNING – only {len(rows)} rows loaded (<1000). Some taxonomy entries may be missing.")

    return index

# Singleton instance to ensure we only have one background thread
_background_refresher = None
_shutdown_event = threading.Event()

def _background_refresh():
    """Background thread to periodically refresh taxonomy data."""
    log_info("[taxonomy] Starting background refresh thread")
    while not _shutdown_event.is_set():
        try:
            # Sleep first, then refresh - this ensures we don't double-load at startup
            _shutdown_event.wait(CACHE_TTL_SEC)
            if not _shutdown_event.is_set():
                log_info("[taxonomy] Background refresh starting")
                load_taxonomy(force=True)
                log_info("[taxonomy] Background refresh completed")
        except Exception as e:
            log_error(f"[taxonomy] Background refresh error: {e}")
    log_info("[taxonomy] Background refresh thread stopping")

def start_background_refresher():
    """Start the background refresher thread if caching is enabled."""
    global _background_refresher
    if CACHE_TTL_SEC > 0 and _background_refresher is None:
        _shutdown_event.clear()
        _background_refresher = threading.Thread(target=_background_refresh, daemon=True)
        _background_refresher.start()

def stop_background_refresher():
    """Stop the background refresher thread."""
    global _background_refresher
    if _background_refresher is not None:
        _shutdown_event.set()
        _background_refresher.join(timeout=1.0)
        _background_refresher = None

# ---------------- Public API -----------------------------

def load_taxonomy(force: bool = False) -> Dict[str, Dict[str, Any]]:
    global _CACHE, _CACHE_TIME

    # ------------------------------------------------------------------
    # Ops flag: set TAXONOMY_FORCE_REFRESH=true to bypass every cache tier
    # ------------------------------------------------------------------
    if not force:
        env_force = os.getenv("TAXONOMY_FORCE_REFRESH", "true").lower() in {
            "true",
        }
        if env_force:
            force = True

    now = time.time()

    log_info(f"[taxonomy] load_taxonomy force={force}")

    # Fast path - return the cached taxonomy if available and not expired
    if not force and _CACHE and (CACHE_TTL_SEC == 0 or (now - _CACHE_TIME) < CACHE_TTL_SEC):
        return _CACHE

    # Lock to prevent multiple threads from loading the taxonomy simultaneously
    with _cache_lock:
        # Double-check to avoid race conditions
        if not force and _CACHE and (CACHE_TTL_SEC == 0 or (now - _CACHE_TIME) < CACHE_TTL_SEC):
            return _CACHE

        try:
            _CACHE = _pull_taxonomy()
            _CACHE_TIME = now
            
            # Start the background refresher if needed
            start_background_refresher()
        except Exception as exc:
            log_error(f"[taxonomy] load failed – using stale cache: {exc}")
            _CACHE = _CACHE or {}
    return _CACHE

def row_by_token(token: str) -> Dict[str, Any] | None:
    """Get row by token with LRU caching."""
    cached = _cached_lookup(token, "row_by_token")
    if cached is not None:
        return cached
    return _ROW_BY_TOKEN.get(token)

# ----------------------- Fuzzy / Word vote helpers -----------------------

def word_vote_lookup(label: str) -> Dict[str, Any] | None:
    """Split label into words, pick the taxonomy row with the most word matches."""
    words = [w for w in re.findall(r"[a-z0-9]+", label.lower()) if w not in STOPWORDS]
    if not words:
        return None
    counter: Dict[str, int] = {}
    for w in words:
        for slug in _WORD_INDEX.get(w, []):
            counter[slug] = counter.get(slug, 0) + 1
    if not counter:
        return None
    best_slug = max(counter.items(), key=lambda x: x[1])[0]
    return _CACHE.get(best_slug)

# export a hot-reload
def reload_taxonomy():
    """Force refresh."""
    load_taxonomy(force=True)

def clear_cache():
    """Clear all caches (memory and disk) to force a fresh load."""
    global _CACHE, _CACHE_TIME, _CACHE_CHECKSUM
    
    # Clear memory cache
    _CACHE = None
    _CACHE_TIME = 0
    _CACHE_CHECKSUM = ""
    
    # Reset all sub-indexes
    _PRIMARY_BY_SLUG.clear()
    _DNAME_BY_SLUG.clear()
    _ALIAS_BY_SLUG.clear()
    _WORD_INDEX.clear()
    _ROW_BY_TOKEN.clear()
    
    # Clear LRU cache
    _cached_lookup.cache_clear()
    
    # Remove disk cache file if it exists
    try:
        if DISK_CACHE_FILE.exists():
            log_info("[taxonomy] Clearing disk cache")
            DISK_CACHE_FILE.unlink()
    except Exception as e:
        log_error(f"[taxonomy] Failed to clear disk cache: {e}")
    
    log_info("[taxonomy] All caches cleared")

# Force an immediate refresh to pick up the updated taxonomy data with svg_url
clear_cache()
reload_taxonomy()
