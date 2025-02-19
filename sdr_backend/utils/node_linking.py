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
    
    The function supports multiple input formats for node details:
      - If an element is a dict, it may have keys like 'node_name', 'current_name', 'old_name', and 'new_name'.
      - If an element is a string, it will be treated as the node name.
    """

    log_info("Entering auto_link_with_user_nodes")
    log_info(f"User defined nodes: {user_defined_nodes}")


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

    log_info(f"Node details: {node_details}")

    # Ensure node_details is always a list
    if isinstance(node_details, dict):
        node_details = [node_details]  # Convert single node dict to list

    if not isinstance(node_details, list):
        log_info(f"Invalid node_details format: {node_details}")
        return {"status": "error", "message": "Invalid node details format"}

    # Process each node detail
    for node_detail in node_details:
        # Support both dict and string formats:
        log_info(f"Processing node detail: {node_detail}")
        search_name = ""
        target_name = ""

        if isinstance(node_detail, dict):
            # Priority: if rename intent is provided via old_name/new_name
            if "old_name" in node_detail and "new_name" in node_detail:
                search_name = node_detail["old_name"].strip()
                target_name = node_detail["new_name"].strip()
            # Fallback: use current_name/new_name if available.
            elif "current_name" in node_detail and "new_name" in node_detail:
                search_name = node_detail["current_name"].strip()
                target_name = node_detail["new_name"].strip()
            # Otherwise, use node_name if present.
            elif "node_name" in node_detail:
                search_name = node_detail["node_name"].strip()
                target_name = search_name
            else:
                # Fallback: use the string representation.
                search_name = str(node_detail).strip()
                target_name = search_name
        elif isinstance(node_detail, str):
            search_name = node_detail.strip()
            target_name = search_name
        else:
            action_results.append(f"Invalid node detail format: {node_detail}")
            continue

        if not search_name:
            action_results.append("Empty node name encountered; skipping.")
            continue

        log_info(f"Searching for node with: '{search_name}' and target label: '{target_name}'.")

        # log_info(f"Updated Nodes: {updated_nodes}")
        # log_info(f"Updated Nodes items: {updated_nodes.items()}")
        # log_info(f"Updated Nodes items: {updated_nodes}")

        # log_info(f"Looking for node: '{node_name.strip().lower()}' in existing nodes.")
        # for node_id, node in updated_nodes.items():
        #     log_info(f"Checking against: '{node['data']['label'].strip().lower()}' (Node ID: {node_id})")

        # Find existing node by matching the search_name in the node label (case-insensitive).
        existing_node = next(
            (node for node in updated_nodes.values() if search_name.lower() in node["data"]["label"].strip().lower()),
            None
        )
        log_info(f"Existing node found: {existing_node}")

        # Check if the node action is add
        if action == "add":
            log_info(f"Entering Add node: {search_name}")
            if existing_node:
                action_results.append(f"Node {search_name} already exists. Consider modifying instead of adding.")
            else:
                new_node_id = generate_new_node_id()
                new_node = {
                    "id": new_node_id,
                    "type": "default",
                    "data": {"label": target_name},
                    "position": {"x": 200, "y": 200}  # Example: Default auto-positioning
                }
                nodes_to_add.append(new_node)
                updated_nodes[new_node_id] = new_node
                action_results.append(f"Node '{target_name}' added.")

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

        # Check if the node action is modify or update
        elif action in ["modify", "update"]:
            log_info(f"Modify/Update action for node: '{search_name}'")
            if existing_node:
                current_label = existing_node["data"]["label"].strip()
                # If target_name differs, update it.
                if current_label.lower() != target_name.lower():
                    log_info(f"Updating node label from '{current_label}' to '{target_name}'.")
                    existing_node["data"]["label"] = target_name
                    nodes_to_update.append(existing_node)
                    action_results.append(f"Node '{search_name}' updated to '{target_name}'.")
                else:
                    action_results.append(f"Node '{search_name}' already has the label '{target_name}', no update needed.")
            else:
                action_results.append(f"Node '{search_name}' not found. Consider adding instead.")

        # Check if the node action is remove or delete
        elif action in ["remove", "delete"]:
            log_info(f"Entering remove node: {search_name}")
            if existing_node:
                node_id = existing_node["id"]
                log_info(f"Entering existing remove node: {existing_node}")
                nodes_to_remove.append(existing_node)
                updated_nodes.pop(node_id, None)

                log_info(f"Updated nodes: {updated_nodes}")
                log_info(f"Updated edges: {updated_edges}")

                # Remove associated edges
                edges_to_remove.extend(
                    [edge for edge in updated_edges if edge["source"] == node_id or edge["target"] == node_id]
                )
                updated_edges = [edge for edge in updated_edges if edge["source"] != node_id and edge["target"] != node_id]

                log_info(f"Updated edges: {updated_edges}")
                action_results.append(f"Node '{search_name}' and its edges removed.")
            else:
                action_results.append(f"Node '{search_name}' not found for removal.")

        else:
            action_results.append(f"Unknown action: {action} for node: {search_name}")
        log_info(f"Action results: {action_results}")

    # else:
    #     action_results.append(f"Invalid node detail format: {node_detail}")

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

