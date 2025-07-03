# services/report_handler.py

from core.llm.llm_gateway_v1 import LLMService
from core.prompt_engineering.prompt_builder import PromptBuilder
from services.response_processor import ResponseProcessor
from core.cache.session_manager import SessionManager

from services.feedback_handler import ResponseLearningService

# Models
from models.threat_models import ThreatsResponse
from models.report_models import ReportSection

from services.threat_modeling_service import ThreatModelingService
from services.supabase_manager import SupabaseManager
from collections import defaultdict
import asyncio
import json, re



llm_service = LLMService()
prompt_builder = PromptBuilder()
response_processor = ResponseProcessor()
session_manager = SessionManager()
response_learning = ResponseLearningService()
threat_modeling_service = ThreatModelingService()
supabase_manager = SupabaseManager()


class ReportsHandler:
    def __init__(self, llm_service: LLMService):
        self.llm = llm_service

    async def _humanise_attack_vectors(self, threats: ThreatsResponse) -> str:
        """
        Create a short, executive-friendly narrative that groups threats by
        their primary attack vector (SQL-Injection, Phishing, Lateral-Movement …).

        › Assumptions  
        • Each ThreatItem may have `properties["attack_vector"]`
            (if not present we fall back to "Other").  
        • We don't want to exceed ~300 words.

        Returns
        -------
        Markdown string suitable for the report section.
        """
        buckets: dict[str, list[str]] = defaultdict(list)

        for t in threats.threats:
            # Access ThreatItem properties properly
            properties = t.properties or {}
            vector = (
                properties.get("attack_vector")
                or properties.get("vector")
                or "Other"
            ).title()
            buckets[vector].append(f"- **{t.id}** – {t.description}")

        # Build markdown
        pieces: list[str] = []
        for vector, items in buckets.items():
            pieces.append(f"### {vector}\n" + "\n".join(items[:6]))   # cap per vector
        return "\n\n".join(pieces) if pieces else "_No attack vectors identified._"

    def _process_system_architecture_content(self, content: str, diagram_url: str = None) -> str:
        """
        Process the System Design Architecture section content to handle diagram placeholders
        """
        if not diagram_url:
            # If no diagram URL, provide a clean placeholder text
            content = content.replace("![System architecture diagram]({diagram_url})", "")
            content = content.replace("{diagram_url}", "")
            content = content.replace("_Diagram captured automatically from the modelling canvas._", 
                                    "_The system architecture diagram will be displayed above this section._")
        else:
            # Replace placeholder with actual URL (frontend will handle display)
            content = content.replace("{diagram_url}", diagram_url)
        
        return content.strip()

    async def build(
        self,
        project: dict,
        diagram_state: dict,
        threat_summary: ThreatsResponse,
        data_flow_description: str,
        diagram_url: str = None
    ) -> list[ReportSection]:
        """Returns a list[ReportSection] ready for FE"""

        # 1) Project Description (use Claude/OpenAI for a structured summary)
        desc_prompt = (
            "Create a structured executive summary for the following architecture in markdown format. "
            "Format it with:\n"
            "- A brief overview paragraph (2-3 sentences)\n"
            "- Key Components section with bullet points\n"
            "- Security Considerations section with bullet points\n"
            "- Architecture Benefits section with bullet points\n"
            "Keep it concise (<=200 words total) and use **bold** for important terms.\n\n"
            f"Architecture Description:\n{data_flow_description}"
        )
        desc = (await self.llm.generate_llm_response(
            prompt=desc_prompt,
            model_provider="openai",
            model_name="gpt-4.1-mini",  # cheaper & fast, sufficient for summary
            temperature=0.3,
            max_tokens=400,
        ))["content"].strip()

        # 2) System Design Architecture - only image display (no content text)
        arch_content = ""

        # 3) Data‐Flow Diagram – optional, reuse your DFD generator if present
        dfd_text = "DFD not generated for this project."  # default
        # (call your /switch_to_dfd logic if available…)

        # 4) Entry Point – left intentionally blank for now
        entry_point_text = "_Entry point analysis to be completed._"

        # 5) Model Attack Possibilities
        attack_possibilities = await self._humanise_attack_vectors(threat_summary)

        # 6-8) Risk sections – create separate sections for each risk level
        high, med, low = [], [], []
        for t in threat_summary.threats:
            blob = (
                f"**Risk:** {t.id}\n\n"
                f"**Description:** {t.description}\n\n"
                f"**Mitigation:** {t.mitigation}\n\n"
            )
            severity = (t.severity or "MEDIUM").upper()
            match severity:
                case "HIGH":   high.append(blob)
                case "MEDIUM": med.append(blob)
                case _:        low.append(blob)

        # Create separate content for each risk level
        high_risks_content = "This section contains high-severity security risks that require immediate attention and remediation.\n\n"
        if high:
            high_risks_content += "\n\n".join(high)
        else:
            high_risks_content += "_No high-severity risks identified in this architecture._"
        
        medium_risks_content = "This section contains medium-severity security risks that should be addressed in your security roadmap.\n\n"
        if med:
            medium_risks_content += "\n\n".join(med)
        else:
            medium_risks_content += "_No medium-severity risks identified in this architecture._"
        
        low_risks_content = "This section contains low-severity security risks that can be addressed as part of security enhancements.\n\n"
        if low:
            low_risks_content += "\n\n".join(low)
        else:
            low_risks_content += "_No low-severity risks identified in this architecture._"

        # Create the main Key Risk Areas section with subsections
        key_risk_areas_content = "This section provides a comprehensive overview of identified security risks, categorized by severity level.\n\n"
        
        return [
            ReportSection(title="Project Description",          content=desc),
            ReportSection(title="System Design Architecture",   content=arch_content),
            ReportSection(title="Data Flow Diagram",            content=dfd_text),
            ReportSection(title="Entry Point",                  content=entry_point_text),
            ReportSection(title="Model Attack Possibilities",   content=attack_possibilities),
            ReportSection(title="Key Risk Areas",               content=key_risk_areas_content),
            ReportSection(title="High Risks",                   content=high_risks_content),
            ReportSection(title="Medium Risks",                 content=medium_risks_content),
            ReportSection(title="Low Risks",                    content=low_risks_content),
        ]

