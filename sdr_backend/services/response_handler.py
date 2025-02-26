from datetime import datetime
from fastapi import HTTPException
from pydantic import BaseModel
from models.pydantic_models import ArchitectureResponse, DiagramContext, ExpertResponse
from fastapi.responses import JSONResponse
from services.prompt_handler import build_prompt
from services.security_rules_handler import apply_security_rules
import json
from core.llm_gateway import llm_gateway
from services.exception_handler import LLMError, RateLimitError, ValidationError
from utils.logger import log_info
from services.exception_handler import SecurityValidationError
from typing import Union, Dict, Any, Optional
from services.validation_handler import ValidationHandler
import logging


async def process_and_validate_llm_response(llm_response: Dict[str, Any], context: Optional[DiagramContext] = None) -> Union[ArchitectureResponse, ExpertResponse]:
    """
        Processes and validates the LLM response against the required schema.
        Includes security validation for architecture responses.
        
        Args:
            llm_response: Raw response from LLM
            context: Optional diagram context for validation
            
        Returns:
            Validated ArchitectureResponse or ExpertResponse
    """
    try:
        current_datetime = datetime.now()
        formatted_timestamp = current_datetime.strftime("%Y-%m-%d %H:%M:%S") 
        # Add timestamp to response
        llm_response['timestamp'] = formatted_timestamp

         # Create a deep copy to avoid modifying the original
        processed_response = json.loads(json.dumps(llm_response))
        
        # Create an instance of ValidationHandler
        validator = ValidationHandler()
        
        # Preprocess the response based on its type
        if 'nodes' in processed_response:
            # Architecture response - preprocess nodes
            try:
                # Fix common issues with node properties before validation
                if isinstance(processed_response['nodes'], list):
                    for node in processed_response['nodes']:
                        # Ensure properties exist
                        if 'properties' not in node or node['properties'] is None:
                            node['properties'] = {}
                        
                        # Handle database properties specifically
                        if node.get('node_type') == 'database' or (
                                isinstance(node.get('properties'), dict) and
                                node.get('properties', {}).get('properties_type') == 'database'):
                            props = node.get('properties', {})
                            
                            # Set properties_type
                            props['properties_type'] = 'database'
                            
                            # Set node_type
                            props['node_type'] = node.get('node_type', 'database')
                            
                            # Map data_classification to accepted values
                            if 'data_classification' in props:
                                data_class = props['data_classification']
                                if isinstance(data_class, str):
                                    data_class = data_class.lower()
                                    # Map variations to standard values
                                    classification_map = {
                                        'sensitive': 'confidential',
                                        'protected': 'confidential',
                                        'private': 'confidential',
                                        'internal': 'confidential',
                                        'classified': 'secret',
                                        'restricted': 'secret',
                                        'top-secret': 'secret',
                                        'public-facing': 'public',
                                        'unrestricted': 'public',
                                        'open': 'public'
                                    }
                                    if data_class in classification_map:
                                        props['data_classification'] = classification_map[data_class]
                                    elif data_class not in ['public', 'confidential', 'secret']:
                                        # Default to confidential for unknown values
                                        props['data_classification'] = 'confidential'
                                        log_info(f"Mapped unknown data_classification '{data_class}' to 'confidential'")
                            else:
                                # Set default if missing
                                props['data_classification'] = 'confidential'
                            
                            # Ensure other required fields exist with defaults
                            if 'encryption_type' not in props:
                                props['encryption_type'] = 'both'
                            
                            if 'backup_schedule' not in props:
                                props['backup_schedule'] = 'daily'
                            
                            node['properties'] = props
                
                # Ensure explanation exists
                if 'explanation' not in processed_response or not processed_response['explanation']:
                    processed_response['explanation'] = "Architecture changes based on security best practices."
                
                # Ensure confidence exists
                if 'confidence' not in processed_response or not processed_response['confidence']:
                    processed_response['confidence'] = 0.8
                elif isinstance(processed_response['confidence'], str):
                    try:
                        processed_response['confidence'] = float(processed_response['confidence'])
                    except ValueError:
                        processed_response['confidence'] = 0.8
                
                # Validate against ArchitectureResponse schema
                validated_response = ArchitectureResponse(**processed_response)
                
                log_info(f"Validating architecture response with context: {context}")
                # Checks if the architecture response is valid
                await validator._process_architecture_response(response=validated_response, context=context)

                processed_and_validated_response = validated_response
                
            except ValidationError as e:
                log_info(f"ArchitectureResponse validation error: {str(e)}")
                # Create fallback expert response when architecture validation fails
                expert_response = {
                    "timestamp": formatted_timestamp,
                    "expert_message": "I encountered an issue while creating the diagram updates. Here's my advice instead.",
                    "justification": f"The system encountered validation errors. Original error: {str(e)[:200]}... " + 
                                    "Please try a more specific request or describe your architecture components in more detail."
                }
                processed_and_validated_response = ExpertResponse(**expert_response)
                
        elif 'expert_message' in processed_response:
            try:
                # Convert justification from list to string if needed
                if "justification" in processed_response and isinstance(processed_response["justification"], list):
                    processed_response["justification"] = "\n".join(processed_response["justification"])
                
                # Handle other fields that might be in unexpected formats
                if 'security_messages' in processed_response:
                    # Remove this field as it's not in the ExpertResponse model
                    security_messages = processed_response.pop('security_messages')
                    # Append security messages to justification if important
                    if security_messages and isinstance(security_messages, list) and len(security_messages) > 0:
                        messages_text = "\n\nSecurity considerations:\n"
                        for msg in security_messages:
                            if isinstance(msg, dict) and 'severity' in msg and 'message' in msg:
                                messages_text += f"- {msg['severity']}: {msg['message']}\n"
                            elif isinstance(msg, str):
                                messages_text += f"- {msg}\n"
                        processed_response["justification"] += messages_text
                
                # Handle recommended_next_steps if present
                if 'recommended_next_steps' in processed_response:
                    steps = processed_response.pop('recommended_next_steps')
                    if steps:
                        steps_text = "\n\nRecommended next steps:\n"
                        if isinstance(steps, list):
                            for step in steps:
                                steps_text += f"- {step}\n"
                        else:
                            steps_text += steps
                        processed_response["justification"] += steps_text
                
                # Handle references if present
                if 'references' in processed_response:
                    refs = processed_response.pop('references')
                    if refs:
                        refs_text = "\n\nReferences:\n"
                        if isinstance(refs, list):
                            for ref in refs:
                                refs_text += f"- {ref}\n"
                        else:
                            refs_text += refs
                        processed_response["justification"] += refs_text
                
                # Create valid ExpertResponse with only the expected fields
                expert_response = {
                    "timestamp": formatted_timestamp,
                    "expert_message": processed_response["expert_message"],
                    "justification": processed_response["justification"]
                }

                # Validate against ExpertResponse schema
                validated_response = ExpertResponse(**expert_response)
                
                # Additional validation for expert response
                await validator._validate_expert_response(response=validated_response)

                processed_and_validated_response = validated_response
                
            except ValidationError as e:
                log_info(f"ExpertResponse validation error: {str(e)}")
                # Create a minimal valid expert response
                expert_response = {
                    "timestamp": formatted_timestamp,
                    "expert_message": "I've analyzed your request but encountered some processing issues.",
                    "justification": "The system was unable to format the complete response. " + 
                                    "Please try rephrasing your question in a more specific way."
                }
                processed_and_validated_response = ExpertResponse(**expert_response)
                
        else:
            log_info("Response must contain either 'nodes' or 'expert_message'")
            # Create a fallback expert response
            expert_response = {
                "timestamp": formatted_timestamp,
                "expert_message": "I've received your request but I'm not sure how to process it.",
                "justification": "The response structure was not recognized. Please try a different query format or be more specific about your security architecture needs."
            }
            processed_and_validated_response = ExpertResponse(**expert_response)
            
        return processed_and_validated_response
        
    except Exception as e:
        log_info(f"Error processing LLM response: {str(e)}")
        # Provide a fallback response instead of raising an exception
        expert_response = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "expert_message": "I encountered an unexpected error while processing your request.",
            "justification": f"System error: {str(e)[:100]}... Please try again with a different query or contact support if the issue persists."
        }
        return ExpertResponse(**expert_response)

