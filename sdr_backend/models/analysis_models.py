# models/analysis.py
from pydantic import BaseModel
from typing import List

class AnalysisInput(BaseModel):
    text: str

class GapAssessment(BaseModel):
    gap: str
    risk_level: str
    recommendations: List[str]
    sources: List[str]

class Assessment(BaseModel):
    name: str
    gaps: List[GapAssessment]

class SecurityAnalysisResponse(BaseModel):
    summary: str
    assessments: List[Assessment]

