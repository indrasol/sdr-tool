from __future__ import annotations

"""FastAPI route for Design-Service v2 (Phase-5).

POST /v1/design_v2/generate
------------------------
Takes NL query + projectId, classifies intent via IntentClassifierV2 and
routes accordingly.

This is an MVP implementation – DSL parsing/layout are placeholders that
already hook into the new helpers, so the rest of the stack can be
developed incrementally.
"""

import asyncio
from typing import Any, Dict, Optional
from datetime import datetime
from utils.logger import log_info, log_error
import os
import subprocess
from pathlib import Path
import traceback

from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from services.auth_handler import verify_token
from tenacity import AsyncRetrying, stop_after_attempt, wait_exponential
from slowapi import Limiter
from slowapi.util import get_remote_address

# Import settings
from config.settings import IR_BUILDER_MIN_ACTIVE

# Rate limiter (10 requests per minute per client IP)
limiter = Limiter(key_func=get_remote_address)

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

from core.intent_classification.intent_classifier_v2 import IntentClassifierV2, CloudProvider
from core.prompt_engineering.prompt_builder_v2 import PromptBuilderV2
from core.prompt_engineering.cloud_prompt_builder import CloudAwarePromptBuilder
from core.ir.ir_builder import IRBuilder
from core.llm.llm_gateway_v2 import LLMGatewayV2
from core.dsl.parser_d2_lang import D2LangParser
from core.dsl.validators import DiagramValidator
from core.dsl.enhanced_layout_engine_v3 import EnhancedLayoutEngineV3, LayoutEngine, LayoutDirection
from core.dsl.dsl_types import DSLDiagram

# Import the view emitters registry
from core.ir.view_emitters import _EMITTERS

# Existing session + DB utilities (temporary until Phase-6)
from core.cache.session_manager_v2 import SessionManagerV2
from services.supabase_manager import SupabaseManager

# Added for synchronous enrichment
from core.ir.enrich import IrEnricher
from core.ir.layout.constraint_adapter import ir_to_dsl

# Only needed for notifications
from core.db.async_session import async_session_factory
from services.notification_manager import notification_manager

router = APIRouter()

