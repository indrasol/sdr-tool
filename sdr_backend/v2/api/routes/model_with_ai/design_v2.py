# from __future__ import annotations

# """FastAPI route for Design-Service v2 (Phase-5).

# POST /v2/design/generate
# ------------------------
# Takes NL query + projectId, classifies intent via IntentClassifierV2 and
# routes accordingly.

# This is an MVP implementation – DSL parsing/layout are placeholders that
# already hook into the new helpers, so the rest of the stack can be
# developed incrementally.
# """

# import asyncio
# from typing import Any, Dict
# from datetime import datetime
# from utils.logger import log_info

# from fastapi import APIRouter, Body, Depends, HTTPException
# from fastapi.responses import JSONResponse

# from services.auth_handler import verify_token
# from tenacity import AsyncRetrying, stop_after_attempt, wait_exponential
# from slowapi import Limiter
# from slowapi.util import get_remote_address

# # Rate limiter (10 requests per minute per client IP)
# limiter = Limiter(key_func=get_remote_address)

# # v2 helpers
# from models.request_models_v2 import DesignGenerateRequestV2
# from models.response_models_v2 import (
#     IntentV2,
#     DSLResponse,
#     DSLResponsePayload,
#     ExpertQAResponse,
#     ClarifyResponse,
#     OutOfScopeResponse,
#     ViewToggleResponse,
#     DesignGenerateResponseV2,
# )

# from core.intent_classification.intent_classifier_v2 import IntentClassifierV2
# from core.prompt_engineering.prompt_builder_v2 import PromptBuilderV2
# from core.prompt_engineering.cloud_prompt_builder import CloudAwarePromptBuilder
# from core.ir.ir_builder import IRBuilder
# from core.llm.llm_gateway_v2 import LLMGatewayV2
# from core.dsl.parser_d2_lang import D2LangParser
# from core.dsl.validators import DiagramValidator
# from core.dsl.enhanced_layout_engine_v3 import EnhancedLayoutEngineV3, LayoutEngine, LayoutDirection
# from core.dsl.dsl_versioning_v2 import DSLVersioningV2
# from core.dsl.dsl_types import DSLDiagram

# # Existing session + DB utilities (temporary until Phase-6)
# from core.cache.session_manager_v2 import SessionManagerV2
# from services.supabase_manager import SupabaseManager

# # Database session factory
# from core.db.async_session import async_session_factory

# # Added for synchronous enrichment
# from core.ir.enrich import IrEnricher
# from core.ir.layout.constraint_adapter import ir_to_dsl

# router = APIRouter()

# # Singletons
# _classifier = IntentClassifierV2()
# _builder = CloudAwarePromptBuilder()
# _ir_builder = IRBuilder()
# _llm = LLMGatewayV2()
# _parser = D2LangParser()
# _validator = DiagramValidator()
# _layout = EnhancedLayoutEngineV3()
# _versioning = DSLVersioningV2()
# _session_mgr = SessionManagerV2()
# _supabase = SupabaseManager()

# # ---------------------------------------------------------------------------
# #  Utility – convert canonical DSLDiagram → React-Flow JSON
# # ---------------------------------------------------------------------------

# def _dsl_to_reactflow(diagram: DSLDiagram):
#     """Return React-Flow compatible dict {nodes, edges} with robust data validation."""
#     rf_nodes = []
#     for n in diagram.nodes:
#         # Use top-level position fields (new robust structure)
#         pos_x = float(n.x) if hasattr(n, 'x') else 0.0
#         pos_y = float(n.y) if hasattr(n, 'y') else 0.0
#         width = float(n.width) if hasattr(n, 'width') else 172.0
#         height = float(n.height) if hasattr(n, 'height') else 36.0
        
#         # Clean and validate label (already validated by DiagramValidator)
#         label = str(n.label).strip() if n.label else n.id
        
#         # Build clean data payload
#         data = {
#             "label": label,
#             "nodeType": n.type or "default", 
#             "description": str(n.properties.get("description", "")).strip()[:500] if n.properties.get("description") else "",
#             "validated": True,
#             "source": "backend"
#         }

