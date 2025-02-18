from pydantic import BaseModel
from typing import List
from models.gap_assessment import GapAssessment


class Assessment(BaseModel):
    name: str
    gaps: List[GapAssessment]