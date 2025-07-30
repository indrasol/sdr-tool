# ────────────────────────────────────────────────────────────
#  utils for svg_public_url back‑fill
# ────────────────────────────────────────────────────────────


import os, re, time, requests, unicodedata, json
from typing import Dict, Iterable, List, Tuple
from supabase import create_client, Client
from tqdm import tqdm
# from config.settings import SUPABASE_URL, SUPABASE_SERVICE_KEY

# ────────────────────────────────────────────────────────────
# 0.  Environment / client
# ────────────────────────────────────────────────────────────
SUPABASE_URL  = os.getenv("SUPABASEURLST")
SUPABASE_KEY  = os.getenv("SUPABASEAPIKEYST")
print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_KEY: {SUPABASE_KEY}")
if not (SUPABASE_URL and SUPABASE_KEY):
    raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

BUCKET = "icons"                                   # ⚠️  change if needed

def public_url(path: str) -> str | None:
    """
    Return a browser‑friendly URL for the object.
    Supabase SDK (Python) only exposes the 2‑arg signature, so we massage
    /object/ → /render/image/ to force correct headers.
    """
    if not path:
        return None
    rsp = supabase.storage.from_(BUCKET).get_public_url(path)
    # sdk < 2.0 returns dict; >=2.0 returns str
    url = rsp["data"]["publicUrl"] if isinstance(rsp, dict) else rsp
    # insure inline-disposition endpoint
    return url.replace("/storage/v1/object/", "/storage/v1/render/image/")

def add_column_once() -> None:
    supabase.postgrest.rpc(
        "execute_sql",
        {"sql": """
            ALTER TABLE tech_taxonomy
            ADD COLUMN IF NOT EXISTS svg_public_url TEXT;
        """}
    ).execute()

def fill_missing_urls(batch_size: int = 500) -> None:
    """
    Find rows where svg_public_url is NULL, generate, and update.
    """
    print("⏳  Fetching rows without svg_public_url …")
    rows = supabase.table("tech_taxonomy") \
        .select("*") \
        .is_("svg_public_url", "null") \
        .eq("token", "aws-account") \
        .execute() \
        .data

    if not rows:
        print("✅  No rows to update.")
        return

    updates = []
    for r in rows:
        url = public_url(r["storage_path"])
        if url:
            updates.append({"token": r["token"],
                            "kind": r["kind"],
                            "subkind": r["subkind"],
                            "display_name": r["display_name"],
                            "provider": r["provider"],
                            "iconify_id": r["iconify_id"],
                            "aliases": r["aliases"],
                            "source": r["source"],
                            "svg_public_url": url})

    print(f"→  Updating {len(updates)} rows")

    upsert_rows(updates)

    # upsert in batches ≤ batch_size
    # for chunk in batched(updates, batch_size):
    #     supabase.table("tech_taxonomy") \
    #         .upsert(chunk, on_conflict="token") \
    #         .execute()
    #     time.sleep(0.1)

def batched(iterable, size=500):
    buf: List[Dict] = []
    for item in iterable:
        buf.append(item)
        if len(buf) == size:
            yield buf
            buf = []
    if buf:
        yield buf

# ── helper ----------------------------------------------
def uniq_by_token(rows: Iterable[Dict]) -> List[Dict]:
    seen: Dict[str, Dict] = {}
    for r in rows:
        tok = r["token"]
        if tok in seen:                      # merge aliases if duplicate
            seen[tok]["aliases"] += r["aliases"]
        else:
            seen[tok] = r
    return list(seen.values())

# ── upsert ----------------------------------------------
def upsert_rows(rows: Iterable[Dict]):
    deduped = uniq_by_token(rows)            # ① compress whole iterable
    for chunk in batched(deduped, 500):      # ② then batch ≤500 rows
        supabase.table("tech_taxonomy") \
            .upsert(chunk, on_conflict="token") \
            .execute()
        time.sleep(0.1)

if __name__ == "__main__":

    # add_column_once()
    fill_missing_urls()
    print("✅  svg_public_url back‑fill complete")
