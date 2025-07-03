from fastapi import APIRouter, Depends, HTTPException
from services.auth_handler import verify_token
from models.data_flow_models import DesignGraph, DataFlowResponse
from services.mermaid_service import build_sequence_diagram, build_flowchart
from utils.logger import log_info

router = APIRouter()

@router.post("/data-flow", response_model=DataFlowResponse)
async def generate_data_flow(
    request: DesignGraph,
    current_user: dict = Depends(verify_token)
):
    """Generate Mermaid sequence diagram from architecture graph."""
    try:
        log_info(f"Building sequence diagram for project {request.project_id} by user {current_user['id']}")
        mermaid_code = build_sequence_diagram(request.nodes, request.edges)
        return DataFlowResponse(mermaid_code=mermaid_code)
    except Exception as exc:
        log_info(f"Data flow generation failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

# NEW endpoint: generate Mermaid flowchart from architecture graph

@router.post("/data-flow/flowchart", response_model=DataFlowResponse)
async def generate_data_flow_flowchart(
    request: DesignGraph,
    current_user: dict = Depends(verify_token)
):
    """Generate Mermaid flowchart diagram from architecture graph."""
    try:
        log_info(f"Building flowchart for project {request.project_id} by user {current_user['id']}")
        mermaid_code = build_flowchart(request.nodes, request.edges)
        return DataFlowResponse(mermaid_code=mermaid_code)
    except Exception as exc:
        log_info(f"Flowchart generation failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc)) 