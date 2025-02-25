import json
from typing import Dict, Any, Optional, List
from models.pydantic_models import ArchitectureResponse, ExpertResponse, DiagramContext
import logging
from utils.logger import log_info

class ValidationHandler:

    def __init__(self):
        pass

    # Validate expert responses
    async def _validate_expert_response(self, response: Dict[str, Any]):
        """
        Additional validation for expert responses.
        """
        required_fields = ['expert_message', 'justification']
        for field in required_fields:
            if field not in response:
                raise ValueError(f"Missing required field: {field}")
            if len(response[field]) < 50:
                raise ValueError(f"Field {field} is too short")
        
        # Check for required keywords in justification
        required_elements = ['because', 'based on', 'according to', 'recommendation', 'suggestion','reason','recommendations','suggestions']
        if not any(element in response.justification.lower() for element in required_elements):
            raise ValueError("Justification must include reasoning ('because', 'based on', 'according to', 'recommendation', 'suggestion','reason','recommendations','suggestions')")

    # Validate ArchitectureResponse format
    async def _process_architecture_response(
        self, 
        response: ArchitectureResponse,
        context: Optional[DiagramContext]
    ) -> None:
        """
        Process and validate architecture-specific response.
        """
        # log_info(f"Processing architecture response: {response}")
        try:
            required_fields = ['nodes', 'edges', 'explanation', 'references', 'confidence', 'security_messages']
            for field in required_fields:
                if not hasattr(response, field):
                    raise ValueError(f"Missing required field: {field}")
                
            # Validate actions
            for node in response.nodes:
                if not all(hasattr(node, key) for key in ['action', 'node_type', 'node_id', 'properties']):
                    raise ValueError(f"Invalid node structure: {node}")
            
            # Validate node IDs and basic structure
            self._validate_node_ids(response)
            
            # Validate node positions if provided
            if context:
                self._validate_node_positions(response, context)
                
        except Exception as e:
            logging.error(f"Error in architecture response processing: {str(e)}")
            raise
    



    # Validate node positions
    async def _validate_node_positions(self,
        response: ArchitectureResponse,
        context: DiagramContext
    ) -> None:
        """
        Validate node positions against existing diagram context.
        """
        existing_positions = {
            node['id']: node.get('position')
            for node in context.get('nodes', [])
        }
        
        for node in response.nodes:
            if node.action == 'add':
                # Check for position conflicts
                new_pos = node.position
                if new_pos:
                    for existing_id, existing_pos in existing_positions.items():
                        if existing_pos and self._positions_overlap(new_pos, existing_pos):
                            response.security_messages.append({
                                "severity": "WARNING",
                                "message": f"Node {node.node_id} position overlaps with {existing_id}"
                            })

    async def _validate_node_ids(self, response: ArchitectureResponse) -> None:
        """
        Validate node ID formats and uniqueness.
        """
        # Get all node IDs
        node_ids = [node.node_id for node in response.nodes]
    
        # Check for node Id format in add, modify, remove
        for node in response.nodes:
            # Validate ID format
            if node.action in ['add', 'modify', 'remove']:
                if not node.node_id.startswith('node-'):
                    raise ValueError(f"Invalid node ID format for {node.action}: {node.node_id}")
            
        # Check for duplicate node IDs
        if len(node_ids) != len(set(node_ids)):
            raise ValueError("Duplicate node IDs found : {node_ids}")

        # Validate edge references
        for edge in response.edges:
            if edge.source not in node_ids:
                raise ValueError(f"Edge references non-existent source node: {edge.source}")
            if edge.target not in node_ids:
                raise ValueError(f"Edge references non-existent target node: {edge.target}")

    @staticmethod
    def _positions_overlap(pos1: List[float], pos2: List[float], threshold: float = 50.0) -> bool:
        """
        Check if two node positions overlap within a threshold.
        """
        return (
            abs(pos1[0] - pos2[0]) < threshold and 
            abs(pos1[1] - pos2[1]) < threshold
        )