from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, HTTPException, Depends
from core.db.supabase_db import get_supabase_client, safe_supabase_operation
from models.report_models import GenerateReportRequest, GenerateReportResponse
from models.dfd_models import DFDSwitchRequest
from services.auth_handler import verify_token
from core.cache.session_manager import SessionManager
from core.llm.llm_gateway_v1 import LLMService
from services.reports_handler import ReportsHandler, acquire_report_lock, release_report_lock, generate_threats_from_description
from services.storage_handler import upload_diagram_png_if_provided
from utils.logger import log_info
import asyncio  # Needed for async sleep while waiting on Redis lock
from core.prompt_engineering.prompt_builder import PromptBuilder
from models.threat_models import ThreatsResponse

router = APIRouter()

# ─────────────────────────────────────────────
# Utility – fast MD5 hash for diagram state
# ─────────────────────────────────────────────

def fast_hash(data) -> str:
    """Generate a fast hash for diagram state comparison"""
    import hashlib, json as _json
    return hashlib.md5(_json.dumps(data, sort_keys=True).encode()).hexdigest()

# routers/report.py
@router.post(
    "/projects/{project_code}/report",
    response_model=GenerateReportResponse,
    summary="Generate (or fetch cached) security report",
    tags=["Reporting"]
)
async def generate_report_endpoint(
    project_code: str,
    req: GenerateReportRequest,
    current_user: dict = Depends(verify_token)
):
    """
    1. Resolve the latest diagram (req.diagram_state > session > DB).
    2. If the diagram hash hasn't changed and a report exists, return it.
    3. Otherwise:
       • run /analyze_diagram  (already coded)
       • run /threat_analysis  (already coded – reuse function not HTTP)
       • build sections via ReportBuilder
       • persist PNG of diagram in Supabase Storage
       • store in 'reports' and return.
    """

    supabase = get_supabase_client()
    session_mgr = SessionManager()
    llm        = LLMService()
    builder    = ReportsHandler(llm)

    user_id = current_user["id"]

    # ────────────────────────────────────────
    # 0) Fetch project row + diagram
    proj = (
        await safe_supabase_operation(
            lambda: supabase.from_("projects")
                           .select("*")
                           .eq("project_code", project_code)
                           .eq("user_id", user_id)
                           .single()
                           .execute(),
            "Project fetch failed"
        )
    ).data
    if not proj:
        raise HTTPException(404, "Project not found or access denied")

    diagram_state = (
        req.diagram_state or
        await session_mgr.get_diagram_from_session(req.session_id) or
        proj["diagram_state"]
    )

    # Improved validation for diagram_state
    if not diagram_state:
        raise HTTPException(400, "No diagram state found in request, session, or project data")
    
    if not isinstance(diagram_state, dict):
        raise HTTPException(400, "Invalid diagram state format - must be a dictionary")
    
    nodes = diagram_state.get("nodes", [])
    if not nodes or len(nodes) == 0:
        # Log for debugging
        log_info(f"Empty diagram nodes - diagram_state keys: {list(diagram_state.keys())}")
        log_info(f"Nodes type: {type(nodes)}, Nodes length: {len(nodes) if nodes else 'None'}")
        raise HTTPException(400, "Project has no architecture diagram nodes")
    
    # Filter out layerGroup nodes if they exist
    actual_nodes = [node for node in nodes if node.get("type") != "layerGroup"]
    if len(actual_nodes) == 0:
        raise HTTPException(400, "Project has no valid architecture diagram nodes (only layer groups found)")
    
    log_info(f"Valid diagram found with {len(actual_nodes)} nodes (filtered from {len(nodes)} total)")
    
    # Update diagram_state with filtered nodes for processing
    diagram_state["nodes"] = actual_nodes

    # hash to detect change
    diagram_hash = fast_hash(diagram_state)

    # ------------------------------------------------------------------
    # Concurrency guard – ensure only one expensive generation per hash
    # ------------------------------------------------------------------
    lock_key = f"report-lock:{project_code}:{diagram_hash}"
    lock_acquired = await acquire_report_lock(session_mgr, lock_key)

    if not lock_acquired:
        # Someone else is already generating the same report – wait until
        # lock disappears, then return the freshly cached version.
        while await session_mgr.redis_pool.exists(lock_key):
            await asyncio.sleep(2)

        # After wait, re-check cache and return if found
        cached_after_wait = (
            await safe_supabase_operation(
                lambda: supabase.from_("reports")
                               .select("*")
                               .eq("project_code", project_code)
                               .eq("diagram_hash", diagram_hash)
                               .order("created_at", desc=True)
                               .limit(1)
                               .execute(),
                "Report lookup after wait failed"
            )
        ).data
        if cached_after_wait:
            # Release lock if we happened to acquire it above but cache already existed
            await release_report_lock(session_mgr, lock_key, lock_acquired)
            return GenerateReportResponse(**cached_after_wait[0]["content"])

    # ────────────────────────────────────────
    # 1) Return cached report if same hash
    cached = (
        await safe_supabase_operation(
            lambda: supabase.from_("reports")
                           .select("*")
                           .eq("project_code", project_code)
                           .eq("diagram_hash", diagram_hash)
                           .order("created_at", desc=True)
                           .limit(1)
                           .execute(),
            "Report lookup failed"
        )
    ).data
    if cached:
        # Release lock if we happened to acquire it above but cache already existed
        await release_report_lock(session_mgr, lock_key, lock_acquired)
        return GenerateReportResponse(**cached[0]["content"])   # already in correct JSON shape

    # ────────────────────────────────────────
    # 2) Fresh generation pipeline
    try:
        # 2a) Data-flow description
        df_desc = await llm.analyze_diagram(
            diagram_content=diagram_state,
            model_provider="openai",
            model_name="gpt-4.1-mini"
        )
        log_info(f"request : {req}")
        data_flow_text = df_desc["data_flow_description"]
        
        # Create proper DFDSwitchRequest object instead of dictionary
        request_obj = DFDSwitchRequest(
            diagram_state        = diagram_state,
            session_id           = req.session_id,
            project_code         = project_code,
            data_flow_description= df_desc["data_flow_description"]   # pass narrative to avoid duplicate LLM call
        )

        # 2b) Threat analysis – run inline to avoid extra analyze_diagram call
        threats = await generate_threats_from_description(
            diagram_state=diagram_state,
            data_flow_description=data_flow_text,
            session_id=req.session_id,
            llm=llm,
            session_mgr=session_mgr,
        )

        # 2c) Capture diagram PNG – let FE keep doing `toPng` and POST it here
        diagram_png = await upload_diagram_png_if_provided(req, supabase)

        # 2d) Build sections
        sections = await builder.build(proj, diagram_state, threats, data_flow_text, diagram_png)

        # 2e) Persist report row
        report_uuid = str(uuid4())
        content_blob = GenerateReportResponse(
            report_id      = report_uuid,
            project_code   = project_code,
            generated_at   = datetime.utcnow(),
            sections       = sections,
            diagram_url    = diagram_png,
            severity_counts= threats.severity_counts
        ).model_dump(mode="json")

        await safe_supabase_operation(
            lambda: supabase.from_("reports").insert({
                "report_id": report_uuid,
                "project_code": project_code,
                "generated_by": user_id,
                "content": content_blob,
                "diagram_url": diagram_png,
                "high_risks": threats.severity_counts["HIGH"],
                "medium_risks": threats.severity_counts["MEDIUM"],
                "low_risks": threats.severity_counts["LOW"],
                "diagram_hash": diagram_hash,
            }).execute(),
            "Report insert failed"
        )

        return content_blob

    finally:
        # Ensure the Redis lock is always released
        await release_report_lock(session_mgr, lock_key, lock_acquired)
