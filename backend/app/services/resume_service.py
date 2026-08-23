import os
import re
import shutil
import spacy
from datetime import datetime
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.candidate import Candidate, Skill, Experience, Education, CandidateSkill
from app.models.resume import Resume
from app.parsers.file_parser import parse_file
from app.parsers.text_cleaner import clean_text
from app.parsers.section_detector import detect_sections
from app.parsers.extractor import (
    extract_skills_from_text,
    extract_experience_entries,
    extract_education_entries,
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load spaCy model for NER (name extraction)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = None


def extract_email(text: str) -> str:
    match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    return match.group(0) if match else None

def extract_phone(text: str) -> str:
    # Support international formats like +91-XXXX, (XXX) XXX-XXXX, etc.
    patterns = [
        r'\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}',
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0).strip()
    return None

def extract_linkedin(text: str) -> str:
    match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[a-zA-Z0-9_-]+', text)
    return match.group(0) if match else None

def extract_github(text: str) -> str:
    match = re.search(r'(?:https?://)?(?:www\.)?github\.com/[a-zA-Z0-9_-]+', text)
    return match.group(0) if match else None

def extract_name(text: str) -> str:
    """Extract name prioritizing the first line, with spaCy NER as fallback."""
    # Names are typically at the very top of a resume
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    bad_words = {"hackathon", "resume", "cv", "curriculum", "aws", "university", "college", "email", "phone", "profile", "summary", "experience"}
    
    # Priority: First 1-3 lines that look like a human name
    for line in lines[:3]:
        words = line.split()
        # 2 to 4 words, alphabetic (allowing hyphens)
        if 2 <= len(words) <= 4 and all(w.replace("-", "").isalpha() for w in words):
            if not any(bad in line.lower() for bad in bad_words):
                return line
                
    # Fallback: spaCy NER on the header
    if nlp is not None:
        header_text = text[:500]
        doc = nlp(header_text)
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                if not any(bad in ent.text.lower() for bad in bad_words):
                    return ent.text
                    
    return None

def extract_location(text: str) -> str:
    """Try to extract location from the header area."""
    header = text[:600]
    # Common patterns: "City, State" or "City, Country"
    match = re.search(r'([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z][A-Za-z\s]+)', header)
    if match:
        return match.group(0).strip()
    return None

def extract_summary(sections: dict, text: str) -> str:
    """Get summary from detected sections, or generate from first paragraph."""
    if sections.get("summary"):
        return sections["summary"][:500]
    # Fallback: grab the first substantial paragraph
    paragraphs = text.split('\n\n')
    for p in paragraphs[1:4]:  # Skip the name/header
        p = p.strip()
        if len(p) > 80:
            return p[:500]
    return ""

def estimate_experience_months(experiences: list) -> int:
    """Estimate total experience in months from extracted experience entries."""
    total = 0
    for exp in experiences:
        start = exp.get("start_date", "")
        end = exp.get("end_date", "")
        if not start:
            continue
        try:
            # Parse year from start
            start_year = int(re.search(r'\d{4}', start).group())
            if end.lower() in ['present', 'current', 'now', '']:
                end_year = datetime.now().year
            else:
                end_year = int(re.search(r'\d{4}', end).group())
            total += max(0, (end_year - start_year)) * 12
        except (AttributeError, ValueError):
            continue
    return total


def process_resume_upload(file: UploadFile, db: Session) -> int:
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    # 1. Extract raw text from file
    raw_text = parse_file(file_location)
    parsed_text = clean_text(raw_text)
    
    # 2. Detect resume sections
    sections = detect_sections(parsed_text)
    
    # 3. Extract contact info
    name = extract_name(parsed_text)
    email = extract_email(parsed_text)
    phone = extract_phone(parsed_text)
    linkedin = extract_linkedin(parsed_text)
    github = extract_github(parsed_text)
    location = extract_location(parsed_text)
    summary = extract_summary(sections, parsed_text)
    
    # 4. Extract real skills from the entire resume text
    extracted_skills = extract_skills_from_text(parsed_text)
    
    # 5. Extract experience entries
    experience_entries = extract_experience_entries(parsed_text)
    total_months = estimate_experience_months(experience_entries)
    
    # 6. Extract education entries
    education_entries = extract_education_entries(parsed_text)
    
    now = datetime.now().isoformat()
    
    # Check if candidate with this email already exists
    if email:
        existing_candidate = db.query(Candidate).filter(Candidate.email == email).first()
        if existing_candidate:
            db.delete(existing_candidate)
            db.commit()
    
    # 7. Create Candidate with REAL extracted data
    candidate = Candidate(
        full_name=name or "Unknown Candidate",
        email=email,
        phone=phone,
        location=location,
        linkedin_url=linkedin,
        github_url=github,
        summary=summary,
        total_experience_months=total_months,
        created_at=now,
        updated_at=now,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    
    # 8. Save REAL extracted skills
    for skill_data in extracted_skills:
        skill = db.query(Skill).filter(Skill.name == skill_data["name"]).first()
        if not skill:
            skill = Skill(name=skill_data["name"], category=skill_data["category"])
            db.add(skill)
            db.commit()
            db.refresh(skill)
        db.add(CandidateSkill(
            candidate_id=candidate.id,
            skill_id=skill.id,
            proficiency="Extracted"
        ))
    
    # 9. Save REAL extracted experiences
    for exp in experience_entries:
        db.add(Experience(
            candidate_id=candidate.id,
            job_title=exp.get("job_title", ""),
            company=exp.get("company", ""),
            start_date=exp.get("start_date", ""),
            end_date=exp.get("end_date", ""),
            description=exp.get("description", "").strip(),
        ))
    
    # 10. Save REAL extracted education
    for edu in education_entries:
        db.add(Education(
            candidate_id=candidate.id,
            degree=edu.get("degree", ""),
            institution=edu.get("institution", ""),
            start_date=edu.get("start_date", ""),
            end_date=edu.get("end_date", ""),
        ))
    
    # 11. Save resume record
    resume = Resume(
        candidate_id=candidate.id,
        file_path=file_location,
        parsed_text=parsed_text
    )
    db.add(resume)
    db.commit()
    
    return candidate.id