# parse_llm_response
async def parse_llm_response(raw_response: str) -> Union[ArchitectureResponse, ExpertResponse]: # Return Union type
    """
    Parses the LLM's raw response and attempts to validate against both ArchitectureResponse and ExpertResponse schemas.

    Args:
        raw_response (str): The raw response from LLM.

    Returns:
        Union[ArchitectureResponse, ExpertResponse]: The validated and structured response, either ArchitectureResponse or ExpertResponse.

    Raises:
        LLMError: If parsing or validation fails for both schemas.
    """
    try:
        log_info(f"Entering parse_llm_response with raw_response: {raw_response}")

        # Extract content from OPenAI response (no changes)
        llm_raw_response = raw_response.get("choices", [{}])[0].get("message", {}).get("content", "")

        if not llm_raw_response:
            raise ValueError("LLM response content is empty")

        log_info(f"LLM raw response: {llm_raw_response}")

        # --- Attempt to parse as ArchitectureResponse first ---
        try:
            parsed_json = json.loads(llm_raw_response)
            log_info(f"Attempting to parse as ArchitectureResponse: {parsed_json}")
            return ArchitectureResponse(**parsed_json) # Try parsing as ArchitectureResponse
        except ValidationError: # Catch ValidationError if ArchitectureResponse parsing fails
            log_info("ArchitectureResponse validation failed. Trying ExpertResponse...")
            # Ignore ValidationError and try parsing as ExpertResponse

        # --- If ArchitectureResponse parsing failed, attempt to parse as ExpertResponse ---
        try:
            parsed_json = json.loads(llm_raw_response)
            log_info(f"Attempting to parse as ExpertResponse: {parsed_json}")
            return ExpertResponse(**parsed_json) # Try parsing as ExpertResponse
        except ValidationError as e: # Catch ValidationError if ExpertResponse parsing also fails
            error_msg = f"ExpertResponse validation error: {str(e)}"
            log_info(f"parse_llm_response ExpertResponse ValidationError: {error_msg}")
            corrected_response = await fix_llm_response(raw_response, error_msg)
            # Retry parsing with corrected response (retry parsing as ArchitectureResponse first again)
            return await parse_llm_response(corrected_response)


        except json.JSONDecodeError as e: # JSONDecodeError handling (no changes)
            error_msg = f"Invalid JSON format: {str(e)}"
            log_info(f"parse_llm_response JSONDecodeError: {error_msg}")
            corrected_response = await fix_llm_response(raw_response, error_msg)
            return await parse_llm_response(corrected_response)  # Retry parsing

        except Exception as e: # General Exception handling (no changes)
            error_msg = f"Unexpected error in parse_llm_response: {str(e)}"
            log_info(error_msg)
            raise HTTPException(500, detail=error_msg)
    except HTTPException as e:  # Catch HTTPException and re-raise
        raise e
    except Exception as e:
        error_msg = f"Unexpected error in parse_llm_response: {str(e)}"
        log_info(error_msg)
        raise HTTPException(500, detail=error_msg)
    


