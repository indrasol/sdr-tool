from fastapi import APIRouter, HTTPException
from datetime import datetime
from utils.logger import log_info
from fastapi.responses import JSONResponse

# Utils

# Models
from models.pydantic_models import UserRequest, ArchitectureResponse, ExpertResponse

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
        try:
            llm_response = await llm_gateway.generate_response(
                processed_request, 
                model="claude", 
                query_type="generic_query"
            )
        except Exception as llm_error:
            log_info(f"LLM generation error: {str(llm_error)}")
            # Create a fallback response when LLM fails
            return ExpertResponse(
                timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                expert_message="I'm having trouble processing your request right now.",
                justification="There was an issue communicating with the AI backend. Please try again shortly or rephrase your query."
            )

        # Step 3: Process and validate LLM response and format for models
        try:
            processed_and_validated_response = await process_and_validate_llm_response(
                llm_response, 
                request.diagram_context
            )
        except Exception as validation_error:
            log_info(f"Validation error: {str(validation_error)}")
            # Return a friendly error response instead of failing
            return ExpertResponse(
                timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                expert_message="I had trouble understanding your request in the context of your current architecture.",
                justification=f"Validation error: {str(validation_error)[:200]}... Please try being more specific or provide more context."
            )

        # Step 4: Apply security rules if needed if response is ArchitectureResponse
        if isinstance(processed_and_validated_response, ArchitectureResponse):
            try:
                log_info(f"Applying security rules to ArchitectureResponse")
                security_validator = SecurityRulesValidator()
                await security_validator.apply_security_rules(
                    processed_and_validated_response, 
                    request.diagram_context
                )
            except Exception as security_error:
                log_info(f"Security validation error: {str(security_error)}")
                # We continue with the response even if security validation fails
                # but add a warning message to security_messages
                warning_msg = {
                    "severity": "HIGH", 
                    "message": f"Security validation incomplete: {str(security_error)[:100]}..."
                }
                if hasattr(processed_and_validated_response, 'security_messages'):
                    processed_and_validated_response.security_messages.append(warning_msg)
        
        # Step 5: Format final response
        try:
            formatted_response = format_response(processed_and_validated_response)
            log_info(f"Formatted response: {formatted_response}")
            return formatted_response
        except Exception as format_error:
            log_info(f"Format error: {str(format_error)}")
            # If formatting fails, return the raw validated response
            return processed_and_validated_response
    
    except ValidationError as e:
        log_info(f"Request validation error: {str(e)}")
        return JSONResponse(
            status_code=422,
            content={
                "detail": f"Validation error: {str(e)}",
                "type": "validation_error"
            }
        )
    except RateLimitError:
        log_info("Rate limit exceeded")
        return JSONResponse(
            status_code=429,
            content={
                "detail": "Rate limit exceeded. Please try again later.",
                "type": "rate_limit_error"
            }
        )
    except Exception as e:
        log_info(f"Unexpected error: {str(e)}")
        # Return a friendly error response
        return JSONResponse(
            status_code=500,
            content={
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "expert_message": "I encountered an unexpected error while processing your request.",
                "justification": "The system experienced an internal error. Please try again later or with a different query.",
                "type": "server_error"
            }
        )
    



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
