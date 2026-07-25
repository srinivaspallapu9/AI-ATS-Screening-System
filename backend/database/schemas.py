from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class JobCreate(BaseModel):
    title: str
    department: Optional[str] = "Engineering"
    required_skills: str
    min_experience: Optional[int] = 1
    description: str
    min_match_score: Optional[float] = 65.0
    max_ai_content_score: Optional[float] = 70.0

class JobResponse(JobCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CandidateApply(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    job_id: Optional[int] = None

class CandidateStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None

class EmailRequest(BaseModel):
    candidate_id: int
    email_type: str # INTERVIEW, SHORTLIST, REJECT, ACKNOWLEDGMENT
    custom_message: Optional[str] = None

class CandidateResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    job_id: Optional[int] = None
    job_title: Optional[str] = None
    resume_filename: str
    parsed_text: Optional[str] = None
    extracted_skills: Optional[str] = None
    summary: Optional[str] = None
    ats_match_score: float
    ai_content_probability: float
    is_ai_flagged: bool
    decision_status: str
    decision_reason: Optional[str] = None
    match_breakdown_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RAGSearchQuery(BaseModel):
    query: str
    top_k: Optional[int] = 5
