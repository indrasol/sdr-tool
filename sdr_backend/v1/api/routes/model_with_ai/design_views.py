from __future__ import annotations

"""Design Views API (Phase-4).

Provides:
• GET /v2/design/view – returns a rendered view payload (ReactFlow, C4, D2 …)
• GET /v2/design/icon_theme – returns current icon registry (with optional theme parameter)

Both endpoints live under the *model_with_ai* namespace like the other design routes.
"""

import json
import hashlib
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import JSONResponse

from core.ir.view_emitters import get_emitter
from core.ir.ir_types import IRGraph
from utils.logger import log_info, log_error

# Supabase path
from services.supabase_manager import SupabaseManager


router = APIRouter(prefix="/v2/design")

# ---------------------------------------------------------------------------
#  Helpers – load IRGraph from DB (simplified placeholder)
# ---------------------------------------------------------------------------

async def _fetch_ir_graph(sp: SupabaseManager, diagram_id: int) -> IRGraph:
    log_info(f"IR View API: Fetching IR graph for diagram {diagram_id}")
    try:
        ir_json = await sp.get_diagram_ir(diagram_id)
        log_info(f"IR View API: Successfully retrieved IR JSON for diagram {diagram_id}")
    except ValueError as ve:
        log_error(f"IR View API: Diagram {diagram_id} not found - {ve}")
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        log_error(f"IR View API: Error fetching diagram {diagram_id} - {e}")
        raise HTTPException(status_code=500, detail="Failed fetching IR")

    try:
        graph = IRGraph.model_validate(ir_json)
        log_info(f"IR View API: Successfully validated IR graph for diagram {diagram_id} - {len(graph.nodes)} nodes, {len(graph.edges)} edges")
        return graph
    except Exception as e:
        log_error(f"IR View API: Invalid IR JSON for diagram {diagram_id}: {e}")
        raise HTTPException(status_code=500, detail="Malformed IR data")

# ---------------------------------------------------------------------------
#  Endpoints
# ---------------------------------------------------------------------------

@router.get("/view")
async def get_view(
    view: str = Query("reactflow", description="Emitter id e.g. reactflow|d2|c4ctx"),
    diagram_id: int = Query(..., description="Diagram primary key"),
    sp: SupabaseManager = Depends(SupabaseManager.get_instance),
):
    """Return the requested *view* for a given diagram (IR → view emitter)."""
    log_info(f"IR View API: Received view request - diagram={diagram_id}, view={view}")
    
    graph = await _fetch_ir_graph(sp, diagram_id)

    try:
        emitter = get_emitter(view)
        log_info(f"IR View API: Using {view} emitter to generate response")
        
        payload = emitter.emit(graph)
        
        log_info(f"IR View API: Successfully generated {view} view for diagram {diagram_id}")
        return JSONResponse(content=payload)
    except Exception as e:
        log_error(f"IR View API: Error generating {view} view for diagram {diagram_id} - {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate {view} view: {str(e)}")

@router.get("/icon_theme")
async def get_icon_theme(
    theme: str = Query(None, description="Optional theme identifier"),
    response: Response = None,
):
    """Return the icon registry based on the requested theme.
    
    Implements ETag-based caching so clients can avoid redundant transfers.
    """
    log_info(f"IR View API: Received icon theme request - theme={theme or 'default'}")
    
    # For now, a simple implementation returning a mock registry
    registry = {
        "Service": "mdi:application",
        "Client": "mdi:monitor-dashboard",
        "Database": "mdi:database",
        "Queue": "mdi:message-queue",
        "Cache": "mdi:lightning-bolt",
        "Function": "mdi:function",
        "Auth": "mdi:shield-account",
        "Gateway": "mdi:api",
        "LB": "mdi:scale-balance",
        "Firewall": "mdi:security-network",
    }
    
    # Generate ETag based on content
    etag = hashlib.md5(json.dumps(registry).encode()).hexdigest()
    
    if response:
        response.headers["ETag"] = etag
        
    log_info(f"IR View API: Returning icon theme with {len(registry)} icons and ETag {etag}")
    return registry 