# Singletons
_classifier = IntentClassifierV2()
_builder = CloudAwarePromptBuilder()
_ir_builder = IRBuilder()
_llm = LLMGatewayV2()
_parser = D2LangParser()
_validator = DiagramValidator()
_layout = EnhancedLayoutEngineV3()
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

        # ------------------------------------------------------------------
        #  Provider / technology context – pull from properties *or* metadata
        # ------------------------------------------------------------------
        provider = (
            n.properties.get("provider")
            or n.properties.get("cloud_provider")
            or (n.metadata.get("provider") if hasattr(n, "metadata") else None)
        )
        # technology = (
        #     n.properties.get("technology")
        #     or n.properties.get("tech_stack")
        #     or (n.metadata.get("technology") if hasattr(n, "metadata") else None)
        # )

        # Handle iconifyId (prefer top-level field, fallback to properties)
        # Preserve icon resolved during enrichment (iconify_id) – we check multiple locations
        iconify_id = (
            getattr(n, 'iconifyId', None)
            or n.properties.get("iconifyId")
            or n.properties.get("iconify_id")
            or (n.metadata.get("iconifyId") if hasattr(n, "metadata") else None)
            or (n.metadata.get("iconify_id") if hasattr(n, "metadata") else None)
        )


        if iconify_id:
            log_info(f"[design_v2] node {n.id} uses icon {iconify_id}")

        if not iconify_id:
            # Use enhanced iconify registry for comprehensive icon resolution
            from core.dsl.enhanced_iconify_registry import resolve_icon

            # Resolve icon using smart resolution (provider/technology already computed)
            candidate_node_type = n.type if n.type and n.type not in {"default", "generic"} else label.lower()
            iconify_id = resolve_icon(candidate_node_type, provider=provider, technology=technology)

            # Log icon assignment for debugging
            log_info(f"V2: Icon assignment for node {n.id} ({n.type or 'default'}): {iconify_id}")
        
        data["iconifyId"] = iconify_id

        svg_url = (
            (n.properties.get("svgUrl") if n.properties else None)
            or (n.metadata.get("svgUrl") if hasattr(n, "metadata") else None)
        )

        if svg_url:
            log_info(f"V2: SVG URL assignment for node {n.id} ({n.type or 'default'}): {svg_url}")
            data["svgUrl"] = svg_url
        else:
            data["svgUrl"] = None


        # Pass-through provider / technology context for front-end grouping
        if provider:
            data["provider"] = provider

        # Propagate enrichment metadata (colour / shape / explicit icon) when present
        # Metadata may live either in ``properties`` (from DSL) or ``metadata`` (IR→DSL adapter)
        color_meta = (
            n.properties.get("color")
            if n.properties else None
        )
        shape_meta = (
            n.properties.get("shape")
            if n.properties else None
        )
        icon_meta = (
            n.properties.get("icon")
            if n.properties else None
        )

        if color_meta:
            data["color"] = color_meta
        if shape_meta:
            data["shape"] = shape_meta
        if icon_meta:
            data["icon"] = icon_meta

        # Include layer index when available - check both properties and metadata
        layer_idx = None
        if n.properties:
            layer_idx = n.properties.get("layerIndex")

        # Include layer index when available - check both properties and metadata
        layer_idx = None
        if n.properties:
            layer_idx = n.properties.get("layerIndex")
        
        # Fallback to metadata if not in properties
        if layer_idx is None and hasattr(n, "metadata") and n.metadata:
            layer_idx = n.metadata.get("layerIndex")
            
        if layer_idx is not None:
            try:
                data["layerIndex"] = int(layer_idx)
            except (ValueError, TypeError):
                # Handle case where layerIndex is not an integer
                data["layerIndex"] = 3  # Default to service layer

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

    # ------------------------------------------------------------------
    #  Optional: emit *layerGroup* container nodes for each IR group that
    #  represents a swim-lane (type == "layer_cluster").  We compute the
    #  bounding box from member nodes AFTER layout so that the container
    #  wraps its children neatly in React-Flow.  This allows the frontend
    #  to render translucent bands similar to the Mermaid reference image.
    # ------------------------------------------------------------------
    if hasattr(diagram, "groups"):
        layer_groups = [g for g in diagram.groups if getattr(g, "type", "") == "domain_cluster"]

        # Build lookup for node positions
        node_pos = {n.id: (float(getattr(n, "x", 0)), float(getattr(n, "y", 0)), float(getattr(n, "width", 0)), float(getattr(n, "height", 0))) for n in diagram.nodes}

        for grp in layer_groups:
            members = [m for m in grp.member_node_ids if m in node_pos]
            if not members:
                continue  # nothing to draw

            min_x = min(node_pos[m][0] for m in members) - 80.0
            min_y = min(node_pos[m][1] for m in members) - 60.0
            max_x = max(node_pos[m][0] + node_pos[m][2] for m in members) + 80.0
            max_y = max(node_pos[m][1] + node_pos[m][3] for m in members) + 60.0

            width = max_x - min_x
            height = max_y - min_y

            rf_nodes.append({
                "id": grp.id,
                "type": "clusterGroup",
                "data": {
                    "label": grp.name,
                    "cluster": grp.name,
                    "nodeType": "layerGroup",  # Required field
                    "iconifyId": "mdi:layer-group",  # Required field - using a generic icon
                    "description": f"Layer group for {grp.name}",  # Required field
                    "source": "backend",  # Required field
                    "validated": True
                },
                "position": {"x": min_x, "y": min_y},
                "width": width,
                "height": height,
                "style": {"fill": "rgba(0,0,0,0)", "strokeWidth": 0},
            })

        # Ensure clusterGroup nodes render behind others by appending them *before* edges are set.

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

