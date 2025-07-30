from __future__ import annotations

"""core/prompt_engineering/prompt_builder_v2.py

Prompt construction logic for Design-Service *v2*.
Enhanced with unified style pack for robustness and efficiency.
Uses dedicated prompts for DSL creation/mutation and expert Q&A.
"""

from typing import Any, Dict, List, Optional
from textwrap import dedent
from datetime import datetime

from models.response_models_v2 import IntentV2
from utils.logger import log_info

# Enhanced Style Pack for consistent D2 diagram generation
STYLE_PACK = """
### SECURETRACK · Provider-Agnostic Diagram Style Pack ###

GLOBAL
  • Preferred layout     : LEFT-TO-RIGHT architecture flow (enforced by backend D2 + ELK)
  • Output format        : **D2 source only** – NO markdown, no prose.
  • Direction setting    : ALWAYS include "direction: right" at the very top.
  • Node-id convention   : snake_case, ASCII only, ≤ 50 chars. Use the *token* from the service dictionary when possible.
  • Label convention     : Use the *display_name* exactly as given in the service dictionary.
  • Edge style           : plain "a -> b"; add edge labels only when it improves clarity.
  • Avoid                : comments (//), HTML, explicit xy coordinates, **ANY style.* or color directives**, shape overrides.

CRITICAL REQUIREMENTS:
  ❌ NEVER use: node_id: type "Label"
  ✅ ALWAYS use: node_id: "Label"
  ✅ FIRST LINE **must** be "direction: right" for left-to-right layout.

ARCHITECTURAL PATTERNS & EXAMPLES (colourless):
  direction: right
  
  web_client: "Web Client"
  api_gateway: "API Gateway" 
  user_database: "User Database"
  auth_service: "Authentication Service"

  web_client -> api_gateway: "HTTPS Request"
  api_gateway -> user_database: "Query Data"

# Colour and shape styling are handled entirely by the front-end based on node.kind/layerIndex.

### END STYLE PACK ###
"""


