import uuid
import re
from utils.logger import log_info
from typing import Dict, List

def auto_link_with_user_nodes(node_details: List[Dict], action: str, user_defined_nodes: Dict[str, Dict], edges: List[Dict]) -> Dict:
    """
    Modifies the existing ReactFlow diagram by:
    - Adding/Modifying/Linking nodes intelligently.
    - Maintaining user-defined positions and connections.
    - Handling multiple nodes in a single action.
    """
    log_info(f"Entering auto_link_with_user_nodes")
    # Create a copy of the user-defined nodes and edges to modify
    updated_nodes = {node['id']: node for node in user_defined_nodes.values()}
    updated_edges = edges.copy()

    # Helper function to find the next available node ID
    def generate_new_node_id() -> str:
        return f"node{len(updated_nodes) + 1}"
    

    action_results = []
    nodes_to_add = []
    nodes_to_update = []
    nodes_to_remove = []
    edges_to_add = []
    edges_to_remove = []

    for node_detail in node_details:
        if isinstance(node_detail, dict):
            node_name = node_detail.get('node_name', '').strip()
            attributes = node_detail.get('attributes', {})

            # Find existing node by name
            existing_node = next(
                (node_id for node_id, node in updated_nodes.items() if node["data"].get("label") == node_name), 
                None
            )

            # Check if the node action is add, modify, or remove
            if action == "add":
                if existing_node:
                    action_results.append(f"Node {node_name} already exists. Consider modifying instead of adding.")
                else:
                    new_node_id = generate_new_node_id()
                    new_node = {
                        "id": new_node_id,
                        "type": "default",
                        "data": {"label": node_name},
                        "position": {"x": 200, "y": 200}  # Example: Default auto-positioning
                    }
                    nodes_to_add.append(new_node)
                    updated_nodes[new_node_id] = new_node
                    action_results.append(f"Node '{node_name}' added.")

                    # Auto-link new node to last existing node
                    if len(updated_nodes) > 1:
                        last_node = list(updated_nodes.values())[-2]
                        new_edge = {
                            "source": last_node["id"],
                            "target": new_node_id,
                            "id": f"edge_{last_node['id']}_{new_node_id}"
                        }
                        edges_to_add.append(new_edge)
                        updated_edges.append(new_edge)

            elif action in ["modify","update"]:
                # For modify action, node_name is used to identify the node
                if existing_node:
                    existing_node["data"]["label"] = node_name
                    nodes_to_update.append(existing_node)
                    action_results.append(f"Node '{node_name}' updated.")
                else:
                    action_results.append(f"Node '{node_name}' not found. Consider adding instead.")

            elif action == "remove":
                if existing_node:
                    nodes_to_remove.append(existing_node["id"])
                    updated_nodes.pop(existing_node["id"], None)

                    # ✅ Remove associated edges
                    edges_to_remove.extend(
                        [edge for edge in updated_edges if edge["source"] == existing_node["id"] or edge["target"] == existing_node["id"]]
                    )
                    updated_edges = [edge for edge in updated_edges if edge["source"] != existing_node["id"] and edge["target"] != existing_node["id"]]

                    action_results.append(f"Node '{node_name}' and its edges removed.")
                else:
                    action_results.append(f"Node '{node_name}' not found for removal.")

            else:
                action_results.append(f"Unknown action: {action} for node: {node_name}")
            log_info(f"Action results: {action_results}")

        else:
            action_results.append(f"Invalid node detail format: {node_detail}")

    return {
        "status": "success",
        "message": ", ".join(action_results),
        "nodes": {
            "add": nodes_to_add,
            "update": nodes_to_update,
            "remove": nodes_to_remove
        },
        "edges": {
            "add": edges_to_add,
            "remove": edges_to_remove
        }
    }

