from typing import Dict, Any, List
from models.pydantic_models import ArchitectureResponse, ExpertResponse
from utils.logger import log_info

class ValidationHandler:
    async def validate_architecture_response(
        self, response: ArchitectureResponse, current_diagram: Dict[str, List[Dict[str, Any]]]
    ) -> None:
        """
        Validate architecture response against the current diagram state.

        Args:
            response: The ArchitectureResponse object containing changes.
            current_diagram: The existing diagram state with nodes and edges.

        Raises:
            ValueError: If validation fails (e.g., invalid node references).
        """
        # Extract current node IDs
        current_node_ids = {node["id"] for node in current_diagram.get("nodes", [])}

        # Check nodes_to_update exist in current diagram
        for node_id in response.nodes_to_update:
            if node_id not in current_node_ids:
                raise ValueError(f"Node to update not found in current diagram: {node_id}")

        # Check nodes_to_remove exist in current diagram
        for node_id in response.nodes_to_remove:
            if node_id not in current_node_ids:
                raise ValueError(f"Node to remove not found in current diagram: {node_id}")

        # Validate edges: check if source/target nodes exist or are being added
        all_node_ids = current_node_ids.union(node.id for node in response.nodes_to_add)
        all_node_ids.difference_update(response.nodes_to_remove)  # Account for removals
        for edge in response.edges_to_add + response.edges_to_update:
            if edge.source not in all_node_ids or edge.target not in all_node_ids:
                raise ValueError(f"Edge references invalid nodes: {edge.source} -> {edge.target}")

        # Check for duplicate IDs in nodes_to_add
        new_node_ids = [node.id for node in response.nodes_to_add]
        if len(new_node_ids) != len(set(new_node_ids)):
            duplicates = [id for id in set(new_node_ids) if new_node_ids.count(id) > 1]
            raise ValueError(f"Duplicate node IDs in nodes_to_add: {duplicates}")

        # Ensure new nodes don’t conflict with existing nodes
        for node_id in new_node_ids:
            if node_id in current_node_ids:
                raise ValueError(f"Node ID already exists in current diagram: {node_id}")

    async def validate_expert_response(self, response: ExpertResponse) -> None:
        """
        Validate expert response content.

        Args:
            response: The ExpertResponse object.

        Raises:
            ValueError: If content is invalid.
        """
        if len(response.content.strip()) < 10:
            log_info("Expert content too short.")
            raise ValueError("Content must be at least 10 characters long.")