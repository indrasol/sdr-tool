from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from typing import Union
from services.auth_handler import verify_token  # Authentication dependency
from services.request_handler import preprocess_request
from core.llm.llm_gateway import LLMGateway
from services.response_handler import ResponseHandler
from models.new_pydantic_models import (
    UserRequest,
    ArchitectureResponse,
    ExpertResponse,
    ErrorResponse,
    ClarificationResponse
)
from utils.logger import log_info  # Logging utility

# Initialize the router
router = APIRouter()

# Initialize core components
llm_gateway = LLMGateway()
response_handler = ResponseHandler()

@router.post("/design")
async def design_endpoint(
    request: UserRequest,
    current_user: dict = Depends(verify_token)
) -> JSONResponse:
    """
    Handles user requests to design secure software architectures.

    Args:
        request: UserRequest containing query, session_id, and project_id.
        current_user: Authenticated user data retrieved via dependency.

    Returns:
        JSONResponse: A validated response (e.g., ArchitectureResponse, ExpertResponse)
                      or an error/clarification response.

    Raises:
        HTTPException: For authentication or specific validation failures.
        ValueError: For invalid input data.
        Exception: For unexpected server-side errors.
    """
    try:
        # Log request information
        log_info(f"Processing design request for user {current_user['supabase_user_id']}, session {request.session_id}")
        
        # Step 1: Preprocess the request with intent classification
        processed_request = await preprocess_request(
            request=request,
            user_id=current_user["supabase_user_id"]
        )
        # Expected processed_request format:
        # {
        #     "query": str,
        #     "session_id": str,
        #     "project_code": str,  # Changed from project_id to project_code
        #     "user_id": str,
        #     "conversation_history": str,
        #     "diagram_context": dict,
        #     "intent": dict (with "intent_type": str)
        # }

        # Step 2: Generate LLM response based on classified intent
        intent_type = processed_request["intent"]["intent_type"]
        log_info(f"Detected intent: {intent_type}")
        
        llm_response = await llm_gateway.generate_response(
            processed_request=processed_request,
            intent_type=intent_type,
            session_id=request.session_id
        )
        # llm_response is a Dict[str, Any] containing the raw LLM output

        # Step 3: Process and validate the LLM response
        validated_response: Union[
            ArchitectureResponse,
            ExpertResponse,
            ErrorResponse,
            ClarificationResponse
        ] = await response_handler.process_and_validate_llm_response(
            processed_request=processed_request,
            llm_response=llm_response,
            session_id=request.session_id,
            intent_type=intent_type
        )

        # Step 4: Return the validated response as JSON
        return JSONResponse(content=validated_response.model_dump())

    except HTTPException as e:
        # Authentication or specific HTTP-related errors
        log_info(f"HTTPException in design_endpoint: {e.status_code} - {e.detail}")
        return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
    except ValueError as e:
        # Input validation errors
        log_info(f"ValueError in design_endpoint: {str(e)}")
        return JSONResponse(status_code=400, content={"detail": str(e)})
    except Exception as e:
        # Unexpected errors
        log_info(f"Unexpected error in design_endpoint: {str(e)}")
        return JSONResponse(
            status_code=500, 
            content={"detail": f"Internal server error: {str(e) if 'production' != 'true' else 'Please try again later.'}"}
        )