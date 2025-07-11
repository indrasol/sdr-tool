# core/dsl/svg_renderer.py
import functools, subprocess, tempfile, os, redis
from utils.logger import log_info

rds = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))

@functools.lru_cache(maxsize=256)
def _render_once(d2_src: str, theme: str) -> bytes:
    with tempfile.NamedTemporaryFile(suffix=".d2", delete=False) as f:
        f.write(d2_src.encode())
        src_path = f.name
    svg = subprocess.check_output(
        ["d2", "--layout", "elk", "--theme", theme, src_path, "-"],
        stderr=subprocess.DEVNULL,
    )
    os.unlink(src_path)
    return svg

def render_svg(d2_src: str, theme: str = "0") -> bytes:
    cache_key = f"svg:{theme}:{hash(d2_src)}"
    if (cached := rds.get(cache_key)):
        return cached
    svg = _render_once(d2_src, theme)
    rds.set(cache_key, svg, ex=3600)
    return svg
