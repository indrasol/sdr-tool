from __future__ import annotations

from typing import Dict, Any, List, Optional, Tuple
import re

from core.ir.ir_types import IRGraph, IRNode
from utils.logger import log_info, log_error
from .taxonomy_client import (
    load_taxonomy, 
    normalize_label, 
    word_vote_lookup, 
    slugify,
    _PRIMARY_BY_SLUG, 
    _DNAME_BY_SLUG, 
    _ALIAS_BY_SLUG,
    _ROW_BY_TOKEN
)
from .fuzzy_match import fuzzy_best_match
from .cloud_resource_mapper import CloudResourceMapper

# Define mapping from kind to numeric layer index for frontend
KIND_TO_LAYER_INDEX = {
    "CLIENT": 0,
    "EDGE_NETWORK": 1,
    "IDENTITY": 2,
    "SERVICE": 3,
    "INTEGRATION_MESSAGING": 4,
    "PROCESSING_ANALYTICS": 5,
    "COMPUTE": 5,  # Map to same layer as PROCESSING_ANALYTICS
    "DATA": 6,
    "OBSERVABILITY": 7,
    "AI_ML": 8,    # Separate layer for AI/ML
    "DEV_CI_CD": 9,  # Separate layer for DevOps
    "OTHER": 10,    # Separate layer for Other
}

# Defaults
DEFAULT_KIND = "SERVICE"
DEFAULT_LAYER_INDEX = 3  # Service layer

