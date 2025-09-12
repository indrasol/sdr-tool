from __future__ import annotations

"""sdr_backend.services.diagrams_service

Utility helpers for working with *mingrammer/diagrams* source-code snippets.
The main entry point is ``parse_diagrams_code`` which converts a Python
snipped written for the *diagrams* library into a serialisable
``{"nodes": [...], "edges": [...], "clusters": [...]}`` structure that our
front-end can render with React Flow.
"""

import ast
from typing import Dict, Any, List
import textwrap
from utils.logger import log_info
import json
from rapidfuzz import process, fuzz
import os
import networkx as nx
import re
from typing import List, Tuple

# ---------- Core Layout Function ----------
def compute_layout(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
    """
    Build a graph using NetworkX and compute node positions with a layout algorithm.
    Returns dictionary {node_id: {"x": float, "y": float}}
    """

    G = nx.DiGraph()

    # Add nodes
    for node in nodes:
        G.add_node(node["id"])

    # Add edges
    for edge in edges:
        G.add_edge(edge["source"], edge["target"])

    # Compute layout positions
    # 'spring_layout' tries to position nodes aesthetically like a force-directed graph
    # pos=nx.kamada_kawai_layout(G)
    # pos=nx.planar_layout(G)
    pos = nx.spring_layout(G, k=1.5, scale=500)

    # Convert numpy floats to standard Python floats for JSON serialization
    return {n: {"x": float(p[0]), "y": float(p[1])} for n, p in pos.items()}


# ---------------------------------------------------------------------------
#  Public helpers
# ---------------------------------------------------------------------------


# Get absolute path to this file's directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Build path to cloud_icons.json inside services folder
json_path = os.path.join(BASE_DIR, "cloud_icons.json")

# Load cloud icons with fallback
try:
    with open(json_path, "r", encoding="utf-8") as f:
        cloud_icons = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    # Fallback if cloud_icons.json doesn't exist
    cloud_icons = {}


def normalize_class_name(cls: str) -> str:
    """
    Normalize the class name for better matching:
    - Strip whitespace
    - Convert kebab-case or snake_case to CamelCase where possible
    - Handle acronyms (EC2, IAM, API, DB, VPC, KMS)
    """
    cls = cls.strip()
    cls = re.sub(r'-([a-z])', lambda m: m.group(1).upper(), cls)
    cls = re.sub(r'_([a-z])', lambda m: m.group(1).upper(), cls)

    acronyms = {
        'ec2': 'EC2', 'iam': 'IAM', 'api': 'API',
        'db': 'DB', 'vpc': 'VPC', 'kms': 'KMS'
    }
    for lower, upper in acronyms.items():
        cls = re.sub(rf'\b{re.escape(lower)}\b', upper, cls, flags=re.IGNORECASE)
    return cls


def camel_case_match(cls: str, candidates: List[str]) -> Tuple[str, int]:
    """
    Try to match acronyms like 'KMS' against CamelCase class names.
    Example: 'KMS' should match 'KeyManagementServiceKMS'.
    """
    for candidate in candidates:
        acronym = ''.join([w[0] for w in re.findall(r'[A-Z][a-z]*', candidate)])
        if cls.upper() == acronym:
            return candidate, 100
    return "", 0


def _alias_acronym(alias: str) -> str:
    """Extract acronym from an alias by taking uppercase letters.

    Example: 'DynamodbGSI' -> 'DGSI', 'ECR' -> 'ECR', 'DocumentDB' -> 'DDB'.
    """
    caps = ''.join(ch for ch in alias if ch.isupper())
    return caps or alias.upper()


def _candidate_acronym(name: str) -> str:
    """Build acronym from CamelCase candidate name.

    Example: 'EC2ContainerRegistry' -> 'ECR', 'DynamodbGlobalSecondaryIndex' -> 'DGSI'.
    """
    parts = re.findall(r'[A-Z][a-z]*\d*', name)
    return ''.join(p[0] for p in parts)


def resolve_icon_path(path_list: List[str], icons_data: dict, score_threshold: int = 85) -> List[str]:
    if not path_list or len(path_list) < 3:
        return path_list

    provider, category, cls = path_list

    # 1. Direct match using provider+category+class (strongest)
    classes_dict = icons_data.get(provider, {}).get(category, {})
    if cls in classes_dict:
        return [provider, category, classes_dict[cls]]

    # 1b. Case-insensitive exact match
    for key, icon in classes_dict.items():
        if key.lower() == cls.lower():
            return [provider, category, icon]

    # 1c. Suffix match (e.g., QLDB -> QuantumLedgerDatabaseQldb)
    for key, icon in classes_dict.items():
        if key.lower().endswith(cls.lower()):
            return [provider, category, icon]

    # 1d. Acronym/alias match (ECR -> EC2ContainerRegistry, AKS -> KubernetesServices, DGSI -> DynamodbGlobalSecondaryIndex)
    alias_acro = _alias_acronym(cls)
    for key, icon in classes_dict.items():
        if _candidate_acronym(key).upper() == alias_acro:
            return [provider, category, icon]

    # Compute normalized only if needed for lenient matching
    normalized_cls = normalize_class_name(cls)
    if normalized_cls in classes_dict:
        return [provider, category, classes_dict[normalized_cls]]

    # 2. If provider exists but category is wrong → search across provider categories
    if provider in icons_data and not classes_dict:
        best_match = None
        best_score = 0
        best_category = None
        best_icon = None
        for cat, sub_dict in icons_data[provider].items():
            if cls in sub_dict:
                return [provider, cat, sub_dict[cls]]
            # Case-insensitive
            for key, icon in sub_dict.items():
                if key.lower() == cls.lower():
                    return [provider, cat, icon]
            # Suffix
            for key, icon in sub_dict.items():
                if key.lower().endswith(cls.lower()):
                    return [provider, cat, icon]
            # Acronym
            for key, icon in sub_dict.items():
                if _candidate_acronym(key).upper() == alias_acro:
                    return [provider, cat, icon]
            if normalized_cls in sub_dict:
                return [provider, cat, sub_dict[normalized_cls]]
            try:
                # Looser partial ratio for long aliases (e.g., DocumentDB)
                partial_threshold = 80 if len(cls) >= 8 else 90
                match, score, _ = process.extractOne(
                    normalized_cls, sub_dict.keys(), scorer=fuzz.partial_ratio
                )
                if score >= partial_threshold and match in sub_dict:
                    return [provider, cat, sub_dict[match]]
                # Fallback to WRatio
                match, score, _ = process.extractOne(
                    normalized_cls, sub_dict.keys(), scorer=fuzz.WRatio
                )
                if score > best_score:
                    best_score = score
                    best_match = match
                    best_category = cat
                    best_icon = sub_dict[match]
            except:
                pass
        if best_score >= score_threshold and best_category:
            return [provider, best_category, best_icon]

    # 3. CamelCase acronym match (like KMS → KeyManagementServiceKMS)
    candidate, score = camel_case_match(normalized_cls, list(classes_dict.keys()))
    if score == 100:
        return [provider, category, classes_dict[candidate]]

    # 4. Fuzzy matching (partial ratio first, then WRatio)
    if classes_dict:
        try:
            best_match, score, _ = process.extractOne(
                normalized_cls, classes_dict.keys(), scorer=fuzz.partial_ratio
            )
            if score >= 90:
                return [provider, category, classes_dict[best_match]]
        except:
            pass

        try:
            best_match, score, _ = process.extractOne(
                normalized_cls, classes_dict.keys(), scorer=fuzz.WRatio
            )
            if score >= score_threshold:
                return [provider, category, classes_dict[best_match]]
        except:
            pass

    return [provider, category, cls]


def get_default_icon_for_category(provider: str, category: str) -> Tuple[str, str]:
    defaults = {
        'compute': 'instance',
        'database': 'database',
        'network': 'internet-gateway',
        'storage': 'storage',
        'security': 'key-management-service',
        'analytics': 'analytics',
    }
    default_icon = defaults.get(category, 'storage')
    classes_dict = cloud_icons.get(provider, {}).get(category, {})
    if default_icon in classes_dict:
        return category, classes_dict[default_icon]
    return category, default_icon


def get_icon_url(node_type: str) -> str:
    parts = node_type.split(".")
    if len(parts) < 2:
        return (
            "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/"
            "onprem/network/internet.png"
        )

    if len(parts) == 2:
        category, cls = parts
        provider = "generic"
        normalized_cls = normalize_class_name(cls)
        icon_path = resolve_icon_path([provider, category, normalized_cls], cloud_icons)
        if icon_path[2] == normalized_cls:
            _, default_icon = get_default_icon_for_category(provider, category)
            icon_path[2] = default_icon
        return (
            "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/"
            f"{provider}/{icon_path[1]}/{icon_path[2]}.png"
        )

    provider, category, cls = parts[:3]
    normalized_cls = normalize_class_name(cls)
    icon_path = resolve_icon_path([provider, category, normalized_cls], cloud_icons)
    if icon_path[2] == normalized_cls:
        _, default_icon = get_default_icon_for_category(provider, category)
        icon_path[2] = default_icon
    return (
        "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/"
        f"{provider}/{icon_path[1]}/{icon_path[2]}.png"
    )


# # Get absolute path to this file's directory
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# # Build path to cloud_icons.json inside services folder
# json_path = os.path.join(BASE_DIR, "cloud_icons.json")

# # Load cloud icons with fallback
# try:
#     with open(json_path, "r", encoding="utf-8") as f:
#         cloud_icons = json.load(f)
# except (FileNotFoundError, json.JSONDecodeError):
#     # Fallback if cloud_icons.json doesn't exist
#     cloud_icons = {}


# def resolve_icon_path(path_list, icons_data, score_threshold=85):
#     """
#     Given [provider, category, class], return [provider, category, icon-name].
#     Matching priority:
#       1. Direct match
#       2. Case-insensitive match
#       3. Suffix match
#       4. Fuzzy match (score >= threshold)
#     """
#     if not path_list or len(path_list) < 3:
#         return path_list
    
#     provider, category, cls = path_list
#     classes_dict = icons_data.get(provider, {}).get(category, {})
#     log_info(f"Classes dict: {classes_dict}")

#     # 1. Direct match
#     if cls in classes_dict:
#         return [provider, category, classes_dict[cls]]

#     # 2. Case-insensitive match
#     for key, icon in classes_dict.items():
#         if key.lower() == cls.lower():
#             return [provider, category, icon]

#     # 3. Suffix match (e.g., IAM → IdentityAndAccessManagementIam)
#     for key, icon in classes_dict.items():
#         if key.lower().endswith(cls.lower()):
#             return [provider, category, icon]

#     # 4. Fuzzy match (best-effort)
#     if classes_dict:
#         try:
#             best_match, score, _ = process.extractOne(
#                 cls,
#                 classes_dict.keys(),
#                 scorer=fuzz.WRatio
#             )
#             if score >= score_threshold:
#                 return [provider, category, classes_dict[best_match]]
#         except:
#             pass

#     # Not found
#     return [provider, category, cls]


# def get_icon_url(node_type: str) -> str:
#     """Return a CDN URL pointing to the SVG/PNG for *node_type*."""
#     log_info(f"Node type: {node_type}")

#     parts = node_type.split(".")
#     log_info(f"Parts: {parts}")
#     icon_path = resolve_icon_path(parts, cloud_icons)
#     log_info(f"Icon path: {icon_path}")

#     # Typical structure: provider.module.NodeClass
#     if len(parts) == 3:
#         provider, module, node_name = icon_path
#         return (
#             "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/"
#             f"{provider}/{module}/{node_name}.png"
#         )

#     # Fallback for generic: e.g. "compute.Rack" (treated as generic/compute)
#     if len(parts) == 2:
#         module, node_name = icon_path
#         return (
#             "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/"
#             f"generic/{module}/{node_name}.png"
#         )

#     # Absolute fallback – internet icon.
#     return (
#         "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/onprem/"
#         "network/internet.png"
#     )


# ---------------------------------------------------------------------------
#  AST parsing helpers
# ---------------------------------------------------------------------------

def _clean_code(code_str: str) -> str:
    """Remove Markdown code-block fences (``` or ```python"""
    lines = [
        ln for ln in code_str.splitlines(keepends=False)
        if not ln.lstrip().startswith("```")
    ]
    return textwrap.dedent("\n".join(lines)).strip()


def _build_import_map(tree: ast.Module) -> Dict[str, str]:
    """Build a mapping of class name -> full provider.module.Class."""
    import_map: Dict[str, str] = {}

    for node in tree.body:
        if isinstance(node, ast.ImportFrom):
            if node.module and node.module.startswith("diagrams."):
                module_path = node.module.replace("diagrams.", "")
                for alias in node.names:
                    class_name = alias.asname or alias.name
                    import_map[class_name] = f"{module_path}.{alias.name}"
    return import_map


def _extract_assignment(
    node: ast.Assign,
    nodes: List[Dict[str, Any]],
    node_id_map: Dict[str, str],
    current_id: int,
    import_map: Dict[str, str],
    current_cluster: str,
    clusters: List[Dict[str, Any]],
    list_var_map: Dict[str, List[str]]
) -> int:
    """Handle an ``ast.Assign`` like ``var = Provider("Label")``."""

    # Helper to add a single node from a call expression
    def _add_node_from_call(call_expr: ast.Call, var_name: str, cur_id: int) -> int:
        func = call_expr.func

        if isinstance(func, ast.Name):  # Direct class import
            node_type = import_map.get(func.id, f"generic.compute.{func.id}")
        elif isinstance(func, ast.Attribute):
            if isinstance(func.value, ast.Attribute):
                # Fully qualified: aws.compute.EC2
                provider = getattr(func.value.value, 'id', 'unknown')
                module = func.value.attr
                node_cls = func.attr
                node_type = f"{provider}.{module}.{node_cls}"
            else:
                # Single level: module.Class
                provider_module = getattr(func.value, "id", None)
                if provider_module:
                    node_type = f"{provider_module}.{func.attr}"
                else:
                    return cur_id
        else:
            return cur_id

        # Extract label from function call
        label = "Unnamed"
        if call_expr.args:
            arg0 = call_expr.args[0]
            if isinstance(arg0, ast.Constant):
                label = str(arg0.value)
            elif hasattr(arg0, 's'):  # ast.Str for older Python versions
                label = arg0.s

        # Register id mapping
        node_id_map[var_name] = var_name

        nodes.append(
            {
                "id": var_name,
                "type": "custom",
                "data": {"label": label, "iconUrl": get_icon_url(node_type)},
                "position": {"x": 0, "y": 0},
            }
        )

        # If inside a cluster, record membership
        if current_cluster:
            for cl in clusters:
                if cl["cluster_id"] == current_cluster:
                    cl["cluster_nodes"].append(var_name)
                    break

        return cur_id + 1

    # Support list or tuple of node constructor calls, e.g. lambdas = [Lambda("A"), Lambda("B")]
    if isinstance(node.value, (ast.List, ast.Tuple)):
        # Use variable name as base id prefix
        if isinstance(node.targets[0], ast.Name):
            base_name = node.targets[0].id
        else:
            base_name = f"tmp_list_{current_id}"

        element_ids: List[str] = []
        idx = 0
        for elt in getattr(node.value, 'elts', []):
            if isinstance(elt, ast.Call):
                element_var = f"{base_name}_{idx}"
                current_id = _add_node_from_call(elt, element_var, current_id)
                element_ids.append(element_var)
                idx += 1
            elif isinstance(elt, ast.Name):
                # Reference to an already defined node variable
                ref_id = node_id_map.get(elt.id)
                if ref_id:
                    element_ids.append(ref_id)
                    idx += 1
            # Ignore other element types silently

        # Map the list variable to its element node ids
        list_var_map[base_name] = element_ids
        return current_id

    if not isinstance(node.value, ast.Call):
        return current_id

    # Use variable name as node ID
    if isinstance(node.targets[0], ast.Name):
        var_name = node.targets[0].id
    else:
        var_name = f"tmp_{current_id}"
    
    return _add_node_from_call(node.value, var_name, current_id)


# ---------------------------------------------------------------------------
#  Helper to flatten chained edge expressions
# ---------------------------------------------------------------------------


def _flatten_binop(expr: ast.AST, op_type: Any) -> List[ast.AST]:
    """Recursively flatten a BinOp chain of the same *op_type* into a list of operands.

    For example, the AST for ``a >> b >> c`` is equivalent to
    BinOp(left=BinOp(left=a, op=RShift, right=b), op=RShift, right=c).
    This helper returns ``[a, b, c]`` for that structure. It preserves order.
    """
    if isinstance(expr, ast.BinOp) and isinstance(expr.op, op_type):
        return _flatten_binop(expr.left, op_type) + _flatten_binop(expr.right, op_type)
    return [expr]


def _extract_edge_pairs(expr: ast.BinOp, edges: List[Dict[str, Any]], node_id_map: Dict[str, str]):
    """Extract edges from a chained expression like ``a >> b >> Edge(label="foo") >> c``.

    It flattens the chain, preserves order, and registers edges between
    consecutive variable names. If an ``Edge(label="...")`` call appears
    between two nodes, the provided label will be carried over to the produced
    edge metadata under the ``label`` key (default is empty string).
    """

    # Determine direction and operator symbol
    if isinstance(expr.op, ast.RShift):
        op_type = ast.RShift
        reverse_direction = False  # a >> b means a -> b
    elif isinstance(expr.op, ast.LShift):
        op_type = ast.LShift
        reverse_direction = True   # a << b means b -> a
    else:
        op_type = type(expr.op)
        reverse_direction = False

    operands = _flatten_binop(expr, op_type)

    prev_name: str | None = None
    pending_label: str = ""

    for operand in operands:
        # Capture Edge(label="...") calls which convey edge labels
        if isinstance(operand, ast.Call):
            func = operand.func
            func_name = None
            if isinstance(func, ast.Name):
                func_name = func.id
            elif isinstance(func, ast.Attribute):
                func_name = func.attr

            if func_name == "Edge":
                # Determine label either from keyword or first positional argument
                extracted = False
                for kw in operand.keywords:
                    if kw.arg == "label":
                        if isinstance(kw.value, ast.Constant):
                            pending_label = str(kw.value.value)
                        elif hasattr(kw.value, "s"):
                            pending_label = kw.value.s
                        extracted = True
                        break

                # Fallback: first positional argument
                if not extracted and operand.args:
                    first_arg = operand.args[0]
                    if isinstance(first_arg, ast.Constant):
                        pending_label = str(first_arg.value)
                    elif hasattr(first_arg, "s"):
                        pending_label = first_arg.s

            # Calls are not node names, skip further processing
            continue

        # We only treat ast.Name as actual node identifiers
        if isinstance(operand, ast.Name):
            current_name = operand.id

            if prev_name is not None:
                src_id = node_id_map.get(prev_name)
                tgt_id = node_id_map.get(current_name)

                if reverse_direction:
                    src_id, tgt_id = tgt_id, src_id

                if src_id and tgt_id:
                    edge_id = f"{src_id}_{tgt_id}"
                    if not any(e["id"] == edge_id for e in edges):
                        edges.append({
                            "id": edge_id,
                            "source": src_id,
                            "target": tgt_id,
                            "label": pending_label or "",
                        })

            # Prepare for next pair
            prev_name = current_name
            pending_label = ""  # Reset after use

    # End for


# ---------------------------------------------------------------------------
#  Updated edge extraction that can handle chained operations
# ---------------------------------------------------------------------------


def _extract_edge_expression(
    node: ast.Expr,
    edges: List[Dict[str, Any]],
    node_id_map: Dict[str, str]
):
    """Handle edge expressions including chained & labeled edges.

    Supports:
        * a >> b
        * a >> b >> c
        * a >> Edge(label="foo") >> b
        * a << b (direction reversed)
        * a - b (simple link)
    """

    # Only interested in binary operations
    if not isinstance(node.value, ast.BinOp):
        return

    expr = node.value

    # Special handling for simple '-' which isn't usually chained
    if isinstance(expr.op, ast.Sub):
        left_id = getattr(expr.left, "id", None)
        right_id = getattr(expr.right, "id", None)
        if left_id and right_id:
            src = node_id_map.get(left_id)
            tgt = node_id_map.get(right_id)
            if src and tgt:
                edge_id = f"{src}_{tgt}"
                if not any(edge["id"] == edge_id for edge in edges):
                    edges.append(
                        {
                            "id": edge_id,
                            "source": src,
                            "target": tgt,
                            "operator": "-",
                        }
                    )
        return

    # Handle chained >> or << expressions (possibly with Edge(...) in between)
    _extract_edge_pairs(expr, edges, node_id_map)


def _is_cluster_context(context_expr: ast.AST) -> bool:
    """Check if the context expression represents a Cluster."""
    if isinstance(context_expr, ast.Call):
        if isinstance(context_expr.func, ast.Name):
            return context_expr.func.id == "Cluster"
        elif isinstance(context_expr.func, ast.Attribute):
            return context_expr.func.attr == "Cluster"
    return False


def _extract_cluster_name(context_expr: ast.Call) -> str:
    """Extract cluster name from Cluster() call."""
    if context_expr.args:
        arg0 = context_expr.args[0]
        if isinstance(arg0, ast.Constant):
            return str(arg0.value)
        elif hasattr(arg0, 's'):  # ast.Str for older Python versions
            return arg0.s
    return "Unnamed Cluster"


def _extract_from_body(
    body,
    nodes,
    edges,
    clusters,
    node_id_map,
    current_id,
    import_map,
    cluster_stack=None,
    current_cluster=None,
    list_var_map: Dict[str, List[str]] | None = None,
):
    """Walk statements, handling clusters, assignments, and edges."""
    if cluster_stack is None:
        cluster_stack = []
    if list_var_map is None:
        list_var_map = {}

    for stmt in body:
        if isinstance(stmt, ast.With):
            if stmt.items:
                context_expr = stmt.items[0].context_expr

                if _is_cluster_context(context_expr):
                    cluster_name = _extract_cluster_name(context_expr)
                    cluster_id = cluster_name.lower().replace(" ", "_").replace("-", "_")

                    # Make cluster ID unique if needed
                    original_id = cluster_id
                    counter = 1
                    while any(cl["cluster_id"] == cluster_id for cl in clusters):
                        cluster_id = f"{original_id}_{counter}"
                        counter += 1

                    clusters.append({
                        "cluster_id": cluster_id,
                        "cluster_label": cluster_name,
                        "cluster_nodes": [],
                        # parent list for nesting
                        "cluster_parent": [current_cluster] if current_cluster else []
                    })

                    # Push current cluster, set new one
                    cluster_stack.append(current_cluster)
                    current_cluster = cluster_id

                    current_id = _extract_from_body(
                        stmt.body, nodes, edges, clusters, node_id_map,
                        current_id, import_map, cluster_stack, current_cluster, list_var_map
                    )

                    # Pop back to previous cluster
                    current_cluster = cluster_stack.pop() if cluster_stack else None

                else:
                    # Non-cluster with-block (like Diagram)
                    current_id = _extract_from_body(
                        stmt.body, nodes, edges, clusters, node_id_map,
                        current_id, import_map, cluster_stack, current_cluster, list_var_map
                    )

        elif isinstance(stmt, ast.Assign):
            current_id = _extract_assignment(
                stmt, nodes, node_id_map, current_id, import_map,
                current_cluster, clusters, list_var_map
            )

        elif isinstance(stmt, ast.For):
            # Handle simple for-loops: for <name> in <iterable>:
            loop_var_name = None
            if isinstance(stmt.target, ast.Name):
                loop_var_name = stmt.target.id

            element_ids: List[str] = []

            # Materialize iterable elements into node ids
            if isinstance(stmt.iter, ast.Name):
                element_ids = list_var_map.get(stmt.iter.id, [])
            elif isinstance(stmt.iter, (ast.List, ast.Tuple)):
                # Inline literal iterable in the for-loop
                idx = 0
                for elt in getattr(stmt.iter, 'elts', []):
                    if isinstance(elt, ast.Call) and loop_var_name:
                        temp_name = f"{loop_var_name}_{idx}"
                        # Reuse assignment helper to add nodes
                        fake_assign = ast.Assign(targets=[ast.Name(id=temp_name)], value=elt)
                        current_id = _extract_assignment(
                            fake_assign, nodes, node_id_map, current_id, import_map,
                            current_cluster, clusters, list_var_map
                        )
                        element_ids.append(temp_name)
                        idx += 1
                    elif isinstance(elt, ast.Name):
                        ref_id = node_id_map.get(elt.id)
                        if ref_id:
                            element_ids.append(ref_id)

            # Iterate body once for each element, binding loop var to that element id
            if loop_var_name and element_ids:
                prior_binding = node_id_map.get(loop_var_name)
                try:
                    for elem_id in element_ids:
                        node_id_map[loop_var_name] = elem_id
                        current_id = _extract_from_body(
                            stmt.body, nodes, edges, clusters, node_id_map,
                            current_id, import_map, cluster_stack, current_cluster, list_var_map
                        )
                finally:
                    # Restore previous binding if it existed; otherwise keep last binding
                    if prior_binding is not None:
                        node_id_map[loop_var_name] = prior_binding

            # Optionally handle for-else (no special binding)
            if stmt.orelse:
                current_id = _extract_from_body(
                    stmt.orelse, nodes, edges, clusters, node_id_map,
                    current_id, import_map, cluster_stack, current_cluster, list_var_map
                )

        elif isinstance(stmt, ast.Expr):
            _extract_edge_expression(stmt, edges, node_id_map)

        elif hasattr(stmt, 'body'):
            current_id = _extract_from_body(
                stmt.body, nodes, edges, clusters, node_id_map,
                current_id, import_map, cluster_stack, current_cluster, list_var_map
            )

    return current_id


# ---------------------------------------------------------------------------
#  Main public parser
# ---------------------------------------------------------------------------

def parse_diagrams_code(code_str: str) -> Dict[str, Any]:
    """Parse *diagrams* Python code and return node/edge/cluster dictionaries."""

    cleaned_code = _clean_code(code_str)
    
    try:
        tree = ast.parse(cleaned_code)
    except SyntaxError as exc:
        raise ValueError(
            "Unable to parse diagrams code – ensure valid Python for *diagrams*. "
            f"Error: {exc.msg} at line {exc.lineno}"
        ) from exc

    nodes, edges, clusters = [], [], []
    node_id_map: Dict[str, str] = {}
    current_id = 1
    import_map = _build_import_map(tree)
    list_var_map: Dict[str, List[str]] = {}

    # Start parsing from module body
    _extract_from_body(
        tree.body, nodes, edges, clusters, node_id_map, current_id, import_map,
        cluster_stack=None, current_cluster=None, list_var_map=list_var_map
    )

    return {"nodes": nodes, "edges": edges, "clusters": clusters}







# from __future__ import annotations

# """sdr_backend.services.diagrams_service

# Utility helpers for working with *mingrammer/diagrams* source-code snippets.
# The main entry point is ``parse_diagrams_code`` which converts a Python
# snipped written for the *diagrams* library into a serialisable
# ``{"nodes": [...], "edges": [...], "clusters": [...]}`` structure that our
# front-end can render with React Flow.
# """

# import ast
# from typing import Dict, Any, List
# import textwrap
# from utils.logger import log_info
# import json
# from rapidfuzz import process, fuzz
# import os
# import networkx as nx

# # ---------- Core Layout Function ----------
# def compute_layout(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
#     """
#     Build a graph using NetworkX and compute node positions with a layout algorithm.
#     Returns dictionary {node_id: {"x": float, "y": float}}
#     """

#     G = nx.DiGraph()

#     # Add nodes
#     for node in nodes:
#         G.add_node(node["id"])

#     # Add edges
#     for edge in edges:
#         G.add_edge(edge["source"], edge["target"])

#     # Compute layout positions
#     # 'spring_layout' tries to position nodes aesthetically like a force-directed graph
#     # pos=nx.kamada_kawai_layout(G)
#     pos=nx.planar_layout(G)
#     # pos = nx.spring_layout(G, k=1.5, scale=500)

#     # Convert numpy floats to standard Python floats for JSON serialization
#     return {n: {"x": float(p[0]), "y": float(p[1])} for n, p in pos.items()}


# # ---------------------------------------------------------------------------
# #  Public helpers
# # ---------------------------------------------------------------------------

# # Get absolute path to this file's directory
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# # Build path to cloud_icons.json inside services folder
# json_path = os.path.join(BASE_DIR, "cloud_icons.json")

# # Load cloud icons with fallback
# try:
#     with open(json_path, "r", encoding="utf-8") as f:
#         cloud_icons = json.load(f)
# except (FileNotFoundError, json.JSONDecodeError):
#     # Fallback if cloud_icons.json doesn't exist
#     cloud_icons = {}


# def resolve_icon_path(path_list, icons_data, score_threshold=85):
#     """
#     Given [provider, category, class], return [provider, category, icon-name].
#     Matching priority:
#       1. Direct match
#       2. Case-insensitive match
#       3. Suffix match
#       4. Fuzzy match (score >= threshold)
#     """
#     if not path_list or len(path_list) < 3:
#         return path_list
    
#     provider, category, cls = path_list
#     classes_dict = icons_data.get(provider, {}).get(category, {})

#     # 1. Direct match
#     if cls in classes_dict:
#         return [provider, category, classes_dict[cls]]

#     # 2. Case-insensitive match
#     for key, icon in classes_dict.items():
#         if key.lower() == cls.lower():
#             return [provider, category, icon]

#     # 3. Suffix match (e.g., IAM → IdentityAndAccessManagementIam)
#     for key, icon in classes_dict.items():
#         if key.lower().endswith(cls.lower()):
#             return [provider, category, icon]

#     # 4. Fuzzy match (best-effort)
#     if classes_dict:
#         try:
#             best_match, score, _ = process.extractOne(
#                 cls,
#                 classes_dict.keys(),
#                 scorer=fuzz.WRatio
#             )
#             if score >= score_threshold:
#                 return [provider, category, classes_dict[best_match]]
#         except:
#             pass

#     # Not found
#     return [provider, category, cls]


# def get_icon_url(node_type: str) -> str:
#     """Return a CDN URL pointing to the SVG/PNG for *node_type*."""
#     log_info(f"Node type: {node_type}")

#     parts = node_type.split(".")
#     log_info(f"Parts: {parts}")
#     icon_path = resolve_icon_path(parts, cloud_icons)
#     log_info(f"Icon path: {icon_path}")

#     # Typical structure: provider.module.NodeClass
#     if len(parts) == 3:
#         provider, module, node_name = icon_path
#         return (
#             "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/"
#             f"{provider}/{module}/{node_name}.png"
#         )

#     # Fallback for generic: e.g. "compute.Rack" (treated as generic/compute)
#     if len(parts) == 2:
#         module, node_name = icon_path
#         return (
#             "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/"
#             f"generic/{module}/{node_name}.png"
#         )

#     # Absolute fallback – internet icon.
#     return (
#         "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources/onprem/"
#         "network/internet.png"
#     )


# # ---------------------------------------------------------------------------
# #  AST parsing helpers
# # ---------------------------------------------------------------------------

# def _clean_code(code_str: str) -> str:
#     """Remove Markdown code-block fences (``` or ```python)."""
#     lines = [
#         ln for ln in code_str.splitlines(keepends=False)
#         if not ln.lstrip().startswith("```")
#     ]
#     return textwrap.dedent("\n".join(lines)).strip()


# def _build_import_map(tree: ast.Module) -> Dict[str, str]:
#     """Build a mapping of class name -> full provider.module.Class."""
#     import_map: Dict[str, str] = {}

#     for node in tree.body:
#         if isinstance(node, ast.ImportFrom):
#             if node.module and node.module.startswith("diagrams."):
#                 module_path = node.module.replace("diagrams.", "")
#                 for alias in node.names:
#                     class_name = alias.asname or alias.name
#                     import_map[class_name] = f"{module_path}.{alias.name}"
#     return import_map


# def _extract_assignment(
#     node: ast.Assign,
#     nodes: List[Dict[str, Any]],
#     node_id_map: Dict[str, str],
#     current_id: int,
#     import_map: Dict[str, str],
#     current_cluster: str,
#     clusters: List[Dict[str, Any]]
# ) -> int:
#     """Handle an ``ast.Assign`` like ``var = Provider("Label")``."""

#     if not isinstance(node.value, ast.Call):
#         return current_id

#     func = node.value.func

#     if isinstance(func, ast.Name):  # Direct class import
#         node_type = import_map.get(func.id, f"generic.compute.{func.id}")
#     elif isinstance(func, ast.Attribute):
#         if isinstance(func.value, ast.Attribute):
#             # Fully qualified: aws.compute.EC2
#             provider = getattr(func.value.value, 'id', 'unknown')
#             module = func.value.attr
#             node_cls = func.attr
#             node_type = f"{provider}.{module}.{node_cls}"
#         else:
#             # Single level: module.Class
#             provider_module = getattr(func.value, "id", None)
#             if provider_module:
#                 node_type = f"{provider_module}.{func.attr}"
#             else:
#                 return current_id
#     else:
#         return current_id

#     # Extract label from function call
#     label = "Unnamed"
#     if node.value.args:
#         arg0 = node.value.args[0]
#         if isinstance(arg0, ast.Constant):
#             label = str(arg0.value)
#         elif hasattr(arg0, 's'):  # ast.Str for older Python versions
#             label = arg0.s

#     # Use variable name as node ID
#     if isinstance(node.targets[0], ast.Name):
#         var_name = node.targets[0].id
#     else:
#         var_name = f"tmp_{current_id}"
    
#     node_id_map[var_name] = var_name

#     nodes.append(
#         {
#             "id": var_name,
#             "type": "custom",
#             "data": {"label": label, "iconUrl": get_icon_url(node_type)},
#             "position": {"x": 0, "y": 0},
#         }
#     )

#     # If inside a cluster, record membership
#     if current_cluster:
#         for cl in clusters:
#             if cl["cluster_id"] == current_cluster:
#                 cl["cluster_nodes"].append(var_name)
#                 break

#     return current_id + 1


# # ---------------------------------------------------------------------------
# #  Helper to flatten chained edge expressions
# # ---------------------------------------------------------------------------


# def _flatten_binop(expr: ast.AST, op_type: Any) -> List[ast.AST]:
#     """Recursively flatten a BinOp chain of the same *op_type* into a list of operands.

#     For example, the AST for ``a >> b >> c`` is equivalent to
#     BinOp(left=BinOp(left=a, op=RShift, right=b), op=RShift, right=c).
#     This helper returns ``[a, b, c]`` for that structure. It preserves order.
#     """
#     if isinstance(expr, ast.BinOp) and isinstance(expr.op, op_type):
#         return _flatten_binop(expr.left, op_type) + _flatten_binop(expr.right, op_type)
#     return [expr]


# def _extract_edge_pairs(expr: ast.BinOp, edges: List[Dict[str, Any]], node_id_map: Dict[str, str]):
#     """Extract edges from a chained expression like ``a >> b >> Edge() >> c``.

#     It flattens the chain, filters out non-Name operands (e.g., ``Edge(...)`` calls),
#     and registers edges between consecutive variable names that have been defined.
#     """

#     # Determine direction and operator symbol
#     if isinstance(expr.op, ast.RShift):
#         op_type = ast.RShift
#         operator_symbol = ">>"
#     elif isinstance(expr.op, ast.LShift):
#         op_type = ast.LShift
#         operator_symbol = "<<"
#     else:
#         op_type = type(expr.op)
#         operator_symbol = "-"

#     operands = _flatten_binop(expr, op_type)

#     # Extract variable names while ignoring Edge(...) or other calls
#     names: List[str] = []
#     for operand in operands:
#         if isinstance(operand, ast.Name):
#             names.append(operand.id)
#         # If it's a reversed direction (<<) we will handle swapping later

#     # Register edges between consecutive variable names
#     for i in range(len(names) - 1):
#         src_id = node_id_map.get(names[i])
#         tgt_id = node_id_map.get(names[i + 1])

#         # Swap for "<<" direction (a << b means b -> a)
#         if isinstance(expr.op, ast.LShift):
#             src_id, tgt_id = tgt_id, src_id

#         if src_id and tgt_id:
#             edge_id = f"{src_id}_{tgt_id}"
#             if not any(e["id"] == edge_id for e in edges):
#                 edges.append({
#                     "id": edge_id,
#                     "source": src_id,
#                     "target": tgt_id,
#                     "operator": operator_symbol,
#                 })


# # ---------------------------------------------------------------------------
# #  Updated edge extraction that can handle chained operations
# # ---------------------------------------------------------------------------


# def _extract_edge_expression(
#     node: ast.Expr,
#     edges: List[Dict[str, Any]],
#     node_id_map: Dict[str, str]
# ):
#     """Handle edge expressions including chained & labeled edges.

#     Supports:
#         * a >> b
#         * a >> b >> c
#         * a >> Edge(label="foo") >> b
#         * a << b (direction reversed)
#         * a - b (simple link)
#     """

#     # Only interested in binary operations
#     if not isinstance(node.value, ast.BinOp):
#         return

#     expr = node.value

#     # Special handling for simple '-' which isn't usually chained
#     if isinstance(expr.op, ast.Sub):
#         left_id = getattr(expr.left, "id", None)
#         right_id = getattr(expr.right, "id", None)
#         if left_id and right_id:
#             src = node_id_map.get(left_id)
#             tgt = node_id_map.get(right_id)
#             if src and tgt:
#                 edge_id = f"{src}_{tgt}"
#                 if not any(edge["id"] == edge_id for edge in edges):
#                     edges.append(
#                         {
#                             "id": edge_id,
#                             "source": src,
#                             "target": tgt,
#                             "operator": "-",
#                         }
#                     )
#         return

#     # Handle chained >> or << expressions (possibly with Edge(...) in between)
#     _extract_edge_pairs(expr, edges, node_id_map)


# def _is_cluster_context(context_expr: ast.AST) -> bool:
#     """Check if the context expression represents a Cluster."""
#     if isinstance(context_expr, ast.Call):
#         if isinstance(context_expr.func, ast.Name):
#             return context_expr.func.id == "Cluster"
#         elif isinstance(context_expr.func, ast.Attribute):
#             return context_expr.func.attr == "Cluster"
#     return False


# def _extract_cluster_name(context_expr: ast.Call) -> str:
#     """Extract cluster name from Cluster() call."""
#     if context_expr.args:
#         arg0 = context_expr.args[0]
#         if isinstance(arg0, ast.Constant):
#             return str(arg0.value)
#         elif hasattr(arg0, 's'):  # ast.Str for older Python versions
#             return arg0.s
#     return "Unnamed Cluster"


# def _extract_from_body(
#     body,
#     nodes,
#     edges,
#     clusters,
#     node_id_map,
#     current_id,
#     import_map,
#     cluster_stack=None,
#     current_cluster=None,
# ):
#     """Walk statements, handling clusters, assignments, and edges."""
#     if cluster_stack is None:
#         cluster_stack = []

#     for stmt in body:
#         if isinstance(stmt, ast.With):
#             if stmt.items:
#                 context_expr = stmt.items[0].context_expr

#                 if _is_cluster_context(context_expr):
#                     cluster_name = _extract_cluster_name(context_expr)
#                     cluster_id = cluster_name.lower().replace(" ", "_").replace("-", "_")

#                     # Make cluster ID unique if needed
#                     original_id = cluster_id
#                     counter = 1
#                     while any(cl["cluster_id"] == cluster_id for cl in clusters):
#                         cluster_id = f"{original_id}_{counter}"
#                         counter += 1

#                     clusters.append({
#                         "cluster_id": cluster_id,
#                         "cluster_label": cluster_name,
#                         "cluster_nodes": [],
#                         # parent list for nesting
#                         "cluster_parent": [current_cluster] if current_cluster else []
#                     })

#                     # Push current cluster, set new one
#                     cluster_stack.append(current_cluster)
#                     current_cluster = cluster_id

#                     current_id = _extract_from_body(
#                         stmt.body, nodes, edges, clusters, node_id_map,
#                         current_id, import_map, cluster_stack, current_cluster
#                     )

#                     # Pop back to previous cluster
#                     current_cluster = cluster_stack.pop() if cluster_stack else None

#                 else:
#                     # Non-cluster with-block (like Diagram)
#                     current_id = _extract_from_body(
#                         stmt.body, nodes, edges, clusters, node_id_map,
#                         current_id, import_map, cluster_stack, current_cluster
#                     )

#         elif isinstance(stmt, ast.Assign):
#             current_id = _extract_assignment(
#                 stmt, nodes, node_id_map, current_id, import_map,
#                 current_cluster, clusters
#             )

#         elif isinstance(stmt, ast.Expr):
#             _extract_edge_expression(stmt, edges, node_id_map)

#         elif hasattr(stmt, 'body'):
#             current_id = _extract_from_body(
#                 stmt.body, nodes, edges, clusters, node_id_map,
#                 current_id, import_map, cluster_stack, current_cluster
#             )

#     return current_id


# # ---------------------------------------------------------------------------
# #  Main public parser
# # ---------------------------------------------------------------------------

# def parse_diagrams_code(code_str: str) -> Dict[str, Any]:
#     """Parse *diagrams* Python code and return node/edge/cluster dictionaries."""

#     cleaned_code = _clean_code(code_str)
    
#     try:
#         tree = ast.parse(cleaned_code)
#     except SyntaxError as exc:
#         raise ValueError(
#             "Unable to parse diagrams code – ensure valid Python for *diagrams*. "
#             f"Error: {exc.msg} at line {exc.lineno}"
#         ) from exc

#     nodes, edges, clusters = [], [], []
#     node_id_map: Dict[str, str] = {}
#     current_id = 1
#     import_map = _build_import_map(tree)

#     # Start parsing from module body
#     _extract_from_body(tree.body, nodes, edges, clusters, node_id_map, current_id, import_map)

#     # ------------------------------------------------------------------
#     #  Post-processing: add "unconnected" cluster for nodes with no edges
#     # ------------------------------------------------------------------

#     # Build a set of node IDs that appear in any edge
#     connected_ids = {e["source"] for e in edges}.union({e["target"] for e in edges})

#     unconnected_nodes = [n["id"] for n in nodes if n["id"] not in connected_ids]

#     if unconnected_nodes:
#         # Determine common parent clusters (intersection)
#         parent_sets = []
#         for node_id in unconnected_nodes:
#             parents = [cl["cluster_id"] for cl in clusters if node_id in cl["cluster_nodes"]]
#             parent_sets.append(set(parents))

#         common_parents = list(set.intersection(*parent_sets)) if parent_sets else []

#         clusters.append({
#             "cluster_id": "unconnected",
#             "cluster_label": "services",
#             "cluster_nodes": unconnected_nodes,
#             "cluster_parent": common_parents,
#         })
 
#     return {"nodes": nodes, "edges": edges, "clusters": clusters}


