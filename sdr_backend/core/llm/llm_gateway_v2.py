from __future__ import annotations

"""core/llm/llm_gateway_v2.py

A thin facade on top of *llm_gateway_v1.LLMService* that exposes just
what Design-Service v2 needs:

• generate_d2_dsl()  – returns pure DSL text (no streaming)
• generate_expert_answer() – returns markdown / text expert answer

The helper chooses a model provider & name based on prompt length to
balance cost vs capability.
"""

from typing import Any, Dict, Tuple

from utils.logger import log_info
from core.llm.llm_gateway_v1 import LLMService


class LLMGatewayV2:
    """Facade providing high-level helpers for v2 service layer."""

    # Simple heuristic thresholds
    _SHORT_PROMPT_TOKENS = 800
    _LONG_PROMPT_TOKENS = 2000

    def __init__(self) -> None:
        self._llm = LLMService()

    # ------------------------------------------------------------------
    #  Public helpers
    # ------------------------------------------------------------------

    async def generate_d2_dsl(self, prompt: str, timeout: int = 120) -> Dict[str, Any]:
        """Generate pure D2 DSL for CREATE / UPDATE intents."""
        provider, model = self._select_model(prompt)
        log_info(f"[LLM-v2] generate_d2_dsl using {provider}:{model}")
        return await self._llm.generate_llm_response(
            prompt=prompt,
            model_provider=provider,
            model_name=model,
            temperature=0.2,            # deterministic
            max_tokens=4096,
            stream=False,
            timeout=timeout,
        )

    async def generate_expert_answer(self, prompt: str, timeout: int = 60) -> Dict[str, Any]:
        """Generate rich expert Q&A answer."""
        provider, model = self._select_model(prompt, purpose="expert")
        log_info(f"[LLM-v2] generate_expert_answer using {provider}:{model}")
        return await self._llm.generate_llm_response(
            prompt=prompt,
            model_provider=provider,
            model_name=model,
            temperature=0.4,
            max_tokens=2048,
            stream=False,
            timeout=timeout,
        )

    # ------------------------------------------------------------------
    #  Internal routing logic
    # ------------------------------------------------------------------

    def _select_model(self, prompt: str, purpose: str = "dsl") -> Tuple[str, str]:
        """Very simple cost/capability router.

        * Short prompts → cheaper OpenAI GPT-4o-mini.
        * Medium → OpenAI GPT-4o.
        * Long / complex → Anthropic Claude-4-Sonnet.
        """
        tokens = len(prompt.split())
        if tokens < self._SHORT_PROMPT_TOKENS:
            return "openai", "gpt-4.1-mini"
        if tokens < self._LONG_PROMPT_TOKENS:
            return "openai", "gpt-4.1"
        return "anthropic", "claude-4-sonnet" 