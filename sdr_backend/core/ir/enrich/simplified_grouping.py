from __future__ import annotations

from typing import Dict, List, Set
from collections import defaultdict
import re

from core.ir.ir_types import IRGraph, IRGroup, IRNode
from utils.logger import log_info

# Define cloud resource group patterns
CLOUD_GROUP_PATTERNS = {
    "vpc": [r"vpc", r"virtual\s+private\s+cloud"],
    "subnet": [r"subnet", r"sub\-net"],
    "security_group": [r"security\s+group", r"sg\-", r"security\s+rules"],
    "availability_zone": [r"az\-", r"availability\s+zone", r"zone\-"],
    "region": [r"region", r"us\-east", r"us\-west", r"eu\-west", r"ap\-south"],
    "resource_group": [r"resource\s+group", r"rg\-"],
    "cluster": [r"cluster", r"eks", r"aks", r"gke", r"k8s", r"kubernetes"],
    "container": [r"container", r"docker"]
}

def assign_groups_by_kind(graph: IRGraph) -> IRGraph:
    """Group nodes by kind and create IRGroup objects for the groups.
    
    This is a simplified approach that creates groups based purely on kind values,
    allowing frontend to render nodes grouped by their layer.
    """
    # Group nodes by kind
    kind_to_nodes: Dict[str, List[str]] = defaultdict(list)
    
    for node in graph.nodes:
        # Use kind as the grouping key
        kind = node.kind.upper() if node.kind else "SERVICE"
        kind_to_nodes[kind].append(node.id)
    
    # Create IRGroup objects for each group
    groups: List[IRGroup] = []
    for idx, (kind, node_ids) in enumerate(kind_to_nodes.items(), start=1):
        # Only create groups with at least 2 nodes
        if len(node_ids) < 2:
            continue
            
        group_id = f"kind_{kind.lower()}"
        group_name = f"{kind.title().replace('_', ' ')} Group"
        
        group = IRGroup(
            id=group_id,
            name=group_name,
            type="layer_cluster",  # Using layer_cluster type
            member_node_ids=node_ids,
        )
        groups.append(group)
        
        log_info(f"[simplified_grouping] Created group '{group_name}' with {len(node_ids)} nodes")
    
    # Domain-based grouping (keep this for backward compatibility)
    domain_groups = create_domain_groups(graph.nodes)
    
    # Combine all groups - REMOVED cloud_groups until schema supports it
    all_groups = list(graph.groups) + groups + domain_groups
    
    log_info(f"[simplified_grouping] Total groups: {len(groups)} kind groups, {len(domain_groups)} domain groups")
    
    return graph.model_copy(update={"groups": all_groups})

def create_cloud_resource_groups(graph: IRGraph) -> List[IRGroup]:
    """Create groups for cloud resources like VPCs, Subnets, Availability Zones, etc.
    
    This function detects cloud resource grouping patterns in node names and descriptions
    and creates appropriate groups.
    
    NOTE: Currently disabled/returning empty list until schema supports cloud group types.
    When re-enabling, use "layer_cluster" for type instead of custom cloud types.
    """
    # Return empty list for now until schema supports custom cloud group types
    return []
    
    # Dict to hold nodes by group type
    cloud_groups: Dict[str, Dict[str, Set[str]]] = {
        group_type: defaultdict(set) for group_type in CLOUD_GROUP_PATTERNS.keys()
    }
    
    # First, identify all cloud resource groups
    for node in graph.nodes:
        node_text = f"{node.name} {node.id}".lower()
        
        # Check if this node has cloud provider metadata
        is_cloud_resource = node.metadata and node.metadata.get("cloud", False)
        cloud_provider = node.metadata.get("provider") if node.metadata else None
        
        # For each cloud group type, check if the node belongs to a specific instance
        for group_type, patterns in CLOUD_GROUP_PATTERNS.items():
            for pattern in patterns:
                # Look for patterns like vpc-123, my-vpc, etc.
                matches = re.finditer(fr"(?:^|\b|[\s\-_])({pattern})[\-_]?([a-z0-9]+)?", node_text)
                for match in matches:
                    # Get the specific group name (e.g., vpc-123, east-1)
                    group_name = match.group(0).strip()
                    if not group_name:
                        continue
                    
                    # Clean up the group name
                    group_name = re.sub(r"^[\s\-_]+|[\s\-_]+$", "", group_name)
                    group_key = f"{group_type}_{group_name}"
                    
                    # Add this node to the group
                    cloud_groups[group_type][group_key].add(node.id)
                    
                    # Also tag the node with group information in metadata
                    # This happens in-place but will be properly handled in the copy later
                    if node.metadata is None:
                        node.metadata = {}
                    
                    if "cloud_groups" not in node.metadata:
                        node.metadata["cloud_groups"] = []
                    
                    node.metadata["cloud_groups"].append({
                        "type": group_type,
                        "name": group_name,
                        "key": group_key
                    })
    
    # Now create IRGroup objects for each detected cloud group
    result_groups: List[IRGroup] = []
    
    for group_type, group_dict in cloud_groups.items():
        for group_key, node_ids in group_dict.items():
            # Only create groups with at least 2 nodes
            if len(node_ids) < 2:
                continue
                
            # Format group name nicely
            group_name_parts = group_key.split('_', 1)
            if len(group_name_parts) > 1:
                display_name = f"{group_name_parts[1].upper()} {group_name_parts[0].replace('_', ' ').title()}"
            else:
                display_name = f"{group_key.replace('_', ' ').title()}"
                
            group = IRGroup(
                id=f"cloud_{group_key}",
                name=display_name,
                # Use "layer_cluster" as a valid type instead of custom cloud types
                type="layer_cluster",
                member_node_ids=list(node_ids),
                metadata={
                    "cloud_group_type": group_type,
                    "is_cloud_group": True
                }
            )
            result_groups.append(group)
            
            log_info(f"[cloud_grouping] Created {group_type} group '{display_name}' with {len(node_ids)} nodes")
    
    return result_groups

def create_domain_groups(nodes: List[IRNode]) -> List[IRGroup]:
    """Create groups based on domain for backward compatibility."""
    dom_to_nodes: Dict[str, List[str]] = defaultdict(list)
    
    for node in nodes:
        if node.domain:
            dom_to_nodes[node.domain].append(node.id)
    
    groups: List[IRGroup] = []
    for idx, (domain, node_ids) in enumerate(dom_to_nodes.items(), start=1):
        # Skip singletons – only add bounded context if >1 nodes share domain
        if len(node_ids) < 2:
            continue
            
        group_id = f"bc_{idx}"
        groups.append(
            IRGroup(
                id=group_id,
                name=domain.title(),
                type="bounded_context",
                member_node_ids=node_ids,
            )
        )
    
    return groups 