from __future__ import annotations

"""core/intent_classification/intent_classifier_v2.py

Light-weight intent classification service for Design-Service v2.
Derives from the proven v1 classifier but trimmed down to match the
new 6-intent taxonomy and to keep Phase-1 scope reasonable.

Later phases can re-introduce advanced metrics and LLM fallback. For
now we stick to pattern + embedding similarity which already covers
>90 % of traffic.
"""

from typing import Dict, Any, List, Tuple, Optional
import os
import re
import json
import time

import numpy as np
import faiss
from enum import Enum
from datetime import datetime
from pathlib import Path

from sentence_transformers import SentenceTransformer

from utils.logger import log_info
from config.settings import ML_MODELS_DIR, TRANSFORMER_MODEL_TOKEN
from huggingface_hub import login

# Local models / enums
from models.response_models_v2 import IntentV2

# Optional LLM fallback
try:
    from core.llm.llm_gateway_v2 import LLMGatewayV2
except Exception:
    LLMGatewayV2 = None  # type: ignore


# ---------------------------------------------------------------------------
#  Embedding model setup helpers (copied from v1 with minor tweaks)
# ---------------------------------------------------------------------------

_DEFAULT_MODEL = "all-MiniLM-L6-v2"
_FALLBACK_MODELS = ["distilbert-base-nli-stsb-mean-tokens"]
_MAX_RETRIES = 3


def _download_transformer(model_name: str, cache_dir: str) -> SentenceTransformer:
    for attempt in range(_MAX_RETRIES):
        try:
            log_info(f"Downloading {model_name} (attempt {attempt + 1})")
            m = SentenceTransformer(model_name, cache_folder=cache_dir)
            log_info(f"Downloaded {model_name}")
            return m
        except Exception as e:
            wait = 2 ** attempt
            log_info(f"Failed: {e}. Retrying in {wait}s …")
            time.sleep(wait)
    raise RuntimeError(f"Unable to download embedding model {model_name}")


# ---------------------------------------------------------------------------
#  Classifier implementation
# ---------------------------------------------------------------------------

