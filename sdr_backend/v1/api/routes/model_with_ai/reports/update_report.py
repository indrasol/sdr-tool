
# from fastapi import APIRouter, File, UploadFile, Form, HTTPException
# from fastapi.responses import FileResponse
# from config.settings import REPORTS_DIR
# import os
# from models.pydantic_models import ReportUpdate
# from core.report_manager import ReportManager
# from fastapi import Path
# from datetime import datetime
# from fastapi.responses import JSONResponse
# from fastapi import status


# router = APIRouter()

# @router.put("/reports/{report_id}")
# async def update_report(
#     report_id: str = Path(..., description="The ID of the report to update"),
#     update: ReportUpdate = None
# ):
#     """
#     Update an existing security report.
    
#     Args:
#         report_id: Unique identifier of the report
#         update: ReportUpdate object containing new content and metadata
    
#     Returns:
#         JSON response with update status and metadata
#     """
#     report_manager = ReportManager()
#     try:
#         # Verify report exists
#         report_path = os.path.join(REPORTS_DIR, f"{report_id}.md")
#         if not os.path.exists(report_path):
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail=f"Report with ID {report_id} not found"
#             )

#         # Load and update metadata
#         metadata = await report_manager.load_report_metadata(report_id)
#         metadata.last_modified = datetime.now()
#         metadata.version += 1
#         metadata.editor = update.editor
#         metadata.edit_comment = update.edit_comment

#         # Create backup of previous version
#         backup_path = os.path.join(
#             REPORTS_DIR, 
#             "backups", 
#             f"{report_id}_v{metadata.version-1}.md"
#         )
#         # Create backup directory if it doesn't exist
#         os.makedirs(os.path.dirname(backup_path), exist_ok=True)
#         with open(report_path, "r") as src, open(backup_path, "w") as dst:
#             dst.write(src.read())

#         # Update report content
#         with open(report_path, "w") as f:
#             f.write(update.content)

#         # Save updated metadata
#         await report_manager.save_report_metadata(report_id, metadata)

#         return JSONResponse(
#             status_code=status.HTTP_200_OK,
#             content={
#                 "status": "success",
#                 "message": "Report updated successfully",
#                 "metadata": {
#                     "last_modified": metadata.last_modified.isoformat(),
#                     "version": metadata.version,
#                     "editor": metadata.editor,
#                     "edit_comment": metadata.edit_comment
#                 }
#             }
#         )

#     except HTTPException as he:
#         raise he
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Error updating report: {str(e)}"
#         )
