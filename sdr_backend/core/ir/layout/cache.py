"""layout/cache.py – in-memory cache mapping ir_hash → positioned DSL JSON"""

from __future__ import annotations

from typing import Dict, Any

_CACHE: Dict[str, Any] = {}


def get(hash_key: str):
    return _CACHE.get(hash_key)


def set(hash_key: str, value):
    _CACHE[hash_key] = value 