#         # ------------------------------------------------------------------
#         #  Provider / technology context – pull from properties *or* metadata
#         # ------------------------------------------------------------------
#         provider = (
#             n.properties.get("provider")
#             or n.properties.get("cloud_provider")
#             or (n.metadata.get("provider") if hasattr(n, "metadata") else None)
#         )
#         technology = (
#             n.properties.get("technology")
#             or n.properties.get("tech_stack")
#             or (n.metadata.get("technology") if hasattr(n, "metadata") else None)
#         )

#         # Handle iconifyId (prefer top-level field, fallback to properties)
#         iconify_id = (
#             getattr(n, 'iconifyId', None)
#             or n.properties.get("iconifyId")
#             or n.properties.get("iconify_id")
#             or n.metadata.get("iconifyId")
#             or n.metadata.get("iconify_id")
#         )

#         if iconify_id:
#             log_info(f"[design_v2] node {n.id} uses icon {iconify_id}")
        
#         data["iconifyId"] = iconify_id

#         # Extract SVG URL from properties or metadata
#         svg_url = (
#             (n.properties.get("svgUrl") if n.properties else None)
#             or (n.properties.get("svg_url") if n.properties else None)
#             or (n.metadata.get("svgUrl") if hasattr(n, "metadata") else None)
#             or (n.metadata.get("svg_url") if hasattr(n, "metadata") else None)
#         )

#         if svg_url:
#             log_info(f"V2: SVG URL assignment for node {n.id} ({n.type or 'default'}): {svg_url}")
#             # Add SVG URL directly to the node data (not inside metadata)
#             data["svgUrl"] = svg_url

#         # Pass-through provider / technology context for front-end grouping
#         if provider:
#             data["provider"] = provider
#         if technology:
#             data["technology"] = technology

#         # Propagate enrichment metadata (colour / shape / explicit icon) when present
#         color_meta = n.properties.get("color") if n.properties else None
#         shape_meta = n.properties.get("shape") if n.properties else None
#         icon_meta = n.properties.get("icon") if n.properties else None

#         if color_meta:
#             data["color"] = color_meta
#         if shape_meta:
#             data["shape"] = shape_meta
#         if icon_meta:
#             data["icon"] = icon_meta

#         # Include layer index when available - check both properties and metadata
#         layer_idx = None
#         if n.properties:
#             layer_idx = n.properties.get("layerIndex")
        
#         # Fallback to metadata if not in properties
#         if layer_idx is None and hasattr(n, "metadata") and n.metadata:
#             layer_idx = n.metadata.get("layerIndex")
            
#         if layer_idx is not None:
#             try:
#                 data["layerIndex"] = int(layer_idx)
#             except (ValueError, TypeError):
#                 # Handle case where layerIndex is not an integer
#                 data["layerIndex"] = 3  # Default to service layer

#         # Node type validation
#         node_type = n.properties.get("shape", "default")
#         if node_type not in ["default", "comment", "layerGroup"]:
#             node_type = "default"

#         rf_nodes.append({
#             "id": n.id,
#             "type": node_type,
#             "data": data,
#             "position": {"x": pos_x, "y": pos_y},
#             "width": width,
#             "height": height
#         })

#     # ------------------------------------------------------------------
#     #  Add synthetic layerGroup nodes representing swim-lanes
#     # ------------------------------------------------------------------
#     if hasattr(diagram, "groups"):
#         for g in diagram.groups:
#             if getattr(g, "type", "") == "layer_cluster":
#                 try:
#                     idx = int(g.id.split("_")[1]) if g.id.startswith("layer_") else int("".join(filter(str.isdigit, g.name)))
#                 except Exception:
#                     idx = 0

