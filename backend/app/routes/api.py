from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models.candidate import Candidate, Skill, Experience, Education
from app.models.resume import Resume
from app.models.job import Job, CandidateMatch
from app.schemas.candidate import Candidate as CandidateSchema
from app.schemas.job import Job as JobSchema, JobCreate
from app.schemas.resume import Resume as ResumeSchema
from app.services.resume_service import process_resume_upload
from app.services.matching_engine import calculate_overall_match

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok"}

# Candidates
@router.get("/candidates", response_model=List[CandidateSchema])
def get_candidates(db: Session = Depends(get_db)):
    return db.query(Candidate).all()

@router.get("/candidates/{candidate_id}", response_model=CandidateSchema)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate

@router.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.delete(candidate)
    db.commit()
    return {"status": "success"}

# Resumes
@router.post("/resumes/upload")
def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    candidate_id = process_resume_upload(file, db)
    return {"candidate_id": candidate_id}

@router.get("/resumes/{resume_id}", response_model=ResumeSchema)
def get_resume(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume

# Jobs
@router.get("/jobs", response_model=List[JobSchema])
def get_jobs(db: Session = Depends(get_db)):
    return db.query(Job).all()

@router.post("/jobs", response_model=JobSchema)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    db_job = Job(**job.dict())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("/jobs/{job_id}", response_model=JobSchema)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"status": "success"}

# Matching
@router.get("/jobs/{job_id}/candidates")
def get_job_candidates(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    candidates = db.query(Candidate).all()
    results = []
    
    for candidate in candidates:
        candidate_data = {
            "skills": [s.name for s in candidate.skills] if hasattr(candidate, 'skills') else [],
            "total_experience_months": candidate.total_experience_months if hasattr(candidate, 'total_experience_months') else 0,
            "education": [{"degree": e.degree} for e in candidate.education] if hasattr(candidate, 'education') else [],
            "summary": candidate.summary if hasattr(candidate, 'summary') else ""
        }
        
        job_data = {
            "required_skills": [s.strip() for s in job.required_skills.split(",")] if job.required_skills else [],
            "preferred_skills": [s.strip() for s in job.preferred_skills.split(",")] if job.preferred_skills else [],
            "minimum_experience_years": job.minimum_experience_years if hasattr(job, 'minimum_experience_years') else 0,
            "education_requirement": job.education_requirement if hasattr(job, 'education_requirement') else ""
        }
        
        match_result = calculate_overall_match(candidate_data, job_data)
        score = match_result["overall_score"]
        
        match = db.query(CandidateMatch).filter(
            CandidateMatch.candidate_id == candidate.id,
            CandidateMatch.job_id == job.id
        ).first()
        
        if not match:
            match = CandidateMatch(candidate_id=candidate.id, job_id=job.id, match_score=score)
            db.add(match)
        else:
            match.match_score = score
            
        results.append({
            "candidate": candidate,
            "match_score": score
        })
        
    db.commit()
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results

# Dashboard
@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_candidates = db.query(func.count(Candidate.id)).scalar()
    total_jobs = db.query(func.count(Job.id)).scalar()
    avg_score = db.query(func.avg(CandidateMatch.match_score)).scalar() or 0.0
    
    return {
        "total_candidates": total_candidates,
        "total_jobs": total_jobs,
        "average_match_score": round(avg_score, 2)
    }