# fix_llm_response
async def fix_llm_response(raw_response: str, error: str) -> str:
    """
    Attempts to fix an invalid LLM response using the LLM itself.  Now aware of both ArchitectureResponse and ExpertResponse schemas.

    Args:
        raw_response (str): The original invalid response.
        error (str): The validation error message.

    Returns:
        str: Corrected response as a JSON string.
    """
    correction_prompt = f"""
    The following JSON response failed validation with this error: {error}

    **Original Response:**
    ```json
    {raw_response}
    ```

    **Valid Response Formats (Strictly Follow One of These Schemas):**

    **1. ArchitectureResponse Schema:**
    {ArchitectureResponse.model_json_schema(indent=2)}

    **2. ExpertResponse Schema:**
    {ExpertResponse.model_json_schema(indent=2)}


    **Instructions:**
    - Correct any JSON syntax errors in the Original Response.
    - Ensure the corrected response strictly adheres to **ONE** of the two schemas provided above (either ArchitectureResponse OR ExpertResponse).
    - Ensure all required fields for the chosen schema are present.
    - Keep data types strictly as specified in the chosen schema.
    - If a field is missing, infer a reasonable default value if possible, or leave it out if truly impossible to infer and not strictly required in the chosen schema.
    - Choose the schema (ArchitectureResponse or ExpertResponse) that is most appropriate for the user's original query and the LLM's original intent.
    - Do not wrap the response in Markdown (```json).
    - Return ONLY the corrected JSON, without explanations or extra text.

    **IMPORTANT:** Only output valid JSON conforming to either ArchitectureResponse or ExpertResponse schema, without explanations or extra text. Choose the most appropriate schema.
    """

    try:
        # Get corrected response from LLM (no changes)
        corrected = await llm_gateway.generate(correction_prompt)

        # Ensure no markdown wrappers (no changes)
        corrected = corrected.strip()
        if corrected.startswith("```json"):
            corrected = corrected[7:-3].strip()  # Remove the markdown block

        return corrected
    except Exception as e:
        raise LLMError(f"Failed to fix response: {str(e)}")
    

    

