from typing import Dict, Any

def find_best_match(partial_name: str, user_defined_nodes: Dict[str, Dict]) -> Dict[str, Any]:
    """
    Find the best matching node by partial name from user-defined nodes.
    Returns the matched node or None.
    """
    partial_name = partial_name.strip().lower()
    return next(
        (node_data for node_data in user_defined_nodes.values() if partial_name in node_data["data"]["label"].strip().lower()),
        None
    )