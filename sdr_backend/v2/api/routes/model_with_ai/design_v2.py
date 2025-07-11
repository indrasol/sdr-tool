from __future__ import annotations

"""FastAPI route for Design-Service v2 (Phase-5).

POST /v2/design/generate
------------------------
Takes NL query + projectId, classifies intent via IntentClassifierV2 and
routes accordingly.

This is an MVP implementation – DSL parsing/layout are placeholders that
already hook into the new helpers, so the rest of the stack can be
developed incrementally.
"""

import asyncio
from typing import Any, Dict
from datetime import datetime
from utils.logger import log_info

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from services.auth_handler import verify_token

# v2 helpers
from models.request_models_v2 import DesignGenerateRequestV2
from models.response_models_v2 import (
    IntentV2,
    DSLResponse,
    DSLResponsePayload,
    ExpertQAResponse,
    ClarifyResponse,
    OutOfScopeResponse,
    ViewToggleResponse,
    DesignGenerateResponseV2,
)

from core.intent_classification.intent_classifier_v2 import IntentClassifierV2
from core.prompt_engineering.prompt_builder_v2 import PromptBuilderV2
from core.llm.llm_gateway_v2 import LLMGatewayV2
from core.dsl.parser_d2_lang import D2LangParser
from core.dsl.validators import DiagramValidator
from core.dsl.enhanced_layout_engine_v3 import EnhancedLayoutEngineV3, LayoutEngine, LayoutDirection
from core.dsl.dsl_versioning_v2 import DSLVersioningV2
from core.dsl.dsl_types import DSLDiagram

# Existing session + DB utilities (temporary until Phase-6)
from core.cache.session_manager_v2 import SessionManagerV2
from services.supabase_manager import SupabaseManager

# Database session factory
from core.db.async_session import async_session_factory

router = APIRouter()

# Singletons
_classifier = IntentClassifierV2()
_builder = PromptBuilderV2()
_llm = LLMGatewayV2()
_parser = D2LangParser()
_validator = DiagramValidator()
_layout = EnhancedLayoutEngineV3()
_versioning = DSLVersioningV2()
_session_mgr = SessionManagerV2()
_supabase = SupabaseManager()

# ---------------------------------------------------------------------------
#  Utility – convert canonical DSLDiagram → React-Flow JSON
# ---------------------------------------------------------------------------

def _dsl_to_reactflow(diagram: DSLDiagram):
    """Return React-Flow compatible dict {nodes, edges} with robust data validation."""
    rf_nodes = []
    for n in diagram.nodes:
        # Use top-level position fields (new robust structure)
        pos_x = float(n.x) if hasattr(n, 'x') else 0.0
        pos_y = float(n.y) if hasattr(n, 'y') else 0.0
        width = float(n.width) if hasattr(n, 'width') else 172.0
        height = float(n.height) if hasattr(n, 'height') else 36.0
        
        # Clean and validate label (already validated by DiagramValidator)
        label = str(n.label).strip() if n.label else n.id
        
        # Build clean data payload
        data = {
            "label": label,
            "nodeType": n.type or "default", 
            "description": str(n.properties.get("description", "")).strip()[:500] if n.properties.get("description") else "",
            "validated": True,
            "source": "backend"
        }
        
        # Handle iconifyId (prefer top-level field, fallback to properties)
        iconify_id = n.iconifyId if hasattr(n, 'iconifyId') and n.iconifyId else n.properties.get("iconifyId")
        
        if not iconify_id:
            # Use enhanced iconify registry for comprehensive icon resolution
            from core.dsl.enhanced_iconify_registry import resolve_icon
            
            # Extract provider and technology context from node properties if available
            provider = n.properties.get("provider") or n.properties.get("cloud_provider")
            technology = n.properties.get("technology") or n.properties.get("tech_stack")
            
            # Resolve icon using smart resolution
            iconify_id = resolve_icon(n.type or "default", provider=provider, technology=technology)
            
            # Log icon assignment for debugging
            log_info(f"V2: Icon assignment for node {n.id} ({n.type or 'default'}): {iconify_id}")
        
        data["iconifyId"] = iconify_id

        # Node type validation
        node_type = n.properties.get("shape", "default")
        if node_type not in ["default", "comment", "layerGroup"]:
            node_type = "default"

        rf_nodes.append({
            "id": n.id,
            "type": node_type,
            "data": data,
            "position": {"x": pos_x, "y": pos_y},
            "width": width,
            "height": height
        })

    rf_edges = []
    for e in diagram.edges:
        rf_edges.append({
            "id": e.id,
            "source": e.source,
            "target": e.target,
            "label": str(e.label).strip() if e.label else "",
            "type": "smoothstep"
        })

    return {"nodes": rf_nodes, "edges": rf_edges}

