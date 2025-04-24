import json
import re
from typing import Dict, Any, Union, Optional
from models.response_models import (
    BaseResponse,
    ArchitectureResponse,
    ExpertResponse,
    ClarificationResponse,
    OutOfContextResponse,
    ResponseType
)
from utils.logger import log_info

class ResponseProcessor:
    """
    Service for processing and validating LLM responses.
    
    Converts raw LLM responses into structured response objects based on the intent.
    Handles responses from both standard and extended thinking modes.
    """
    
    async def process_response(
        self,
        llm_response: Union[str, Dict[str, Any]],
        intent: ResponseType,
        session_id: str,
        classification_source: Optional[str] = None
    ) -> Union[ArchitectureResponse, ExpertResponse, ClarificationResponse, OutOfContextResponse]:
        """
        Process and validate the LLM text response based on the intent.
        
        Args:
            llm_response: The response from the LLM (string or dictionary)
            intent: The classified intent of the user's query
            session_id: The session identifier
            classification_source: Source of the intent classification (pattern, vector, llm)
            
        Returns:
            A structured response object based on the intent
        """
        # Check if the response is already a dictionary (from generate_response's new format)
        if isinstance(llm_response, dict):
            # If it's a dictionary with "content" key, extract content
            if "content" in llm_response:
                response_text = llm_response["content"]
            else:
                # If no content key, use the entire dictionary as response data
                return await self.process_response_from_json(llm_response, intent, session_id, classification_source)
        else:
            # Original string response handling
            response_text = llm_response
        
        # Extract JSON from the response text
        response_data = self._extract_json(response_text)
        
        return self._create_response_object(response_data, intent, session_id, classification_source)
    
    async def process_response_from_json(
        self,
        response_data: Dict[str, Any],
        intent: ResponseType,
        session_id: str,
        classification_source: Optional[str] = None
    ) -> Union[ArchitectureResponse, ExpertResponse, ClarificationResponse, OutOfContextResponse]:
        """
        Create the appropriate response object based on intent and data.
        
        Args:
            response_data: The parsed response data
            intent: The classified intent of the user's query
            session_id: The session identifier
            classification_source: Source of the intent classification (pattern, vector, llm)
            
        Returns:
            A structured response object based on the intent
        """
        try:
            log_info(f"Processing response from JSON: {type(response_data)}")
            log_info(f"Response data keys: {response_data.keys() if isinstance(response_data, dict) else 'Not a dict'}")
            
            # If the response from LLM service includes a 'content' field (which contains the JSON response),
            # we need to extract the actual JSON from this content
            if isinstance(response_data, dict) and 'content' in response_data:
                log_info(f"Found content field in response data")
                content_text = response_data['content']
                # Extract JSON from the content text
                extracted_data = self._extract_json(content_text)
                if extracted_data:
                    log_info(f"Extracted data from content: {extracted_data.keys() if isinstance(extracted_data, dict) else 'Not a dict'}")
                    log_info(f"Nodes to add: {extracted_data.get('nodes_to_add')}")
                    log_info(f"Edges to add: {extracted_data.get('edges_to_add')}")
                    log_info(f"Elements to remove: {extracted_data.get('elements_to_remove')}")
                    response_data = extracted_data
                else:
                    log_info("No data extracted from content")
            else:
                log_info("No content field found in response data")
            
            # Common parameters for all response types
            common_params = {
                "message": response_data.get("message", ""),
                "confidence": response_data.get("confidence", 0.7),
                "session_id": session_id,
                "classification_source": classification_source
            }
            
            # Create appropriate response object based on intent
            if intent == ResponseType.ARCHITECTURE:
                # Validate required fields or set defaults
                diagram_updates = response_data.get("diagram_updates")
                nodes_to_add = response_data.get("nodes_to_add", [])
                edges_to_add = response_data.get("edges_to_add", [])
                elements_to_remove = response_data.get("elements_to_remove", [])
                
                # Ensure nodes_to_add is a list
                if nodes_to_add and not isinstance(nodes_to_add, list):
                    nodes_to_add = [nodes_to_add]
                
                # Ensure edges_to_add is a list
                if edges_to_add and not isinstance(edges_to_add, list):
                    edges_to_add = [edges_to_add]
                
                # Ensure elements_to_remove is a list
                if elements_to_remove and not isinstance(elements_to_remove, list):
                    elements_to_remove = [elements_to_remove]

                log_info(f"Diagram Updates : {diagram_updates}")
                log_info(f"Elements To Remove : {elements_to_remove}")
                log_info(f"Diagram Updates : {diagram_updates}")
                
                return ArchitectureResponse(
                    response_type=ResponseType.ARCHITECTURE,
                    diagram_updates=diagram_updates,
                    nodes_to_add=nodes_to_add,
                    edges_to_add=edges_to_add,
                    elements_to_remove=elements_to_remove,
                    **common_params
                )
            elif intent == ResponseType.EXPERT:
                # Validate or set defaults for expert response fields
                references = response_data.get("references", [])
                related_concepts = response_data.get("related_concepts", [])
                
                # Ensure references is a list
                if references and not isinstance(references, list):
                    references = [references]
                
                # Ensure related_concepts is a list
                if related_concepts and not isinstance(related_concepts, list):
                    related_concepts = [related_concepts]
                
                return ExpertResponse(
                    response_type=ResponseType.EXPERT,
                    references=references,
                    related_concepts=related_concepts,
                    **common_params
                )
            elif intent == ResponseType.CLARIFICATION:
                # Ensure questions field is always a list
                questions = response_data.get("questions", [])
                if not questions:
                    questions = ["Could you provide more details about what you're trying to accomplish?"]
                elif isinstance(questions, str):
                    questions = [questions]
                
                return ClarificationResponse(
                    response_type=ResponseType.CLARIFICATION,
                    questions=questions,
                    **common_params
                )
            elif intent == ResponseType.OUT_OF_CONTEXT:
                # Set suggestion if available
                suggestion = response_data.get("suggestion")
                
                return OutOfContextResponse(
                    response_type=ResponseType.OUT_OF_CONTEXT,
                    suggestion=suggestion,
                    **common_params
                )
            else:
                # Default to clarification response for unknown intent types
                log_info(f"Unknown intent type: {intent}, defaulting to ClarificationResponse")
                return ClarificationResponse(
                    response_type=ResponseType.CLARIFICATION,
                    message="I need more information to understand your request.",
                    confidence=0.5,
                    session_id=session_id,
                    classification_source=classification_source,
                    questions=["Could you provide more details about what you're trying to accomplish?"]
                )
        except Exception as e:
            log_info(f"Error creating response object: {str(e)}", exc_info=True)
            # Fallback to a simple response in case of errors
            return ClarificationResponse(
                response_type=ResponseType.CLARIFICATION,
                message="I encountered an issue processing your request. Could you try rephrasing it?",
                confidence=0.5,
                session_id=session_id,
                classification_source=classification_source,
                questions=["Could you provide your request in simpler terms?"]
            )
    
    def _extract_json(self, llm_response: str) -> Dict[str, Any]:
        """
        Extract JSON from the LLM response.
        
        Args:
            llm_response: The raw response from the LLM
            
        Returns:
            The extracted JSON as a dictionary
        """
        # Try to find JSON within code blocks
        json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', llm_response, re.DOTALL)
        
        if json_match:
            json_str = json_match.group(1)
        else:
            # If no JSON in code blocks, try to find JSON-like structure
            json_match = re.search(r'\{.*\}', llm_response, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                # Fallback if no JSON-like structure found
                return {"message": llm_response, "confidence": 0.5}
        
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            # Fallback for parsing failures
            log_info(f"JSON decode error: {e}. Response: {llm_response[:200]}...")
            return {"message": llm_response, "confidence": 0.5}

    def _create_response_object(
        self,
        response_data: Dict[str, Any],
        intent: ResponseType,
        session_id: str,
        classification_source: Optional[str] = None
    ) -> Union[ArchitectureResponse, ExpertResponse, ClarificationResponse, OutOfContextResponse]:
        """
        Helper method to create the appropriate response object from the extracted JSON data.
        
        Args:
            response_data: The parsed response data
            intent: The classified intent
            session_id: The session identifier
            classification_source: Source of classification
            
        Returns:
            A structured response object based on the intent
        """
        try:
            log_info(f"Creating response object from data: {type(response_data)}")
            log_info(f"Response data keys: {response_data.keys() if isinstance(response_data, dict) else 'Not a dict'}")
            
            # Common parameters for all response types
            common_params = {
                "message": response_data.get("message", ""),
                "confidence": response_data.get("confidence", 0.7),
                "session_id": session_id,
                "classification_source": classification_source
            }
            
            # Create appropriate response object based on intent
            if intent == ResponseType.ARCHITECTURE:
                # Log the architecture-specific data
                log_info(f"Architecture response data: {response_data}")
                
                # Validate required fields or set defaults
                diagram_updates = response_data.get("diagram_updates")
                nodes_to_add = response_data.get("nodes_to_add", [])
                edges_to_add = response_data.get("edges_to_add", [])
                elements_to_remove = response_data.get("elements_to_remove", [])
                
                # Ensure nodes_to_add is a list
                if nodes_to_add and not isinstance(nodes_to_add, list):
                    nodes_to_add = [nodes_to_add]
                
                # Ensure edges_to_add is a list
                if edges_to_add and not isinstance(edges_to_add, list):
                    edges_to_add = [edges_to_add]
                
                # Ensure elements_to_remove is a list
                if elements_to_remove and not isinstance(elements_to_remove, list):
                    elements_to_remove = [elements_to_remove]
                    
                log_info(f"Final architecture data - nodes: {nodes_to_add}, edges: {edges_to_add}, remove: {elements_to_remove}")
                
                return ArchitectureResponse(
                    response_type=ResponseType.ARCHITECTURE,
                    diagram_updates=diagram_updates,
                    nodes_to_add=nodes_to_add,
                    edges_to_add=edges_to_add,
                    elements_to_remove=elements_to_remove,
                    **common_params
                )
                
            elif intent == ResponseType.EXPERT:
                # Expert response handling
                references = response_data.get("references", [])
                related_concepts = response_data.get("related_concepts", [])
                
                # Ensure references is a list
                if references and not isinstance(references, list):
                    references = [references]
                
                # Ensure related_concepts is a list
                if related_concepts and not isinstance(related_concepts, list):
                    related_concepts = [related_concepts]
                
                return ExpertResponse(
                    response_type=ResponseType.EXPERT,
                    references=references,
                    related_concepts=related_concepts,
                    **common_params
                )
                
            elif intent == ResponseType.CLARIFICATION:
                # Clarification response handling
                questions = response_data.get("questions", [])
                if not questions:
                    questions = ["Could you provide more details about what you're trying to accomplish?"]
                elif isinstance(questions, str):
                    questions = [questions]
                
                return ClarificationResponse(
                    response_type=ResponseType.CLARIFICATION,
                    questions=questions,
                    **common_params
                )
                
            elif intent == ResponseType.OUT_OF_CONTEXT:
                # Out of context handling
                suggestion = response_data.get("suggestion")
                
                return OutOfContextResponse(
                    response_type=ResponseType.OUT_OF_CONTEXT,
                    suggestion=suggestion,
                    **common_params
                )
                
            else:
                # Default to clarification for unknown intent
                return ClarificationResponse(
                    response_type=ResponseType.CLARIFICATION,
                    message="I need more information to understand your request.",
                    confidence=0.5,
                    session_id=session_id,
                    classification_source=classification_source,
                    questions=["Could you provide more details about what you're trying to accomplish?"]
                )
                
        except Exception as e:
            log_info(f"Error creating response object: {str(e)}", exc_info=True)
            # Fallback response in case of errors
            return ClarificationResponse(
                response_type=ResponseType.CLARIFICATION,
                message=f"I encountered an issue processing your request: {str(e)}",
                confidence=0.5,
                session_id=session_id,
                classification_source=classification_source,
                questions=["Could you try rephrasing your request?"]
            )