#                 rf_nodes.append({
#                     "id": g.id,
#                     "type": "layerGroup",
#                     "data": {
#                         "label": g.name,
#                         "layerIndex": idx,
#                         "layer": g.name.lower(),
#                         "nodeType": "layerGroup",  # Required field
#                         "iconifyId": "mdi:layer-group",  # Required field - using a generic icon
#                         "description": f"Layer group for {g.name}",  # Required field
#                         "source": "backend",  # Required field
#                         "validated": True
#                     },
#                     "position": {"x": 0, "y": 0},
#                     "width": 10,
#                     "height": 10,
#                 })

#     rf_edges = []
#     for e in diagram.edges:
#         rf_edges.append({
#             "id": e.id,
#             "source": e.source,
#             "target": e.target,
#             "label": str(e.label).strip() if e.label else "",
#             "type": "smoothstep"
#         })

#     return {"nodes": rf_nodes, "edges": rf_edges}

# # ---------------------------------------------------------------------------
# #  Helper – generate diagram with retries on validation failure
# # ---------------------------------------------------------------------------

# async def _generate_and_validate(prompt: str, max_attempts: int = 3):
#     """Generate D2 DSL via LLM, parse + validate, retrying up to *max_attempts* times."""
#     attempt_prompt = prompt
#     last_errors = []
#     for _ in range(max_attempts):
#         llm_resp = await _llm.generate_d2_dsl(attempt_prompt)
#         dsl_text = llm_resp.get("content", "")

#         if not dsl_text.strip():
#             last_errors = ["Empty LLM response"]
#         else:
#             try:
#                 diagram = _parser.parse(dsl_text)
#                 valid, errors = _validator.validate(diagram)
#                 if valid:
#                     return diagram, dsl_text
#                 last_errors = errors
#             except ValueError as e:
#                 last_errors = [str(e)]

#         # Refine the prompt with explicit fix instructions for the next attempt
#         attempt_prompt += "\nFIX ERRORS: " + ", ".join(last_errors) + "\nPlease regenerate valid D2 starting with 'direction: right'."

#     # All attempts failed – propagate errors
#     raise ValueError("Validation failed after retries", last_errors)

# @router.post("/generate", response_model=DesignGenerateResponseV2)
# # @limiter.limit("10/minute")
# async def design_generate(
#     request: DesignGenerateRequestV2,
#     current_user: dict = Depends(verify_token),
# ):
#     """Main entry for v2 design generation."""
#     log_info(f"Design generate request: {request}")
#     user_id = current_user["id"]
#     project_code = request.project_id

#     # ------------------------------------------------------------------
#     #  Input validation – length & simple profanity filter
#     # ------------------------------------------------------------------
#     MAX_QUERY_LEN = 512
#     PROFANE_WORDS = {"fuck", "shit", "bitch", "asshole"}

#     if len(request.query) > MAX_QUERY_LEN:
#         raise HTTPException(
#             status_code=400,
#             detail={
#                 "error_code": "QUERY_TOO_LONG",
#                 "message": f"Query exceeds maximum length of {MAX_QUERY_LEN} characters.",
#             },
#         )

#     lower_query = request.query.lower()
#     if any(word in lower_query for word in PROFANE_WORDS):
#         raise HTTPException(
#             status_code=400,
#             detail={
#                 "error_code": "PROFANITY_DETECTED",
#                 "message": "Please rephrase your request.",
#             },
#         )

#     # Session context – lightweight v2 manager
#     session_id = request.session_id or await _session_mgr.create_session(project_code)

#     session_data = await _session_mgr.get_session(session_id) or {}
#     conversation_history: list = []

#     # Classify intent
#     intent, confidence, source = await _classifier.classify(request.query)

#     # Branch handling
#     if intent in (IntentV2.DSL_CREATE, IntentV2.DSL_UPDATE):
#         # Check Redis cache for identical query to save LLM cost
#         cached = await _session_mgr.get_cached_dsl(project_code, request.query)
#         if cached:
#             log_info("Serving diagram from DSL cache")
#             diagram_json = cached.get("diagram_json") or {"nodes": [], "edges": []}
#             dsl_text = cached.get("dsl_text") or ""
#             version_id = cached.get("version_id") or session_data.get("last_version_id") or 0
#             human_msg = "Diagram retrieved from cache."
#             payload = DSLResponsePayload(version_id=version_id, diagram_state=diagram_json, pinned_nodes=[])
#             resp = DSLResponse(intent=intent, message=human_msg, confidence=confidence, session_id=session_id, classification_source="cache", payload=payload)
#             return DesignGenerateResponseV2(response=resp)

