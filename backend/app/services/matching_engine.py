import re

def normalize_skill(skill: str) -> str:
    """Normalize skill names for better matching."""
    skill = skill.lower().strip()
    # Handle common variations
    mapping = {
        'js': 'javascript',
        'node': 'node.js',
        'reactjs': 'react',
        'postgres': 'postgresql',
        'ml': 'machine learning',
        'deep-learning': 'deep learning',
        'ai': 'artificial intelligence',
        'ts': 'typescript',
        'vuejs': 'vue',
    }
    return mapping.get(skill, skill)

def calculate_skill_score(candidate_skills: list[str], required_skills: list[str], preferred_skills: list[str]) -> dict:
    if not required_skills and not preferred_skills:
        return {"score": 100, "matching": [], "missing": []}

    normalized_candidate = {normalize_skill(s) for s in candidate_skills}
    normalized_required = {normalize_skill(s) for s in required_skills}
    normalized_preferred = {normalize_skill(s) for s in preferred_skills}

    matching_required = normalized_required.intersection(normalized_candidate)
    missing_required = normalized_required.difference(normalized_candidate)

    matching_preferred = normalized_preferred.intersection(normalized_candidate)
    
    # Required skills are heavily weighted
    required_score = (len(matching_required) / len(normalized_required) * 100) if normalized_required else 100
    preferred_score = (len(matching_preferred) / len(normalized_preferred) * 100) if normalized_preferred else 0

    # Combine scores (70% required, 30% preferred if both exist)
    if normalized_required and normalized_preferred:
        total_score = (required_score * 0.7) + (preferred_score * 0.3)
    elif normalized_required:
        total_score = required_score
    else:
        total_score = preferred_score

    return {
        "score": round(total_score, 2),
        "matching": list(matching_required.union(matching_preferred)),
        "missing": list(missing_required)
    }

def calculate_experience_score(candidate_experience_months: int, required_experience_years: int) -> float:
    if not required_experience_years:
        return 100.0
    
    required_months = required_experience_years * 12
    if candidate_experience_months >= required_months:
        return 100.0
    
    return round((candidate_experience_months / required_months) * 100, 2)

def calculate_education_score(candidate_education: list, required_education: str) -> float:
    # A simplified scoring - if job requires specific education, we check if candidate has it.
    if not required_education:
        return 100.0
        
    req_edu_lower = required_education.lower()
    for edu in candidate_education:
        degree = edu.get("degree", "").lower()
        if req_edu_lower in degree or degree in req_edu_lower:
            return 100.0
            
    # If no exact match but candidate has some education
    if candidate_education:
        return 50.0
        
    return 0.0

def generate_recommendation(score: float) -> str:
    if score >= 90:
        return "Strong Match"
    elif score >= 75:
        return "Good Match"
    elif score >= 60:
        return "Moderate Match"
    else:
        return "Weak Match"

def calculate_overall_match(candidate_data: dict, job_data: dict) -> dict:
    """
    candidate_data expected:
      - skills: list[str]
      - total_experience_months: int
      - education: list[dict]
      - summary: str
    
    job_data expected:
      - required_skills: list[str]
      - preferred_skills: list[str]
      - minimum_experience_years: int
      - education_requirement: str
    """
    skill_match = calculate_skill_score(
        candidate_data.get("skills", []),
        job_data.get("required_skills", []),
        job_data.get("preferred_skills", [])
    )
    
    exp_score = calculate_experience_score(
        candidate_data.get("total_experience_months", 0),
        job_data.get("minimum_experience_years", 0)
    )
    
    edu_score = calculate_education_score(
        candidate_data.get("education", []),
        job_data.get("education_requirement", "")
    )
    
    # Keyword score (simple presence in summary)
    summary_lower = candidate_data.get("summary", "").lower()
    keyword_score = 0
    all_job_skills = job_data.get("required_skills", []) + job_data.get("preferred_skills", [])
    if all_job_skills:
        found_keywords = [s for s in all_job_skills if s.lower() in summary_lower]
        keyword_score = (len(found_keywords) / len(all_job_skills)) * 100
    else:
        keyword_score = 100.0

    # Weights: Skill: 40%, Experience: 25%, Keywords: 15%, Education: 10%, Projects: 10%
    overall_score = (
        (skill_match["score"] * 0.45) + 
        (exp_score * 0.25) +
        (keyword_score * 0.20) +
        (edu_score * 0.10)
    )
    
    recommendation = generate_recommendation(overall_score)
    
    strengths = []
    weaknesses = []
    
    if skill_match["score"] >= 80:
        strengths.append("Strong technical skill match.")
    elif skill_match["score"] < 50:
        weaknesses.append("Missing key required skills.")
        
    if exp_score >= 100:
        strengths.append("Meets or exceeds experience requirements.")
    elif exp_score < 70:
        weaknesses.append("Slightly under-experienced for the role.")

    return {
        "overall_score": round(overall_score, 2),
        "skill_score": skill_match["score"],
        "experience_score": exp_score,
        "education_score": edu_score,
        "keyword_score": round(keyword_score, 2),
        "matching_skills": skill_match["matching"],
        "missing_skills": skill_match["missing"],
        "recommendation": recommendation,
        "strengths": strengths,
        "weaknesses": weaknesses
    }
