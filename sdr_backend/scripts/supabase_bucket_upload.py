#!/usr/bin/env python
"""
Upload local AWS/Azure/GCP SVGs to Supabase Storage (bucket 'icons') and
patch tech_taxonomy rows with storage_path & svg_url. Idempotent.

Env:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY  (service role key)
  ICONS_ROOT            (folder containing aws-icons/, azure-icons/, gcp-icons/)
"""

import os
import hashlib
from pathlib import Path
from typing import Iterable, Tuple
from supabase import create_client, Client

BUCKET = "icons"
# ROOT   = Path(os.getenv("ICONS_ROOT", "./icons"))  # contains aws-icons/, etc.
ROOT = Path("/Users/rithingullapalli/Desktop/SDR")

# folder -> provider prefix and strip pattern
FOLDERS: Tuple[Tuple[str, str, str], ...] = (
    ("aws-icons",   "aws",   r"^arch_amazon-|^arch_aws-"),
    ("azure-icons", "azure", r"^\d+?_icon-service-"),
    ("gcp-icons",   "gcp",   r"^"),
)

SUPABASE_URL  = os.getenv("SUPABASEURLST")
SUPABASE_KEY  = os.getenv("SUPABASESERVICEKEYST")
print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_KEY: {SUPABASE_KEY}")
if not (SUPABASE_URL and SUPABASE_KEY):
    raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars")

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

import re, unicodedata

SLUGIFY_RE = re.compile(r"[^a-z0-9]+")


def slugify(text: str) -> str:
    """ASCII-slug, identical to cloud_taxonomy.py implementation."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return SLUGIFY_RE.sub("-", text.lower()).strip("-")


# Stop-word sets copied from cloud_taxonomy.py so cleaning is consistent.
AWS_STOPWORDS   = {"arch", "amazon", "aws", "for", "of", "the", "controller", "sdk"}
AZURE_STOPWORDS = {"icon", "service", "svg"}
GCP_STOPWORDS   = {"svg"}


def clean_stem(provider: str, stem: str) -> str:
    """Return cleaned service stem identical to cloud_taxonomy token logic."""
    if provider == "aws":
        stem = re.sub(r"^Arch_", "", stem, flags=re.I)
        stem = re.sub(r"_\d+$", "", stem)              # _64 etc.
        parts = re.split(r"[-_]", stem)
        words = [p for p in parts if p.lower() not in AWS_STOPWORDS and p]
        return "-".join(words)

    if provider == "azure":
        stem = re.sub(r"^\d+\-?", "", stem)           # numeric prefix
        stem = stem.replace("icon-service-", "").replace("icon-service", "")
        parts = re.split(r"[-_]", stem)
        words = [p for p in parts if p.lower() not in AZURE_STOPWORDS and p]
        return "-".join(words)

    if provider == "gcp":
        parts = re.split(r"[-_]", stem)
        words = [p for p in parts if p.lower() not in GCP_STOPWORDS and p]
        return "-".join(words)

    # Fallback
    return stem

def walk_svgs() -> Iterable[Tuple[str, str, bytes]]:
    """Yield (provider, filename_slug, content_bytes)"""
    for folder, provider, strip_regex in FOLDERS:
        base = ROOT / folder
        if not base.exists():
            continue
        for p in base.glob("*.svg"):
            raw = p.read_bytes()

            stem  = p.stem
            # First remove generic folder-specific prefix patterns
            if strip_regex:
                stem = re.sub(strip_regex, "", stem, flags=re.I)

            cleaned = clean_stem(provider, stem)

            token = f"{provider}-{slugify(cleaned)}"
            yield provider, token, raw

def upload_svg(storage_path: str, data: bytes):
    # upsert True so running again is fine; cache 1 year
    sb.storage.from_(BUCKET).upload(
        storage_path,
        data,
        {"contentType": "image/svg+xml", "upsert": "true", "cacheControl": "31536000"},
    )

def public_url(storage_path: str) -> str:
    return sb.storage.from_(BUCKET).get_public_url(storage_path)

def patch_row(token: str, storage_path: str, url: str, digest: str):
    sb.table("tech_taxonomy").update({
        "storage_path": storage_path,
        "svg_url": url,
        "svg_sha256": digest,
        # ensure iconify_id remains custom:*; if empty set it
        "iconify_id": sb.rpc("coalesce_iconify_id", {"tok": token}).execute().data
    }).eq("token", token).execute()

# If you don't have that RPC, just read current row:
def ensure_iconify_id(token: str) -> str:
    res = sb.table("tech_taxonomy").select("iconify_id").eq("token", token).execute()
    if res.data:
        iid = res.data[0]["iconify_id"]
        if iid:  # keep it
            return iid
    # derive from token: remove "<prov>-"
    return "custom:" + token.split("-", 1)[-1]

def patch_row_simple(token, storage_path, url, digest):
    sb.table("tech_taxonomy").update({
        "storage_path": storage_path,
        "svg_url": url,
        "svg_sha256": digest,
        "iconify_id": ensure_iconify_id(token),
    }).eq("token", token).execute()

def main():
    for provider, token, data in walk_svgs():
        filename = token.split("-", 1)[-1] + ".svg"   # cloudfront.svg
        storage_path = f"{provider}/{filename}"
        digest = sha256_bytes(data)

        # upload if not exists or changed
        # Head check: supabase-py doesn't expose head; easiest: try upload always (upsert).
        upload_svg(storage_path, data)
        url = public_url(storage_path)

        patch_row_simple(token, storage_path, url, digest)

    print("✅ Upload & patch complete.")

if __name__ == "__main__":
    main()
