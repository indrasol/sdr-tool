# api/routes/analyze.py

"""
    Endpoint to analyze security architecture text.
"""


# routes/analyze.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from core.analysis import analyze_architecture
from models.analysis_input import AnalysisInput  # Import Pydantic model
import re

router = APIRouter()

def clean_input_text(text: str) -> str:
    cleaned_text = re.sub(r"[^\x00-\x7F]+", " ", text)  # Remove non-ASCII characters
    cleaned_text = re.sub(r"\s+", " ", cleaned_text)      # Replace multiple spaces with one
    return cleaned_text.strip()

    # Log the cleaned text for debugging
    print(f"Cleaned text: {cleaned_text}")

    return cleaned_text

@router.post("/analyze", summary="Analyze security architecture text")
async def analyze(input: AnalysisInput):
    
    try:
        # Log the input text for debugging purposes
        print(f"Received input for analysis: {input.text}")

        cleaned_text = clean_input_text(input.text)
        print(f"Cleaned text: {cleaned_text}")
        
        analysis = analyze_architecture(input.text)
    except Exception as e:
        # Log the error for further debugging
        print(f"Error during analysis: {str(e)}")

        # Raise an HTTPException with the error message
        raise HTTPException(status_code=500, detail=f"Error during security analysis: {str(e)}") from e

    # Convert Pydantic model to dictionary using `model_dump()`
    return JSONResponse(content={"analysis": analysis.model_dump()})