# ---------------------------------------------------------------------------
#  Helper – generate diagram with retries on validation failure
# ---------------------------------------------------------------------------

async def _generate_and_validate(prompt: str, max_attempts: int = 3):
    """Generate D2 DSL via LLM, parse + validate, retrying up to *max_attempts* times."""
    attempt_prompt = prompt
    last_errors = []
    for _ in range(max_attempts):
        llm_resp = await _llm.generate_d2_dsl(attempt_prompt)
        dsl_text = llm_resp.get("content", "")

        if not dsl_text.strip():
            last_errors = ["Empty LLM response"]
        else:
            try:
                diagram = _parser.parse(dsl_text)
                valid, errors = _validator.validate(diagram)
                if valid:
                    return diagram, dsl_text
                last_errors = errors
            except ValueError as e:
                last_errors = [str(e)]

        # Refine the prompt with explicit fix instructions for the next attempt
        attempt_prompt += "\nFIX ERRORS: " + ", ".join(last_errors) + "\nPlease regenerate valid D2 starting with 'direction: right'."

    # All attempts failed – propagate errors
    raise ValueError("Validation failed after retries", last_errors)

# Check if d2json is available
def ensure_d2_present():
    """Checks if d2json binary is available and logs status."""
    # Find d2json binary in project or PATH
    possible_paths = [
        Path(os.path.dirname(__file__)) / ".." / ".." / ".." / ".." / "tools" / "cmd" / "d2json" / "d2json",
        Path(os.path.dirname(__file__)) / ".." / ".." / ".." / "tools" / "cmd" / "d2json" / "d2json",
        Path("/usr/local/bin/d2json"),
        Path("/usr/bin/d2json"),
    ]
    
    for path in possible_paths:
        if path.exists() and os.access(path, os.X_OK):
            log_info(f"d2json found at: {path}")
            return True
    
    log_error("d2json binary not found! IR flow may not work properly.")
    return False

# Call check on module import
d2json_available = ensure_d2_present()

