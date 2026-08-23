from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    company = Column(String)
    description = Column(Text)
    required_skills = Column(Text)
    preferred_skills = Column(Text)
    minimum_experience_years = Column(Integer)
    education_requirement = Column(String)
    location = Column(String)
    created_at = Column(String)
    
    matches = relationship("CandidateMatch", back_populates="job")

class CandidateMatch(Base):
    __tablename__ = "candidate_matches"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    match_score = Column(Float)
    
    candidate = relationship("Candidate", back_populates="matches")
    job = relationship("Job", back_populates="matches")
