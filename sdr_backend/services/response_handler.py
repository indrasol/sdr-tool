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

         # Create an instance of ValidationHandler
        validator = ValidationHandler()
        
        # Validate response type and structure
        if 'nodes' in llm_response:
            try:
                log_info(f"Validating architecture response with context: {context}")
                # Validate against ArchitectureResponse schema
                validated_response = ArchitectureResponse(**llm_response)
                
                log_info(f"Validating architecture response with context: {context}")
                # Checks if the architecture response is valid
                await validator._process_architecture_response(response=validated_response, context=context)

                processed_and_validated_response = validated_response
                
            except ValidationError as e:
                logging.error(f"ArchitectureResponse validation error: {str(e)}")
                raise ValueError(f"Invalid ArchitectureResponse format: {str(e)}")
        elif 'expert_message' in llm_response:
            try:
                # Validate against ExpertResponse schema
                validated_response = ExpertResponse(**llm_response)
                
                # Additional validation for expert response
                await validator._validate_expert_response(response=validated_response)

                processed_and_validated_response = validated_response
                
            except ValidationError as e:
                logging.error(f"ExpertResponse validation error: {str(e)}")
                raise ValueError(f"Invalid ExpertResponse format: {str(e)}")

        else:
            raise ValueError("Response must contain either 'actions' or 'expert_message'")
            
        return processed_and_validated_response
        
    except Exception as e:
        log_info(f"Error processing LLM response: {str(e)}")
        raise ValueError(f"Failed to process LLM response: {str(e)}")

# generate_llm_response
# async def generate_llm_response(prompt: str, model: str = "claude") -> dict:
#     """Enhance Prompt and Generate response using LLM """
#     log_info(f"Entering generate_llm_response with prompt: {prompt}")
#     try:
#         raw_response = await llm_gateway.generate(prompt, model=model, prompt_type="generic_query")
#         return raw_response
#     except LLMError as e:
#         raise HTTPException(500, detail=f"LLM Error: {str(e)}")
#     except RateLimitError as e:
#         raise HTTPException(429, detail=str(e))

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



