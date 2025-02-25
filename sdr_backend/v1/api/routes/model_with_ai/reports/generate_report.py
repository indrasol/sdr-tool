from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
import shutil
import uuid
import os
from models.pydantic_models import DiagramContext, NodeContext, EdgeContext
from services.security_analysis import analyze_security_gaps
from core.llm_gateway import LLMGateway
import json
from config.settings import REPORTS_DIR
from core.report_manager import ReportManager
from models.pydantic_models import SecurityAnalysisResponse
from utils.logger import log_info



router = APIRouter()

# Directory to store reports
os.makedirs(REPORTS_DIR, exist_ok=True)

@router.post("/generate_report")
async def generate_report(
    image: UploadFile = File(...),
    context: str = Form(...)
):
    try:
        # Create necessary directories if they don't exist
        reports_dir = os.path.join(REPORTS_DIR)
        images_dir = os.path.join(REPORTS_DIR, "images")
        backups_dir = os.path.join(REPORTS_DIR, "backups")
        os.makedirs(reports_dir, exist_ok=True)
        os.makedirs(images_dir, exist_ok=True)
        os.makedirs(backups_dir, exist_ok=True)
        
        

        # Create DiagramContext instance
        try:
            # Parse the context string to dict first
            context_data = json.loads(context)
            # Convert the nodes array positions to tuples
            for node in context_data.get('nodes', []):
                if 'position' in node and isinstance(node['position'], list):
                    node['position'] = tuple(node['position'])
            
            # Create the DiagramContext instance
            diagram_context = DiagramContext(
                nodes=[NodeContext(**node) for node in context_data.get('nodes', [])],
                edges=[EdgeContext(**edge) for edge in context_data.get('edges', [])],
                version=context_data.get('version', 1)
            )
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid diagram context: {str(e)}")
        # diagram__dict = {
        #     "nodes": diagram_context.nodes,
        #     "edges": diagram_context.edges
        # }
        # Save image
        image_id = uuid.uuid4().hex
        image_path = os.path.join(images_dir, f"{image_id}.png")

        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Perform security analysis
        llm_gateway = LLMGateway()

        # Get LLM response
        llm_response = await llm_gateway.generate_response(diagram_context, model="claude", query_type="security_analysis")
        

        # Create SecurityAnalysisResponse with processed data
        analysis_results = SecurityAnalysisResponse(
            identified_gaps=llm_response.get('identified_gaps', []),
            recommendations=llm_response.get('recommendations', [])
        )
        # analysis_results = SecurityAnalysisResponse(** await llm_gateway.generate_response(diagram_context, model="claude", query_type="security_analysis"))
        
        log_info(f"Analysis results: {analysis_results}")

        # Generate report
        report_manager = ReportManager()
        report_id = await report_manager.create_report(analysis_results, f"images/{image_id}.png")
        
        return {
            "report_id": report_id,
            "report_url": f"http://localhost:8000/reports/{report_id}.md",
            "image_url": f"http://localhost:8000/reports/images/{image_id}.png"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))