@router.post("/generate", response_model=DesignGenerateResponseV2)
# @limiter.limit("10/minute")
async def design_generate(
    request: DesignGenerateRequestV2,
    current_user: dict = Depends(verify_token),
):
    """Main entry for v2 design generation."""
    log_info(f"Design generate request: {request}")
    user_id = current_user["id"]
    project_code = request.project_id

    # ------------------------------------------------------------------
    #  Input validation – length & simple profanity filter
    # ------------------------------------------------------------------
    MAX_QUERY_LEN = 512
    MIN_QUERY_LEN = 2
    PROFANE_WORDS = {"fuck", "shit", "bitch", "asshole"}

    if not request.query or len(request.query.strip()) < MIN_QUERY_LEN:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "QUERY_TOO_SHORT",
                "message": f"Query must be at least {MIN_QUERY_LEN} characters.",
            },
        )

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

    # Validate project ID
    if not project_code or not isinstance(project_code, str) or not project_code.strip():
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "INVALID_PROJECT_ID",
                "message": "A valid project ID is required.",
            },
        )

    # ------------------------------------------------------------------
    # SessionManager is the single source of truth for conversation history
    # ------------------------------------------------------------------
    session_id = await _session_mgr.ensure_session(request.session_id, project_code)
    conversation_history = await _session_mgr.get_conversation_history(session_id, limit=5)

    # ------------------------------------------------------------------
    # Classification with integrated cloud provider detection
    # ------------------------------------------------------------------
    intent, confidence, provider, source = await _classifier.classify(request.query, conversation_history)
    log_info(f"Intent classification: {intent}, provider: {provider}, confidence: {confidence}, source: {source}")

    # Branch handling
    if intent in (IntentV2.DSL_CREATE, IntentV2.DSL_UPDATE):
        # Check Redis cache for identical query to save LLM cost
        cached = await _session_mgr.get_cached_dsl(project_code, request.query)
        if cached:
            log_info("Serving diagram from DSL cache")
            diagram_json = cached.get("diagram_json") or {"nodes": [], "edges": []}
            dsl_text = cached.get("dsl_text") or ""
            version_id = cached.get("version_id") or 0
            human_msg = "Diagram retrieved from cache."
            # Use imported setting instead of os.getenv
            av_views = list(_EMITTERS.keys()) if IR_BUILDER_MIN_ACTIVE else None
            if av_views:
                log_info(f"IR flow active: Available views for cached response: {av_views}")
            else:
                log_info("IR flow inactive: No alternative views available")
                
            # Get diagram_id from cache if available, otherwise leave as None
            cached_diagram_id = cached.get("diagram_id")
            
            payload = DSLResponsePayload(
                diagram_id=cached_diagram_id, 
                version_id=version_id, 
                diagram_state=diagram_json, 
                pinned_nodes=[],
                available_views=av_views, 
                provider=provider.value if provider != CloudProvider.NONE else None
            )
            resp = DSLResponse(intent=intent, message=human_msg, confidence=confidence, session_id=session_id, classification_source="cache", payload=payload)
            return DesignGenerateResponseV2(response=resp)

        # Retrieve current diagram_state from Supabase (if any)
        current_dsl = ""
        rendered_json: Dict[str, Any] | None = None
        try:
            proj = await _supabase.get_project_data(user_id, project_code)
            rendered_json = proj.get("diagram_state") or {"nodes": [], "edges": []}
        except Exception:
            rendered_json = {"nodes": [], "edges": []}

        # Fetch the latest stored DSL from Supabase to provide context for updates
        if intent == IntentV2.DSL_UPDATE:
            # Use the new SupabaseManager method instead of direct PostgreSQL calls
            current_dsl = await _supabase.fetch_latest_dsl(project_code) or ""
            log_info(f"Retrieved latest DSL for project {project_code} ({len(current_dsl)} chars)")

        # Build prompt with cloud awareness
        prompt = await _builder.build_prompt_by_intent(
            intent=intent,
            query=request.query,
            provider=provider, 
            conversation_history=conversation_history,
            current_dsl=current_dsl
        )

        # Generate diagram with automatic validation & retry
        try:
            diagram, dsl_text = await _generate_and_validate(prompt)
        except ValueError as ve:
            raise HTTPException(
                status_code=422,
                detail={
                    "error_code": "DIAGRAM_VALIDATION_FAILED",
                    "errors": ve.args[1] if len(ve.args) > 1 else [str(ve)],
                },
            )

        # Apply layout with enhanced engine after successful validation
        layout_result = _layout.layout(
            diagram,
            direction=LayoutDirection.LEFT_TO_RIGHT,
            preferred_engine=LayoutEngine.AUTO
        )
        diagram = layout_result.diagram

        # Log layout metrics
        log_info(
            f"Layout completed: engine={layout_result.engine_used.value}, "
            f"time={layout_result.execution_time:.3f}s, "
            f"quality={layout_result.quality_score:.2f}, "
            f"success={layout_result.success}"
        )

        # Build enriched IR synchronously so layer containers & icons are ready
        ir_base = _ir_builder.build(diagram, source_dsl=dsl_text)
        ir_enriched = IrEnricher().run(ir_base)

        # ------------------------------------------------------------------
        #  NEW: Apply layout directly on the *enriched* IR so that layer
        #        containers and node positions are preserved.  This guarantees
        #        the very first render is already fully positioned.
        # ------------------------------------------------------------------
        diagram_full = _layout.layout_ir(ir_enriched)
        diagram_json = _dsl_to_reactflow(diagram_full)
        
        # If IR present in rendered_json, run layout_ir to add positions
        # Use imported setting instead of os.getenv
        if IR_BUILDER_MIN_ACTIVE:
            log_info("IR flow active: Checking for IR data to apply layout")
            try:
                ir_json = rendered_json.get("ir_json") if isinstance(rendered_json, dict) else None
                if ir_json:
                    log_info("IR flow: Found IR data, applying layout")
                    from core.ir.ir_types import IRGraph
                    ir_graph = IRGraph.model_validate(ir_json)
                    positioned = _layout.layout_ir(ir_graph)
                    diagram_json = positioned.model_dump()
                    log_info("IR flow: Successfully applied layout to IR data")
                else:
                    log_info("IR flow: No IR data found in rendered_json")
            except Exception as e:
                log_error(f"IR flow: Layout failed: {e}")
        else:
            log_info("IR flow inactive: Skipping IR layout")

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

        # ---- update conversation history in session ----
        await _session_mgr.append_conversation_entry(session_id, "user", request.query)
        await _session_mgr.append_conversation_entry(session_id, "assistant", human_msg)

        # Save diagram version to Supabase
        _diag_id = None
        version_number = 1  # Default version number
        try:
            # Build IR JSON if needed
            ir_json = None
            if IR_BUILDER_MIN_ACTIVE:
                try:
                    ir_json = ir_enriched.model_dump()
                    log_info(f"Generated IR JSON with {len(ir_json.get('nodes', []))} nodes for project {project_code}")
                except Exception as e:
                    log_error(f"Failed to generate IR JSON: {e}")
                
            # Save diagram version via Supabase
            _diag_id, version_number = await _supabase.save_diagram_version(
                project_code=project_code,
                d2_dsl=dsl_text,
                rendered_json=diagram_json,
                pinned_nodes=pinned_nodes,
                ir_json=ir_json
            )
            log_info(f"Successfully saved diagram version {version_number} with ID {_diag_id} for project {project_code}")
            
            # Fire-and-forget notification
            try:
                async def send_notification():
                    try:
                        async with async_session_factory() as db:
                            await notification_manager.add_notification(
                                db=db,
                                user_id=user_id,
                                project_id=project_code,
                                notif_type="DIAGRAM_UPDATED",
                                payload_json={"version": version_number},
                            )
                            log_info(f"Successfully sent notification for project {project_code}")
                    except Exception as inner_err:
                        log_error(f"Notification failed in async task: {inner_err}")
                        
                # Create task without awaiting
                asyncio.create_task(send_notification())
            except Exception as notif_err:
                log_error(f"Failed to create notification task: {notif_err}")
                
        except Exception as e:
            log_error(f"Failed to save diagram version: {e}")
            log_error(traceback.format_exc())
            _diag_id = None
            version_number = 1  # Default fallback

        # Update version id in session (should be done whether or not diagram saving succeeded)
        await _session_mgr.set_last_version(session_id, version_number)

        # 2️⃣ Update project data in Supabase - always separate from diagram versioning
        try:
            await _supabase.update_project_data(
                user_id=user_id,
                project_code=project_code,
                conversation_history=conversation_history,
                diagram_state=diagram_json,
                dfd_data=None,
                threat_model_id=None,
            )
            log_info(f"Successfully updated project data for {project_code}")
        except Exception as e:
            log_error(f"Supabase project data update failed: {e}")
            # Non-fatal error, frontend will still show diagram with version id

        # Use imported setting instead of os.getenv
        # But check if d2json is available before returning view options
        if IR_BUILDER_MIN_ACTIVE:
            if d2json_available:
                av_views = list(_EMITTERS.keys())
                log_info(f"IR flow active and d2json available: Available views in response: {av_views}")
            else:
                # Only include ReactFlow if d2json is missing - this avoids errors while still using the IR data model
                av_views = ["reactflow"]
                log_info(f"IR flow active but d2json missing: Limited views in response: {av_views}")
        else:
            av_views = None
            log_info("IR flow inactive: No alternative views in response")
            
        # Build response payload with all required fields
        payload = DSLResponsePayload(
            diagram_id=_diag_id,  # Always include diagram_id (may be None if save failed)
            version_id=version_number, 
            diagram_state=diagram_json, 
            pinned_nodes=pinned_nodes, 
            available_views=av_views,
            provider=provider.value if provider != CloudProvider.NONE else None
        )
        resp = DSLResponse(
            intent=intent, 
            message=human_msg, 
            confidence=confidence, 
            session_id=session_id, 
            classification_source=source, 
            payload=payload
        )
        log_info(f"DSL Response: {resp}")

        # 🔒 Cache the DSL + rendered JSON for same query (avoid repeated LLM calls)
        # Include all relevant fields including diagram_id
        try:
            await _session_mgr.cache_dsl(project_code, request.query, {
                "dsl_text": dsl_text,
                "diagram_json": diagram_json,
                "version_id": version_number,
                "diagram_id": _diag_id
            })
            log_info(f"Successfully cached DSL for project {project_code}")
        except Exception as _c_err:
            log_error(f"Could not cache DSL for project {project_code}: {_c_err}")

        return DesignGenerateResponseV2(response=resp)

    elif intent == IntentV2.EXPERT_QA:
        answer = ""
        try:
            prompt = await _builder.build_expert_prompt(request.query, conversation_history)
            llm_resp = await _llm.generate_expert_answer(prompt)
            answer = llm_resp.get("content", "")
            if not answer.strip():
                answer = "I'm sorry, I couldn't generate a response. Please try asking in a different way."
                log_info(f"Empty expert response for query: {request.query}")
        except Exception as e:
            answer = "I encountered an error while processing your question. Please try again."
            log_error(f"Expert QA error: {e}")
            log_error(traceback.format_exc())
        
        # Update conversation history in session
        try:
            await _session_mgr.append_conversation_entry(session_id, "user", request.query)
            await _session_mgr.append_conversation_entry(session_id, "assistant", answer)
        except Exception as e:
            log_error(f"Failed to update conversation history: {e}")
        
        resp = ExpertQAResponse(
            intent=intent, 
            message=answer, 
            confidence=confidence, 
            session_id=session_id, 
            classification_source=source, 
            references=None
        )
        return DesignGenerateResponseV2(response=resp)

    elif intent == IntentV2.VIEW_TOGGLE:
        message = "I've switched the view to DFD."
        
        # Update conversation history in session
        try:
            await _session_mgr.append_conversation_entry(session_id, "user", request.query)
            await _session_mgr.append_conversation_entry(session_id, "assistant", message)
            log_info(f"View toggled for session {session_id}")
        except Exception as e:
            log_error(f"Failed to update conversation history for view toggle: {e}")
        
        resp = ViewToggleResponse(
            intent=intent, 
            message=message, 
            confidence=confidence, 
            session_id=session_id, 
            classification_source=source, 
            target_view="DFD", 
            diagram_state=None
        )
        return DesignGenerateResponseV2(response=resp)

    elif intent == IntentV2.CLARIFY:
        message = "I'm not sure I understand. Could you clarify please?"
        
        # Update conversation history in session
        try:
            await _session_mgr.append_conversation_entry(session_id, "user", request.query)
            await _session_mgr.append_conversation_entry(session_id, "assistant", message)
        except Exception as e:
            log_error(f"Failed to update conversation history for clarify: {e}")
        
        resp = ClarifyResponse(
            intent=intent, 
            message=message, 
            confidence=confidence, 
            session_id=session_id, 
            classification_source=source, 
            questions=["Please provide more details"]
        )
        return DesignGenerateResponseV2(response=resp)

    else:  # OUT_OF_SCOPE
        message = "I focus on system and security architecture. Try asking me about threat modelling or data-flow security."
        
        # Update conversation history in session
        try:
            await _session_mgr.append_conversation_entry(session_id, "user", request.query)
            await _session_mgr.append_conversation_entry(session_id, "assistant", message)
        except Exception as e:
            log_error(f"Failed to update conversation history for out-of-scope: {e}")
        
        resp = OutOfScopeResponse(
            intent=intent, 
            message=message, 
            confidence=confidence, 
            session_id=session_id, 
            classification_source=source, 
            suggestion="Ask about security architecture, for example"
        )
        return DesignGenerateResponseV2(response=resp) 