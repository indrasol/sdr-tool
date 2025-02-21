import datetime

from fastapi import HTTPException
from models.pydantic_models import ArchitectureResponse, DiagramContext
from fastapi.responses import JSONResponse
from services.prompt_handler import build_prompt
from services.security_rules_handler import apply_security_rules
import json
from core.llm_gateway import llm_gateway
from services.exception_handler import LLMError, RateLimitError, ValidationError
from utils.logger import log_info
from services.exception_handler import SecurityValidationError
# generate_llm_response
async def generate_llm_response(processed_input: dict) -> dict:
    """Enhance Prompt and Generate response using LLM """
    prompt = build_prompt(processed_input)
    try:
        raw_response = await llm_gateway.generate(prompt)
        #     prompt,
        #     context={
        #         "project_id": processed_input.get("context", {}).get("project"),
        #         "compliance": processed_input.get("context", {}).get("compliance")
        #     }
        # )
        return raw_response
    except LLMError as e:
        raise HTTPException(500, detail=f"LLM Error: {str(e)}")
    except RateLimitError as e:
        raise HTTPException(429, detail=str(e))



# parse_llm_response
async def parse_llm_response(raw_response: str) -> ArchitectureResponse:
    """
    Parses the LLM's raw response and ensures it matches the expected schema.

    Args:
        raw_response (str): The raw response from LLM.

    Returns:
        ArchitectureResponse: The validated and structured response.

    Raises:
        LLMError: If parsing or validation fails.
    """
    try:
        # Ensure the response is in proper JSON format
        parsed_json = json.loads(raw_response)

        # Validate response against ArchitectureResponse schema
        return ArchitectureResponse(**parsed_json)
    
    except json.JSONDecodeError as e:
        error_msg = f"Invalid JSON format: {str(e)}"
        log_info(" parse_llm_response JSONDecodeError : {error_msg}")  # Log error for debugging
        corrected_response = await fix_llm_response(raw_response, error_msg)
        return await parse_llm_response(corrected_response)  # Retry parsing
    
    except ValidationError as e:
        error_msg = f"Validation error: {str(e)}"
        log_info(" parse_llm_response ValidationError : {error_msg}")  # Log error for debugging
        corrected_response = await fix_llm_response(raw_response, error_msg)
        return await parse_llm_response(corrected_response)  # Retry parsing
    


# fix_llm_response
async def fix_llm_response(raw_response: str, error: str) -> str:
    """
    Attempts to fix an invalid LLM response using the LLM itself.

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
    
    **Required Format (Strictly Follow This Schema):**
    {ArchitectureResponse.model_json_schema(indent=2)}

    **Instructions:**
    - Correct any JSON syntax errors.
    - Ensure all required fields are present.
    - Keep data types strictly as specified.
    - If a field is missing, infer a reasonable default.
    - Do not wrap the response in Markdown (```json).
    - Return ONLY the corrected JSON, without extra text.

    **IMPORTANT:** Only output valid JSON without explanations or extra text.
    """

    try:
        # Get corrected response from LLM
        corrected = await llm_gateway.generate(correction_prompt)

        # Ensure no markdown wrappers
        corrected = corrected.strip()
        if corrected.startswith("```json"):
            corrected = corrected[7:-3].strip()  # Remove the markdown block

        return corrected
    
    except Exception as e:
        raise LLMError(f"Failed to fix response: {str(e)}")
    

    

async def process_llm_response(llm_response: dict, context: DiagramContext) -> ArchitectureResponse:
    """Convert LLM response into actionable architecture changes with security validation messages."""

    # Validate against current diagram state and perform security rule checks
    validated_response = ArchitectureResponse(**llm_response)
    validation_messages = [] # Initialize an empty list to collect messages

    try:
        # Receive all validation messages (warnings/info) in response.security_messages from apply_security_rules.
        await apply_security_rules(validated_response, context)
    except SecurityValidationError as e:
        validation_messages.append(str(e)) # Capture blocking error messages from exception
        log_info(f"Security validation error: {str(e)}")

    # Attach all validation messages (errors and warnings/info) to the response
    # Purpose: For Robustness and User Feedback
    # Run security rule checks.
    # Catches SecurityValidationError exceptions (for critical/medium errors).
    # `apply_security_rules` now populates `response.security_messages` with all validation messages (including warnings/info).
    # This function then ensures that the `security_messages` from `apply_security_rules`
    # (and any blocking error messages caught as exceptions) are attached to the final ArchitectureResponse.
    validated_response.security_messages.extend(validation_messages) # Extend with caught blocking errors (if any)

    return validated_response



def format_response(response: ArchitectureResponse) -> JSONResponse:
    """Format final API response"""
    return JSONResponse({
        "actions": response.actions,
        "explanation": response.explanation,
        "references": response.references,
        "confidence": response.confidence,
        "timestamp": datetime.now().isoformat()
    })

