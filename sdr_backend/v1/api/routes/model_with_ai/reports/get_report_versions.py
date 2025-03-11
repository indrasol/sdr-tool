
# from fastapi import APIRouter, HTTPException
# from fastapi.responses import FileResponse
# import os
# from config.settings import REPORTS_DIR
# from fastapi import Path
# from typing import Optional
# from fastapi import status
# from core.report_manager import ReportManager



# router = APIRouter()


# @router.get("/reports/{report_id}/versions")
# async def get_report_versions(
#     report_id: str = Path(..., description="The ID of the report to get versions for")
# ):
#     """
#     Get all available versions of a report.
#     """
#     report_manager = ReportManager()
#     try:
#         metadata = await report_manager.load_report_metadata(report_id)
#         backups_dir = os.path.join(REPORTS_DIR, "backups")
#         versions = []
        
#         # Add all backup versions
#         if os.path.exists(backups_dir):
#             for file in os.listdir(backups_dir):
#                 if file.startswith(f"{report_id}_v") and file.endswith(".md"):
#                     version = int(file.split("_v")[1].replace(".md", ""))
#                     versions.append(version)
        
#         # Add current version
#         versions.append(metadata.version)
#         versions.sort()
        
#         return {
#             "report_id": report_id,
#             "current_version": metadata.version,
#             "available_versions": versions
#         }
        
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Error retrieving report versions: {str(e)}"
#         )
