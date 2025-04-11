import importlib
import sys
import io
from contextlib import redirect_stdout
from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone
import uuid
import json

# Direct PyTM imports
from pytm import TM, Server, Datastore, Actor, Boundary, Dataflow, Lambda, Process, ExternalEntity
from pytm.pytm import Element, Dataflow as PyTMDataflow  # For type checking

from services.dfd_mapper import ADToPytmMapper
from utils.logger import log_info
from models.dfd_models import DFDResponse, DFDElement, DFDDataFlow, DFDBoundary, DFDThreat
from models.threat_models import DFDModelResponse, ThreatsResponse, FullThreatModelResponse, ThreatItem

class ThreatModelingService:

    def __init__(self):
        self.mapper = ADToPytmMapper()
    async def extract_structured_dfd(self, llm_response: Dict[str, Any], threat_model_id: str = None) -> FullThreatModelResponse:
        """
        Extract structured DFD and threat information from LLM response.
        
        Args:
            llm_response: Raw response from LLM
            threat_model_id: Optional threat model ID to use
            
        Returns:
            Structured DFD and threats data
        """
        log_info(f"Extracting structured DFD from LLM response")
        
        # Generate a new threat model ID if not provided
        if not threat_model_id:
            threat_model_id = str(uuid.uuid4())
        
        try:
            # Initialize elements, edges, and boundaries lists
            elements = []
            edges = []
            boundaries = []
            threats = []
            
            # Process elements and convert to DFDElement format
            if "elements" in llm_response and isinstance(llm_response["elements"], list):
                for element in llm_response["elements"]:
                    # Create element dictionary directly
                    element_dict = {
                        "id": element.get("id", f"element_{len(elements)}"),
                        "type": element.get("type", "process"),
                        "label": element.get("name", "Unnamed Element"),
                        "properties": {
                            "shape": element.get("shape", "circle"),
                            "position": element.get("position", {"x": 0, "y": 0})
                        },
                        "boundary_id": None
                    }
                    elements.append(element_dict)
            
            # Process edges and convert to DFDEdge format (not DFDDataFlow)
            if "edges" in llm_response and isinstance(llm_response["edges"], list):
                for edge in llm_response["edges"]:
                    # Create edge dictionary directly
                    edge_dict = {
                        "id": edge.get("id", f"edge_{len(edges)}"),
                        "source": edge.get("source", ""),
                        "target": edge.get("target", ""),
                        "label": edge.get("data", "Data Flow"),
                        "properties": {
                            "protocol": "HTTP/HTTPS" if "HTTP" in edge.get("data", "") else "Unknown"
                        }
                    }
                    edges.append(edge_dict)
            
            # Process trust boundaries and convert to DFDBoundary format
            if "trust_boundaries" in llm_response and isinstance(llm_response["trust_boundaries"], list):
                for boundary in llm_response["trust_boundaries"]:
                    # Create boundary dictionary directly
                    boundary_dict = {
                        "id": boundary.get("id", f"boundary_{len(boundaries)}"),
                        "label": boundary.get("name", "Unnamed Boundary"),
                        "element_ids": boundary.get("elements", []),
                        "properties": {
                            "shape": boundary.get("shape", "dashed_rectangle"),
                            "position": boundary.get("position", {"x": 0, "y": 0})
                        }
                    }
                    boundaries.append(boundary_dict)
                    
                    # Update element boundary_id for elements in this boundary
                    for element in elements:
                        if element["id"] in boundary.get("elements", []):
                            element["boundary_id"] = boundary_dict["id"]
            
            # Generate at least one generic threat if none provided
            if not "threats" in llm_response or not llm_response.get("threats"):
                # Create a minimal threat for each boundary
                for idx, boundary in enumerate(boundaries):
                    if boundary["element_ids"]:
                        threat_dict = {
                            "id": f"T{idx+1}",
                            "description": f"Security considerations for {boundary['label']}",
                            "mitigation": "Implement proper security controls and access restrictions",
                            "severity": "MEDIUM",
                            "target_elements": boundary["element_ids"][:1]  # Target first element in boundary
                        }
                        threats.append(threat_dict)
            
            # Construct the final models from dictionaries
            dfd_model = {
                "elements": elements,
                "edges": edges,
                "boundaries": boundaries
            }
            
            threats_data = {
                "severity_counts": {
                    "HIGH": 0,
                    "MEDIUM": len(threats),
                    "LOW": 0
                },
                "threats": threats
            }
            
            # Create the response directly
            response = FullThreatModelResponse(
                threat_model_id=threat_model_id,
                dfd_model=DFDModelResponse(**dfd_model),
                threats=ThreatsResponse(**threats_data),
                generated_at=datetime.now(timezone.utc).isoformat()
            )
            
            log_info(f"Successfully extracted DFD with {len(elements)} elements, " 
                    f"{len(edges)} edges, {len(boundaries)} boundaries, "
                    f"and {len(threats)} threats")
            
            return response
            
        except Exception as e:
            # Log the error
            log_info(f"Error extracting structured DFD from LLM response: {str(e)}")
            
            # Return a minimal valid structure
            return FullThreatModelResponse(
                threat_model_id=threat_model_id,
                dfd_model=DFDModelResponse(elements=[], edges=[], boundaries=[]),
                threats=ThreatsResponse(severity_counts={"HIGH": 0, "MEDIUM": 0, "LOW": 0}, threats=[]),
                generated_at=datetime.now(timezone.utc).isoformat()
            )

    # def _extract_structured_data(self, tm_instance, threat_model_id: str) -> Dict[str, Any]:
    #     """Extracts structured data from a processed pytm TM object and includes the threat_model_id."""
    #     nodes = []
    #     edges = []
    #     boundaries = []
    #     threats = []

    #     try:
    #         # Extract Boundaries
    #         if hasattr(tm_instance, 'boundaries'):
    #             for b_obj in tm_instance.boundaries:
    #                 boundary_id = getattr(b_obj, 'name', f'boundary_{uuid.uuid4()}')
    #                 boundaries.append(DFDBoundary(
    #                     id=boundary_id,
    #                     label=boundary_id,
    #                     element_ids=[]
    #                 ))
    
    #         # Extract Elements (Nodes)
    #         if hasattr(tm_instance, 'elements'):
    #             for element_obj in tm_instance.elements:
    #                 element_name = getattr(element_obj, 'name', f'element_{uuid.uuid4()}')
                    
    #                 # Safely get properties
    #                 props = {}
                    
    #                 # Basic properties from the element itself
    #                 for prop_name in ['OS', 'isSQL', 'isHardened', 'sanitizesInput', 'encodesOutput', 'storesSensitiveData']:
    #                     # Try direct access first
    #                     if hasattr(element_obj, prop_name):
    #                         props[prop_name] = getattr(element_obj, prop_name)
    #                     # Then try via controls
    #                     elif hasattr(element_obj, 'controls') and hasattr(element_obj.controls, prop_name):
    #                         props[prop_name] = getattr(element_obj.controls, prop_name)
                    
    #                 # Clean up properties - remove None values
    #                 props = {k: v for k, v in props.items() if v is not None}
    
    #                 # Get boundary information if available
    #                 boundary_id = None
    #                 if hasattr(element_obj, 'inBoundary') and element_obj.inBoundary:
    #                     boundary_ref = element_obj.inBoundary
    #                     boundary_id = getattr(boundary_ref, 'name', None)
    
    #                 # Create the element
    #                 element_type = element_obj.__class__.__name__ if hasattr(element_obj, '__class__') else "Unknown"
    #                 nodes.append(DFDElement(
    #                     id=element_name,
    #                     type=element_type,
    #                     label=element_name,
    #                     properties=props,
    #                     boundary_id=boundary_id
    #                 ))
                    
    #                 # Add element to its boundary
    #                 if boundary_id:
    #                     for b in boundaries:
    #                         if b.id == boundary_id:
    #                             b.element_ids.append(element_name)
    #                             break
    
    #         # Extract Dataflows (Edges)
    #         # Find dataflows using the same flexible approach as in _serialize_model
    #         dataflows = []
    #         if hasattr(tm_instance, 'dataflows'):
    #             dataflows = tm_instance.dataflows
    #         elif hasattr(tm_instance, '_flows'):
    #             dataflows = tm_instance._flows
    #         else:
    #             # Look for dataflows in any attribute that might contain them
    #             for attr_name in dir(tm_instance):
    #                 if attr_name.startswith('_') and not attr_name.startswith('__'):
    #                     attr_value = getattr(tm_instance, attr_name, None)
    #                     if isinstance(attr_value, list) and attr_value and hasattr(attr_value[0], 'source') and hasattr(attr_value[0], 'sink'):
    #                         dataflows = attr_value
    #                         break
    
    #         for flow_obj in dataflows:
    #             flow_name = getattr(flow_obj, 'name', f'flow_{uuid.uuid4()}')
                
    #             # Safely collect properties
    #             props = {}
    #             for prop_name in ['protocol', 'isEncrypted', 'dstPort', 'data', 'authenticatesSource', 'authenticatesDestination']:
    #                 # Try direct access first
    #                 if hasattr(flow_obj, prop_name):
    #                     props[prop_name] = getattr(flow_obj, prop_name)
    #                 # Then try via controls
    #                 elif hasattr(flow_obj, 'controls') and hasattr(flow_obj.controls, prop_name):
    #                     props[prop_name] = getattr(flow_obj.controls, prop_name)
                
    #             # Handle data specially to avoid complex objects
    #             if 'data' in props and props['data'] is not None:
    #                 props['data'] = str(props['data'])
                
    #             # Clean up properties
    #             props = {k: v for k, v in props.items() if v is not None}
    
    #             # Get source and target
    #             source_obj = getattr(flow_obj, 'source', None)
    #             sink_obj = getattr(flow_obj, 'sink', None)
                
    #             source_name = getattr(source_obj, 'name', 'unknown_source') if source_obj else 'unknown_source'
    #             sink_name = getattr(sink_obj, 'name', 'unknown_sink') if sink_obj else 'unknown_sink'
    
    #             edges.append(DFDDataFlow(
    #                 id=flow_name,
    #                 source=source_name,
    #                 target=sink_name,
    #                 label=flow_name,
    #                 properties=props
    #             ))
    
    #         # Extract Threats (Findings)
    #         if hasattr(tm_instance, 'findings') and tm_instance.findings:
    #             for finding in tm_instance.findings:
    #                 # Handle both object-style findings and dict-style findings
    #                 if isinstance(finding, dict):
    #                     # Dict-style findings (from our _minimal_threat_matching)
    #                     target_obj = finding.get('target')
    #                     finding_sid = finding.get('SID', f'threat_{uuid.uuid4()}')
    #                     finding_desc = finding.get('description', 'No description')
    #                     finding_sev = finding.get('severity', 'Medium')
    #                 else:
    #                     # Object-style findings (from PyTM's native processing)
    #                     target_obj = getattr(finding, 'target', None)
    #                     finding_sid = getattr(finding, 'SID', f'threat_{uuid.uuid4()}')
    #                     finding_desc = getattr(finding, 'description', 'No description')
    #                     finding_sev = getattr(finding, 'severity', 'Medium')
                    
    #                 # Default to unknown target
    #                 target_id = None
    #                 target_type = None
                    
    #                 # Try to identify the target element or flow
    #                 if target_obj:
    #                     # Get the target name
    #                     if hasattr(target_obj, 'name'):
    #                         target_name = target_obj.name
    #                     elif isinstance(target_obj, dict) and 'name' in target_obj:
    #                         target_name = target_obj['name']
    #                     else:
    #                         target_name = str(target_obj)
                            
    #                     # Check if it's a dataflow or an element
    #                     if (hasattr(target_obj, 'source') and hasattr(target_obj, 'sink')) or \
    #                        (isinstance(target_obj, dict) and 'source' in target_obj and 'sink' in target_obj):
    #                         target_id = target_name
    #                         target_type = 'dataflow'
    #                     else:
    #                         target_id = target_name
    #                         target_type = 'element'
                    
    #                 # Create the threat
    #                 threats.append(DFDThreat(
    #                     id=finding_sid,
    #                     description=finding_desc,
    #                     severity=finding_sev,
    #                     target_element_id=target_id,
    #                     target_element_type=target_type
    #                 ))
    #     except Exception as e:
    #         log_info(f"Error extracting structured data: {e}")
    #         # If extraction fails, create a minimal result
    #         if not nodes:
    #             nodes = [DFDElement(
    #                 id="system",
    #                 type="System",
    #                 label="System",
    #                 properties={},
    #                 boundary_id=None
    #             )]
            
    #         if not threats:
    #             threats = [DFDThreat(
    #                 id="GENERIC-THREAT",
    #                 description="Generic security threat - error during threat modeling",
    #                 severity="Medium",
    #                 target_element_id="system",
    #                 target_element_type="element"
    #             )]

    #     response = DFDResponse(
    #         threat_model_id=threat_model_id,
    #         nodes=nodes,
    #         edges=edges,
    #         boundaries=boundaries,
    #         threats=threats,
    #         generated_at=datetime.now(timezone.utc).isoformat()
    #     )
    #     # Return as dict matching the DFDResponse model structure
    #     return response.model_dump(exclude_none=True)

    # def build_direct_threat_model(self, diagram_state: Dict[str, Any], threat_model_id: str) -> Tuple[str, Dict[str, Any]]:
    #     """
    #     Directly builds a PyTM threat model from diagram state without using exec().
        
    #     Args:
    #         diagram_state: The diagram state with nodes and edges
    #         threat_model_id: Unique ID for the threat model
            
    #     Returns:
    #         Tuple of (serialized_model_code, structured_data)
    #     """
    #     log_info(f"Building direct threat model with ID: {threat_model_id}")
    #     start_time = datetime.now(timezone.utc)
        
    #     # Save and modify sys.argv to prevent PyTM from trying to parse arguments
    #     original_argv = sys.argv
    #     sys.argv = ["pytm"]  # Set a minimal argv to avoid parsing errors
        
    #     try:
    #         # Create the threat model
    #         tm = TM(name=f"Threat Model {threat_model_id[:8]}")
    #         tm.description = "Threat model generated from architecture diagram"
    #         tm.isOrdered = True
    #         tm.mergeResponses = True
            
    #         # Track created objects for reference
    #         boundaries = {}
    #         elements = {}
            
    #         # Create default boundaries
    #         b_external = Boundary(name="External Boundary")
    #         b_system = Boundary(name="System Boundary")
    #         b_data = Boundary(name="Data Boundary")
            
    #         boundaries = {
    #             "External Boundary": b_external,
    #             "System Boundary": b_system,
    #             "Data Boundary": b_data
    #         }
            
    #         # Process nodes
    #         nodes = diagram_state.get("nodes", [])
    #         edges = diagram_state.get("edges", [])
            
    #         # Step 1: Create elements from nodes
    #         for node in nodes:
    #             node_id = node.get("id")
    #             if not node_id:
    #                 continue
                    
    #             node_data = node.get("data", {})
    #             label = node_data.get("label", f"Component {node_id}")
    #             description = node_data.get("description", f"Description for {label}")
                
    #             # Determine element type and boundary
    #             element_type = "Server"  # Default
    #             boundary = b_system  # Default boundary
                
    #             label_lower = label.lower()
                
    #             # Map node to PyTM element type
    #             if "database" in label_lower or "db" in label_lower or "store" in label_lower:
    #                 element_class = Datastore
    #                 boundary = b_data
    #             elif "user" in label_lower or "actor" in label_lower or "client" in label_lower:
    #                 element_class = Actor
    #                 boundary = b_external
    #             elif "process" in label_lower or "job" in label_lower or "task" in label_lower:
    #                 element_class = Process
    #                 boundary = b_system
    #             elif "lambda" in label_lower or "function" in label_lower:
    #                 element_class = Lambda
    #                 boundary = b_system
    #             elif "external" in label_lower or "third party" in label_lower:
    #                 element_class = ExternalEntity
    #                 boundary = b_external
    #             else:
    #                 element_class = Server
    #                 boundary = b_system
                
    #             # Create the element
    #             element = element_class(name=label)
    #             element.description = description
    #             element.inBoundary = boundary
                
    #             # Add element-specific properties
    #             if element_class == Datastore:
    #                 element.isSQL = 'sql' in label_lower or 'database' in label_lower
    #                 element.controls.storesSensitiveData = 'sensitive' in label_lower or 'user' in label_lower
                    
    #             if element_class == Server:
    #                 element.OS = "Linux"  # Default
    #                 element.controls.isHardened = False
    #                 element.controls.sanitizesInput = True
    #                 element.controls.encodesOutput = True
                
    #             # Store for later reference
    #             elements[node_id] = element
            
    #         # Step 2: Create dataflows from edges
    #         for edge in edges:
    #             source_id = edge.get("source")
    #             target_id = edge.get("target")
                
    #             if not source_id or not target_id:
    #                 continue
                    
    #             if source_id not in elements or target_id not in elements:
    #                 log_info(f"Skipping edge: source or target node not found: {source_id} -> {target_id}")
    #                 continue
                    
    #             source = elements[source_id]
    #             target = elements[target_id]
                
    #             # Get source and target labels for better description
    #             source_label = source.name
    #             target_label = target.name
                
    #             flow = Dataflow(source, target, name=f"Flow from {source_label} to {target_label}")
                
    #             # Determine flow properties
    #             is_external = False
    #             is_sensitive = False
    #             is_authentication = False
                
    #             source_label_lower = source_label.lower()
    #             target_label_lower = target_label.lower()
                
    #             # Check sensitivity and security context
    #             if any(term in source_label_lower or term in target_label_lower for term in 
    #                 ["auth", "login", "user", "account", "credential", "password"]):
    #                 is_sensitive = True
    #                 is_authentication = True
                    
    #             if (isinstance(source, Actor) or isinstance(source, ExternalEntity) or
    #                 isinstance(target, Actor) or isinstance(target, ExternalEntity)):
    #                 is_external = True
                
    #             # Set appropriate properties
    #             if is_external:
    #                 flow.protocol = "HTTPS"
    #                 flow.isEncrypted = True
    #                 if is_authentication:
    #                     flow.authenticatesDestination = True
    #                     flow.controls.authenticatesSource = True
    #             else:
    #                 # Internal flow
    #                 flow.protocol = "HTTP"
    #                 flow.isEncrypted = False
    #                 flow.controls.authenticatesSource = True
            
    #         # Process the model using our custom method that doesn't try to parse arguments
    #         self._custom_process_model(tm)
            
    #         # Serialize the model for storage (optional but useful for debugging)
    #         serialized_code = self._serialize_model(tm, elements, boundaries)
            
    #         # Extract structured data
    #         structured_data = self._extract_structured_data(tm, threat_model_id)
            
    #         # Get dataflows count using the same method as in _serialize_model
    #         dataflows = []
    #         if hasattr(tm, 'dataflows'):
    #             dataflows = tm.dataflows
    #         elif hasattr(tm, '_flows'):
    #             dataflows = tm._flows
    #         else:
    #             for attr_name in dir(tm):
    #                 if attr_name.startswith('_') and not attr_name.startswith('__'):
    #                     attr_value = getattr(tm, attr_name, None)
    #                     if isinstance(attr_value, list) and attr_value and len(attr_value) > 0 and hasattr(attr_value[0], 'source') and hasattr(attr_value[0], 'sink'):
    #                         dataflows = attr_value
    #                         break
            
    #         # Add performance metadata
    #         generation_time = (datetime.now(timezone.utc) - start_time).total_seconds()
    #         structured_data["performance"] = {
    #             "direct_generation_time": generation_time,
    #             "element_count": len(elements),
    #             "dataflow_count": len(dataflows) if dataflows else 0,
    #             "boundary_count": len(boundaries),
    #             "generated_at": datetime.now(timezone.utc).isoformat()
    #         }
            
    #         log_info(f"Direct threat model generation completed in {generation_time:.2f} seconds")
    #         return serialized_code, structured_data
    #     except Exception as e:
    #         log_info(f"Error in direct threat model generation: {str(e)}")
    #         raise
    #     finally:
    #         # Always restore the original sys.argv
    #         sys.argv = original_argv

    # def _serialize_model(self, tm, elements, boundaries):
    #     """
    #     Serializes the PyTM model to code representation for storage/debugging.
    #     This doesn't use exec() - it's just for storage of the model definition.
    #     """
    #     code_lines = [
    #         "from pytm import TM, Server, Datastore, Actor, Boundary, Dataflow, Lambda, Process, ExternalEntity",
    #         "",
    #         f"tm = TM('{tm.name}')",
    #         f"tm.description = '{tm.description}'",
    #         "tm.isOrdered = True",
    #         "tm.mergeResponses = True",
    #         ""
    #     ]
        
    #     # Add boundaries
    #     for name, boundary in boundaries.items():
    #         code_lines.append(f"b_{name.lower().replace(' ', '_')} = Boundary('{name}')")
    #     code_lines.append("")
        
    #     # Add elements
    #     element_vars = {}
    #     for i, (element_id, element) in enumerate(elements.items()):
    #         var_name = f"element_{i}"
    #         element_vars[element_id] = var_name
            
    #         element_type = element.__class__.__name__
    #         code_lines.append(f"{var_name} = {element_type}('{element.name}')")
            
    #         if hasattr(element, 'description') and element.description:
    #             code_lines.append(f"{var_name}.description = '{element.description}'")
                
    #         if hasattr(element, 'inBoundary') and element.inBoundary:
    #             boundary_name = element.inBoundary.name
    #             boundary_var = f"b_{boundary_name.lower().replace(' ', '_')}"
    #             code_lines.append(f"{var_name}.inBoundary = {boundary_var}")
                
    #         # Add type-specific properties
    #         if element_type == "Datastore":
    #             if hasattr(element, 'isSQL'):
    #                 code_lines.append(f"{var_name}.isSQL = {element.isSQL}")
    #             if hasattr(element, 'controls') and hasattr(element.controls, 'storesSensitiveData'):
    #                 code_lines.append(f"{var_name}.controls.storesSensitiveData = {element.controls.storesSensitiveData}")
                    
    #         if element_type == "Server":
    #             if hasattr(element, 'OS'):
    #                 code_lines.append(f"{var_name}.OS = '{element.OS}'")
    #             if hasattr(element, 'controls'):
    #                 if hasattr(element.controls, 'isHardened'):
    #                     code_lines.append(f"{var_name}.controls.isHardened = {element.controls.isHardened}")
    #                 if hasattr(element.controls, 'sanitizesInput'):
    #                     code_lines.append(f"{var_name}.controls.sanitizesInput = {element.controls.sanitizesInput}")
    #                 if hasattr(element.controls, 'encodesOutput'):
    #                     code_lines.append(f"{var_name}.controls.encodesOutput = {element.controls.encodesOutput}")
                        
    #         code_lines.append("")
        
    #     # Add data flows - use the internal data structure from PyTM
    #     dataflows = []
    #     if hasattr(tm, 'dataflows'):
    #         dataflows = tm.dataflows
    #     elif hasattr(tm, '_flows'):
    #         dataflows = tm._flows
    #     else:
    #         # Look for dataflows in any attribute that might contain them
    #         for attr_name in dir(tm):
    #             if attr_name.startswith('_') and not attr_name.startswith('__'):
    #                 attr_value = getattr(tm, attr_name, None)
    #                 if isinstance(attr_value, list) and attr_value and hasattr(attr_value[0], 'source') and hasattr(attr_value[0], 'sink'):
    #                     dataflows = attr_value
    #                     break
        
    #     for i, flow in enumerate(dataflows):
    #         source_id = None
    #         target_id = None
            
    #         # Find the element IDs for this flow
    #         for eid, element in elements.items():
    #             if flow.source == element:
    #                 source_id = eid
    #             if flow.sink == element:
    #                 target_id = eid
                    
    #         if source_id in element_vars and target_id in element_vars:
    #             source_var = element_vars[source_id]
    #             target_var = element_vars[target_id]
                
    #             flow_name = f"flow_{i}"
    #             code_lines.append(f"{flow_name} = Dataflow({source_var}, {target_var}, '{flow.name}')")
                
    #             if hasattr(flow, 'protocol'):
    #                 code_lines.append(f"{flow_name}.protocol = '{flow.protocol}'")
    #             if hasattr(flow, 'isEncrypted'):
    #                 code_lines.append(f"{flow_name}.isEncrypted = {flow.isEncrypted}")
    #             if hasattr(flow, 'authenticatesDestination'):
    #                 code_lines.append(f"{flow_name}.authenticatesDestination = {flow.authenticatesDestination}")
    #             if hasattr(flow, 'controls') and hasattr(flow.controls, 'authenticatesSource'):
    #                 code_lines.append(f"{flow_name}.controls.authenticatesSource = {flow.controls.authenticatesSource}")
                    
    #             code_lines.append("")
        
    #     # Add processing command
    #     code_lines.append("# Process the model")
    #     code_lines.append("tm.process()")
        
    #     return "\n".join(code_lines)

    # def _custom_process_model(self, tm):
    #     """
    #     Custom implementation of the TM.process() method that doesn't try to parse arguments.
    #     This avoids the command-line argument parsing that causes issues.
    #     """
    #     log_info("Processing threat model without command line arguments")
        
    #     # First ensure threats are loaded
    #     try:
    #         # Make sure threats are loaded - this is critical
    #         if hasattr(tm, '_threats') and not tm._threats:
    #             try:
    #                 from pytm.pytm import Threat
    #                 tm._threats = Threat.load()
    #                 log_info(f"Loaded {len(tm._threats)} threats")
    #             except Exception as threat_error:
    #                 log_info(f"Error loading threats: {threat_error}")
    #                 # Create a minimal threat if loading fails
    #                 from pytm.pytm import Threat
    #                 class MinimalThreat(Threat):
    #                     def __init__(self):
    #                         self.id = "GENERIC-THREAT"
    #                         self.description = "Generic security threat"
    #                         self.condition = "True"
    #                 tm._threats = [MinimalThreat()]
    #     except Exception as e:
    #         log_info(f"Error preparing threats: {e}")
        
    #     # Direct processing approach - skip the command-line argument handling
    #     try:
    #         # METHOD 1: Try direct processing with timeout protection
    #         import threading
    #         import time
            
    #         # Create a flag for timeout detection
    #         timeout_occurred = [False]
    #         processing_completed = [False]
    #         processing_error = [None]
            
    #         # Define a function to be run in a thread with timeout protection
    #         def process_with_timeout():
    #             try:
    #                 start_time = time.time()
    #                 log_info("Starting direct threat model processing")
                    
    #                 # Direct method - call internal processing if available
    #                 if hasattr(tm, '_process'):
    #                     log_info("Using internal _process method")
    #                     tm._process()
    #                 else:
    #                     log_info("No _process method found, using fallback")
    #                     # Fallback to minimal processing
    #                     self._minimal_threat_matching(tm)
                    
    #                 processing_time = time.time() - start_time
    #                 log_info(f"Threat model processing completed in {processing_time:.2f} seconds")
    #                 processing_completed[0] = True
    #             except Exception as e:
    #                 log_info(f"Error in direct processing: {e}")
    #                 processing_error[0] = str(e)
    #                 # Still attempt minimal processing as fallback
    #                 try:
    #                     log_info("Attempting minimal threat matching as fallback")
    #                     self._minimal_threat_matching(tm)
    #                     processing_completed[0] = True
    #                 except Exception as fallback_error:
    #                     log_info(f"Fallback processing also failed: {fallback_error}")
            
    #         # Create and start the processing thread
    #         processing_thread = threading.Thread(target=process_with_timeout)
    #         processing_thread.daemon = True  # Allow the thread to be killed when main thread exits
    #         processing_thread.start()
            
    #         # Wait with timeout
    #         max_wait_time = 60  # Maximum seconds to wait for processing
    #         wait_increment = 0.5  # Check every half second
    #         elapsed = 0
            
    #         while elapsed < max_wait_time and not processing_completed[0] and processing_thread.is_alive():
    #             time.sleep(wait_increment)
    #             elapsed += wait_increment
            
    #         if not processing_completed[0]:
    #             timeout_occurred[0] = True
    #             log_info(f"Threat model processing timed out after {elapsed} seconds")
    #             # We can't forcibly terminate the thread in Python, but we can proceed
    #             # Fallback to minimal threat matching
    #             self._minimal_threat_matching(tm)
            
    #         if processing_error[0]:
    #             log_info(f"Processing completed with error: {processing_error[0]}")
            
    #         # Ensure we have at least some findings
    #         if not hasattr(tm, 'findings') or not tm.findings:
    #             log_info("No findings generated, creating minimal findings")
    #             self._ensure_minimal_findings(tm)
            
    #         return
            
    #     except Exception as direct_error:
    #         log_info(f"Error in direct processing approach: {direct_error}")
    #         # Fall through to the next method
        
    #     # METHOD 2: Simplified manual threat matching - this is our fallback
    #     try:
    #         log_info("Using simplified manual threat matching")
    #         self._minimal_threat_matching(tm)
    #     except Exception as e:
    #         log_info(f"Error in simplified manual threat matching: {e}")
    #         self._ensure_minimal_findings(tm)

    # def _minimal_threat_matching(self, tm):
    #     """Simple implementation of threat matching to avoid PyTM's complex processing."""
    #     log_info("Performing minimal threat matching")
        
    #     if not hasattr(tm, 'elements'):
    #         log_info("No elements found in threat model")
    #         tm.findings = []
    #         return
            
    #     if not hasattr(tm, '_threats') or not tm._threats:
    #         log_info("No threats loaded for matching")
    #         tm.findings = []
    #         return
        
    #     findings = []
    #     element_count = len(tm.elements)
    #     threat_count = len(tm._threats) if hasattr(tm, '_threats') else 0
        
    #     log_info(f"Processing {element_count} elements against {threat_count} threats")
        
    #     # Process a limited number of threats to avoid excessive processing
    #     max_threats_per_element = 3
    #     processed = 0
        
    #     try:
    #         # Get all elements
    #         elements = list(tm.elements)
            
    #         # Process each element
    #         for element in elements:
    #             # Track processed elements for debugging
    #             processed += 1
    #             if processed % 10 == 0:
    #                 log_info(f"Processed {processed}/{element_count} elements")
                
    #             # Get the element name for logging
    #             element_name = getattr(element, 'name', f"Element-{processed}")
                
    #             # Find matching threats (limit to avoid excessive processing)
    #             matched_threats = 0
                
    #             # Try the normal apply method first
    #             for threat in tm._threats:
    #                 # Skip after max threats per element
    #                 if matched_threats >= max_threats_per_element:
    #                     break
                        
    #                 try:
    #                     # Use PyTM's built-in apply method if available
    #                     if hasattr(threat, 'apply') and callable(threat.apply):
    #                         applies = threat.apply(element)
    #                         if applies:
    #                             finding = threat.generate(element)
    #                             findings.append(finding)
    #                             matched_threats += 1
    #                 except Exception as apply_error:
    #                     # If apply fails, use a simple approach
    #                     pass
                
    #             # If no threats matched, add a generic one
    #             if matched_threats == 0 and hasattr(element, '__class__'):
    #                 # Create a simple generic finding
    #                 element_type = element.__class__.__name__
    #                 finding = {
    #                     'target': element,
    #                     'description': f"Generic security consideration for {element_type}",
    #                     'SID': f"GENERIC-{element_type}-{len(findings)}",
    #                     'severity': 'Medium'
    #                 }
    #                 findings.append(finding)
    #     except Exception as e:
    #         log_info(f"Error during minimal threat matching: {e}")
            
    #     # Set the findings on the TM object
    #     tm.findings = findings
    #     log_info(f"Generated {len(findings)} findings through minimal matching")

    # def _ensure_minimal_findings(self, tm):
    #     """Ensure that there are at least some findings for the elements."""
    #     if not hasattr(tm, 'findings'):
    #         tm.findings = []
            
    #     if len(tm.findings) > 0:
    #         return  # Already has findings
            
    #     log_info("Generating minimal findings")
    #     findings = []
        
    #     # Get elements
    #     elements = []
    #     if hasattr(tm, 'elements'):
    #         elements = list(tm.elements)
        
    #     # Generate at least one finding per element type
    #     element_types_seen = set()
        
    #     for element in elements:
    #         if hasattr(element, '__class__'):
    #             element_type = element.__class__.__name__
                
    #             # Only add one finding per element type
    #             if element_type not in element_types_seen:
    #                 # Generic finding based on element type
    #                 finding = {
    #                     'target': element,
    #                     'description': self._get_generic_finding_for_type(element_type),
    #                     'SID': f"GENERIC-{element_type}",
    #                     'severity': 'Medium'
    #                 }
    #                 findings.append(finding)
    #                 element_types_seen.add(element_type)
        
    #     # Add the findings to the model
    #     tm.findings = findings
    #     log_info(f"Added {len(findings)} minimal findings")
    
    # def _get_generic_finding_for_type(self, element_type):
    #     """Return a generic finding description based on element type."""
    #     if element_type == "Server":
    #         return "Servers should be hardened, use firewalls, and have proper access controls."
    #     elif element_type == "Datastore":
    #         return "Ensure data is encrypted and access is properly controlled."
    #     elif element_type == "Actor":
    #         return "Validate all user input and authenticate users properly."
    #     elif element_type == "Dataflow":
    #         return "Ensure data in transit is encrypted and authenticated."
    #     elif element_type == "Process":
    #         return "Processes should be isolated and have minimal privileges."
    #     elif element_type == "Lambda":
    #         return "Ensure cloud functions have proper IAM controls and input validation."
    #     elif element_type == "ExternalEntity":
    #         return "Validate and sanitize all data from external systems."
    #     else:
    #         return f"Ensure proper security controls are in place for {element_type}."

    # async def generate_threat_model(self, diagram_state: Dict[str, Any], 
    #                               check_cancellation_func=None, project_code=None) -> Tuple[str, str, Dict[str, Any]]:
    #     """Orchestrates the generation process. Returns (pytm_code, threat_model_id, dfd_data)."""
    #     log_info(f"Generating threat model for project {project_code}")
        
    #     # Create a local status update function
    #     async def update_status(progress_pct: int, message: str):
    #         """Updates the status in Redis only (for more frequent updates without DB load)"""
    #         if not project_code:
    #             return
                
    #         try:
    #             # Create the status object
    #             status_data = {
    #                 "status": "in_progress",
    #                 "progress": progress_pct,
    #                 "step": "generating_threat_model",
    #                 "message": message,
    #                 "updated_at": datetime.now(timezone.utc).isoformat()
    #             }
                
    #             # Use session_manager to update Redis if available 
    #             from core.cache.session_manager import SessionManager
    #             try:
    #                 session_manager = SessionManager()
    #                 if session_manager.redis_pool:
    #                     status_cache_key = f"dfd_status:{project_code}"
    #                     # Update Redis with a short TTL
    #                     await session_manager.redis_pool.setex(
    #                         status_cache_key,
    #                         30,  # 30 seconds TTL for intermediate updates
    #                         json.dumps(status_data)
    #                     )
    #             except Exception as e:
    #                 log_info(f"Error updating status in Redis: {e}")
    #         except Exception as outer_e:
    #             log_info(f"Error in update_status: {outer_e}")
        
    #     try:
    #         # Validate diagram state has minimum components needed
    #         nodes = diagram_state.get("nodes", [])
    #         edges = diagram_state.get("edges", [])
            
    #         if not nodes or len(nodes) < 2:
    #             log_info("Diagram has insufficient nodes for threat modeling")
    #             raise ValueError("Diagram must have at least two components for threat modeling")
                
    #         if not edges or len(edges) < 1:
    #             log_info("Diagram has no connections between components")
    #             raise ValueError("Diagram must have at least one connection between components")
            
    #         # Check for cancellation before starting heavy work
    #         if check_cancellation_func and callable(check_cancellation_func):
    #             cancelled = await check_cancellation_func()
    #             if cancelled:
    #                 log_info(f"Threat model generation cancelled before processing for project {project_code}")
    #                 raise RuntimeError("Threat model generation was cancelled")
            
    #         # Generate unique ID for this threat model version
    #         new_threat_model_id = str(uuid.uuid4())
    #         log_info(f"Generated new Threat Model ID: {new_threat_model_id} for project {project_code}")
    #         await update_status(25, "Preparing threat modeling environment")
            
    #         # Use the direct implementation only (no fallback to exec)
    #         log_info(f"Using direct PyTM implementation for project {project_code}")
    #         start_time = datetime.now(timezone.utc)
            
    #         try:
    #             # Use the direct implementation - we no longer need a fallback using exec()
    #             await update_status(30, "Creating threat model components")
    #             pytm_code, dfd_data = await self.build_direct_threat_model_with_status(
    #                 diagram_state, 
    #                 new_threat_model_id, 
    #                 update_status
    #             )
                
    #             execution_time = (datetime.now(timezone.utc) - start_time).total_seconds()
    #             log_info(f"Direct PyTM implementation completed in {execution_time:.2f} seconds")
                
    #             # Check cancellation after generation
    #             if check_cancellation_func and callable(check_cancellation_func):
    #                 cancelled = await check_cancellation_func()
    #                 if cancelled:
    #                     log_info(f"Threat model generation cancelled after processing for project {project_code}")
    #                     raise RuntimeError("Threat model generation was cancelled")
                
    #             await update_status(65, "Formatting threat model for display")
    #             return pytm_code, new_threat_model_id, dfd_data
                
    #         except Exception as direct_error:
    #             log_info(f"Error in threat model generation: {str(direct_error)}")
    #             raise
            
    #     except Exception as e:
    #         # Log the error
    #         log_info(f"Threat model generation failed for project {project_code}: {e}")
    #         # Re-raise the exception so the calling function knows it failed
    #         raise
    
    # async def build_direct_threat_model_with_status(
    #     self, 
    #     diagram_state: Dict[str, Any], 
    #     threat_model_id: str,
    #     status_update_func = None
    # ) -> Tuple[str, Dict[str, Any]]:
    #     """
    #     Async version of build_direct_threat_model that includes status updates
    #     """
    #     # Wrap the synchronous method in a way that allows status updates
    #     import asyncio
        
    #     # Create a wrapper function that will run in an executor
    #     def _run_build():
    #         return self.build_direct_threat_model(diagram_state, threat_model_id)
        
    #     # Create status update points
    #     if status_update_func and callable(status_update_func):
    #         await status_update_func(35, "Creating threat model structure")
    #         # Wait a moment to allow the status to be seen
    #         await asyncio.sleep(0.5)
        
    #     # Run the CPU-bound threat model building in a separate thread
    #     loop = asyncio.get_event_loop()
        
    #     # Add intermediate status updates
    #     if status_update_func and callable(status_update_func):
    #         # Schedule status updates during the build process
    #         asyncio.create_task(self._send_intermediate_status_updates(status_update_func))
        
    #     # Execute the build function in a thread pool executor
    #     result = await loop.run_in_executor(None, _run_build)
        
    #     # Final status update before returning
    #     if status_update_func and callable(status_update_func):
    #         await status_update_func(60, "Threat model built successfully")
        
    #     return result
    
    # async def _send_intermediate_status_updates(self, status_update_func):
    #     """Sends intermediate status updates during long-running operations"""
    #     import asyncio
        
    #     # List of status messages to cycle through
    #     status_messages = [
    #         "Creating model components",
    #         "Analyzing component interactions",
    #         "Mapping data flows",
    #         "Analyzing trust boundaries",
    #         "Identifying threat vectors",
    #         "Applying threat rules",
    #         "Processing security considerations",
    #         "Analyzing attack surfaces",
    #         "Validating model integrity",
    #         "Building threat matrix"
    #     ]
        
    #     # Start from 35% (where we left off) and go to 60%
    #     start_progress = 35
    #     end_progress = 60
        
    #     # Send an update every 3-5 seconds to avoid overloading Redis
    #     # but still give feedback that processing is happening
    #     for i, message in enumerate(status_messages):
    #         # Calculate progress percentage
    #         progress = start_progress + (i * (end_progress - start_progress) / len(status_messages))
            
    #         # Send status update
    #         await status_update_func(int(progress), message)
            
    #         # Wait before sending next update
    #         await asyncio.sleep(4)
            
    #         # If we've gone through all messages but the operation is still running,
    #         # recycle with slight variations so users know it's still working
    #         if i == len(status_messages) - 1:
    #             await status_update_func(58, "Finalizing threat analysis (this may take a moment)")
    #             await asyncio.sleep(5)

