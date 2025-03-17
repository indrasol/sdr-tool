# from fastapi import APIRouter, Depends, HTTPException
# from fastapi.responses import JSONResponse
# from datetime import datetime, timezone
# from services.auth_handler import verify_token
# from core.cache.session_manager import SessionManager    
# from sdr_backend.services.supabase_manager import SupabaseManager
# from utils.logger import log_info

# # Initialize router
# router = APIRouter()

# # Services will be injected via dependency injection
# async def get_session_manager():
#     session_manager = SessionManager()
#     await session_manager.connect()
#     return session_manager

# async def get_supabase_manager():
#     return SupabaseManager()

# @router.post("/save_project/{session_id}")
# async def save_project(
#     session_id: str,
#     current_user: dict = Depends(verify_token),
#     session_manager: SessionManager = Depends(get_session_manager),
#     supabase_manager: SupabaseManager = Depends(get_supabase_manager)
# ):
#     """
#     Save session data to the database when the user clicks the 'Save' button in the UI.

#     Args:
#         session_id: The session ID to save
#         current_user: Authenticated user (via dependency)
#         session_manager: SessionManager instance (injected)
#         supabase_manager: SupabaseManager instance (injected)

#     Returns:
#         JSONResponse: Confirmation of save or error details
#     """
#     try:
#         # Get user ID from the authenticated user
#         user_id = current_user
#         if not user_id:
#             log_info(f"Invalid user authentication data")
#             return JSONResponse(
#                 status_code=400,
#                 content={"detail": "Invalid user authentication data"}
#             )

#         # Retrieve session data - this is already async in the SessionManager
#         try:
#             session_data = await session_manager.get_session(
#                 session_id, 
#                 expected_user_id=user_id  # Verify user ID right in the get_session call
#             )
#         except HTTPException as e:
#             log_info(f"Session error: {e.detail}")
#             return JSONResponse(
#                 status_code=e.status_code,
#                 content={"detail": e.detail}
#             )

#         # Get project ID from session
#         project_id = session_data.get("project_id")
#         log_info(f"Project id in save project : {project_id}")
#         if not project_id:
#             log_info(f"Project ID missing in session {session_id}")
#             return JSONResponse(
#                 status_code=400,
#                 content={"detail": "Project ID missing in session data"}
#             )

#         # Extend session TTL to keep it alive
#         await session_manager.extend_session_ttl(session_id)

#         # Prepare data to save
#         # save_timestamp = datetime.now(timezone.utc).isoformat()
        
#         # Extract the conversation history and diagram state
#         conversation_history = session_data.get("conversation_history", [])
#         diagram_state = session_data.get("diagram_state", {"nodes": [], "edges": []})
        
#         # Add thinking history if needed (optional)
#         thinking_history = session_data.get("thinking_history", [])
        
#         # Save to database
#         await supabase_manager.update_project_data(
#             user_id=user_id,
#             project_code=project_id,
#             conversation_history=conversation_history,
#             diagram_state=diagram_state
#         )

#         log_info(f"Project {project_id} saved successfully for user {user_id}")
#         return JSONResponse(
#             status_code=200,
#             content={
#                 "message": "Project saved successfully", 
#                 "session_id": session_id,
#                 "project_id": project_id
#             }
#         )

#     except HTTPException as e:
#         log_info(f"HTTPException in save_project: {e.detail}")
#         return JSONResponse(
#             status_code=e.status_code,
#             content={"detail": e.detail}
#         )
#     except ValueError as e:
#         # Handle specific database errors
#         log_info(f"ValueError in save_project: {str(e)}")
#         return JSONResponse(
#             status_code=400,
#             content={"detail": str(e)}
#         )
#     except Exception as e:
#         # Handle unexpected errors
#         log_info(f"Unexpected error saving project: {str(e)}")
#         return JSONResponse(
#             status_code=500,
#             content={"detail": f"Failed to save project: {str(e)}"}
#         )