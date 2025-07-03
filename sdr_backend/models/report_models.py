from pydantic import BaseModel, Field
from typing import Dict, Optional, Any, List
from datetime import datetime

# schemas/report.py
class ReportSection(BaseModel):
    title: str
    content: str          # Markdown – the FE already handles that nicely

class GenerateReportRequest(BaseModel):
    session_id: str | None = None         # to reuse cached threat model
    diagram_state: dict   | None = None   # front-end may send latest

class GenerateReportResponse(BaseModel):
    report_id: str
    project_code: str
    generated_at: datetime
    sections: list[ReportSection]
    diagram_url: str | None               # presigned URL to Supabase Storage
    severity_counts: dict[str, int]       # for charts on FE
