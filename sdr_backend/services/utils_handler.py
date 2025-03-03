from typing import Dict, List, Optional
from models.new_pydantic_models import ArchitectureResponse

async def apply_diagram_changes(current_diagram: Dict[str, List[Dict]], response: ArchitectureResponse) -> Dict[str, List[Dict]]:
    """
    Apply changes from ArchitectureResponse to the current diagram state with robust error handling.

    Args:
        current_diagram: The existing diagram state with "nodes" and "edges" keys.
        response: The ArchitectureResponse containing diagram changes.

    Returns:
        Updated diagram state.

    Raises:
        ValueError: If any change cannot be applied due to inconsistencies or invalid data.
    """
    # Create a deep copy to avoid modifying the original
    updated_diagram = {
        "nodes": current_diagram.get("nodes", []).copy(),
        "edges": current_diagram.get("edges", []).copy()
    }

    # Helper function to find a node by ID
    def get_node_by_id(node_id: str) -> Optional[Dict]:
        return next((n for n in updated_diagram["nodes"] if n["id"] == node_id), None)

    # **Remove Nodes**
    for node_id in response.nodes_to_remove:
        if not node_id or not isinstance(node_id, str):
            raise ValueError(f"Invalid node ID for removal: {node_id}")
        if get_node_by_id(node_id) is None:
            raise ValueError(f"Cannot remove non-existent node: {node_id}")
        updated_diagram["nodes"] = [n for n in updated_diagram["nodes"] if n["id"] != node_id]

    # **Update Nodes**
    for update in response.nodes_to_update:
        if not isinstance(update.id, str) or not update.id:
            raise ValueError(f"Invalid node ID for update: {update.id}")
        node = get_node_by_id(update.id)
        if node is None:
            raise ValueError(f"Cannot update non-existent node: {update.id}")
        # Merge updates into the existing node
        node.update(update.dict(exclude_unset=True))

    # **Add New Nodes**
    for node in response.nodes_to_add:
        if not isinstance(node.id, str) or not node.id:
            raise ValueError(f"Invalid node ID for addition: {node.id}")
        if get_node_by_id(node.id) is not None:
            raise ValueError(f"Node ID already exists: {node.id}")
        updated_diagram["nodes"].append(node.dict())

    # **Remove Edges**
    for edge_id in response.edges_to_remove:
        if not edge_id or not isinstance(edge_id, str):
            raise ValueError(f"Invalid edge ID for removal: {edge_id}")
        if not any(e["id"] == edge_id for e in updated_diagram["edges"]):
            raise ValueError(f"Cannot remove non-existent edge: {edge_id}")
        updated_diagram["edges"] = [e for e in updated_diagram["edges"] if e["id"] != edge_id]

    # **Update Edges**
    for update in response.edges_to_update:
        if not isinstance(update.id, str) or not update.id:
            raise ValueError(f"Invalid edge ID for update: {update.id}")
        edge = next((e for e in updated_diagram["edges"] if e["id"] == update.id), None)
        if edge is None:
            raise ValueError(f"Cannot update non-existent edge: {update.id}")
        edge.update(update.dict(exclude_unset=True))

    # **Add New Edges**
    for edge in response.edges_to_add:
        if not isinstance(edge.id, str) or not edge.id:
            raise ValueError(f"Invalid edge ID for addition: {edge.id}")
        if not edge.source or not edge.target:
            raise ValueError(f"Edge missing source or target: {edge.id}")
        if get_node_by_id(edge.source) is None or get_node_by_id(edge.target) is None:
            raise ValueError(f"Edge references non-existent nodes: {edge.source} -> {edge.target}")
        updated_diagram["edges"].append(edge.dict())

    return updated_diagram