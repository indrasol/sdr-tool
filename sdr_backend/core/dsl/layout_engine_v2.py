# core/dsl/layout_engine_v2.py
import json
from typing import Dict, List, Any
from utils.logger import log_info, log_error
from core.dsl.dsl_types import DSLDiagram, DSLNode, DSLEdge


class LayoutEngineV2:
    """
    Robust ELK-based layout engine that computes hierarchical positions.
    Provides fallback strategies when ELK layout fails.
    """
    
    def __init__(self):
        self.node_spacing = 150
        self.layer_spacing = 200
        self.min_node_width = 120
        self.min_node_height = 60
        
    def layout(self, diagram: DSLDiagram) -> DSLDiagram:
        """
        Apply hierarchical layout to diagram nodes using ELK-inspired algorithm.
        Falls back to grid layout if hierarchical layout fails.
        """
        if not diagram.nodes:
            log_info("No nodes to layout")
            return diagram
            
        log_info(f"Applying layout to {len(diagram.nodes)} nodes and {len(diagram.edges)} edges")
        
        try:
            # First try hierarchical layout based on node connections
            positioned_diagram = self._apply_hierarchical_layout(diagram)
            log_info("Successfully applied hierarchical layout")
            return positioned_diagram
        except Exception as e:
            log_error(f"Hierarchical layout failed: {e}. Falling back to grid layout.")
            return self._apply_grid_layout(diagram)
    
    def _apply_hierarchical_layout(self, diagram: DSLDiagram) -> DSLDiagram:
        """
        Apply hierarchical layout based on node connections and types.
        """
        nodes = diagram.nodes.copy()
        edges = diagram.edges
        
        # Build adjacency information
        node_map = {node.id: node for node in nodes}
        outgoing = {node.id: [] for node in nodes}
        incoming = {node.id: [] for node in nodes}
        
        for edge in edges:
            if edge.source in outgoing and edge.target in incoming:
                outgoing[edge.source].append(edge.target)
                incoming[edge.target].append(edge.source)
        
        # Determine layers using topological sorting
        layers = self._compute_layers(nodes, outgoing, incoming)
        
        # Position nodes within each layer
        self._position_nodes_in_layers(layers, node_map)
        
        # Update the original nodes with new positions
        for node in nodes:
            if node.id in node_map:
                positioned_node = node_map[node.id]
                node.x = positioned_node.x
                node.y = positioned_node.y
                node.width = max(positioned_node.width, self.min_node_width)
                node.height = max(positioned_node.height, self.min_node_height)
        
        diagram.nodes = nodes
        return diagram
    
    def _compute_layers(self, nodes: List[DSLNode], outgoing: Dict[str, List[str]], incoming: Dict[str, List[str]]) -> List[List[DSLNode]]:
        """
        Compute hierarchical layers using node types and connections.
        """
        layers = []
        positioned = set()
        node_map = {node.id: node for node in nodes}
        
        # Layer 0: Client nodes (users, browsers, mobile apps)
        client_nodes = [node for node in nodes if self._is_client_node(node)]
        if client_nodes:
            layers.append(client_nodes)
            positioned.update(node.id for node in client_nodes)
        
        # Layer 1: External facing services (API gateways, load balancers, CDN)
        external_nodes = [node for node in nodes 
                         if node.id not in positioned and self._is_external_service(node)]
        if external_nodes:
            layers.append(external_nodes)
            positioned.update(node.id for node in external_nodes)
        
        # Layer 2: Application services (business logic, microservices)
        app_nodes = [node for node in nodes 
                    if node.id not in positioned and self._is_application_service(node)]
        if app_nodes:
            layers.append(app_nodes)
            positioned.update(node.id for node in app_nodes)
        
        # Layer 3: Data and security services
        data_security_nodes = [node for node in nodes 
                              if node.id not in positioned and self._is_data_or_security_service(node)]
        if data_security_nodes:
            layers.append(data_security_nodes)
            positioned.update(node.id for node in data_security_nodes)
        
        # Remaining nodes in final layer
        remaining_nodes = [node for node in nodes if node.id not in positioned]
        if remaining_nodes:
            layers.append(remaining_nodes)
        
        # Ensure we have at least one layer
        if not layers:
            layers = [nodes]
        
        log_info(f"Computed {len(layers)} layers: {[len(layer) for layer in layers]}")
        return layers
    
    def _position_nodes_in_layers(self, layers: List[List[DSLNode]], node_map: Dict[str, DSLNode]):
        """
        Position nodes within their assigned layers.
        """
        current_y = 50  # Start with some padding
        
        for layer_idx, layer_nodes in enumerate(layers):
            if not layer_nodes:
                continue
                
            # Calculate layer width needed
            total_node_width = len(layer_nodes) * self.min_node_width
            total_spacing = (len(layer_nodes) - 1) * self.node_spacing if len(layer_nodes) > 1 else 0
            layer_width = total_node_width + total_spacing
            
            # Center the layer horizontally
            start_x = max(50, -layer_width // 2 + 400)  # Center around x=400
            
            # Position each node in the layer
            current_x = start_x
            max_height = self.min_node_height
            
            for node in layer_nodes:
                node.x = float(current_x)
                node.y = float(current_y)
                node.width = max(float(node.width), self.min_node_width) if hasattr(node, 'width') else self.min_node_width
                node.height = max(float(node.height), self.min_node_height) if hasattr(node, 'height') else self.min_node_height
                
                max_height = max(max_height, node.height)
                current_x += node.width + self.node_spacing
                
                log_info(f"Positioned {node.id} at ({node.x:.1f}, {node.y:.1f})")
            
            # Move to next layer
            current_y += max_height + self.layer_spacing
    
    def _apply_grid_layout(self, diagram: DSLDiagram) -> DSLDiagram:
        """
        Fallback grid layout when hierarchical layout fails.
        """
        nodes = diagram.nodes
        
        if not nodes:
            return diagram
        
        # Calculate grid dimensions
        nodes_count = len(nodes)
        cols = max(1, int(nodes_count ** 0.5))
        rows = (nodes_count + cols - 1) // cols
        
        log_info(f"Applying grid layout: {rows}x{cols} for {nodes_count} nodes")
        
        # Position nodes in grid
        for idx, node in enumerate(nodes):
            row = idx // cols
            col = idx % cols
            
            node.x = float(100 + col * (self.min_node_width + self.node_spacing))
            node.y = float(100 + row * (self.min_node_height + self.layer_spacing))
            node.width = max(float(getattr(node, 'width', self.min_node_width)), self.min_node_width)
            node.height = max(float(getattr(node, 'height', self.min_node_height)), self.min_node_height)
            
            log_info(f"Grid positioned {node.id} at ({node.x:.1f}, {node.y:.1f})")
        
        return diagram
    
    def _is_client_node(self, node: DSLNode) -> bool:
        """Check if node represents a client/user interface."""
        node_type = (node.type or "").lower()
        node_id = node.id.lower()
        
        return any(term in node_type or term in node_id for term in [
            'client', 'user', 'browser', 'mobile', 'frontend', 'ui', 'app'
        ])
    
    def _is_external_service(self, node: DSLNode) -> bool:
        """Check if node is an external-facing service."""
        node_type = (node.type or "").lower()
        node_id = node.id.lower()
        
        return any(term in node_type or term in node_id for term in [
            'gateway', 'load_balancer', 'cdn', 'proxy', 'firewall', 'waf'
        ])
    
    def _is_application_service(self, node: DSLNode) -> bool:
        """Check if node is an application/business logic service.""" 
        node_type = (node.type or "").lower()
        node_id = node.id.lower()
        
        return any(term in node_type or term in node_id for term in [
            'service', 'api', 'application', 'microservice', 'server', 'backend'
        ]) and not self._is_data_or_security_service(node)
    
    def _is_data_or_security_service(self, node: DSLNode) -> bool:
        """Check if node is a data storage or security service."""
        node_type = (node.type or "").lower()
        node_id = node.id.lower()
        
        return any(term in node_type or term in node_id for term in [
            'database', 'db', 'storage', 'cache', 'redis', 'mongo', 'sql',
            'auth', 'security', 'encryption', 'secret', 'credential', 'vault'
        ])
