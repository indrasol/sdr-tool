import importlib
import sys
import io
from contextlib import redirect_stdout
from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone
import uuid
import json
import re
import os

from core.llm.llm_gateway_v1 import LLMService
from core.prompt_engineering.prompt_builder import PromptBuilder
from utils.logger import log_info

# Direct PyTM imports
from pytm import TM, Server, Datastore, Actor, Boundary, Dataflow, Lambda, Process, ExternalEntity
from pytm.pytm import Element, Dataflow as PyTMDataflow  # For type checking

from services.dfd_mapper import DirectDFDMapper
from utils.logger import log_info
from models.dfd_models import DFDResponse, DFDElement, DFDDataFlow, DFDBoundary, DFDThreat
from models.threat_models import DFDModelResponse, ThreatsResponse, FullThreatModelResponse, ThreatItem

class ThreatModelingService:

    def __init__(self):

        self.dfd_mapper = DirectDFDMapper()


    async def generate_threat_model(
        self, 
        conversation_history: List[Dict[str, Any]], 
        diagram_state: Dict[str, Any], 
        threat_model_id: str = None
    ) -> FullThreatModelResponse:
        """
        Generate a comprehensive threat model using LLM.
        
        This method orchestrates the process of:
        1. Building specialized prompts for DFD and threat analysis
        2. Calling the LLM service to generate responses
        3. Structuring the responses into the FullThreatModelResponse format
        
        Args:
            conversation_history: List of previous exchanges
            diagram_state: Current state of the architecture diagram
            threat_model_id: Optional threat model ID to use
            
        Returns:
            A structured FullThreatModelResponse with DFD and threats
        """
        # Generate a new threat model ID if not provided
        if not threat_model_id:
            threat_model_id = str(uuid.uuid4())
            
        log_info(f"Generating threat model with ID: {threat_model_id}")
        
        try:
            # Initialize the services
            llm_service = LLMService()
            prompt_builder = PromptBuilder()
            
            # CHANGE: Use the DirectDFDMapper to map diagram to DFD without relying on LLM
            log_info(f"Generating DFD model using DirectDFDMapper")
            
            # First, analyze the diagram using the analyze_diagram function
            data_flow_description = await llm_service.analyze_diagram(
                diagram_content=diagram_state,
                model_provider="openai",
                model_name="gpt-4.1-mini"
            )
            data_flow_content = data_flow_description.get("data_flow_description", "")
            log_info(f"Generated data flow description with {len(data_flow_content)} characters")
            
            # Build the DFD prompt with the data flow description
            dfd_prompt = await prompt_builder.build_dfd_prompt(
                conversation_history=conversation_history,
                data_flow_description=data_flow_content
            )
            
            # Generate the DFD model using the appropriate prompt
            dfd_model_response = await llm_service.generate_llm_response(
                prompt=dfd_prompt,
                model_provider="openai",
                model_name="gpt-4.1",
                temperature=0.1,
                timeout=60
            )
            
            # Extract the DFD model from the response
            dfd_model = {}
            if isinstance(dfd_model_response, dict) and "content" in dfd_model_response:
                # Use our simple JSON extractor
                content = dfd_model_response["content"]
                log_info(f"DFD Model raw response length: {len(content)} characters")
                
                # Extract and parse the JSON from the LLM response
                dfd_model = self._extract_json_from_llm_response(content)
            else:
                log_info(f"Unexpected DFD model response format: {dfd_model_response}")
                dfd_model = {"elements": [], "edges": [], "boundaries": []}
            
            # Validate the model to ensure it has required properties
            dfd_model = self._validate_dfd_model(dfd_model)
            
            log_info(f"DFD model processed with {len(dfd_model.get('elements', []))} elements, "
                   f"{len(dfd_model.get('edges', []))} edges, and "
                   f"{len(dfd_model.get('boundaries', []))} boundaries")
            
            # Build the specialized threat prompt with data flow description
            base_threat_prompt = await prompt_builder.build_threat_prompt(
                conversation_history, 
                diagram_state,
                data_flow_content
            )
            
            # Enhance threat prompt with additional instructions
            threat_prompt = base_threat_prompt
            
            # Generate threats using the threat prompt
            log_info(f"Generating threats analysis using threat prompt")
            threat_response = await llm_service.generate_llm_response(
                prompt=threat_prompt,
                model_provider="openai",
                model_name="gpt-4.1",
                temperature=0.3,  # Lower temperature for more deterministic output
                stream=False,
                timeout=90
            )
            
            # Extract the threat JSON from the response
            threat_json = {}
            if isinstance(threat_response, dict) and "content" in threat_response:
                content = threat_response["content"]
                try:
                    # Look for JSON in the content
                    json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL)
                    if json_match:
                        threat_json = json.loads(json_match.group(1))
                    else:
                        # Try to parse the whole content as JSON
                        threat_json = json.loads(content)
                except json.JSONDecodeError as e:
                    log_info(f"Failed to parse threat JSON: {e}")
                    threat_json = {"threats": [], "severity_counts": {"HIGH": 0, "MEDIUM": 0, "LOW": 0}}
            else:
                threat_json = {"threats": [], "severity_counts": {"HIGH": 0, "MEDIUM": 0, "LOW": 0}}

            log_info(f"LLM threats json : {threat_json}")
            
            # Enhanced recovery mechanism for truncated or incomplete responses
            if isinstance(threat_json, dict):
                # Check if we need to extract threats from thinking
                if "thinking" in threat_json and isinstance(threat_json["thinking"], str):
                    thinking_text = threat_json["thinking"]
                    if "threats" not in threat_json or not threat_json.get("threats"):
                        # Try to extract JSON from thinking which might contain more complete responses
                        try:
                            # Look for JSON blocks in thinking
                            json_matches = re.findall(r'```(?:json)?\s*(.*?)\s*```', thinking_text, re.DOTALL)
                            
                            # Try each JSON block found
                            for json_str in json_matches:
                                try:
                                    extracted_json = json.loads(json_str)
                                    
                                    # If we found threats, use them
                                    if "threats" in extracted_json and isinstance(extracted_json["threats"], list) and len(extracted_json["threats"]) > 0:
                                        log_info(f"Found {len(extracted_json['threats'])} threats in thinking text")
                                        
                                        # Copy to the main response
                                        threat_json["threats"] = extracted_json["threats"]
                                        
                                        # Also copy severity counts if available
                                        if "severity_counts" in extracted_json:
                                            threat_json["severity_counts"] = extracted_json["severity_counts"]
                                        
                                        # Found what we need, break
                                        break
                                except json.JSONDecodeError:
                                    # Try to extract threats array directly from truncated JSON
                                    threats_match = re.search(r'"threats"\s*:\s*\[(.*?)(?:\]\s*}|$)', json_str, re.DOTALL)
                                    if threats_match:
                                        try:
                                            # Extract threats array with proper JSON wrapping
                                            threats_str = '{"threats":[' + threats_match.group(1) + ']}'
                                            # Fix potential truncation
                                            if not threats_str.endswith("]}"):
                                                last_complete_threat = threats_str.rfind("},")
                                                if last_complete_threat > 0:
                                                    threats_str = threats_str[:last_complete_threat+1] + "]}"
                                            
                                            threats_data = json.loads(threats_str)
                                            if "threats" in threats_data and len(threats_data["threats"]) > 0:
                                                log_info(f"Extracted {len(threats_data['threats'])} threats from truncated JSON in thinking")
                                                threat_json["threats"] = threats_data["threats"]
                                                # Found what we need, break
                                                break
                                        except Exception as e:
                                            log_info(f"Failed to extract threats array from thinking: {str(e)}")
                                    continue
                        except Exception as e:
                            log_info(f"Error extracting threats from thinking: {str(e)}")

                # If the message field contains a code block with JSON, try to extract it
                if "message" in threat_json and isinstance(threat_json["message"], str) and ("threats" not in threat_json or not threat_json.get("threats")):
                    try:
                        message_text = threat_json["message"]
                        json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', message_text, re.DOTALL)
                        
                        if json_match:
                            nested_json_str = json_match.group(1)
                            try:
                                nested_json = json.loads(nested_json_str)
                                
                                # If nested JSON has a "threats" field, use it
                                if "threats" in nested_json and isinstance(nested_json["threats"], list):
                                    log_info(f"Found nested JSON with {len(nested_json['threats'])} threats in message field")
                                    threat_json["threats"] = nested_json["threats"]
                                    
                                    # Also copy severity counts if available
                                    if "severity_counts" in nested_json:
                                        threat_json["severity_counts"] = nested_json["severity_counts"]
                            except json.JSONDecodeError:
                                # Try to extract threats array directly
                                threats_match = re.search(r'"threats"\s*:\s*\[(.*?)(?:\]\s*}|$)', nested_json_str, re.DOTALL)
                                if threats_match:
                                    try:
                                        threats_str = '{"threats":[' + threats_match.group(1) + ']}'
                                        # Fix potential truncation
                                        if not threats_str.endswith("]}"):
                                            last_complete_threat = threats_str.rfind("},")
                                            if last_complete_threat > 0:
                                                threats_str = threats_str[:last_complete_threat+1] + "]}"
                                        
                                        threats_data = json.loads(threats_str)
                                        if "threats" in threats_data:
                                            log_info(f"Extracted {len(threats_data['threats'])} threats from truncated JSON in message")
                                            threat_json["threats"] = threats_data["threats"]
                                    except Exception as e:
                                        log_info(f"Failed to extract threats array from message: {str(e)}")
                    except Exception as e:
                        log_info(f"Error processing message field for threats: {str(e)}")

            # Process the threat analysis
            severity_counts = threat_json.get("severity_counts", {"HIGH": 0, "MEDIUM": 0, "LOW": 0})
            threat_items = threat_json.get("threats", [])
            log_info(f"Severity Counts from LLM Response : {severity_counts}")
            log_info(f"Threats from LLM Response : {threat_items}")
            
            # Process threats into ThreatItem objects
            processed_threats = []
            for threat in threat_items:
                # Skip invalid threat entries
                if not isinstance(threat, dict):
                    log_info(f"Skipping non-dict threat: {threat}")
                    continue
                
                threat_id = threat.get("id", f"THREAT-{len(processed_threats) + 1}")
                description = threat.get("description", "Unnamed threat")
                mitigation = threat.get("mitigation", "No mitigation provided")
                severity = threat.get("severity", "MEDIUM")
                
                # Safely handle target_elements field
                target_elements = threat.get("target_elements", [])
                if not isinstance(target_elements, list):
                    target_elements = []
                
                # Safely handle properties field
                properties = threat.get("properties", {})
                if not isinstance(properties, dict):
                    properties = {}
                
                # Extract property values with fallbacks
                threat_type = properties.get("threat_type", "UNKNOWN")
                attack_vector = properties.get("attack_vector", "Unknown attack vector")
                impact = properties.get("impact", "Unknown impact")
                
                # Create a processed threat item
                processed_threat = {
                    "id": threat_id,
                    "description": description,
                    "mitigation": mitigation,
                    "severity": severity,
                    "target_elements": target_elements,
                    "properties": {
                        "threat_type": threat_type,
                        "attack_vector": attack_vector,
                        "impact": impact
                    }
                }
                
                processed_threats.append(processed_threat)
            
            # Update severity counts if missing or invalid
            if not severity_counts or not isinstance(severity_counts, dict):
                severity_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
                for threat in processed_threats:
                    severity = threat.get("severity", "MEDIUM").upper()
                    if severity in severity_counts:
                        severity_counts[severity] += 1
            
            # Log the number of processed threats
            log_info(f"Processed {len(processed_threats)} threats with severity counts: {severity_counts}")
            
            # Construct the DFDModelResponse
            dfd_model_response = DFDModelResponse(
                elements=dfd_model.get("elements", []),
                edges=dfd_model.get("edges", []),
                boundaries=dfd_model.get("boundaries", [])
            )
            
            # Construct the ThreatsResponse
            threats_response = ThreatsResponse(
                severity_counts=severity_counts,
                threats=processed_threats
            )
            
            # Construct the FullThreatModelResponse
            full_response = FullThreatModelResponse(
                threat_model_id=threat_model_id,
                dfd_model=dfd_model_response,
                threats=threats_response,
                generated_at=datetime.now(timezone.utc).isoformat()
            )
            
            log_info(f"Threat model generation complete. Model has {len(processed_threats)} threats.")
            return full_response
            
        except Exception as e:
            log_info(f"Error in threat model generation: {str(e)}")
            
            # Return minimal response on error
            return FullThreatModelResponse(
                threat_model_id=threat_model_id,
                dfd_model=DFDModelResponse(elements=[], edges=[], boundaries=[]),
                threats=ThreatsResponse(severity_counts={"HIGH": 0, "MEDIUM": 0, "LOW": 0}, threats=[]),
                generated_at=datetime.now(timezone.utc).isoformat()
            )

    def _format_elements_for_prompt(self, elements: List[Dict[str, Any]]) -> str:
        """Formats DFD elements for inclusion in the threat prompt."""
        if not elements:
            return "No elements in the DFD."
            
        result = []
        for idx, element in enumerate(elements[:10]):  # Limit to 10 elements
            element_id = element.get("id", "unknown")
            element_type = element.get("type", "process")
            element_label = element.get("label", element.get("name", "Unnamed element"))
            result.append(f"- {element_id} ({element_type}): {element_label}")
            
        return "\n".join(result)
        
    def _format_boundaries_for_prompt(self, boundaries: List[Dict[str, Any]]) -> str:
        """Formats DFD boundaries for inclusion in the threat prompt."""
        if not boundaries:
            return "No trust boundaries in the DFD."
            
        result = []
        for idx, boundary in enumerate(boundaries[:5]):  # Limit to 5 boundaries
            boundary_id = boundary.get("id", "unknown")
            boundary_label = boundary.get("label", boundary.get("name", "Unnamed boundary"))
            element_count = len(boundary.get("element_ids", []))
            result.append(f"- {boundary_id}: {boundary_label} (contains {element_count} elements)")
            
        return "\n".join(result)

    def _extract_json_from_llm_response(self, response_text: str) -> Dict[str, Any]:
        """
        Extract JSON from the LLM response text, handling common parsing issues.
        
        Args:
            response_text: The raw text response from the LLM
            
        Returns:
            A dictionary containing the parsed JSON or a minimal valid structure
        """
        # Default fallback model
        default_model = {"elements": [], "edges": [], "boundaries": []}
        
        try:
            # First try: Look for JSON in code blocks
            json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1).strip()
                log_info(f"Found JSON in code block, length: {len(json_str)} characters")
                
                # Try to fix common JSON issues before parsing
                fixed_json = self._fix_json_format(json_str)
                return json.loads(fixed_json)
                
            # Second try: Look for entire content as JSON
            trimmed_content = response_text.strip()
            if trimmed_content.startswith('{') and trimmed_content.endswith('}'):
                fixed_json = self._fix_json_format(trimmed_content)
                return json.loads(fixed_json)
                
            # Third try: Look for any JSON-like block in the response
            json_block_match = re.search(r'(\{.*\})', response_text, re.DOTALL)
            if json_block_match:
                json_block = json_block_match.group(1).strip()
                fixed_json = self._fix_json_format(json_block)
                return json.loads(fixed_json)
                
            # Fourth try: Check if this is valid JSON but missing outer braces
            # This is useful for cases where the outer braces are missing
            try:
                if 'elements' in response_text or 'edges' in response_text or 'boundaries' in response_text:
                    # Try wrapping in braces
                    wrapped_json = '{' + response_text + '}'
                    fixed_json = self._fix_json_format(wrapped_json)
                    return json.loads(fixed_json)
            except Exception:
                pass
                
            log_info("No JSON structure found in LLM response")
            return default_model
            
        except json.JSONDecodeError as e:
            log_info(f"JSON parsing error: {e}")
            
            # Special handling for case where there are message, confidence fields from LLM
            if 'message' in response_text and 'confidence' in response_text:
                try:
                    # Extract the individual fields we care about
                    message_match = re.search(r'"message"\s*:\s*"([^"]*)"', response_text, re.DOTALL)
                    message = message_match.group(1) if message_match else ""
                    
                    # Build a simple valid JSON model
                    log_info("Reconstructing model from partial content")
                    
                    # Try to extract elements, edges, and boundaries
                    elements = self._extract_array_by_name(response_text, "elements")
                    edges = self._extract_array_by_name(response_text, "edges")
                    boundaries = self._extract_array_by_name(response_text, "boundaries")
                    
                    return {
                        "message": message,
                        "elements": elements,
                        "edges": edges,
                        "boundaries": boundaries
                    }
                except Exception as reconstruct_error:
                    log_info(f"Error reconstructing JSON: {str(reconstruct_error)}")
            
            # Try to extract essential parts
            try:
                # Look for arrays with our improved method
                elements = self._extract_array_by_name(response_text, "elements")
                edges = self._extract_array_by_name(response_text, "edges")
                boundaries = self._extract_array_by_name(response_text, "boundaries")
                
                if elements or edges or boundaries:
                    log_info(f"Recovered partial model: {len(elements)} elements, {len(edges)} edges, {len(boundaries)} boundaries")
                    return {
                        "elements": elements,
                        "edges": edges,
                        "boundaries": boundaries
                    }
            except Exception as recovery_error:
                log_info(f"Failed to recover partial model: {str(recovery_error)}")
            
            # Check for a sample file as a last resort
            try:
                sample_path = "sdr_backend/resources/sample_dfd.json"
                if os.path.exists(sample_path):
                    with open(sample_path, "r") as f:
                        return json.load(f)
            except Exception:
                pass
                
            return default_model
    
    def _fix_json_format(self, json_str: str) -> str:
        """
        Fix common JSON formatting issues.
        
        Args:
            json_str: The JSON string to fix
            
        Returns:
            A corrected JSON string
        """
        # First, try more aggressive property name quoting - directly addressing the 
        # "Expecting property name enclosed in double quotes" error
        lines = json_str.split('\n')
        fixed_lines = []
        
        for line in lines:
            # Find property names not in quotes at the beginning of lines
            # This matches patterns like:  message: "value" or  message : "value"
            line = re.sub(r'^\s*(\w+)\s*:', r'"\1":', line)
            
            # Also fix property names in the middle of lines
            line = re.sub(r',\s*(\w+)\s*:', r', "\1":', line)
            
            fixed_lines.append(line)
        
        json_str = '\n'.join(fixed_lines)
        
        # Remove trailing commas in objects and arrays
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)
        
        # Replace single quotes with double quotes
        json_str = re.sub(r"'", '"', json_str)
        
        # Replace unquoted property names with quoted ones - more general case
        json_str = re.sub(r'([{,])\s*(\w+)\s*:', r'\1"\2":', json_str)
        
        # Fix possible issues with null, true, false values
        json_str = re.sub(r':\s*null\b', ': null', json_str)
        json_str = re.sub(r':\s*true\b', ': true', json_str)
        json_str = re.sub(r':\s*false\b', ': false', json_str)
        
        # Balance brackets if needed
        open_braces = json_str.count('{')
        close_braces = json_str.count('}')
        if open_braces > close_braces:
            json_str += '}' * (open_braces - close_braces)
        
        open_brackets = json_str.count('[')
        close_brackets = json_str.count(']')
        if open_brackets > close_brackets:
            json_str += ']' * (open_brackets - close_brackets)
            
        # Last-ditch effort for problem characters
        json_str = json_str.replace('\t', ' ')
        
        return json_str
    
    def _extract_array_by_name(self, json_str: str, array_name: str) -> List[Dict[str, Any]]:
        """
        Extract an array from a JSON string by its name.
        
        Args:
            json_str: The JSON string to search
            array_name: The name of the array to extract
            
        Returns:
            A list of dictionaries from the array, or an empty list if not found
        """
        try:
            # Look for the array pattern
            # First try a more precise extraction with balanced bracket tracking
            start_pattern = f'"{array_name}"\\s*:\\s*\\['
            start_match = re.search(start_pattern, json_str)
            
            if start_match:
                start_pos = start_match.end() - 1  # Position of the opening bracket
                pos = start_pos
                open_brackets = 1
                
                # Track bracket nesting to find the matching closing bracket
                while open_brackets > 0 and pos < len(json_str) - 1:
                    pos += 1
                    if json_str[pos] == '[':
                        open_brackets += 1
                    elif json_str[pos] == ']':
                        open_brackets -= 1
                
                if open_brackets == 0:
                    # Extract the full array with matched brackets
                    array_str = json_str[start_pos:pos+1]
                    
                    # Fix JSON formatting issues in the array
                    fixed_array_str = self._fix_json_format(array_str)
                    
                    # Try to parse the array
                    return json.loads(fixed_array_str)
            
            # Fallback to simpler regex pattern if bracket matching failed
            pattern = f'"{array_name}"\\s*:\\s*(\\[.*?\\])'
            array_match = re.search(pattern, json_str, re.DOTALL)
            
            if array_match:
                array_str = array_match.group(1)
                fixed_array_str = self._fix_json_format(array_str)
                return json.loads(fixed_array_str)
                
            # Ultimate fallback: manually extract objects from the array
            # For cases where the array is badly malformed but objects are mostly intact
            if array_name in json_str:
                try:
                    # Find where the array starts
                    array_start = json_str.find('[', json_str.find(f'"{array_name}"'))
                    if array_start > 0:
                        # Look for object patterns within this section
                        objects = re.findall(r'(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})', json_str[array_start:])
                        if objects:
                            items = []
                            for obj_str in objects:
                                try:
                                    fixed_obj = self._fix_json_format(obj_str)
                                    obj = json.loads(fixed_obj)
                                    items.append(obj)
                                except json.JSONDecodeError:
                                    pass  # Skip objects that can't be parsed
                            return items
                except Exception:
                    pass
                    
        except Exception as e:
            log_info(f"Error extracting {array_name} array with improved method: {e}")
            
        return []
        
    def _validate_dfd_model(self, dfd_model: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate the DFD model structure, ensuring it has all required fields.
        
        Args:
            dfd_model: The DFD model to validate
            
        Returns:
            A validated DFD model
        """
        # Ensure we have the basic structure
        if not isinstance(dfd_model, dict):
            return {"elements": [], "edges": [], "boundaries": []}
            
        # Ensure all required arrays exist
        elements = dfd_model.get("elements", [])
        edges = dfd_model.get("edges", [])
        boundaries = dfd_model.get("boundaries", [])
        
        # Ensure arrays are actually lists
        if not isinstance(elements, list):
            elements = []
        if not isinstance(edges, list):
            edges = []
        if not isinstance(boundaries, list):
            boundaries = []
            
        # Validate elements to ensure they have required fields
        valid_elements = []
        for idx, element in enumerate(elements):
            if not isinstance(element, dict):
                continue
                
            # Add missing required fields with sensible defaults
            if "id" not in element:
                element["id"] = f"element_{idx}"
            if "type" not in element:
                element["type"] = "process"
            if "label" not in element:
                element["label"] = f"Element {idx}"
            if "properties" not in element or not isinstance(element["properties"], dict):
                element["properties"] = {}
                
            # Add position if missing
            if "position" not in element["properties"]:
                element["properties"]["position"] = {
                    "x": 100 + (idx % 5) * 150,
                    "y": 100 + (idx // 5) * 150
                }
                
            valid_elements.append(element)
            
        # Validate edges to ensure they have required fields
        valid_edges = []
        for idx, edge in enumerate(edges):
            if not isinstance(edge, dict):
                continue
                
            # Add missing required fields
            if "id" not in edge:
                edge["id"] = f"edge_{idx}"
            if "source" not in edge or "target" not in edge:
                continue  # Skip edges without source or target
            if "properties" not in edge or not isinstance(edge["properties"], dict):
                edge["properties"] = {}
                
            valid_edges.append(edge)
            
        # Validate boundaries
        valid_boundaries = []
        for idx, boundary in enumerate(boundaries):
            if not isinstance(boundary, dict):
                continue
                
            # Add missing required fields
            if "id" not in boundary:
                boundary["id"] = f"boundary_{idx}"
            if "label" not in boundary:
                boundary["label"] = f"Boundary {idx}"
            if "element_ids" not in boundary or not isinstance(boundary["element_ids"], list):
                boundary["element_ids"] = []
            if "properties" not in boundary or not isinstance(boundary["properties"], dict):
                boundary["properties"] = {}
                
            valid_boundaries.append(boundary)
            
        return {
            "elements": valid_elements,
            "edges": valid_edges,
            "boundaries": valid_boundaries
        }