async def process_llm_response(llm_response: dict, context: DiagramContext) -> ArchitectureResponse:
    """Convert LLM response into actionable architecture changes with security validation messages."""

    # Validate against current diagram state and perform security rule checks
    log_info(f"Entering Processing LLM response...")

      # --- ADD THIS LOGGING BEFORE json.dumps ---
    log_info("llm_response object before validation")
    # log_info(llm_response) # Log the object directly
    log_info(f"type of llm_response: {type(llm_response)}")
    # --- END ADDED LOGGING ---

    # If llm_response is a string, parse it into a dictionary
    if isinstance(llm_response, BaseModel):
     validated_response = llm_response
    else:
     try:
        validated_response = ArchitectureResponse(**llm_response)
     except ValidationError as e:
        error_msg = f"ArchitectureResponse Pydantic Validation Error: {str(e)}"
        log_info(f"process_llm_response ValidationError: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

    log_info(f"Validated response: {validated_response}")
    validation_messages = [] # Initialize an empty list to collect messages

    try:
        # Receive all validation messages (warnings/info) in response.security_messages from apply_security_rules.
        await apply_security_rules(validated_response, context)
    except SecurityValidationError as e:
        log_info(f"inside except SecurityValidationError: {e}")
        # Format SecurityValidationError as a dictionary with "Severity" and "Message"
        validation_messages.append({
            "severity": e.severity,  # Get severity from the exception object
            "message": str(e)  # Convert the exception message to string
        })
        log_info(f"Security validation error: {str(e)}")

    # Attach all validation messages (errors and warnings/info) to the response
    # Purpose: For Robustness and User Feedback
    # Run security rule checks.
    # Catches SecurityValidationError exceptions (for critical/medium errors).
    # `apply_security_rules` now populates `response.security_messages` with all validation messages (including warnings/info).
    # This function then ensures that the `security_messages` from `apply_security_rules`
    # (and any blocking error messages caught as exceptions) are attached to the final ArchitectureResponse.
    validated_response.security_messages.extend(validation_messages) # Extend with caught blocking errors (if any)
    log_info(f"validated_response.security_messages: {validated_response.security_messages}")

    return validated_response



def format_response(response: Union[ArchitectureResponse, ExpertResponse]) -> JSONResponse:
    """Format final API response to include all relevant fields, including security_messages."""
    # log_info(f"inside format_response: {response}")
    # current_datetime = datetime.now()
    # formatted_timestamp = current_datetime.strftime("%Y-%m-%d %H:%M:%S") 
    # log_info(f"current_datetime: {formatted_timestamp}")
    # response.timestamp = formatted_timestamp
    # log_info(f"Formatted response: {response}")
    return response



