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
### SECURETRACK 2 · Unified Diagram Style Pack ###

GLOBAL
  • Preferred layout     : LEFT-TO-RIGHT architecture flow (enforced by backend D2 + ELK)
  • Output format        : **D2 source only**. NO markdown, no prose.
  • Direction setting    : ALWAYS include "direction: right" at the top level
  • Node id convention   : snake_case, ASCII, ≤ 30 chars.
  • Label length         : ≤ 60 chars, Title Case.
  • Edge style           : plain "a -> b" unless label needed.
  • Avoid               : explicit xy, comments (//), HTML.

CORRECT D2 SYNTAX EXAMPLES WITH LEFT-TO-RIGHT DIRECTION:
  direction: right
  
  web_client: "Web Client"
  api_gateway: "API Gateway" 
  user_database: "User Database"
  auth_service: "Authentication Service"

  web_client -> api_gateway: "HTTPS Request"
  api_gateway -> user_database: "Query Data"

STYLING (with LEFT-TO-RIGHT direction):
  direction: right
  
  client_app: "Client App" {
    shape: rectangle
    style.fill: "#3B82F6"
  }
  
  database: "Database" {
    shape: cylinder
    style.fill: "#F97316"
  }

CRITICAL REQUIREMENTS: 
  ❌ NEVER use: node_id: type "Label"
  ✅ ALWAYS use: node_id: "Label"
  ✅ ALWAYS start D2 code with: "direction: right"
  ✅ MANDATORY: First line must be "direction: right" for left-to-right layout

CATEGORY COLORS (use in style.fill when needed):
  client      #3B82F6   # blue-500
  process     #8B5CF6   # violet-500  
  database    #F97316   # orange-500
  queue       #10B981   # emerald-500
  security    #F43F5E   # rose-500
  external    #64748B   # slate-500

ARCHITECTURAL PATTERNS & EXAMPLES:

🎮 GAME APPLICATION ARCHITECTURE:
  game_client: "Game Client" { style.fill: "#3B82F6" }
  game_server: "Game Server" { style.fill: "#8B5CF6" }
  matchmaking: "Matchmaking Service" { style.fill: "#8B5CF6" }
  realtime_engine: "Real-time Engine" { style.fill: "#8B5CF6" }
  user_auth: "User Authentication" { style.fill: "#F43F5E" }
  player_db: "Player Database" { style.fill: "#F97316" }
  game_db: "Game State DB" { style.fill: "#F97316" }
  leaderboard: "Leaderboard Service" { style.fill: "#8B5CF6" }
  chat_service: "Chat Service" { style.fill: "#8B5CF6" }
  payment_gateway: "Payment Gateway" { style.fill: "#F43F5E" }
  analytics: "Analytics Service" { style.fill: "#8B5CF6" }
  cdn: "CDN Assets" { style.fill: "#64748B" }
  
  game_client -> game_server: "WebSocket"
  game_client -> user_auth: "Login"
  game_server -> game_db: "Game State"
  game_server -> realtime_engine: "Updates"
  matchmaking -> player_db: "Player Data"
  chat_service -> game_server: "Messages"

🌐 WEB APPLICATION ARCHITECTURE:
  web_client: "Web Client" { style.fill: "#3B82F6" }
  load_balancer: "Load Balancer" { style.fill: "#64748B" }
  web_server: "Web Server" { style.fill: "#8B5CF6" }
  api_gateway: "API Gateway" { style.fill: "#8B5CF6" }
  auth_service: "Auth Service" { style.fill: "#F43F5E" }
  app_server: "Application Server" { style.fill: "#8B5CF6" }
  database: "Database" { style.fill: "#F97316" }
  cache: "Redis Cache" { style.fill: "#10B981" }
  cdn: "CDN" { style.fill: "#64748B" }
  
  web_client -> load_balancer
  load_balancer -> web_server
  web_server -> api_gateway
  api_gateway -> auth_service
  api_gateway -> app_server
  app_server -> database
  app_server -> cache

🛍️ E-COMMERCE ARCHITECTURE:
  customer_app: "Customer App" { style.fill: "#3B82F6" }
  admin_panel: "Admin Panel" { style.fill: "#3B82F6" }
  api_gateway: "API Gateway" { style.fill: "#8B5CF6" }
  user_service: "User Service" { style.fill: "#8B5CF6" }
  product_service: "Product Service" { style.fill: "#8B5CF6" }
  order_service: "Order Service" { style.fill: "#8B5CF6" }
  payment_service: "Payment Service" { style.fill: "#F43F5E" }
  inventory_service: "Inventory Service" { style.fill: "#8B5CF6" }
  notification_service: "Notification Service" { style.fill: "#8B5CF6" }
  user_db: "User Database" { style.fill: "#F97316" }
  product_db: "Product Database" { style.fill: "#F97316" }
  order_db: "Order Database" { style.fill: "#F97316" }
  message_queue: "Message Queue" { style.fill: "#10B981" }
  
  customer_app -> api_gateway
  admin_panel -> api_gateway
  api_gateway -> user_service
  api_gateway -> product_service
  api_gateway -> order_service
  order_service -> payment_service
  order_service -> inventory_service
  payment_service -> notification_service

🤖 AI/ML APPLICATION ARCHITECTURE:
  user_interface: "User Interface" { style.fill: "#3B82F6" }
  api_gateway: "API Gateway" { style.fill: "#8B5CF6" }
  ml_service: "ML Service" { style.fill: "#8B5CF6" }
  data_pipeline: "Data Pipeline" { style.fill: "#8B5CF6" }
  model_registry: "Model Registry" { style.fill: "#8B5CF6" }
  vector_db: "Vector Database" { style.fill: "#F97316" }
  training_data: "Training Data Store" { style.fill: "#F97316" }
  llm_service: "LLM Service" { style.fill: "#8B5CF6" }
  monitoring: "ML Monitoring" { style.fill: "#8B5CF6" }
  feature_store: "Feature Store" { style.fill: "#F97316" }
  
  user_interface -> api_gateway
  api_gateway -> ml_service
  ml_service -> vector_db
  ml_service -> llm_service
  data_pipeline -> training_data
  data_pipeline -> feature_store
  model_registry -> ml_service

MICROSERVICES PATTERNS:
  • Always include: API Gateway, Service Discovery, Load Balancer
  • Data patterns: Database per service, Event sourcing, CQRS
  • Communication: Async messaging, Event bus, Service mesh
  • Observability: Logging, Metrics, Tracing, Health checks
  • Security: Auth service, API keys, Circuit breakers

SECURITY PATTERNS:
  • Authentication: OAuth, JWT, Multi-factor
  • Authorization: RBAC, ABAC, Policy engine
  • Network: Firewall, WAF, VPN, Zero-trust
  • Data: Encryption at rest/transit, Secrets management
  • Monitoring: SIEM, Anomaly detection, Audit logs

COMPLEX AI PATTERNS  (use when user asks for RAG / vector search / LLM)
  • "rag_pipeline" cluster → { ingest → vector_store → retriever → llm }
  • vector_store: "Vector Database"
  • llm nodes: openai_llm: "OpenAI GPT", claude_llm: "Claude AI"

ARCHITECTURE PRINCIPLES:
  • Be COMPREHENSIVE: Include all necessary components for the application type
  • Think HOLISTICALLY: Consider data flow, security, scalability, monitoring
  • Add DEPTH: Include supporting services like auth, logging, monitoring, caching
  • Consider SCALE: Add load balancers, CDNs, caching layers
  • Think SECURITY: Include firewalls, auth services, encryption points
  • Plan DATA: Include appropriate database types, caching, message queues
  
  # ==== Advanced AI & Cloud Patterns ====
  ADVANCED AI/CLOUD PATTERNS:
  • AI Workflow: rag_ingest: "RAG Ingest" { style.fill: "#8B5CF6" } -> vector_db: "Vector DB" { shape: cylinder; style.fill: "#F97316" } -> retriever: "Retriever" -> llm_chain: "LLM Chain" { style.fill: "#8B5CF6" }
  • AI Agents: agent_orchestrator: "Agent Orchestrator" -> tool_registry: "Tool Registry" -> memory_store: "Memory Store" { shape: cylinder }
    agent_orchestrator -> external_api: "External Tools" { style.dashed: true }
  • MCP (Model Context Protocol): context_manager: "Context Manager" { style.fill: "#10B981" } -> llm_endpoint: "LLM Endpoint"
  • A2A Collaboration: agent1: "Agent 1" <-> agent2: "Agent 2": "Bidirectional Comm" { style.animated: true }
  • Hybrid Cloud: multi_cloud_gateway: "Multi-Cloud Gateway" -> aws_cluster: "AWS Cluster" { style.fill: "#F97316" } -> gcp_cluster: "GCP Cluster" { style.fill: "#3B82F6" }
    service_mesh: "Istio Mesh" {
      aws_cluster
      gcp_cluster
    }
  • Serverless: api_gateway -> lambda_function: "Lambda" { style.fill: "#F43F5E" } -> event_bridge: "Event Bridge" -> dynamodb: "DynamoDB"
  • Edge AI: cdn_edge: "CDN Edge" { style.fill: "#64748B" } -> ml_inference: "ML Inference at Edge" { style.fill: "#8B5CF6" }

  # Enforce consistency for advanced patterns
  ENFORCE CONSISTENCY: Always "direction: right"; cluster related nodes (e.g., {{ security_zone: {{ firewall -> auth_service }} }}); use dashed for optional edges.

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
            else:
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
• Add security components: firewalls, auth services, encryption
• Consider scalability: load balancers, CDNs, microservices
• Include data flow with meaningful edge labels
• Use proper D2 syntax with colors and styling
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