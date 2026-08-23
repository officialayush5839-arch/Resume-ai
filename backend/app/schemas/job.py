from pydantic import BaseModel
from typing import Optional

class JobBase(BaseModel):
    title: str
    company: str
    description: Optional[str] = None
    required_skills: Optional[str] = None
    preferred_skills: Optional[str] = None
    minimum_experience_years: Optional[int] = 0
    education_requirement: Optional[str] = None
    location: Optional[str] = None
    created_at: Optional[str] = None

class JobCreate(JobBase):
    pass

class Job(JobBase):
    id: int
    class Config:
        from_attributes = True

class CandidateMatchBase(BaseModel):
    candidate_id: int
    job_id: int
    match_score: float

class CandidateMatchCreate(CandidateMatchBase):
    pass

class CandidateMatch(CandidateMatchBase):
    id: int
    class Config:
        from_attributes = True
