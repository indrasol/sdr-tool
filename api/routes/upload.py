# api/upload.py

"""
    Endpoint to process an uploaded file (image, PDF, DOCX, etc.).
    It extracts text from the file and then performs security analysis
    by calling the /analyze endpoint internally.
"""
    
import json
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
from fastapi.responses import FileResponse, JSONResponse
import datetime

from core.file_processor import extract_text_from_document
from api.routes.analyze import analyze
from models.analysis_models import AnalysisInput  # Import Pydantic model
from config.settings import UPLOADS_DIR, OUTPUT_DIR
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from pathlib import Path

#pdf
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

router = APIRouter()

UPLOAD_FOLDER = UPLOADS_DIR
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

JSON_OUTPUT_FOLDER = OUTPUT_DIR
os.makedirs(JSON_OUTPUT_FOLDER, exist_ok=True)

PDF_OUTPUT_FOLDER = OUTPUT_DIR
os.makedirs(PDF_OUTPUT_FOLDER, exist_ok=True)

# Jinja2 template setup to render HTML for business users
templates = Jinja2Templates(directory="templates")


@router.post("/upload", summary="Upload file for security analysis")
async def upload_file(request: Request, file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    
    # Step 1: Attempt to save the file to disk
    try:
        # Ensure the folder exists
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        # Save the uploaded file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
    except Exception as e:
        # Handle errors related to saving the file
        raise HTTPException(status_code=500, detail="Failed to save file") from e
    

    # Step 2: Extract text from the file based on its content type
    try:
        text_extracted = extract_text_from_document(file_path)
    except Exception as e:
        # Handle errors related to text extraction
        raise HTTPException(status_code=400, detail="Failed to extract text from the file") from e

    if not text_extracted.strip():
        # If no content is extracted, raise a 400 error
        raise HTTPException(
            status_code=400,
            detail="No content could be extracted from the file. Ensure that the document is clear."
        )


    # Step 3: Call the analysis logic (internal call to analyze endpoint logic)
    try:
        # Ensure the input text is valid before passing to analysis
        analysis_input = AnalysisInput(text=text_extracted)
        analysis_response = await analyze(analysis_input)

        # Debugging the analysis_response content
        print("--------------")
        print("Analysis Response: ", analysis_response)
        print("--------------")

        # Ensure analysis_response is JSON-serializable and parse it
        if isinstance(analysis_response, JSONResponse):
            # Extract JSON content from the JSONResponse object
            analysis_content = json.loads(analysis_response.body.decode("utf-8"))
            print("JSON Response: ", analysis_content)
        else:
            # If the response is not JSONResponse, check if it's already a string or JSON object
            if isinstance(analysis_response, str):
                print("String response: ", analysis_response)
                analysis_content = json.loads(analysis_response)
            else:
                analysis_content = analysis_response

    except Exception as e:
        # Handle errors related to the analysis process
        raise HTTPException(status_code=500, detail="Error during security analysis") from e
    
    # Step 4: Structure the analysis response and return it as JSON
    try:
        # Ensure that we access 'analysis' correctly
        analysis_data = analysis_content.get('analysis', {})

        # Check and set summary
        print("------------------")
        summary = analysis_data.get('summary', 'No summary provided')
        assessments = analysis_data.get('assessments', [])
        
        # Prepare the final structured response
        output = {
            "summary": summary,
            "assessments": []
        }
        print("------------------")
        print("Output: ", output)

        for assessment in assessments:
            assessment_data = {
                "assessment_name": assessment.get('name', 'Unknown'),
                "gaps": []
            }
            for gap in assessment.get('gaps', []):
                gap_data = {
                    "gap": gap.get('gap', 'N/A'),
                    "risk_level": gap.get('risk_level', 'N/A'),
                    "recommendations": gap.get('recommendations', [])
                }
                assessment_data['gaps'].append(gap_data)

            output['assessments'].append(assessment_data)

        # Return the structured JSON response
        return JSONResponse(content=output)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse and return analysis content: {str(e)}")
