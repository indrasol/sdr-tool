from datetime import datetime
from typing import Dict, Any, Union, Optional
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError
# from core.llm.llm_gateway import llm_gateway  # Assuming this exists for LLM interaction
from services.exception_handler import LLMError  # Custom exception class
from utils.logger import log_info  # Logging utility
from services.validation_handler import ValidationHandler  # Updated below
from models.new_pydantic_models import (
    ArchitectureResponse,
    ExpertResponse,
    ErrorResponse,
    ClarificationResponse,
    ResponseType,
    Status,
)
import json
from core.cache.session_manager import SessionManager
from services.utils_handler import apply_diagram_changes




class ResponseHandler:
    def __init__(self):
        self.validator = ValidationHandler()
        self.session_manager = SessionManager()

    async def process_and_validate_llm_response(
        self,
        processed_request,
        llm_response: Dict[str, Any],
        session_id: str,
        intent_type : str
    ) -> Union[ArchitectureResponse, ExpertResponse, ErrorResponse, ClarificationResponse]:
        try:
            # Fetch current session data for context (e.g., diagram state)
            session_data = self.session_manager.get_session(session_id) or {}
            current_diagram = session_data.get("diagram_state", {"nodes": [], "edges": []})

            # Convert raw response to appropriate Pydantic model
            if intent_type == "diagram_modification":
                response_model =  self._handle_architecture_response(llm_response, current_diagram)
                # Apply changes to get the updated diagram state
                updated_diagram = await apply_diagram_changes(current_diagram, response_model)
            elif intent_type in ["expert_advice" , "diagram_query"]:
                response_model =  self._handle_expert_response(llm_response)
                updated_diagram = None
            else:
                raise ValueError(f"Unsupported intent_type: {intent_type}")

            # Update session only after successful validation
            self.session_manager.update_session(
                session_id,
                query=processed_request.get('query', ''),
                response=response_model.dict() if hasattr(response_model, 'dict') else response_model,
                diagram_state=updated_diagram
            )

        except (ValueError, KeyError, PydanticValidationError) as e:
            log_info(f"Response processing failed: {str(e)}")
            return self._create_fallback_response(session_id, Status.error, str(e))

    async def _handle_architecture_response(
        self, raw_response: Dict[str, Any], current_diagram: Dict[str, list]
    ) -> ArchitectureResponse:
        preprocessed = self._preprocess_architecture_response(raw_response)
        try:
            response = ArchitectureResponse(**preprocessed)
            # Validate with current diagram state
            await self.validator.validate_architecture_response(response, current_diagram)
            return response
        except PydanticValidationError as e:
            log_info(f"ArchitectureResponse validation failed: {str(e)}")
            corrected = await self._fix_response(raw_response, str(e), ResponseType.architecture)
            try:
                response = ArchitectureResponse(**corrected)
                await self.validator.validate_architecture_response(response, current_diagram)
                return response
            except Exception as fix_error:
                log_info(f"Failed to fix architecture response: {str(fix_error)}")
                return self._create_fallback_response(
                    raw_response["session_id"], Status.error, str(fix_error)
                )

    async def _handle_expert_response(self, raw_response: Dict[str, Any]) -> ExpertResponse:
        try:
            response = ExpertResponse(**raw_response)
            await self.validator.validate_expert_response(response)
            return response
        except PydanticValidationError as e:
            return self._create_fallback_response(raw_response["session_id"], Status.error, str(e))

    def _create_fallback_response(
        self, session_id: str, status: Status, error_message: str
    ) -> ErrorResponse:
        return ErrorResponse(
            session_id=session_id,
            response_type=ResponseType.error,
            status=status,
            message=f"Response processing failed: {error_message}",
            timestamp=datetime.now().isoformat()
        )

    def _preprocess_architecture_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Preprocess architecture response to align with ArchitectureResponse model.

        Args:
            response: Raw LLM response dictionary.

        Returns:
            Preprocessed dictionary ready for validation.
        """
        response.setdefault("response_type", ResponseType.architecture)
        response.setdefault("status", Status.success)
        response.setdefault("nodes_to_add", [])
        response.setdefault("nodes_to_update", [])
        response.setdefault("nodes_to_remove", [])
        response.setdefault("edges_to_add", [])
        response.setdefault("edges_to_update", [])
        response.setdefault("edges_to_remove", [])
        response.setdefault("explanation", None)
        response.setdefault("security_messages", [])
        return response

    def _preprocess_expert_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Preprocess expert response to align with ExpertResponse model.

        Args:
            response: Raw LLM response dictionary.

        Returns:
            Preprocessed dictionary ready for validation.
        """
        response.setdefault("response_type", ResponseType.expert)
        response.setdefault("status", Status.success)
        response.setdefault("title", None)
        response.setdefault("content", "No content provided.")  # Required field
        response.setdefault("sections", None)
        response.setdefault("references", None)
        return response

    async def _fix_response(
        self, raw_response: Dict[str, Any], error: str, response_type: ResponseType
    ) -> Dict[str, Any]:
        """
        Attempt to fix an invalid response using the LLM.

        Args:
            raw_response: Original raw response dictionary.
            error: Validation error message.
            response_type: Type of response to fix.

        Returns:
            Corrected response dictionary.

        Raises:
            LLMError: If correction fails.
        """
        schema = (
            ArchitectureResponse.model_json_schema()
            if response_type == ResponseType.architecture
            else ExpertResponse.model_json_schema()
        )
        prompt = f"""
        The following JSON response failed validation: {error}

        **Original Response:**
        ```json
        {json.dumps(raw_response, indent=2)}

        **Expected Response**
        ```json
        {json.dumps(schema, indent=2)}

        Fix the response to match the schema. Return only the corrected JSON.
        """

        try:
            corrected_json = await llm_gateway.generate_response(prompt, model="claude")
            return json.loads(corrected_json.strip())
        except Exception as e:
            raise LLMError(f"Failed to fix response: {str(e)}")
        
    def _create_fallback_response(
    self, session_id: str, status: Status, error: Optional[str] = None
    ) -> Union[ErrorResponse, ClarificationResponse]:
        """
        Create a fallback response for errors or clarification.

        Args:
        session_id: Session identifier.
        status: Status of the fallback (error or warning).
        error: Optional error message.

        Returns:
        ErrorResponse or ClarificationResponse.
        """
        if status == Status.error:
            return ErrorResponse(
            session_id=session_id,
            timestamp=datetime.now(),
            response_type=ResponseType.error,
            status=Status.error,
            error_message="Failed to process the request.",
            details={"error": error} if error else None,
            )
        return ClarificationResponse(
            session_id=session_id,
            timestamp=datetime.now(),
            response_type=ResponseType.clarification,
            status=Status.warning,
            clarification_needed="Please clarify your request.",
            suggestions=["Rephrase your input.", "Provide more details."],
        )

    def format_response(
    self, response: Union[ArchitectureResponse, ExpertResponse, ErrorResponse, ClarificationResponse]
    ) -> JSONResponse:
        """
        Format the validated response for API output.

        Args:
        response: Validated response object.

        Returns:
        JSONResponse for API return.
        """
        return JSONResponse(content=response.model_dump())
        text