
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
from config.settings import REPORTS_DIR
from fastapi import Path
from typing import Optional
from fastapi import status
from core.report_manager import ReportManager
router = APIRouter()

@router.get("/reports/{report_id}")
async def get_report(
    report_id: str = Path(..., description="The ID of the report to retrieve"),
    version: Optional[int] = None
):
    """
    Retrieve a security report.
    
    Args:
        report_id: Unique identifier of the report
        version: Optional specific version to retrieve
    
    Returns:
        FileResponse with the report content
    """
    report_manager = ReportManager()
    try:
        if version:
            # Get specific version from backups
            report_path = os.path.join(
                REPORTS_DIR, 
                "backups", 
                f"{report_id}_v{version}.md"
            )
        else:
            # Get latest version
            report_path = os.path.join(REPORTS_DIR, f"{report_id}.md")

        if not os.path.exists(report_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report {report_id} {'version ' + str(version) if version else ''} not found"
            )

        # Load metadata
        metadata = await report_manager.load_report_metadata(report_id)
        
        return FileResponse(
            report_path,
            media_type="text/markdown",
            headers={
                "X-Report-Version": str(metadata.version),
                "X-Last-Modified": metadata.last_modified.isoformat(),
                "X-Last-Editor": metadata.editor or "Unknown"
            }
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving report: {str(e)}"
        )
