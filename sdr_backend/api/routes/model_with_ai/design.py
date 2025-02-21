from fastapi import APIRouter, HTTPException

from utils.logger import log_info, log_error
import json

# Utils
from utils.prompt_engineering import enhance_prompt
from utils.structured_action_from_prompt import get_structured_action_from_prompt, get_expert_response_from_prompt
from utils.node_linking import auto_link_with_user_nodes

# Models
from models.pydantic_models import UserRequest

# Services
from services.request_handler import preprocess_request
from services.response_handler import generate_llm_response, process_llm_response, format_response, parse_llm_response

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
        # log_info(f"Processing request: {request}")
        # Step 1: Process user request
        processed_request = await preprocess_request(request)
        log_info(f"Processed request: {processed_request}")

        # Step 2: Generate LLM response
        raw_llm_response = await generate_llm_response(processed_request)

        # Step 3: Parse LLM response
        parsed_llm_response = await parse_llm_response(raw_llm_response)
        
        # Step 4: Validate parsed LLM response and apply security rules if needed
        validated_response = await process_llm_response(parsed_llm_response, request.diagram_context)
        
        # Step 5: Format final output
        return format_response(validated_response)
    
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
