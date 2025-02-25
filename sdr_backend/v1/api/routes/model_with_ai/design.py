from fastapi import APIRouter, HTTPException

from utils.logger import log_info

# Utils

# Models
from models.pydantic_models import UserRequest, ArchitectureResponse

# Core
from core.security_layer import SecurityRulesValidator
from core.llm_gateway import LLMGateway

# Services
from services.request_handler import preprocess_request
from services.response_handler import format_response, process_and_validate_llm_response
# from services.prompt_handler import build_prompt

# Exceptions
from services.exception_handler import RateLimitError, ValidationError


router = APIRouter()


@router.post("/design")
async def process_request(request: UserRequest): 
    """
    Process user chat requests for architecture design assistance
    
    Args:
        request: UserRequest containing input and diagram context
        current_user: Authenticated user making the request
    
    Returns:
        JSONResponse with architecture modifications or expert advice
    """
    try:
        log_info(f"Processing request: {request}")

        # Step 1: Process user request
        processed_request = await preprocess_request(request)
        log_info(f"Processed request: {processed_request}")

        # Step 2: Build prompt as per LLM model
        # enahnced_prompt = await build_prompt(processed_request, model="claude")

        # Step 3: Generate LLM response using user-defined LLM model
        llm_gateway = LLMGateway()
        llm_response = await llm_gateway.generate_response(processed_request, model="claude", query_type="generic_query")

        # Step 4: Process and validate LLM response and format for ArchitectureResponse or ExpertResponse pydantic models
        processed_and_validated_response = await process_and_validate_llm_response(llm_response, request.diagram_context)

        # Apply security rules if needed if response is ArchitectureResponse
        if isinstance(processed_and_validated_response, ArchitectureResponse):
            log_info(f"Applying security rules to ArchitectureResponse")
            security_validator = SecurityRulesValidator()
            await security_validator.apply_security_rules(processed_and_validated_response, request.diagram_context)
        
        # Step 5: Format final ArchitectureResponse pydantic model into JSONResponse for frontend
        formatted_response = format_response(processed_and_validated_response)
        # current_datetime = datetime.now()
        # formatted_timestamp = current_datetime.strftime("%Y-%m-%d %H:%M:%S") 
        # log_info(f"current_datetime: {formatted_timestamp}")
        # formatted_response.timestamp = formatted_timestamp
        log_info(f"Formatted response: {formatted_response}")

        return formatted_response
    
    except ValidationError as e:
        raise HTTPException(422, detail=str(e))
    except RateLimitError:
        raise HTTPException(429, detail="Rate limit exceeded")
    except Exception as e:
        raise HTTPException(500, detail="Internal server error")
    



# Sampele tests

# NODE INTERACTION

# ADD
# Add a Firewall Protection node and an Intrusion Detection System.

#  MODIFY
#Scenario 1: give full  node name
# Update Firewall Protection node to Firewall.

#Scenario 2: give partial node name
# Update Firewall node to firewall.

# REMOVE
# Remove the Intrusion Detection System node.   

# EXPERT QUERY
# How to make kubernetes fit in secured architecture
