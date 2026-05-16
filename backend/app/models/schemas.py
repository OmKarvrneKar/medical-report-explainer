from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Parameter(BaseModel):
    name: str
    value: str
    normal_range: str
    risk_level: str
    explanation: str
    flag: Optional[str] = None

class ReportResponse(BaseModel):
    id: Optional[str] = None
    summary: str
    overall_status: str
    parameters: List[Parameter]
    what_to_do: str
    disclaimer: str
    language: Optional[str] = None
    created_at: Optional[datetime] = None