#         # Retrieve current diagram_state from Supabase (if any)
#         current_dsl = ""
#         rendered_json: Dict[str, Any] | None = None
#         try:
#             proj = await _supabase.get_project_data(user_id, project_code)
#             rendered_json = proj.get("diagram_state") or {"nodes": [], "edges": []}
#             conversation_history = proj.get("conversation_history") or []
#         except Exception:
#             rendered_json = {"nodes": [], "edges": []}

#         # Fetch the latest stored DSL from Postgres to provide context for updates
#         if intent == IntentV2.DSL_UPDATE:
#             async with async_session_factory() as _db:
#                 latest = await _versioning.fetch_latest_dsl_async(_db, project_code)
#                 current_dsl = latest or ""

#         # Build prompt
#         prompt = await _builder.build_prompt_by_intent(intent, request.query, conversation_history, current_dsl)

#         # Generate diagram with automatic validation & retry
#         try:
#             diagram, dsl_text = await _generate_and_validate(prompt)
#         except ValueError as ve:
#             raise HTTPException(
#                 status_code=422,
#                 detail={
#                     "error_code": "DIAGRAM_VALIDATION_FAILED",
#                     "errors": ve.args[1] if len(ve.args) > 1 else [str(ve)],
#                 },
#             )

#         # Apply layout with enhanced engine after successful validation
#         layout_result = _layout.layout(
#             diagram,
#             direction=LayoutDirection.LEFT_TO_RIGHT,
#             preferred_engine=LayoutEngine.AUTO
#         )
#         diagram = layout_result.diagram

#         # Log layout metrics
#         log_info(
#             f"Layout completed: engine={layout_result.engine_used.value}, "
#             f"time={layout_result.execution_time:.3f}s, "
#             f"quality={layout_result.quality_score:.2f}, "
#             f"success={layout_result.success}"
#         )

#         ir_base = _ir_builder.build(diagram, source_dsl=dsl_text)
#         ir_enriched = IrEnricher().run(ir_base)

#         # Apply layout directly on enriched IR to preserve positions & layer groups
#         diagram_full = _layout.layout_ir(ir_enriched)
#         diagram_json = _dsl_to_reactflow(diagram_full)
        
#         # ------------------------------------------------------------------
#         #  Generate human-readable explanation (conversational)
#         # ------------------------------------------------------------------

#         human_msg = "Diagram updated."
#         try:
#             if intent == IntentV2.DSL_CREATE:
#                 explain_prompt = await _builder.build_create_explanation(
#                     dsl_text, diagram_json, request.query
#                 )
#             else:  # DSL_UPDATE
#                 explain_prompt = await _builder.build_update_explanation(
#                     current_dsl or "", dsl_text, diagram_json, request.query
#                 )

#             explain_resp = await _llm.generate_expert_answer(explain_prompt)
#             human_msg = (explain_resp.get("content", "") or "Diagram updated.").strip()
#             if not human_msg:
#                 human_msg = "I have updated the diagram."  # graceful degradation
#         except Exception as _e:  # noqa: E501 – fallback on any LLM failure without breaking flow
#             human_msg = "I have updated the diagram."  # graceful degradation

#         # Ensure first-person tone
#         if human_msg.lower().startswith("you "):
#             human_msg = "I" + human_msg[3:]

#         # --------------------------------------------------------------
#         #  Extract pinned nodes (ids where data.pinned === true)
#         # --------------------------------------------------------------
#         pinned_nodes: list[str] = []
#         try:
#             for n in diagram_json.get("nodes", []):
#                 if n.get("data", {}).get("pinned"):
#                     pinned_nodes.append(n.get("id"))
#         except Exception:
#             pinned_nodes = []

