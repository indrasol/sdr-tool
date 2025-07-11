from typing import List, Dict, Any
import re


def build_sequence_diagram(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> str:
    """Generate a simple Mermaid sequenceDiagram string from nodes & directed edges.

    This uses node data.label if present, otherwise node id.
    Each diagram element becomes a `participant`.
    Each edge is rendered as `A->>B: call` where A and B are participant aliases.
    """
    if not nodes:
        return "sequenceDiagram\n    Note over Client: No nodes to display"

    # Helpers -------------------------------------------------------------
    def _safe_id(text: str) -> str:
        """Return a Mermaid-safe identifier (no spaces or special chars)."""
        return re.sub(r"[^A-Za-z0-9_]+", "_", text.strip())

    def _prettify(name: str) -> str:
        """Remove common prefixes & convert snake_case to Title Case."""
        parts = name.split("_")
        if len(parts) > 1 and parts[0] in {"client", "network", "application", "database", "data", "service", "server"}:
            parts = parts[1:]

        def fmt(w: str) -> str:
            uppers = {"api", "cdn", "waf", "sql", "db"}
            return w.upper() if w.lower() in uppers else w.capitalize()

        return " ".join(fmt(w) for w in parts)

    # Build maps ----------------------------------------------------------
    id_to_alias: Dict[str, str] = {}
    id_to_display: Dict[str, str] = {}
    order: List[str] = []

    for n in nodes:
        node_id = n.get("id")
        alias = _safe_id(node_id)
        id_to_alias[node_id] = alias
        display_label_raw = n.get("data", {}).get("label", node_id)
        pretty = _prettify(display_label_raw)
        id_to_display[node_id] = pretty
        order.append(node_id)

    # Deduplicate while preserving order
    seen_set = set()
    participants = []
    for nid in order:
        if id_to_alias[nid] not in seen_set:
            participants.append(nid)
            seen_set.add(id_to_alias[nid])

    # ---------------------------------------------------------------------
    lines = ["sequenceDiagram", "autonumber", "%% actors"]

    for nid in participants:
        alias = id_to_alias[nid]
        display = id_to_display[nid].replace("\n", " ")
        lines.append(f"participant {alias} as {display}")

    # Render edges
    for edge in edges:
        src = id_to_alias.get(edge.get("source"))
        tgt = id_to_alias.get(edge.get("target"))
        if not src or not tgt:
            continue
        # Mermaid sequence arrows must be followed by a message text after the colon.
        # If the edge does not provide a label we fall back to a generic placeholder
        # so that the generated diagram is always syntactically valid.
        raw_label = (edge.get("label") or "").replace("\n", " ").strip()
        label = raw_label if raw_label else "call"  # Default placeholder
        lines.append(f"{src}->>{tgt}: {label}")

    if len(lines) <= 3:  # only header lines present, no edges
        lines.append("Note over Client: No edges to display")

    diagram = "\n".join(lines) + "\n"

    # --- Safeguard: ensure each edge statement is on its own line ---
    # If two edge statements were concatenated without a newline (e.g. ...CDNMobile_Banking->>)
    # this regex inserts a newline between them.
    diagram = re.sub(r"(->>[^\n]*)(?=[A-Za-z0-9_]+->>)", r"\1\n", diagram)

    return diagram


# NEW: Flowchart generator
def build_flowchart(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> str:
    """Generate a Mermaid flowchart (LR) string from nodes and directed edges.

    Nodes are grouped into `subgraph` blocks based on `data.group` or `data.nodeType`.
    Each edge is rendered with a label if provided.
    """

    if not nodes:
        return "flowchart LR\n    %% No nodes provided"

    def _safe(label: str) -> str:
        """Return a Mermaid-safe identifier.

        Replaces any non-alphanumeric characters with an underscore and guarantees
        that the identifier starts with a letter (Mermaid does **not** allow an
        identifier to start with a digit). If, after cleaning, the identifier is
        empty, we fall back to a generic "N" prefix.
        """

        # 1. Sanitize by replacing disallowed characters with underscores
        base = re.sub(r"[^A-Za-z0-9_]+", "_", label.strip())

        # 2. Ensure the id is not empty
        if base == "":
            base = "N"

        # 3. Prefix with a letter when the first char is **not** alphabetic
        if not re.match(r"^[A-Za-z]", base):
            base = f"N_{base}"

        return base

    # Group nodes
    groups: Dict[str, List[Dict[str, Any]]] = {}
    for n in nodes:
        group_name = (
            n.get("data", {}).get("group")
            or n.get("data", {}).get("nodeType")
            or "Ungrouped"
        )
        groups.setdefault(group_name, []).append(n)

    # Build mapping id -> alias for safe identifiers
    id_to_alias: Dict[str, str] = {}
    for n in nodes:
        alias = _safe(n.get("id"))
        id_to_alias[n["id"]] = alias

    lines = ["flowchart LR"]

    def _prettify_group(name: str) -> str:
        """Convert a raw nodeType/group string (e.g. "application_web_server") into a more
        human-readable form (e.g. "Web Server").

        1. Remove a leading category prefix such as client_, network_, application_, database_, etc.
        2. Replace underscores with spaces.
        3. Title-case words except well-known acronyms (API, CDN, WAF, etc.).
        """
        # Strip the first segment if it looks like a category prefix
        parts = name.split("_")
        if len(parts) > 1 and parts[0] in {
            "client",
            "network",
            "application",
            "database",
            "data",
            "service",
            "server",
        }:
            parts = parts[1:]

        def _format_word(w: str) -> str:
            upper_acronyms = {"api", "cdn", "waf", "sql", "db"}
            return w.upper() if w.lower() in upper_acronyms else w.capitalize()

        return " ".join(_format_word(w) for w in parts)

    for group_name, group_nodes in groups.items():
        # Add suffix to subgraph identifier to avoid conflicts with node identifiers
        safe_group = _safe(group_name) + "_group"
        pretty_name = _prettify_group(group_name)
        # Render subgraph with a blank header to avoid duplicate labels inside the box
        lines.append(f"  subgraph {safe_group} [\" \" ]")
        for n in group_nodes:
            raw_label = n.get("data", {}).get("label", n.get("id"))
            # Clean label – replace newlines and stray brackets that could break Mermaid syntax
            label = (
                str(raw_label)
                .replace("[", "(")  # avoid internal square brackets which break Mermaid syntax
                .replace("]", ")")
                .replace("\n", "<br/>")
            )
            alias = id_to_alias[n["id"]]
            # Use square brackets to render a rectangular node with label
            lines.append(f"    {alias}[{label}]")
        lines.append("  end")

    # Render edges
    for e in edges:
        src_alias = id_to_alias.get(e.get("source"))
        tgt_alias = id_to_alias.get(e.get("target"))
        if not src_alias or not tgt_alias:
            continue
        raw_label = (e.get("label") or "").replace("\n", " ").strip()
        # Escape vertical bars which have special meaning in Mermaid edge labels
        safe_label = raw_label.replace("|", "/")
        label_part = f"|{safe_label}|" if safe_label else ""
        lines.append(f"  {src_alias} -->{label_part} {tgt_alias}")

    # Ensure at least one edge or note present
    if len(edges) == 0:
        lines.append("  %% No edges to display")

    return "\n".join(lines) + "\n" 