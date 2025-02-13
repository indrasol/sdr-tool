from pydantic import BaseModel
from typing import List

class GapAssessment(BaseModel):
    gap: str
    risk_level: str
    recommendations: List[str]
    sources: List[str]