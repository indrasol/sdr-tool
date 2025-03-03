from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from typing import Union, Optional
from services.auth_handler import get_current_user  # Authentication dependency
from core.db.connection_manager import get_db     # Database dependency
from models.db_schema_models import User          # User model
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
import asyncio
from utils.logger import log_info  # Logging utility

# Initialize the router
router = APIRouter()

# Initialize core components
# request_handler = RequestHandler()
llm_gateway = LLMGateway()
response_handler = ResponseHandler()

userquery = "Design a basic e-commerce system with a web server, application server, and database."

@router.post("/dummy_design")
async def design_endpoint(
    query: str = userquery,
    delay_minutes: Optional[float] = 0
    # request: UserRequest,
    # current_user: User = Depends(get_current_user),
    # db=Depends(get_db)
) -> JSONResponse:
    """
    Handles user requests to design secure software architectures.

    Args:
        request: UserRequest containing query, session_id, and project_id.
        current_user: Authenticated user object retrieved via dependency.
        db: Database connection provided via dependency.

    Returns:
        JSONResponse: A validated response (e.g., ArchitectureResponse, ExpertResponse)
                      or an error/clarification response.

    Raises:
        HTTPException: For authentication or specific validation failures.
        ValueError: For invalid input data.
        Exception: For unexpected server-side errors.
    """
    # try:
        # Step 1: Preprocess the request with intent classification
        # processed_request = await preprocess_request(
        #     request=request,
        #     # user_id=current_user.id,
        #     db=db
        # )
        # Expected processed_request format:
        # {
        #     "query": str,
        #     "session_id": str,
        #     "project_id": str,
        #     "user_id": str,
        #     "conversation_history": str,
        #     "diagram_context": dict,
        #     "intent": dict (with "intent_type": str)
        # }

        # Step 2: Generate LLM response based on classified intent
        # intent_type = processed_request["intent"]["intent_type"]
        # llm_response = await llm_gateway.generate_response(
        #     processed_request=processed_request,
        #     intent_type=intent_type,
        #     session_id=request.session_id
        # )
        # llm_response is a Dict[str, Any] containing the raw LLM output

        # Step 3: Process and validate the LLM response
        # validated_response: Union[
        #     ArchitectureResponse,
        #     ExpertResponse,
        #     ErrorResponse,
        #     ClarificationResponse
        # ] = await response_handler.process_and_validate_llm_response(
        #     processed_request=processed_request,
        #     llm_response=llm_response,
        #     session_id=request.session_id,
        #     intent_type=intent_type
        # )

    try:
        delay_minutes = 3
        # Add delay if requested
        if delay_minutes > 0:
            log_info(f"Delaying response for {delay_minutes} minutes")
            # Convert minutes to seconds for asyncio.sleep
            await asyncio.sleep(delay_minutes * 60)

        validated_response = None

        # Step 4: Return the validated response as JSON
        return JSONResponse(content=validated_response.model_dump())

    except HTTPException as e:
        # Authentication or specific HTTP-related errors
        return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
    except ValueError as e:
        # Input validation errors
        log_info(f"ValueError in design_endpoint: {str(e)}")
        return JSONResponse(status_code=400, content={"detail": str(e)})
    except Exception as e:
        # Unexpected errors
        log_info(f"Unexpected error in design_endpoint: {str(e)}")
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    



# Sampele test scenarios

# Mixed Actions

# Design a basic e-commerce system with a web server, application server, and database.

# Mixed Action : Add + Modify
# Add a load balancer in front of the web servers and increase the database's security level to high.

# Mixed Action : Add + Remove
# Remove the application server and replace it with three microservices: an inventory service, a payment service, and a user management service.

# Mixed Action : Modify + Remove
# Change the web server to use HTTPS and remove the load balancer.

# Mixed Action : Complex Mixed operations
# Scale our architecture by adding a caching layer with Redis, implement a message queue between services, make the database redundant, and remove any single points of failure.

# Mixed Action : Rename + Restructure
# Rename our services with more specific names and restructure to have a three-tier architecture with proper segmentation.

# Mixed Action : Security Focussed Changes
# Add a firewall to protect our web tier, implement encryption for all data in transit, replace the user management service with an OAuth service, and remove direct database access from the web tier.