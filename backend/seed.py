import os
import sqlite3
from datetime import datetime

# Sample data for jobs
JOBS = [
    {
        "title": "Software Engineer (Python/React)",
        "company": "TechNova Solutions",
        "description": "We are looking for a full stack engineer with strong Python and React skills to build our next generation SaaS platform.",
        "required_skills": "Python, React, TypeScript, SQL",
        "preferred_skills": "FastAPI, Docker, AWS",
        "minimum_experience": 3,
        "education_requirement": "B.S. in Computer Science or related",
        "location": "Remote",
        "employment_type": "Full-time",
        "created_at": datetime.now().isoformat()
    },
    {
        "title": "Data / ML Engineer",
        "company": "DataSphere Analytics",
        "description": "Join our data team to build scalable ML pipelines. Must be proficient in Python, Pandas, and deep learning frameworks.",
        "required_skills": "Python, Machine Learning, Pandas, Scikit-learn",
        "preferred_skills": "PyTorch, SQL, Airflow",
        "minimum_experience": 2,
        "education_requirement": "M.S. in Data Science",
        "location": "New York, NY",
        "employment_type": "Full-time",
        "created_at": datetime.now().isoformat()
    }
]

# Sample candidates
CANDIDATES = [
    {
        "full_name": "Jane Doe",
        "email": "jane.doe@example.com",
        "phone": "+1-555-0123",
        "location": "San Francisco, CA",
        "linkedin_url": "https://linkedin.com/in/janedoe",
        "github_url": "https://github.com/janedoe",
        "portfolio_url": "",
        "summary": "Experienced full stack developer with 4 years of experience building scalable web applications.",
        "total_experience": 48,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "full_name": "John Smith",
        "email": "jsmith.ml@example.com",
        "phone": "+1-555-9876",
        "location": "New York, NY",
        "linkedin_url": "https://linkedin.com/in/jsmith-ml",
        "github_url": "https://github.com/jsmith-ml",
        "portfolio_url": "https://jsmith.dev",
        "summary": "Data enthusiast and ML engineer specializing in predictive analytics and computer vision.",
        "total_experience": 24,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
]

SKILLS = [
    (1, "Python", "Programming"),
    (1, "React", "Web"),
    (1, "TypeScript", "Web"),
    (1, "SQL", "Database"),
    (1, "FastAPI", "Web"),
    
    (2, "Python", "Programming"),
    (2, "Machine Learning", "Data/AI"),
    (2, "Pandas", "Data/AI"),
    (2, "PyTorch", "Data/AI"),
]

def seed_database():
    db_path = "resumeiq.db"
    
    if not os.path.exists(db_path):
        print(f"Database {db_path} does not exist. Please run the backend to create the tables first.")
        # But we'll try to just insert assuming tables exist, otherwise we just create basic structure
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if jobs table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='jobs'")
        if not cursor.fetchone():
            print("Tables don't exist yet. Run FastAPI backend first to create tables via SQLAlchemy.")
            return

        # Insert Jobs
        for job in JOBS:
            cursor.execute('''
                INSERT INTO jobs (title, company, description, required_skills, preferred_skills, minimum_experience_years, education_requirement, location, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                job["title"], job["company"], job["description"], job["required_skills"], job["preferred_skills"], 
                job["minimum_experience"], job["education_requirement"], job["location"], job["created_at"]
            ))
            
        print(f"Inserted {len(JOBS)} jobs.")
        
        # Insert Candidates
        for c in CANDIDATES:
            cursor.execute('''
                INSERT INTO candidates (full_name, email, phone, location, linkedin_url, github_url, portfolio_url, summary, total_experience_months, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                c["full_name"], c["email"], c["phone"], c["location"], c["linkedin_url"], c["github_url"], 
                c["portfolio_url"], c["summary"], c["total_experience"], c["created_at"], c["updated_at"]
            ))
            
        print(f"Inserted {len(CANDIDATES)} candidates.")
        
        # Insert Candidate Skills
        for c_id, s_name, s_category in SKILLS:
            # First insert skill if not exists
            cursor.execute('SELECT id FROM skills WHERE name=?', (s_name,))
            skill = cursor.fetchone()
            if not skill:
                cursor.execute('INSERT INTO skills (name, category) VALUES (?, ?)', (s_name, s_category))
                skill_id = cursor.lastrowid
            else:
                skill_id = skill[0]
                
            cursor.execute('INSERT INTO candidate_skills (candidate_id, skill_id, proficiency) VALUES (?, ?, ?)', (c_id, skill_id, "Intermediate"))
            
        print("Inserted candidate skills.")
        
        conn.commit()
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed_database()
