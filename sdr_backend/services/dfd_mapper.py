# services/mapper_service.py
from typing import Dict, Any, List, Tuple
import re
from utils.logger import log_info

class DirectDFDMapper:
    """
    Maps architecture diagram directly to DFD elements without relying on LLM.
    
    This class implements a deterministic mapping of architecture components to 
    the corresponding DFD elements, ensuring complete and accurate transformation.
    """
    
    def __init__(self):
        # Initialize type mapping dictionaries
        self.external_entity_keywords = ['internet', 'user', 'customer', 'actor', 'client', 'browser', 'third party', 'external']
        self.datastore_keywords = ['db', 'database', 'sql', 'storage', 'repository', 'cache', 'vault', 'backup']
        self.process_keywords = ['server', 'service', 'function', 'api', 'gateway', 'processor', 'app', 'application', 'lb', 'balancer', 'fw', 'firewall', 'protection', 'waf', 'cdn', 'proxy', 'siem', 'log']
    
    def map_diagram_to_dfd(self, diagram_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Converts architecture diagram state to DFD model.
        
        Args:
            diagram_state: Current state of the architecture diagram with nodes and edges
            
        Returns:
            A structured DFD model with elements, edges and boundaries
        """
        if not diagram_state or not diagram_state.get("nodes"):
            return {"elements": [], "edges": [], "boundaries": []}
        
        # Extract nodes and edges
        nodes = diagram_state.get("nodes", [])
        edges = diagram_state.get("edges", [])
        
        # Map nodes to DFD elements
        elements = []
        for node in nodes:
            element = self._map_node_to_element(node)
            if element:
                elements.append(element)
        
        # Map edges to DFD data flows
        dfd_edges = []
        for edge in edges:
            dfd_edge = self._map_edge_to_dataflow(edge)
            if dfd_edge:
                dfd_edges.append(dfd_edge)
        
        # Identify and create trust boundaries
        boundaries = self._create_trust_boundaries(nodes, edges)
        
        return {
            "elements": elements,
            "edges": dfd_edges,
            "boundaries": boundaries
        }
    
    def _map_node_to_element(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Maps a diagram node to a DFD element."""
        node_id = node.get("id")
        if not node_id:
            return None
        
        # Extract label and position
        label = self._get_node_label(node)
        position = node.get("position", {"x": 0, "y": 0})
        
        # Determine element type based on node label/id
        element_type = self._determine_element_type(node_id, label)
        
        # Determine shape based on element type
        shape = "rectangle"
        if element_type == "process":
            shape = "circle"
        elif element_type == "datastore":
            shape = "cylinder"
        
        # Return complete element
        return {
            "id": node_id,
            "type": element_type,
            "label": label,
            "properties": {
                "shape": shape,
                "position": position,
                "description": f"{label} ({element_type})"
            }
        }
    
    def _map_edge_to_dataflow(self, edge: Dict[str, Any]) -> Dict[str, Any]:
        """Maps a diagram edge to a DFD data flow."""
        edge_id = edge.get("id")
        source_id = edge.get("source")
        target_id = edge.get("target")
        
        if not edge_id or not source_id or not target_id:
            return None
        
        # Extract label if available
        label = edge.get("label", "Data flow")
        
        # Return complete data flow
        return {
            "id": edge_id,
            "source": source_id,
            "target": target_id,
            "label": label,
            "properties": {
                "data_type": "Application data"
            }
        }
    
    def _create_trust_boundaries(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Identifies logical trust boundaries based on node connectivity patterns.
        
        This implements a basic network segmentation approach:
        1. Internet-facing components in external boundary
        2. Application and processing components in application boundary
        3. Data storage components in data boundary
        """
        # Initialize empty boundaries
        boundaries = []
        
        # Define boundary types and initial node assignments
        boundary_definitions = {
            "external_boundary": {
                "id": "boundary_external",
                "label": "External Zone",
                "element_ids": [],
                "properties": {
                    "shape": "dashed_rectangle",
                    "position": {"x": 100, "y": 100}
                }
            },
            "application_boundary": {
                "id": "boundary_application",
                "label": "Application Zone",
                "element_ids": [],
                "properties": {
                    "shape": "dashed_rectangle", 
                    "position": {"x": 400, "y": 300}
                }
            },
            "data_boundary": {
                "id": "boundary_data",
                "label": "Data Zone",
                "element_ids": [],
                "properties": {
                    "shape": "dashed_rectangle",
                    "position": {"x": 700, "y": 500}
                }
            }
        }
        
        # Assign nodes to boundaries based on type and connectivity
        for node in nodes:
            node_id = node.get("id")
            if not node_id:
                continue
            
            label = self._get_node_label(node).lower()
            # log_info(f"Node : {label}")
            
            # Assign to external boundary
            if self._is_external_entity(node_id, label):
                # log_info(f"Node {label} is an external entity")
                boundary_definitions["external_boundary"]["element_ids"].append(node_id)
            
            # Assign to data boundary
            elif self._is_datastore(node_id, label):
                # log_info(f"Node {label} is a datastore")
                boundary_definitions["data_boundary"]["element_ids"].append(node_id)
            
            # Assign to application boundary (default)
            else:
                # log_info(f"Node {label} is a process")
                boundary_definitions["application_boundary"]["element_ids"].append(node_id)
        
        # Only add boundaries that have elements
        for boundary_id, boundary_data in boundary_definitions.items():
            if boundary_data["element_ids"]:
                boundaries.append(boundary_data)
        
        return boundaries
    
    def _determine_element_type(self, node_id: str, label: str) -> str:
        """Determines the DFD element type from node label and id."""
        label_lower = label.lower()
        node_id_lower = node_id.lower()
        
        # Check for external entity
        if self._is_external_entity(node_id_lower, label_lower):
            return "external_entity"
        
        # Check for process
        elif self._is_process(node_id_lower, label_lower):
            return "process"
        
        # Check for datastore
        elif self._is_datastore(node_id_lower, label_lower):
            return "datastore"
        
        else:   
            # Default to process
            return "process"
    
    def _is_external_entity(self, node_id: str, label: str) -> bool:
        """Checks if a node should be classified as an external entity."""
        return any(keyword in label or keyword in node_id for keyword in self.external_entity_keywords)
    
    def _is_process(self, node_id: str, label: str) -> bool:
        """Checks if a node should be classified as a process."""
        return any(keyword in label or keyword in node_id for keyword in self.process_keywords)
    
    def _is_datastore(self, node_id: str, label: str) -> bool:
        """Checks if a node should be classified as a datastore."""
        return any(keyword in label or keyword in node_id for keyword in self.datastore_keywords)
    
    def _get_node_label(self, node: Dict[str, Any]) -> str:
        """Safely extracts label from node data."""
        node_data = node.get("data", {})
        if isinstance(node_data, dict):
            label = node_data.get("label", "")
        else:
            label = ""
            
        # If no label found, use node ID with spaces
        if not label and node.get("id"):
            # Convert camelCase or snake_case to readable format
            label = node.get("id").replace("_", " ").replace("-", " ")
            # Add spaces before uppercase letters in camelCase
            label = ''.join([' ' + c if c.isupper() else c for c in label]).strip()
            # Capitalize first letter of each word
            label = ' '.join(word.capitalize() for word in label.split())
            
        return label or "Unnamed Node"