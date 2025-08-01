import os
import mimetypes
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv
import re
import unicodedata

# Load env vars
# load_dotenv()
SUPABASE_URL = os.getenv("SUPABASEURLST")
SUPABASE_KEY = os.getenv("SUPABASESERVICEKEYST")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Constants
GCP_DIR = Path("/Users/rithingullapalli/Desktop/SDR/gcp-icons")
BUCKET_NAME = "icons"
UPLOAD_PREFIX = "gcp-icons"

GCP_STOPWORDS   = {"svg"}
SLUGIFY = re.compile(r"[^a-z0-9]+")

def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return SLUGIFY.sub("-", text.lower()).strip("-")

# def normalize_label(filename: str) -> str:
#     """Strip prefix/suffix and normalize to kebab-case"""
#     name = filename.replace("Arch_Azure-", "").replace("_64.svg", "")
#     return name.lower().replace("_", "-")

def upload_and_update(azure_dir: Path):
    for file in azure_dir.glob("*.svg"):
        stem   = file.stem                       # bigquery
        parts  = re.split(r"[-_]", stem)
        words  = [p for p in parts if p and p.lower() not in GCP_STOPWORDS]
        base   = slugify("-".join(words))
        storage_path = f"{UPLOAD_PREFIX}/{base}.svg"

        # Upload SVG
        with open(file, "rb") as svg_file:
            res = supabase.storage.from_(BUCKET_NAME).upload(
                path=storage_path,
                file=svg_file,
                file_options={
                    "content-type": "image/svg+xml",
                    "upsert": "true",
                    "cache-control": "max-age=31536000, public",
                },
            )
            print(f"✅ Uploaded {file.name} → {res}")
            if not res:
                print(f"❌ Failed to upload: {file.name}")
                continue

        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)
        print(f"✅ Uploaded {file.name} → {public_url}")

        # Update Supabase table
        token_value = f"gcp-{base}"
        update_res = supabase.table("tech_taxonomy").update({
            "token": token_value,
            "svg_url": public_url
        }).eq("token", token_value).execute()

        if update_res:
            print(f"🔄 Updated svg_url for token: {token_value}")
        else:
            print(f"⚠️ Failed to update DB for token: {token_value} → {update_res}")

if __name__ == "__main__":
    upload_and_update(GCP_DIR)
