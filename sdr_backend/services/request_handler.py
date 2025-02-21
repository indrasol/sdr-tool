from models.pydantic_models import UserRequest

async def preprocess_request(request: UserRequest) -> dict:
    """Enhance user input with context and security rules"""
    return {
        "query": request.user_input,
        "context": {
            "nodes": request.diagram_context.nodes,
            "edges": request.diagram_context.edges,
            "compliance": request.compliance_standards,
            "project": request.project_id
        }
    }