from pydantic import BaseModel
from typing import List, Optional

class SkillBase(BaseModel):
    name: str
    category: Optional[str] = None

class Skill(SkillBase):
    id: int
    class Config:
        from_attributes = True

class CandidateSkillBase(BaseModel):
    proficiency: Optional[str] = None

class CandidateSkill(CandidateSkillBase):
    id: int
    candidate_id: int
    skill_id: int
    skill: Skill
    class Config:
        from_attributes = True

class EducationBase(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class Education(EducationBase):
    id: int
    candidate_id: int
    class Config:
        from_attributes = True

class ExperienceBase(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

class Experience(ExperienceBase):
    id: int
    candidate_id: int
    class Config:
        from_attributes = True

class CandidateBase(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    summary: Optional[str] = None
    total_experience_months: Optional[int] = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CandidateCreate(CandidateBase):
    pass

class Candidate(CandidateBase):
    id: int
    educations: List[Education] = []
    experiences: List[Experience] = []
    skills: List[CandidateSkill] = []
    class Config:
        from_attributes = True