class PromptBuilderV2:
    """Generate enhanced LLM prompts for the v2 design service with unified style pack."""

    # ------------------------------------------------------------------
    #  Public entry point
    # ------------------------------------------------------------------

    async def build_prompt_by_intent(
        self,
        intent: IntentV2,
        query: str,
        conversation_history: List[Dict[str, Any]] | None = None,
        current_dsl: str | None = None,
    ) -> str:
        if intent in (IntentV2.DSL_CREATE, IntentV2.DSL_UPDATE):
            if intent == IntentV2.DSL_CREATE:
                return await self.build_dsl_create_prompt(query, conversation_history or [])
            elif intent == IntentV2.DSL_UPDATE:
                return await self.build_dsl_update_prompt(
                    query, conversation_history or [], current_dsl or ""
                )
        elif intent == IntentV2.EXPERT_QA:
            return await self.build_expert_prompt(query, conversation_history or [])
        # CLARIFY / OUT_OF_SCOPE handled upstream – return empty string to avoid LLM call
        return ""

    # ------------------------------------------------------------------
    #  Enhanced builders with Style Pack
    # ------------------------------------------------------------------

    async def build_dsl_create_prompt(
        self,
        query: str,
        conversation_history: List[Dict[str, Any]],
    ) -> str:
        """Enhanced prompt for building a *new* diagram in D2 DSL with style pack."""
        history_txt = self._format_conversation_history(conversation_history)
        
        prompt = f"""{STYLE_PACK}

### TASK ###
Create a COMPREHENSIVE architecture diagram based on the USER REQUEST below.

CRITICAL REQUIREMENTS:
• MANDATORY FIRST LINE: Start D2 code with "direction: right" for left-to-right layout
• Generate a COMPLETE, PRODUCTION-READY architecture (not just a single node)
• Include ALL necessary components for the application type
• Follow the architectural patterns and examples in the Style Pack above
• Include supporting services: authentication, databases, caching, monitoring
• Use 'Microservice' suffix instead of simple 'Service' for internal business-logic components (e.g., 'Payment Microservice', 'Auth Microservice')
• Add security components: firewalls, auth services, encryption
• Consider scalability: load balancers, CDNs, microservices
• Include data flow with meaningful edge labels
• Use proper D2 syntax with no style.* directives (color handled in front-end)
• ENFORCE HORIZONTAL FLOW: Always begin with "direction: right"

ARCHITECTURE MAPPING GUIDE:
• "game app" → Use GAME APPLICATION ARCHITECTURE pattern
• "web app" → Use WEB APPLICATION ARCHITECTURE pattern  
• "e-commerce" → Use E-COMMERCE ARCHITECTURE pattern
• "AI/ML app" → Use AI/ML APPLICATION ARCHITECTURE pattern
• "microservices" → Apply MICROSERVICES PATTERNS
• Always add security, monitoring, and data management components

### CONTEXT (latest ≤ 5 messages) ###
{history_txt}

### USER REQUEST ###
{query}

### OUTPUT ###
Complete D2 architecture diagram code only. No markdown, no prose, no comments.
"""
        log_info("Generated enhanced DSL_CREATE prompt (v2)")
        return prompt

    async def build_dsl_update_prompt(
        self,
        query: str,
        conversation_history: List[Dict[str, Any]],
        current_dsl: str,
    ) -> str:
        """Enhanced prompt for mutating an *existing* diagram via D2 with style pack."""
        history_txt = self._format_conversation_history(conversation_history)
        
        prompt = f"""{STYLE_PACK}

### CURRENT DIAGRAM (read-only) ###
```d2
{current_dsl}
```

### TASK ###
Update the diagram so it fulfils the USER REQUEST.
• MANDATORY: Start updated D2 code with "direction: right" for left-to-right layout
• Keep existing node ids stable where possible.
• Remove obsolete components if the request implies it.
• Follow Style Pack for any new nodes.
• PRESERVE HORIZONTAL FLOW: Ensure "direction: right" is the first line

### CONTEXT (latest ≤ 5 messages) ###
{history_txt}

### USER REQUEST ###
{query}

### OUTPUT ###
Updated D2 code only – no diff, no prose.
"""
        log_info("Generated enhanced DSL_UPDATE prompt (v2)")
        return prompt

    async def build_expert_prompt(
        self, query: str, conversation_history: List[Dict[str, Any]]
    ) -> str:
        """Enhanced expert prompt for Q&A with security focus."""
        history_txt = self._format_conversation_history(conversation_history)
        prompt = dedent(
            f"""
            You are *Guardian AI*, an expert in secure cloud architecture and cybersecurity.
            Provide a concise, technically accurate answer to the question below.
            
            GUIDELINES:
            • Focus on security best practices and real-world implementation
            • Include relevant standards (OWASP, NIST, ISO 27001) where applicable
            • Provide actionable insights, not just theory
            • Use clear, professional language
            • Format lists and code snippets in markdown when helpful

            ### CONTEXT (latest ≤ 5 messages) ###
            {history_txt}

            ### QUESTION ###
            {query}

            ### RESPONSE ###
            """
        )
        log_info("Generated enhanced EXPERT_QA prompt (v2)")
        return prompt

    # ------------------------------------------------------------------
    #  Utility helpers
    # ------------------------------------------------------------------

    def _format_conversation_history(self, history: List[Dict[str, Any]]) -> str:
        """Format conversation history with improved readability."""
        if not history:
            return "- none -"

        lines: List[str] = []
        for h in history[-5:]:  # last 5 exchanges
            role = h.get("role") or ("assistant" if h.get("response") else "user")
            content = (
                h.get("content")
                or h.get("query")
                or h.get("response", {}).get("message", "")
            )
            ts = h.get("timestamp") or datetime.utcnow().isoformat()
            # Clean and truncate content for better prompt efficiency
            clean_content = content.strip().replace('\n', ' ')[:100]
            lines.append(f"[{role}] {ts[:19]} – {clean_content}")
        return "\n".join(lines)

    # --------------------------------------------------------------
    #  Enhanced conversational diagram explanations
    # --------------------------------------------------------------

    async def build_create_explanation(
        self,
        dsl_text: str,
        reactflow_json: Dict[str, Any],
        user_query: str,
    ) -> str:
        """Enhanced explanation for a *new* diagram with security focus."""
        return dedent(
            f"""
            You are *Guardian AI*, a friendly senior security architect.

            I have created a new security-focused architecture diagram based on your request.

            GENERATED DIAGRAM:
            ```d2
            {dsl_text}
            ```

            INSTRUCTIONS:
            • Speak in first-person ("I have created...")
            • Highlight key security components and their protective roles
            • Briefly explain the main data flows and security boundaries
            • Mention any security best practices implemented
            • Keep response to 2-4 sentences, conversational tone
            • NO code blocks or markdown fences in output

            USER'S ORIGINAL REQUEST: {user_query}
            """
        )

    async def build_update_explanation(
        self,
        old_dsl: str,
        new_dsl: str,
        reactflow_json: Dict[str, Any],
        user_query: str,
    ) -> str:
        """Enhanced explanation highlighting security-focused changes."""
        return dedent(
            f"""
            You are *Guardian AI*, a friendly senior security architect.

            I have updated the architecture diagram to address your request.

            PREVIOUS DIAGRAM:
            ```d2
            {old_dsl}
            ```

            UPDATED DIAGRAM:
            ```d2
            {new_dsl}
            ```

            INSTRUCTIONS:
            • Speak in first-person ("I have updated...")
            • Highlight specific changes: additions, removals, modifications
            • Explain how changes improve security posture
            • Connect changes to the user's request
            • Keep response to 2-4 sentences, conversational tone
            • NO code blocks or markdown fences in output

            USER'S UPDATE REQUEST: {user_query}
            """
        )

    # --------------------------------------------------------------
    #  Additional utility methods for enhanced functionality
    # --------------------------------------------------------------

    def get_style_pack_info(self) -> str:
        """Return the current style pack for debugging/info purposes."""
        return STYLE_PACK

    def validate_node_id(self, node_id: str) -> bool:
        """Validate node ID against style pack conventions."""
        return (
            len(node_id) <= 30 and
            node_id.replace('_', '').isalnum() and
            node_id.islower() and
            node_id.isascii()
        )

    def validate_label_length(self, label: str) -> bool:
        """Validate label length against style pack guidelines."""
        return len(label) <= 60 