# -------------------------------------------------------------
# Utility helpers – exported for re-use by API route(s)
# -------------------------------------------------------------

LOCK_TTL_SEC = 600  # 10 minutes


async def acquire_report_lock(session_mgr: SessionManager, lock_key: str, ttl: int = LOCK_TTL_SEC) -> bool:
    """Acquire a short-lived Redis lock; returns True if lock obtained."""
    if not session_mgr.redis_pool:
        await session_mgr.connect()

    if not session_mgr.redis_pool:
        return True  # Redis unavailable – continue without locking

    return bool(await session_mgr.redis_pool.set(lock_key, "1", ex=ttl, nx=True))


async def release_report_lock(session_mgr: SessionManager, lock_key: str, lock_acquired: bool):
    """Release previously obtained Redis lock."""
    if lock_acquired and session_mgr.redis_pool:
        try:
            await session_mgr.redis_pool.delete(lock_key)
        except Exception:
            pass


async def generate_threats_from_description(
    diagram_state: dict,
    data_flow_description: str,
    *,
    session_id: str | None = None,
    llm: LLMService | None = None,
    session_mgr: SessionManager | None = None,
) -> ThreatsResponse:
    """Generate `ThreatsResponse` from an existing data-flow narrative without re-running
    the expensive `analyze_diagram` step.
    """

    llm = llm or llm_service
    session_mgr = session_mgr or session_manager

    conversation_history = []
    if session_id and session_mgr:
        try:
            if not session_mgr.redis_pool:
                await session_mgr.connect()
            session_data = await session_mgr.get_session(session_id=session_id)
            if session_data:
                conversation_history = session_data.get("conversation_history", [])
        except Exception:
            pass

    threat_prompt = await prompt_builder.build_threat_prompt(
        conversation_history,
        diagram_state,
        data_flow_description,
    )

    threat_response = await llm.generate_llm_response(
        prompt=threat_prompt,
        model_provider="openai",
        model_name="gpt-4.1",
        temperature=0.3,
        stream=False,
        timeout=90,
    )

    threat_json: dict[str, any] = {}
    if isinstance(threat_response, dict) and "content" in threat_response:
        content = threat_response["content"]
        try:
            match = re.search(r"```(?:json)?\s*(.*?)\s*```", content, re.DOTALL)
            threat_json = json.loads(match.group(1) if match else content)
        except Exception:
            threat_json = {"threats": [], "severity_counts": {"HIGH": 0, "MEDIUM": 0, "LOW": 0}}

    severity_counts = threat_json.get("severity_counts", {"HIGH": 0, "MEDIUM": 0, "LOW": 0})
    threat_items = threat_json.get("threats", [])

    return ThreatsResponse(severity_counts=severity_counts, threats=threat_items)
