from pydantic import BaseModel
from typing import List
from models.assessment import Assessment

class SecurityAnalysisResponse(BaseModel):
    summary: str
    assessments: List[Assessment]