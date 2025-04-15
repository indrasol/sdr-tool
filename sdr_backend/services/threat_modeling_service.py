import importlib
import sys
import io
from contextlib import redirect_stdout
from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone
import uuid
import json
import re

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
            dfd_model = self.dfd_mapper.map_diagram_to_dfd(diagram_state)
            
            log_info(f"DFD model generated with {len(dfd_model.get('elements', []))} elements, "
                   f"{len(dfd_model.get('edges', []))} edges, and "
                   f"{len(dfd_model.get('boundaries', []))} boundaries")
            
            # Validate the DFD model
            if not dfd_model.get("elements") and not dfd_model.get("edges"):
                log_info("DirectDFDMapper returned empty DFD. Using fallback approach.")
                
                # Build the specialized prompts for DFD generation
                base_dfd_prompt = await prompt_builder.build_dfd_prompt(conversation_history, diagram_state)
                
                # Enhance prompt with explicit JSON format instructions
                dfd_prompt = f"""
                {base_dfd_prompt}
                
                IMPORTANT: Your response MUST be a valid JSON object with EXACTLY the following structure:
                
                {{
                    "elements": [
                        {{
                            "id": "unique_element_id",
                            "type": "external_entity|process|datastore|actor",
                            "name": "Element Name",
                            "description": "Optional description",
                            "properties": {{
                                "shape": "rectangle|circle|cylinder",
                                "position": {{"x": 100, "y": 200}}
                            }}
                        }}
                    ],
                    "edges": [
                        {{
                            "id": "edge_id",
                            "source": "source_element_id",
                            "target": "target_element_id",
                            "data": "Description of data flowing",
                            "properties": {{
                                "protocol": "HTTP/HTTPS/TCP/etc"
                            }}
                        }}
                    ],
                    "boundaries": [
                        {{
                            "id": "boundary_id",
                            "name": "Boundary Name",
                            "elements": ["element_id1", "element_id2"],
                            "properties": {{
                                "shape": "dashed_rectangle"
                            }}
                        }}
                    ]
                }}
                
                Include ONLY the JSON structure in your response with NO text before or after. The JSON must parse correctly.
                Make sure elements reference each other correctly and all IDs are unique.
                """
                
                # Generate DFD using LLM (fallback approach)
                log_info(f"Falling back to LLM for DFD generation")
                dfd_json = await llm_service.generate_structured_response(
                    prompt=dfd_prompt,
                    model="gpt-4-turbo",
                    temperature=0.1,
                    max_tokens=4096
                )
                
                # Use the LLM-generated DFD if it's valid
                if dfd_json.get("elements") and dfd_json.get("edges"):
                    dfd_model = dfd_json
            
            # NEW: Use analyze_diagram to get a detailed data flow description
            log_info(f"Analyzing diagram to generate data flow description")
            diagram_analysis = await llm_service.analyze_diagram(diagram_state, llm="openai")
            
            # Extract the data flow description from the analysis result
            data_flow_description = None
            if diagram_analysis and diagram_analysis.get("success", False):
                data_flow_description = diagram_analysis.get("data_flow_description", None)
                log_info(f"Data flow analysis completed successfully")
            else:
                error_message = diagram_analysis.get("error", "Unknown error") if diagram_analysis else "Analysis failed"
                log_info(f"Failed to analyze diagram: {error_message}")
            
            # Build the specialized threat prompt with data flow description
            base_threat_prompt = await prompt_builder.build_threat_prompt(
                conversation_history, 
                diagram_state,
                data_flow_description
            )
            
            # Enhance threat prompt with additional instructions
            threat_prompt = base_threat_prompt
            
            # Generate threats using the threat prompt
            log_info(f"Generating threats analysis using threat prompt")
            threat_json = await llm_service.generate_structured_response(
                prompt=threat_prompt,
                with_thinking=False,
                temperature=0.3,  # Lower temperature for more deterministic output
                stream=True,
                timeout=90
            )

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