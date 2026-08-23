import re

SECTION_KEYWORDS = {
    "summary": ["summary", "profile", "objective", "about me"],
    "experience": ["experience", "employment", "work history", "professional experience", "work experience"],
    "education": ["education", "academic background", "qualifications"],
    "skills": ["skills", "technologies", "core competencies", "technical skills"]
}

def detect_sections(text: str) -> dict:
    sections = {key: "" for key in SECTION_KEYWORDS.keys()}
    lines = text.split('\n')
    
    current_section = None
    
    for line in lines:
        cleaned_line = line.strip().lower()
        
        # Check if line is a section header
        is_header = False
        for section, keywords in SECTION_KEYWORDS.items():
            if any(cleaned_line.startswith(kw) or cleaned_line == kw for kw in keywords) and len(cleaned_line) < 30:
                current_section = section
                is_header = True
                break
                
        if not is_header and current_section:
            sections[current_section] += line + "\n"
            
    # Clean up sections
    for k in sections:
        sections[k] = sections[k].strip()
        
    return sections