class TaxonomyMapper:
    """Maps IR nodes to taxonomy entries for kind, icon, and layer assignment."""
    
    def __init__(self):
        """Initialize with taxonomy data and cloud resource mapper."""
        # Force refresh taxonomy data to get latest fields including svg_url
        from .taxonomy_client import reload_taxonomy
        reload_taxonomy()
        
        self.taxonomy = load_taxonomy(force=True)
        self.fuzzy_keys = list(self.taxonomy.keys())
        self.cloud_mapper = CloudResourceMapper()
        log_info(f"[taxonomy_mapper] Initialized with {len(self.taxonomy)} taxonomy entries")
    
    def find_best_taxonomy_match(self, node: IRNode) -> Dict[str, Any]:
        """Find the best matching taxonomy entry for a node."""
        # Extract node properties for matching
        node_name = node.name.lower()
        node_kind = node.kind
        metadata = node.metadata or {}
        
        # Step 1: Check if this is a cloud resource (provider-service format)
        is_cloud_resource, cloud_data = self._check_cloud_resource(node_name, metadata)
        if is_cloud_resource and cloud_data:
            log_info(f"[taxonomy_mapper] ✅ Cloud resource identified: {node_name}")
            # Debug cloud resource data
            if cloud_data.get("svg_url"):
                log_info(f"[taxonomy_mapper] Cloud resource has svg_url: {cloud_data.get('svg_url')}")
            return cloud_data
            
        # Step 2: Try direct token match (most confident)
        slug, _ = normalize_label(node_name)
        
        log_info(f"[taxonomy_mapper] Finding match for node '{node.id}' with name '{node_name}' and slug '{slug}'")
        
        # Try direct match on the token first
        for cand in self._candidate_slugs(slug):
            # 1. canonical token match
            row = (_PRIMARY_BY_SLUG.get(cand))
            if row:
                log_info(f"[taxonomy_mapper] ✅ Primary match found: {row['token']} for '{node_name}'")
                # Debug svg_url presence
                if 'svg_url' in row:
                    log_info(f"[taxonomy_mapper] Primary match has svg_url: {row['svg_url']}")
                else:
                    log_info(f"[taxonomy_mapper] ⚠️ Primary match missing svg_url field")
                return row

            # 2. display-name match
            row = _DNAME_BY_SLUG.get(cand)
            if row:
                log_info(f"[taxonomy_mapper] ✅ Display name match found: {row['token']} for '{node_name}'")
                # Debug svg_url presence
                if 'svg_url' in row:
                    log_info(f"[taxonomy_mapper] Display name match has svg_url: {row['svg_url']}")
                else:
                    log_info(f"[taxonomy_mapper] ⚠️ Display name match missing svg_url field")
                return row

            # 3. alias match
            alias_rows = _ALIAS_BY_SLUG.get(cand)
            if alias_rows and alias_rows[0]:
                row = self._best_alias_match(node_name, alias_rows)
                log_info(f"[taxonomy_mapper] ✅ Alias match found: {row['token']} for '{node_name}'")
                # Debug svg_url presence
                if 'svg_url' in row:
                    log_info(f"[taxonomy_mapper] Alias match has svg_url: {row['svg_url']}")
                else:
                    log_info(f"[taxonomy_mapper] ⚠️ Alias match missing svg_url field")
                return row
        
        # Step 3: Try word-vote heuristics
        row = word_vote_lookup(node_name)
        if row:
            log_info(f"[taxonomy_mapper] ✅ Word-vote match found: {row['token']} for '{node_name}'")
            return row
        
        # Step 4: Try fuzzy matching (more expensive)
        key, score = fuzzy_best_match(slug, self.fuzzy_keys)
        if key and score > 60:  # Threshold for fuzzy matching
            row = self.taxonomy[key]
            log_info(f"[taxonomy_mapper] ✅ Fuzzy match found: {row['token']} (score={score}) for '{node_name}'")
            return row
        
        # Step 5: Fallback - check if iconify_id or provider already exists in metadata
        iconify_id = metadata.get("iconify_id") or metadata.get("iconifyId")
        if iconify_id:
            for _, row in self.taxonomy.items():
                if row.get("iconify_id") == iconify_id:
                    log_info(f"[taxonomy_mapper] ✅ Match by iconify_id: {row['token']} for '{node_name}'")
                    return row
        
        # No match found
        log_info(f"[taxonomy_mapper] ❌ No taxonomy match found for '{node_name}', defaulting to {DEFAULT_KIND}")
        
        # Return fallback with minimal fields
        return {
            "token": node_name,
            "kind": DEFAULT_KIND,
            "iconify_id": "mdi:cube-outline",
        }
    
    def _check_cloud_resource(self, node_name: str, metadata: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Check if this node is a cloud resource and if so, return cloud metadata.
        
        Args:
            node_name: The node name to check
            metadata: Existing node metadata
            
        Returns:
            Tuple of (is_cloud_resource, cloud_metadata)
        """
        # Check if we already have provider info in metadata
        existing_provider = metadata.get("provider")
        
        # Special case for nodes with provider but not in provider-service format
        if existing_provider and existing_provider.lower() in self.cloud_mapper.KNOWN_PROVIDERS:
            # If we already have a provider, try to construct a cloud resource
            cloud_token = f"{existing_provider.lower()}-{node_name.lower()}"
            cloud_data = self.cloud_mapper.map_cloud_resource(cloud_token)
            if cloud_data:
                log_info(f"[taxonomy_mapper] Created cloud resource from provider metadata: {cloud_token}")
                return True, self._convert_cloud_data_to_taxonomy_row(cloud_token, cloud_data)
        
        # Check if the node name follows provider-service pattern
        provider, service = self.cloud_mapper.extract_provider_service(node_name)
        if provider and service:
            cloud_data = self.cloud_mapper.map_cloud_resource(node_name)
            if cloud_data:
                log_info(f"[taxonomy_mapper] Detected cloud resource from name pattern: {node_name}")
                return True, self._convert_cloud_data_to_taxonomy_row(node_name, cloud_data)
        
        return False, None
    
    def _convert_cloud_data_to_taxonomy_row(self, token: str, cloud_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert cloud resource data to taxonomy row format.
        
        Args:
            token: The cloud resource token
            cloud_data: Cloud resource data from cloud mapper
            
        Returns:
            Taxonomy row compatible dictionary
        """
        metadata = cloud_data.get("metadata", {})
        
        # Log detailed cloud data for debugging
        log_info(f"[taxonomy_mapper] Cloud data metadata: {metadata}")
        
        return {
            "token": token,
            "kind": cloud_data.get("kind", DEFAULT_KIND),
            "iconify_id": metadata.get("iconifyId"),
            "provider": metadata.get("provider"),
            "technology": metadata.get("service"),
            "layer_index": metadata.get("layerIndex", DEFAULT_LAYER_INDEX),
            "category": metadata.get("category", "other"),
            "region": metadata.get("region"),
            "svg_url": metadata.get("svg_url"),  # Add svg_url from metadata if available
            "cloud": True
        }
    
    def _candidate_slugs(self, slug: str) -> List[str]:
        """Return list of slugs to try in priority order: full slug then each part."""
        parts = [p for p in slug.split("-") if p]
        return [slug] + parts
    
    def _best_alias_match(self, raw_label: str, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Select row whose token shares most words with the raw label."""
        raw_words = set(re.findall(r"[a-z0-9]+", raw_label.lower()))
        best_row = rows[0]
        best_score = -1
        for r in rows:
            tok_words = set(re.findall(r"[a-z0-9]+", r["token"].lower()))
            score = len(raw_words & tok_words)
            if score > best_score:
                best_score = score
                best_row = r
        return best_row

def assign_taxonomy(graph: IRGraph) -> IRGraph:
    """Assign kind, layer, and icon metadata based on taxonomy lookup."""
    mapper = TaxonomyMapper()
    new_nodes: List[IRNode] = []
    
    token_success_count = 0
    fallback_count = 0
    cloud_count = 0
    
    for node in graph.nodes:
        # Skip if node already has a non-default kind and we're just using this for metadata
        existing_kind = node.kind
        use_existing_kind = existing_kind
        
        # Get the best taxonomy match
        taxonomy_row = mapper.find_best_taxonomy_match(node)
        log_info(f"[taxonomy_mapper] Taxonomy row: {taxonomy_row}")
        
        # Extract useful data from the taxonomy entry
        kind = taxonomy_row.get("kind", DEFAULT_KIND)
        if not kind:
            kind = DEFAULT_KIND
            
        # Make sure kind is uppercase to match our new convention
        kind = kind.upper()
        
        # Determine layer_index based on kind
        layer_index = taxonomy_row.get("layer_index") 
        if layer_index is None:
            layer_index = KIND_TO_LAYER_INDEX.get(kind, DEFAULT_LAYER_INDEX)
        
        # Create metadata to add to node
        metadata_updates = {
            "layerIndex": layer_index,
        }
        
        # Add iconify_id if available
        if taxonomy_row.get("iconify_id"):
            metadata_updates["iconifyId"] = taxonomy_row["iconify_id"]
            
        # Add provider if available
        if taxonomy_row.get("provider"):
            metadata_updates["provider"] = taxonomy_row["provider"]
        
        # Add svg_url if available
        if taxonomy_row.get("svg_url"):
            # Clean the URL to remove any trailing question marks or other issues
            svg_url = taxonomy_row["svg_url"].rstrip('?')
            metadata_updates["svgUrl"] = svg_url
            log_info(f"[taxonomy_mapper] Added SVG URL for node {node.id}: {svg_url}")
        
        # Update the node with new values
        updated_node = node.model_copy(update={
            "kind": existing_kind if use_existing_kind else kind,
            "layer": kind,  # Use kind as layer directly
            "metadata": {**node.metadata, **metadata_updates}
        })
        log_info(f"[taxonomy_mapper] Updated node: {updated_node}")
        
        new_nodes.append(updated_node)
        
        # Track statistics
        if taxonomy_row.get("token") == node.name.lower():
            token_success_count += 1
        else:
            fallback_count += 1
    
    log_info(f"[taxonomy_mapper] Processed {len(graph.nodes)} nodes: "
             f"{token_success_count} direct matches, {fallback_count} fallbacks")
    
    return graph.model_copy(update={"nodes": new_nodes}) 