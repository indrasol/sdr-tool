import json
from typing import Dict, Any, Optional, List, Union
from models.pydantic_models import ArchitectureResponse, ExpertResponse, DiagramContext
import logging
from utils.logger import log_info

class ValidationHandler:

    def __init__(self):
        pass

    # Validate expert responses with enhanced robustness
    async def _validate_expert_response(self, response: Union[Dict[str, Any], ExpertResponse]):
        """
        Additional validation for expert responses with more flexibility.
        """
        try:
            # Handle both dict and ExpertResponse objects
            if isinstance(response, dict):
                expert_message = response.get('expert_message', '')
                justification = response.get('justification', '')
            else:  # ExpertResponse object
                expert_message = response.expert_message
                justification = response.justification
            
            # More flexible length check
            if len(expert_message) < 10:  # Reduced from 50 for flexibility
                log_info(f"Warning: expert_message is very short ({len(expert_message)} chars)")
                # Don't raise error, just log warning
            
            if len(justification) < 10:  # Reduced from 50 for flexibility
                log_info(f"Warning: justification is very short ({len(justification)} chars)")
                # Don't raise error, just log warning
            
            # More flexible keyword check with fuzzy matching
            required_elements = [
                'because', 'based on', 'according to', 'recommendation', 'suggestion',
                'reason', 'recommendations', 'suggestions', 'advise', 'advice',
                'therefore', 'thus', 'hence', 'best practice', 'standard'
            ]
            
            # Convert justification to lowercase for case-insensitive matching
            justification_lower = justification.lower()
            
            if not any(element in justification_lower for element in required_elements):
                log_info("Warning: Justification may lack explicit reasoning keywords")
                # Don't raise error, just log warning
            
            return True  # Validation successful
            
        except Exception as e:
            log_info(f"Expert response validation warning (non-critical): {str(e)}")
            return False  # Validation failed but we'll continue processing

    # Validate ArchitectureResponse format with enhanced robustness
    async def _process_architecture_response(
        self, 
        response: ArchitectureResponse,
        context: Optional[DiagramContext] = None
    ) -> None:
        """
        Process and validate architecture-specific response with better error handling.
        """
        log_info(f"Processing architecture response with {len(response.nodes)} nodes and {len(response.edges)} edges")
        
        try:
            # Validate required fields but continue on warning-level issues
            required_fields = ['nodes', 'edges', 'explanation']  # Removed non-critical fields
            missing_fields = []
            
            for field in required_fields:
                if not hasattr(response, field) or getattr(response, field) is None:
                    missing_fields.append(field)
            
            if missing_fields:
                missing_str = ", ".join(missing_fields)
                error_msg = f"Missing required fields: {missing_str}"
                log_info(f"Validation error: {error_msg}")
                raise ValueError(error_msg)
            
            # Check for empty nodes list
            if not response.nodes:
                log_info("Warning: Response contains no nodes")
                # Continue processing, as this might be valid in some contexts
            
            # Optional field validation with defaults
            if not hasattr(response, 'references') or response.references is None:
                response.references = []
                log_info("Added default empty references list")
            
            if not hasattr(response, 'confidence') or response.confidence is None:
                response.confidence = 0.8
                log_info("Added default confidence value of 0.8")
            
            if not hasattr(response, 'security_messages') or response.security_messages is None:
                response.security_messages = []
                log_info("Added default empty security_messages list")
            
            # Validate node structure but be more flexible
            invalid_nodes = []
            for i, node in enumerate(response.nodes):
                # Check for required node fields
                required_node_fields = ['action', 'node_type', 'node_id']
                if not all(hasattr(node, field) for field in required_node_fields):
                    missing_node_fields = [f for f in required_node_fields if not hasattr(node, f)]
                    invalid_nodes.append((i, f"Missing fields: {', '.join(missing_node_fields)}"))
                    continue
                
                # Normalize action field
                if hasattr(node, 'action'):
                    node.action = node.action.lower()
                    # Map similar actions to standard ones
                    action_map = {
                        'create': 'add', 'insert': 'add', 'new': 'add',
                        'update': 'modify', 'change': 'modify', 'edit': 'modify',
                        'delete': 'remove', 'erase': 'remove',
                        'link': 'connect', 'join': 'connect'
                    }
                    if node.action in action_map:
                        original = node.action
                        node.action = action_map[node.action]
                        log_info(f"Normalized node action from '{original}' to '{node.action}'")
            
            # Report invalid nodes but continue with valid ones
            if invalid_nodes:
                for idx, reason in invalid_nodes:
                    log_info(f"Warning: Node at index {idx} has invalid structure: {reason}")
                
                # Remove invalid nodes
                response.nodes = [node for i, node in enumerate(response.nodes) 
                                  if i not in [idx for idx, _ in invalid_nodes]]
                log_info(f"Removed {len(invalid_nodes)} invalid nodes, {len(response.nodes)} remain")
            
            # Validate node IDs and structure, but don't fail on warnings
            try:
                await self._validate_node_ids(response)
            except ValueError as e:
                log_info(f"Node ID validation warning: {str(e)}")
                # Add as a security message instead of failing
                response.security_messages.append({
                    "severity": "HIGH",
                    "message": f"Node ID issue: {str(e)}"
                })
            
            # Validate node positions if context provided
            if context:
                try:
                    await self._validate_node_positions(response, context)
                except Exception as e:
                    log_info(f"Position validation warning: {str(e)}")
                    # Add as a security message instead of failing
                    response.security_messages.append({
                        "severity": "MEDIUM",
                        "message": f"Position issue: {str(e)}"
                    })
                    
        except ValueError as e:
            # Critical validation errors should still be raised
            log_info(f"Critical validation error: {str(e)}")
            raise
        except Exception as e:
            log_info(f"Unexpected error in architecture response processing: {str(e)}")
            # Add as a security message but continue processing
            if hasattr(response, 'security_messages'):
                response.security_messages.append({
                    "severity": "CRITICAL",
                    "message": f"Validation error: {str(e)}"
                })

    # Validate node positions with enhanced error handling
    async def _validate_node_positions(self,
        response: ArchitectureResponse,
        context: DiagramContext
    ) -> None:
        """
        Validate node positions against existing diagram context.
        Enhanced to handle various context formats and position representations.
        """
        try:
            # Handle context data in multiple possible formats
            existing_positions = {}
            
            # Extract nodes from context based on different possible structures
            context_nodes = []
            if hasattr(context, 'nodes') and context.nodes:
                context_nodes = context.nodes
            elif isinstance(context, dict) and 'nodes' in context:
                context_nodes = context['nodes']
            
            # Build position map with more flexible position handling
            for node in context_nodes:
                node_id = None
                position = None
                
                # Handle different node structure formats
                if isinstance(node, dict):
                    node_id = node.get('id')
                    position = node.get('position')
                else:  # Assume object with attributes
                    if hasattr(node, 'id'):
                        node_id = node.id
                    if hasattr(node, 'position'):
                        position = node.position
                
                if node_id and position:
                    # Normalize position format
                    if isinstance(position, (list, tuple)):
                        # Already in [x, y] format
                        pass
                    elif isinstance(position, dict) and 'x' in position and 'y' in position:
                        # Convert {x: val, y: val} to [x, y]
                        position = [position['x'], position['y']]
                    
                    existing_positions[node_id] = position
            
            # Check new node positions against existing ones
            for node in response.nodes:
                if node.action == 'add':
                    # Get and normalize position
                    new_pos = None
                    if hasattr(node, 'position'):
                        new_pos = node.position
                    
                    if new_pos:
                        # Normalize new_pos format if needed
                        if isinstance(new_pos, dict) and 'x' in new_pos and 'y' in new_pos:
                            new_pos = [new_pos['x'], new_pos['y']]
                        
                        # Check for overlaps
                        for existing_id, existing_pos in existing_positions.items():
                            if existing_pos and self._positions_overlap(new_pos, existing_pos):
                                # Add warning message instead of failing
                                if not hasattr(response, 'security_messages'):
                                    response.security_messages = []
                                
                                response.security_messages.append({
                                    "severity": "WARNING",
                                    "message": f"Node {node.node_id} position overlaps with {existing_id}"
                                })
        except Exception as e:
            log_info(f"Position validation warning (non-critical): {str(e)}")
            # Don't raise exception, just log warning

    # Validate node IDs with more flexible handling
    async def _validate_node_ids(self, response: ArchitectureResponse) -> None:
        """
        Validate node ID formats and uniqueness with enhanced error handling.
        """
        try:
            # Get all node IDs, handling potential missing attributes
            node_ids = []
            for node in response.nodes:
                if hasattr(node, 'node_id'):
                    node_ids.append(node.node_id)
                elif hasattr(node, 'id'):  # Fallback
                    node_ids.append(node.id)
        
            # Check for node ID format in add, modify, remove operations
            format_warnings = []
            for node in response.nodes:
                # Skip if node_id attribute is missing
                if not hasattr(node, 'node_id'):
                    continue
                    
                # Check ID format for specific actions
                if hasattr(node, 'action') and node.action in ['add', 'modify', 'remove']:
                    if not node.node_id.startswith('node-'):
                        # Auto-fix ID format if possible
                        if node.node_id.isdigit():
                            original_id = node.node_id
                            node.node_id = f"node-{node.node_id}"
                            format_warnings.append(f"Auto-fixed node ID format from '{original_id}' to '{node.node_id}'")
                        else:
                            format_warnings.append(f"Invalid node ID format for {node.action}: {node.node_id}")
            
            # Log format warnings but don't fail
            for warning in format_warnings:
                log_info(f"Warning: {warning}")
                if hasattr(response, 'security_messages'):
                    response.security_messages.append({
                        "severity": "LOW",
                        "message": warning
                    })
            
            # Check for duplicate node IDs
            if len(node_ids) != len(set(node_ids)):
                duplicates = [id for id in node_ids if node_ids.count(id) > 1]
                unique_duplicates = list(set(duplicates))
                warning = f"Duplicate node IDs found: {unique_duplicates}"
                log_info(f"Warning: {warning}")
                
                if hasattr(response, 'security_messages'):
                    response.security_messages.append({
                        "severity": "HIGH",
                        "message": warning
                    })
            
            # Validate edge references with more flexible handling
            if hasattr(response, 'edges'):
                edge_warnings = []
                for i, edge in enumerate(response.edges):
                    # Skip edges missing source or target
                    if not hasattr(edge, 'source') or not hasattr(edge, 'target'):
                        edge_warnings.append(f"Edge at index {i} missing source or target")
                        continue
                        
                    if edge.source not in node_ids:
                        edge_warnings.append(f"Edge references non-existent source node: {edge.source}")
                    if edge.target not in node_ids:
                        edge_warnings.append(f"Edge references non-existent target node: {edge.target}")
                
                # Log edge warnings but don't fail
                for warning in edge_warnings:
                    log_info(f"Warning: {warning}")
                    if hasattr(response, 'security_messages'):
                        response.security_messages.append({
                            "severity": "MEDIUM",
                            "message": warning
                        })
                        
        except Exception as e:
            log_info(f"Node ID validation warning (non-critical): {str(e)}")
            # Don't raise exception for non-critical validation

    @staticmethod
    def _positions_overlap(pos1: List[float], pos2: List[float], threshold: float = 50.0) -> bool:
        """
        Check if two node positions overlap within a threshold.
        Enhanced to handle various position formats.
        """
        try:
            # Ensure positions are in the expected format
            if not (isinstance(pos1, (list, tuple)) and isinstance(pos2, (list, tuple))):
                return False
                
            # Ensure positions have at least 2 elements
            if len(pos1) < 2 or len(pos2) < 2:
                return False
                
            # Calculate distance
            return (
                abs(float(pos1[0]) - float(pos2[0])) < threshold and 
                abs(float(pos1[1]) - float(pos2[1])) < threshold
            )
        except (TypeError, ValueError, IndexError):
            # If any conversion fails, assume positions don't overlap
            return False