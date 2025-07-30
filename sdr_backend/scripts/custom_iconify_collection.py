#!/usr/bin/env python
"""
Build custom Iconify collection from Supabase-stored SVGs.

Outputs ./custom-icons.json and (optionally) uploads to Supabase Storage.
"""

import os, json, re, requests
from supabase import create_client
from bs4 import BeautifulSoup
from supabase import create_client, Client



SUPABASE_URL  = os.getenv("SUPABASEURLST")
SUPABASE_KEY  = os.getenv("SUPABASESERVICEKEYST")
print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_KEY: {SUPABASE_KEY}")
if not (SUPABASE_URL and SUPABASE_KEY):
    raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars")

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
BUCKET       = "icons"

# 1. Pull rows
ROWS = sb.table("tech_taxonomy") \
    .select("token,iconify_id,svg_url") \
    .ilike("iconify_id", "custom:%") \
    .execute().data

# 2. SVG to Iconify format
def svg_to_iconify(svg_txt: str, monochrome: bool = False):
    soup = BeautifulSoup(svg_txt, "lxml")
    svg = soup.find("svg")
    if svg is None:
        raise ValueError("No <svg> tag")

    # viewBox parsing
    vb = svg.get("viewBox", "0 0 24 24").split()
    try:
        w = int(float(vb[2]))
        h = int(float(vb[3]))
    except Exception:
        w, h = 24, 24

    # Remove defs, title, etc. Keep only visible shapes
    for tag in svg(["title", "desc", "metadata", "defs", "style"]):
        tag.decompose()

    # Collect inner HTML without outer <svg>
    body_parts = []
    for child in svg.children:
        if getattr(child, "name", None):
            body_parts.append(str(child))

    body = "".join(body_parts).replace("\n", "")

    # replace hard-coded colors with currentColor if you want theme-able icons
    if monochrome:
        body = re.sub(r'fill="#[0-9a-fA-F]{3,6}"', 'fill="currentColor"', body)


    return {"body": body, "width": w, "height": h}

icons = {}
for row in ROWS:
    iconify_id = row["iconify_id"]   # custom:cloudfront
    name = iconify_id.split(":", 1)[1]
    if name in icons:
        continue
    svg_txt = requests.get(row["svg_url"], timeout=20).text
    try:
        icons[name] = svg_to_iconify(svg_txt)
    except Exception as e:
        print(f"⚠️  {name} failed: {e}")

collection = {
    "prefix": "custom",
    "icons": icons,
    "info": {
        "name": "SecureTrack Cloud Icons",
        "total": len(icons),
        "author": {"name": "Indrasol", "url": "https://indrasol.com"},
        "license": {"title": "See individual providers’ terms"}
    }
}

out_path = "custom-icons.json"
with open(out_path, "w", encoding="utf-8") as fh:
    json.dump(collection, fh, ensure_ascii=False, separators=(",", ":"))

print(f"✅ wrote {out_path} ({len(icons)} icons)")

# Optional upload
sb.storage.from_(BUCKET).upload(
    "custom/custom-icons.json",
    open(out_path, "rb"),
    {"contentType": "application/json", "upsert": "true", "cacheControl": "31536000"},
)

print("✅ uploaded to storage/icons/custom/custom-icons.json")