#         # ---- update conversation history ----
#         now_iso = datetime.utcnow().isoformat()
#         conversation_entry_user = {
#             "role": "user",
#             "content": request.query,
#             "timestamp": now_iso,
#         }
#         conversation_entry_assistant = {
#             "role": "assistant",
#             "content": human_msg,
#             "timestamp": now_iso,
#         }
#         conversation_history.extend([conversation_entry_user, conversation_entry_assistant])

#         # 1️⃣  Persist new version in Postgres FIRST – guarantees a canonical version id
#         async with async_session_factory() as db:
#             # If this fails we *do not* touch Supabase so the UI will retry gracefully
#             _diag_id, version_number = await _versioning.save_new_version_async(
#                 db,
#                 project_id=project_code,
#                 d2_dsl=dsl_text,
#                 rendered_json=diagram_json,
#                 pinned_nodes=pinned_nodes,
#             )

#             # Fire-and-forget notification (inside same transaction ensures atomicity)
#             from services.notification_manager import notification_manager

#             await notification_manager.add_notification(
#                 db=db,
#                 user_id=user_id,
#                 project_id=project_code,
#                 notif_type="DIAGRAM_UPDATED",
#                 payload_json={"version": version_number},
#             )

#         # 2️⃣  Supabase update – include new version id in conversation history data
#         try:
#             await _supabase.update_project_data(
#                 user_id=user_id,
#                 project_code=project_code,
#                 conversation_history=conversation_history,
#                 diagram_state=diagram_json,
#                 dfd_data=None,
#                 threat_model_id=None,
#             )
#         except Exception as e:
#             # Supabase failure after Postgres commit -> log; front-end will still show version id
#             log_info(f"Supabase update failed for project {project_code}: {e}")

#         # Increment version id in session
#         last_version = session_data.get("last_version_id") or 0
#         version_no = (version_number if 'version_number' in locals() else last_version + 1)
#         await _session_mgr.set_last_version(session_id, version_no)

#         payload = DSLResponsePayload(version_id=version_no, diagram_state=diagram_json, pinned_nodes=pinned_nodes)
#         resp = DSLResponse(intent=intent, message=human_msg, confidence=confidence, session_id=session_id, classification_source=source, payload=payload)

#         # 🔒 Cache the DSL + rendered JSON for same query (avoid repeated LLM calls)
#         try:
#             await _session_mgr.cache_dsl(project_code, request.query, {
#                 "dsl_text": dsl_text,
#                 "diagram_json": diagram_json,
#                 "version_id": version_no
#             })
#         except Exception as _c_err:
#             log_info(f"Could not cache DSL for proj {project_code}: {_c_err}")

#         return DesignGenerateResponseV2(response=resp)

#     elif intent == IntentV2.EXPERT_QA:
#         prompt = await _builder.build_expert_prompt(request.query, conversation_history)
#         llm_resp = await _llm.generate_expert_answer(prompt)
#         answer = llm_resp.get("content", "")
#         resp = ExpertQAResponse(intent=intent, message=answer, confidence=confidence, session_id=session_id, classification_source=source, references=None)
#         return DesignGenerateResponseV2(response=resp)

#     elif intent == IntentV2.VIEW_TOGGLE:
#         resp = ViewToggleResponse(intent=intent, message=f"I've switched the view to DFD.", confidence=confidence, session_id=session_id, classification_source=source, target_view="DFD", diagram_state=None)
#         return DesignGenerateResponseV2(response=resp)

#     elif intent == IntentV2.CLARIFY:
#         resp = ClarifyResponse(intent=intent, message="I'm not sure I understand. Could you clarify?", confidence=confidence, session_id=session_id, classification_source=source, questions=["Please provide more details"])
#         return DesignGenerateResponseV2(response=resp)

#     else:  # OUT_OF_SCOPE
#         resp = OutOfScopeResponse(intent=intent, message="I focus on system and security architecture. Try asking me about threat modelling or data-flow security.", confidence=confidence, session_id=session_id, classification_source=source, suggestion="Ask about security architecture, for example")
#         return DesignGenerateResponseV2(response=resp) 