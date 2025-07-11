"""
intent_classifier_v2.py  – SecureTrack 2.0
· Stage-1   Regex / keyword
· Stage-2   PGvector KNN (semantic)
· Stage-3   LLM fallback (Claude / GPT-4o)
"""

from __future__ import annotations
import re, time, asyncio, os
from dataclasses import dataclass
from typing import Tuple, List, Optional

import asyncpg                         # Supabase pg connection
import openai                          # embeddings + fallback LLM
from supabase import create_client
from config.settings import SUPABASE_DB_PASSWORD, OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
from models.response_models import ResponseType
from utils.logger import log_info

# ──────────────── CONFIG ─────────────────────────────────
EMBED_MODEL = "text-embedding-3-small"             # 1536-d, cheap
K          = 5                                     # nearest neighbours
VEC_TABLE  = "intent_examples"                     # pg table name

openai.api_key = OPENAI_API_KEY
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
pool: asyncpg.Pool | None = None                   # pg pool injected in FastAPI startup


# ──────────────── DATA CLASSES ───────────────────────────
@dataclass
class Classified:
    intent: ResponseType
    confidence: float
    source: str                # pattern | vector | llm


# ──────────────── CLASSIFIER ─────────────────────────────
class IntentClassifierV2:
    """Zero-maintenance hybrid classifier – pgvector + OpenAI."""

    # ---------- stage-1 patterns ----------
    PATTERNS: dict[ResponseType, List[re.Pattern]] = {
        ResponseType.ARCHITECTURE: [
            re.compile(r"\b(add|create|generate|connect|remove|update)\b", re.I),
            re.compile(r"\b(load\s*balancer|firewall|vpc|database|lambda)\b", re.I),
        ],
        ResponseType.DFD: [
            re.compile(r"\b(data\s*flow|dfd|threat\s*model)\b", re.I)
        ],
        ResponseType.EXPERT: [
            re.compile(r"\bwhat\s+is\b|\bexplain\b|\bhow\s+does\b", re.I),
            re.compile(r"\bzero\s*trust|owasp|nvd\b", re.I)
        ],
        ResponseType.OUT_OF_CONTEXT: [
            re.compile(r"\b(weather|joke|movie|hello|good\s+morning)\b", re.I)
        ],
    }

    async def classify(
        self,
        query: str,
        session_id: Optional[str] = None,
        *,
        store_metrics: bool = True,
    ) -> Classified:
        start = time.perf_counter()

        # ---------- Stage-1  (pattern) ----------
        for intent, regexes in self.PATTERNS.items():
            if any(r.search(query) for r in regexes):
                latency = time.perf_counter() - start
                await self._metrics(session_id, intent, 0.9, "pattern", latency, store_metrics)
                return Classified(intent, 0.9, "pattern")

        # ---------- Stage-2  (vector search) ----------
        intent, conf = await self._vector_knn(query)
        if conf >= 0.6:
            latency = time.perf_counter() - start
            await self._metrics(session_id, intent, conf, "vector", latency, store_metrics)
            return Classified(intent, conf, "vector")

        # ---------- Stage-3  (LLM fallback) ----------
        intent, conf = await self._llm_zero_shot(query)
        latency = time.perf_counter() - start
        await self._metrics(session_id, intent, conf, "llm", latency, store_metrics)
        return Classified(intent, conf, "llm")

    # ========== Vector helpers ===========================================
    async def _vector_knn(self, query: str) -> Tuple[ResponseType, float]:
        # embed once via OpenAI – caching upstream already
        resp = await openai.embeddings.with_async_retry().create(
            model=EMBED_MODEL,
            input=query.strip()
        )
        emb = resp.data[0].embedding  # 1 × 1536 python list[float]

        async with pool.acquire() as conn:
            rows = await conn.fetch(
                f"""
                SELECT intent, 1 - (embedding <=> $1::vector) AS score
                FROM {VEC_TABLE}
                ORDER BY embedding <=> $1::vector
                LIMIT {K};
                """,
                emb
            )
        if not rows:
            return ResponseType.CLARIFICATION, 0.0

        # Majority vote weighted by score
        buckets: dict[ResponseType, float] = {}
        for r in rows:
            buckets[ResponseType(r["intent"])] = buckets.get(ResponseType(r["intent"]), 0) + r["score"]
        top_intent, score = max(buckets.items(), key=lambda kv: kv[1])
        conf_norm = min(1.0, score / K)
        return top_intent, conf_norm

    # ========== LLM fallback =============================================
    async def _llm_zero_shot(self, query: str) -> Tuple[ResponseType, float]:
        sys = """You are a classifier for SecureTrack. 
Return one token from {ARCHITECTURE, DFD, EXPERT, CLARIFICATION, OUT_OF_CONTEXT}
and a confidence 0-1. Format: INTENT|0.82"""
        user = f"Query: ```{query}```"
        chat = await openai.chat.with_async_retry().completions.create(
            model="gpt-4o-mini",
            temperature=0,
            max_tokens=5,
            messages=[{"role":"system","content":sys}, {"role":"user","content":user}]
        )
        raw = chat.choices[0].message.content.strip()
        try:
            intent_str, conf_str = raw.split("|")
            intent = ResponseType[intent_str.strip()]
            conf  = float(conf_str)
        except Exception:
            intent, conf = ResponseType.CLARIFICATION, 0.33
        return intent, conf

    # ========== Metrics sink =============================================
    async def _metrics(
        self,
        session_id: Optional[str],
        intent: ResponseType,
        conf: float,
        source: str,
        latency: float,
        enabled: bool = True
    ):
        if not enabled or session_id is None:
            return
        await supabase.table("intents_metrics").insert({
            "session_id": session_id,
            "intent": intent.value,
            "confidence": conf,
            "source": source,
            "latency": f"{latency:.3f}s"
        }).execute()

# ─────────── PG pool initialiser (FastAPI lifespan) ───────────
async def init_pg_pool():
    global pool
    pool = await asyncpg.create_pool(SUPABASE_URL.replace("https://", "postgres://"),
                                     user="postgres",
                                     password=settings.SUPABASE_DB_PASSWORD,
                                     database="postgres",
                                     min_size=1, max_size=10)