class IntentClassifierV2:
    """Intent classifier returning the six v2 intents."""

    # -------------------------------
    #  Patterns per intent
    # -------------------------------
    _DSL_CREATE_PATTERNS = [
        r"\b(add|create|generate|insert|build)\b.*(node|component|service|server|database)",
        r"\bstart.*diagram\b",
        r"new\s+(architecture|diagram|design)",
    ]

    _DSL_UPDATE_PATTERNS = [
        r"\b(update|modify|change|remove|delete|connect)\b.*(node|edge|component|connection)",
        r"rename\s+node",
        r"rearrange\s+diagram",
    ]

    _VIEW_TOGGLE_PATTERNS = [
        r"\b(show|switch|toggle)\b.*\b(dfd|data flow|architecture|layers?)\b",
        r"view\s+(dfd|architecture)",
    ]

    _EXPERT_QA_PATTERNS = [
        r"\b(what|how|why|explain|best practices|recommend)\b",
        r"security\s+(implications|risks|controls)",
    ]

    _CLARIFY_PATTERNS = [
        r"\b(clarify|not sure|confused)\b",
        r"\b(what next|help me)\b",
    ]

    _OUT_OF_SCOPE_PATTERNS = [
        r"\b(weather|joke|movie|sports|hello|hi)\b",
    ]

    _PATTERN_TABLE: Dict[IntentV2, List[str]] = {
        IntentV2.DSL_CREATE: _DSL_CREATE_PATTERNS,
        IntentV2.DSL_UPDATE: _DSL_UPDATE_PATTERNS,
        IntentV2.VIEW_TOGGLE: _VIEW_TOGGLE_PATTERNS,
        IntentV2.EXPERT_QA: _EXPERT_QA_PATTERNS,
        IntentV2.CLARIFY: _CLARIFY_PATTERNS,
        IntentV2.OUT_OF_SCOPE: _OUT_OF_SCOPE_PATTERNS,
    }

    # Example sentences per intent – seed for vector search
    _DEFAULT_EXAMPLES: Dict[IntentV2, List[str]] = {
        IntentV2.DSL_CREATE: [
            "Add a web server to the diagram",
            "Create a new PostgreSQL database",
            "Generate the initial architecture diagram",
        ],
        IntentV2.DSL_UPDATE: [
            "Connect the API gateway to the auth service",
            "Remove the old firewall node",
            "Rename web_server_1 to web_frontend",
        ],
        IntentV2.VIEW_TOGGLE: [
            "Switch to DFD view",
            "Show me the data-flow diagram",
            "Toggle architecture view",
        ],
        IntentV2.EXPERT_QA: [
            "What is zero trust?",
            "Explain TLS mutual authentication",
            "Best practices for API security?",
        ],
        IntentV2.CLARIFY: [
            "I'm not sure what to do",
            "Can you clarify?",
            "What should I do next?",
        ],
        IntentV2.OUT_OF_SCOPE: [
            "Tell me a joke",
            "Who won the game yesterday?",
            "What's the weather like?",
        ],
    }

    def __init__(self, model_name: str = _DEFAULT_MODEL, cache_dir: Optional[str] = None):
        self.cache_dir = cache_dir or ML_MODELS_DIR
        Path(self.cache_dir).mkdir(parents=True, exist_ok=True)

        # Authenticate to HF if token provided
        if TRANSFORMER_MODEL_TOKEN:
            login(token=TRANSFORMER_MODEL_TOKEN)

        # Load embedding model with fallback
        self.embedding_model = None
        for candidate in [model_name] + _FALLBACK_MODELS:
            try:
                self.embedding_model = _download_transformer(candidate, self.cache_dir)
                break
            except Exception as e:
                log_info(f"Embedding model {candidate} failed: {e}")
        if self.embedding_model is None:
            raise RuntimeError("No embedding model could be loaded")

        # Build initial example index
        self.examples = self._DEFAULT_EXAMPLES.copy()
        self._build_faiss_index()

        # Lazy LLM gateway to avoid startup penalty when not needed
        self._llm: LLMGatewayV2 | None = LLMGatewayV2() if LLMGatewayV2 else None

    # ------------------------------------------------------------------
    #  Public API
    # ------------------------------------------------------------------

    async def classify(
        self,
        query: str,
        k: int = 3,
        pattern_threshold: float = 0.7,
        vector_threshold: float = 0.6,
    ) -> Tuple[IntentV2, float, str]:
        """Return (intent, confidence, source) for a user query."""
        query_lower = query.lower()

        # 1️⃣  Pattern pass (fast-path)
        intent, confidence = self._pattern_classify(query_lower)
        if confidence >= pattern_threshold:
            return intent, confidence, "pattern"

        # 2️⃣  Vector similarity
        intent_vec, conf_vec = self._vector_classify(query_lower, k=k)
        if conf_vec >= vector_threshold:
            return intent_vec, conf_vec, "vector"

        # 3️⃣  LLM fallback (best-effort)
        if self._llm is not None:
            try:
                intent_llm, conf_llm = await self._llm_classify_llm(query)
                if intent_llm != IntentV2.CLARIFY:
                    return intent_llm, conf_llm, "llm"
            except Exception as e:
                log_info(f"LLM fallback classify failed: {e}")

        # 4️⃣  Default fallback – clarify
        return IntentV2.CLARIFY, 0.4, "fallback"

    # ------------------------------------------------------------------
    #  Internal helpers
    # ------------------------------------------------------------------

    def _pattern_classify(self, text: str) -> Tuple[IntentV2, float]:
        """Regex-based heuristic classification."""
        best_intent = IntentV2.CLARIFY
        best_score = 0.0
        for intent, patterns in self._PATTERN_TABLE.items():
            matches = sum(1 for p in patterns if re.search(p, text, re.IGNORECASE))
            if matches:
                # Normalize by number of patterns to get rough confidence
                score = min(1.0, matches / max(1, len(patterns)))
                if score > best_score:
                    best_intent, best_score = intent, score
        return best_intent, best_score

    def _build_faiss_index(self):
        """Create a FAISS index from example embeddings."""
        corpus = []
        self._intent_lookup: List[IntentV2] = []
        for intent, examples in self.examples.items():
            corpus.extend(examples)
            self._intent_lookup.extend([intent] * len(examples))

        if not corpus:
            self.index = None
            self.embeddings = None
            return

        self.embeddings = self.embedding_model.encode(corpus, normalize_embeddings=True)
        dim = self.embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(self.embeddings)

    def _vector_classify(self, text: str, k: int = 3) -> Tuple[IntentV2, float]:
        if not self.index or self.index.ntotal == 0:
            return IntentV2.CLARIFY, 0.0

        query_emb = self.embedding_model.encode([text], normalize_embeddings=True)
        sims, idx = self.index.search(query_emb, min(k, self.index.ntotal))

        intent_scores: Dict[IntentV2, float] = {}
        for sim, i in zip(sims[0], idx[0]):
            if i < len(self._intent_lookup):
                intent = self._intent_lookup[i]
                intent_scores[intent] = intent_scores.get(intent, 0.0) + float(sim)

        if not intent_scores:
            return IntentV2.CLARIFY, 0.0

        best_intent, best_score = max(intent_scores.items(), key=lambda kv: kv[1])
        total = sum(intent_scores.values()) or 1.0
        confidence = best_score / total
        return best_intent, confidence

    # ------------------------------------------------------------------
    #  LLM fallback helper
    # ------------------------------------------------------------------

    async def _llm_classify_llm(self, query: str) -> Tuple[IntentV2, float]:
        """Ask a small model to choose the best intent label."""
        prompt = (
            "You are a routing assistant. Map the given USER_QUERY to one of the "
            "intent names from the following list exactly: DSL_CREATE, DSL_UPDATE, "
            "VIEW_TOGGLE, EXPERT_QA, CLARIFY, OUT_OF_SCOPE.\n" 
            "Return only a JSON object like {\"intent\": \"...\"}.\n\n" 
            f"USER_QUERY: {query}"
        )

        resp = await self._llm.generate_expert_answer(prompt)  # reuse low-temp settings
        content = (resp.get("content") or "{}").strip()
        import json

        try:
            data = json.loads(content)
            intent_raw = str(data.get("intent", "")).strip().upper()
            intent = IntentV2(intent_raw) if intent_raw in IntentV2.__members__ else IntentV2.CLARIFY
            confidence = 0.8 if intent != IntentV2.CLARIFY else 0.5
            return intent, confidence
        except Exception:
            return IntentV2.CLARIFY, 0.5 