@router.post("/generate", response_model=DesignGenerateResponseV2)
async def design_generate(
    request: DesignGenerateRequestV2,
    current_user: dict = Depends(verify_token),
):
    """Main entry for v2 design generation."""
    user_id = current_user["id"]
    project_code = request.project_id

    # ------------------------------------------------------------------
    #  Input validation – length & simple profanity filter
    # ------------------------------------------------------------------
    MAX_QUERY_LEN = 512
    PROFANE_WORDS = {"fuck", "shit", "bitch", "asshole"}

    if len(request.query) > MAX_QUERY_LEN:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "QUERY_TOO_LONG",
                "message": f"Query exceeds maximum length of {MAX_QUERY_LEN} characters.",
            },
        )

    lower_query = request.query.lower()
    if any(word in lower_query for word in PROFANE_WORDS):
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "PROFANITY_DETECTED",
                "message": "Please rephrase your request.",
            },
        )

    # Session context – lightweight v2 manager
    session_id = request.session_id or await _session_mgr.create_session(project_code)

    session_data = await _session_mgr.get_session(session_id) or {}
    conversation_history: list = []

    # Classify intent
    intent, confidence, source = await _classifier.classify(request.query)

    # Branch handling
    if intent in (IntentV2.DSL_CREATE, IntentV2.DSL_UPDATE):
        # Retrieve current diagram_state from Supabase (if any)
        current_dsl = ""
        rendered_json: Dict[str, Any] | None = None
        try:
            proj = await _supabase.get_project_data(user_id, project_code)
            rendered_json = proj.get("diagram_state") or {"nodes": [], "edges": []}
            conversation_history = proj.get("conversation_history") or []
        except Exception:
            rendered_json = {"nodes": [], "edges": []}

        # Fetch the latest stored DSL from Postgres to provide context for updates
        if intent == IntentV2.DSL_UPDATE:
            async with async_session_factory() as _db:
                latest = await _versioning.fetch_latest_dsl_async(_db, project_code)
                current_dsl = latest or ""

        # Build prompt
        prompt = await _builder.build_prompt_by_intent(intent, request.query, conversation_history, current_dsl)

        # Call LLM to get DSL text
        llm_resp = await _llm.generate_d2_dsl(prompt)
        dsl_text = llm_resp.get("content", "")
        
        if not dsl_text.strip():
            raise HTTPException(
                status_code=422,
                detail={
                    "error_code": "EMPTY_LLM_RESPONSE",
                    "message": "LLM returned empty DSL content",
                },
            )
        
        log_info(f"Generated D2 DSL ({len(dsl_text)} chars)")

        try:
            # Parse DSL using robust parser (includes validation and error handling)
            diagram = _parser.parse(dsl_text)
            
            # Additional validation using our robust validator
            is_valid, validation_errors = _validator.validate(diagram)
            if not is_valid:
                log_info(f"Diagram validation failed: {validation_errors}")
                raise HTTPException(
                    status_code=422,
                    detail={
                        "error_code": "DIAGRAM_VALIDATION_FAILED",
                        "errors": validation_errors,
                    },
                )
            
            # Apply layout with enhanced engine
            layout_result = _layout.layout(
                diagram, 
                direction=LayoutDirection.LEFT_TO_RIGHT,
                preferred_engine=LayoutEngine.AUTO
            )
            diagram = layout_result.diagram
            
            # Log layout performance metrics
            log_info(f"Layout completed: engine={layout_result.engine_used.value}, "
                    f"time={layout_result.execution_time:.3f}s, "
                    f"quality={layout_result.quality_score:.2f}, "
                    f"success={layout_result.success}")
            
            log_info(f"Successfully parsed and validated diagram: {len(diagram.nodes)} nodes, {len(diagram.edges)} edges")
            
        except ValueError as e:
            # Handle parser errors (timeout, compilation failure, etc.)
            log_info(f"DSL parsing failed: {e}")
            raise HTTPException(
                status_code=422,
                detail={
                    "error_code": "DSL_PARSING_FAILED",
                    "message": str(e),
                },
            )

        # Convert to React-Flow format
        diagram_json = _dsl_to_reactflow(diagram)
        
        # ------------------------------------------------------------------
        #  Generate human-readable explanation (conversational)
        # ------------------------------------------------------------------

        human_msg = "Diagram updated."
        try:
            if intent == IntentV2.DSL_CREATE:
                explain_prompt = await _builder.build_create_explanation(
                    dsl_text, diagram_json, request.query
                )
            else:  # DSL_UPDATE
                explain_prompt = await _builder.build_update_explanation(
                    current_dsl or "", dsl_text, diagram_json, request.query
                )

            explain_resp = await _llm.generate_expert_answer(explain_prompt)
            human_msg = (explain_resp.get("content", "") or "Diagram updated.").strip()
            if not human_msg:
                human_msg = "I have updated the diagram."  # graceful degradation
        except Exception as _e:  # noqa: E501 – fallback on any LLM failure without breaking flow
            human_msg = "I have updated the diagram."  # graceful degradation

        # Ensure first-person tone
        if human_msg.lower().startswith("you "):
            human_msg = "I" + human_msg[3:]

        # --------------------------------------------------------------
        #  Extract pinned nodes (ids where data.pinned === true)
        # --------------------------------------------------------------
        pinned_nodes: list[str] = []
        try:
            for n in diagram_json.get("nodes", []):
                if n.get("data", {}).get("pinned"):
                    pinned_nodes.append(n.get("id"))
        except Exception:
            pinned_nodes = []

        # ---- update conversation history ----
        now_iso = datetime.utcnow().isoformat()
        conversation_entry_user = {
            "role": "user",
            "content": request.query,
            "timestamp": now_iso,
        }
        conversation_entry_assistant = {
            "role": "assistant",
            "content": human_msg,
            "timestamp": now_iso,
        }
        conversation_history.extend([conversation_entry_user, conversation_entry_assistant])

        # 1️⃣  Persist new version in Postgres FIRST – guarantees a canonical version id
        async with async_session_factory() as db:
            # If this fails we *do not* touch Supabase so the UI will retry gracefully
            _diag_id, version_number = await _versioning.save_new_version_async(
                db,
                project_id=project_code,
                d2_dsl=dsl_text,
                rendered_json=diagram_json,
                pinned_nodes=pinned_nodes,
            )

            # Fire-and-forget notification (inside same transaction ensures atomicity)
            from services.notification_manager import notification_manager

            await notification_manager.add_notification(
                db=db,
                user_id=user_id,
                project_id=project_code,
                notif_type="DIAGRAM_UPDATED",
                payload_json={"version": version_number},
            )

        # 2️⃣  Supabase update – include new version id in conversation history data
        try:
            await _supabase.update_project_data(
                user_id=user_id,
                project_code=project_code,
                conversation_history=conversation_history,
                diagram_state=diagram_json,
                dfd_data=None,
                threat_model_id=None,
            )
        except Exception as e:
            # Supabase failure after Postgres commit -> log; front-end will still show version id
            log_info(f"Supabase update failed for project {project_code}: {e}")

        # Increment version id in session
        last_version = session_data.get("last_version_id") or 0
        version_no = (version_number if 'version_number' in locals() else last_version + 1)
        await _session_mgr.set_last_version(session_id, version_no)

        payload = DSLResponsePayload(version_id=version_no, diagram_state=diagram_json, pinned_nodes=pinned_nodes)
        resp = DSLResponse(intent=intent, message=human_msg, confidence=confidence, session_id=session_id, classification_source=source, payload=payload)
        return DesignGenerateResponseV2(response=resp)

    elif intent == IntentV2.EXPERT_QA:
        prompt = await _builder.build_expert_prompt(request.query, conversation_history)
        llm_resp = await _llm.generate_expert_answer(prompt)
        answer = llm_resp.get("content", "")
        resp = ExpertQAResponse(intent=intent, message=answer, confidence=confidence, session_id=session_id, classification_source=source, references=None)
        return DesignGenerateResponseV2(response=resp)

    elif intent == IntentV2.VIEW_TOGGLE:
        resp = ViewToggleResponse(intent=intent, message=f"I've switched the view to DFD.", confidence=confidence, session_id=session_id, classification_source=source, target_view="DFD", diagram_state=None)
        return DesignGenerateResponseV2(response=resp)

    elif intent == IntentV2.CLARIFY:
        resp = ClarifyResponse(intent=intent, message="I'm not sure I understand. Could you clarify?", confidence=confidence, session_id=session_id, classification_source=source, questions=["Please provide more details"])
        return DesignGenerateResponseV2(response=resp)

    else:  # OUT_OF_SCOPE
        resp = OutOfScopeResponse(intent=intent, message="I focus on system and security architecture. Try asking me about threat modelling or data-flow security.", confidence=confidence, session_id=session_id, classification_source=source, suggestion="Ask about security architecture, for example")
        return DesignGenerateResponseV2(response=resp) 