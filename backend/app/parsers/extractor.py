import re

# Comprehensive skill dictionary organized by category
SKILL_DATABASE = {
    "Programming Languages": [
        "python", "java", "javascript", "typescript", "c++", "c#", "c", "ruby", "go", "golang",
        "rust", "swift", "kotlin", "scala", "php", "perl", "r", "matlab", "dart", "lua",
        "objective-c", "groovy", "haskell", "elixir", "clojure", "fortran", "cobol",
        "assembly", "shell", "bash", "powershell", "vba", "julia"
    ],
    "Web Frontend": [
        "react", "reactjs", "react.js", "angular", "angularjs", "vue", "vuejs", "vue.js",
        "svelte", "next.js", "nextjs", "nuxt.js", "nuxtjs", "gatsby", "html", "html5",
        "css", "css3", "sass", "scss", "less", "tailwind", "tailwindcss", "bootstrap",
        "material-ui", "mui", "chakra ui", "ant design", "jquery", "webpack", "vite",
        "babel", "redux", "zustand", "mobx", "graphql", "apollo", "pwa"
    ],
    "Web Backend": [
        "node.js", "nodejs", "express", "express.js", "fastapi", "flask", "django",
        "spring", "spring boot", "springboot", ".net", "asp.net", "rails", "ruby on rails",
        "laravel", "symphony", "gin", "fiber", "actix", "rocket", "nestjs", "nest.js",
        "koa", "hapi", "restful", "rest api", "microservices", "grpc", "soap"
    ],
    "Database": [
        "sql", "mysql", "postgresql", "postgres", "sqlite", "mongodb", "redis",
        "elasticsearch", "cassandra", "dynamodb", "firebase", "firestore", "couchdb",
        "neo4j", "mariadb", "oracle", "sql server", "mssql", "supabase", "prisma",
        "sequelize", "sqlalchemy", "mongoose", "typeorm", "knex"
    ],
    "Cloud & DevOps": [
        "aws", "amazon web services", "azure", "gcp", "google cloud", "docker",
        "kubernetes", "k8s", "terraform", "ansible", "jenkins", "circleci", "github actions",
        "gitlab ci", "ci/cd", "nginx", "apache", "linux", "unix", "heroku", "vercel",
        "netlify", "digitalocean", "cloudflare", "serverless", "lambda", "ec2", "s3",
        "ecs", "eks", "fargate", "helm", "istio", "prometheus", "grafana"
    ],
    "Data & AI/ML": [
        "machine learning", "deep learning", "artificial intelligence", "ai", "ml",
        "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "pandas", "numpy",
        "scipy", "matplotlib", "seaborn", "plotly", "jupyter", "nlp",
        "natural language processing", "computer vision", "opencv", "spacy", "nltk",
        "hugging face", "transformers", "bert", "gpt", "llm", "langchain",
        "data science", "data analysis", "data engineering", "data visualization",
        "tableau", "power bi", "looker", "hadoop", "spark", "apache spark",
        "airflow", "kafka", "etl", "data pipeline", "bigquery"
    ],
    "Mobile": [
        "android", "ios", "react native", "flutter", "xamarin", "swift", "swiftui",
        "kotlin", "objective-c", "ionic", "cordova", "expo"
    ],
    "Tools & Other": [
        "git", "github", "gitlab", "bitbucket", "jira", "confluence", "slack",
        "figma", "sketch", "adobe xd", "photoshop", "illustrator",
        "agile", "scrum", "kanban", "tdd", "bdd", "unit testing", "integration testing",
        "selenium", "cypress", "jest", "mocha", "pytest", "postman", "swagger",
        "api design", "system design", "microservices architecture",
        "oauth", "jwt", "sso", "ldap", "blockchain", "web3", "solidity"
    ]
}

def extract_skills_from_text(text: str) -> list[dict]:
    """Extract real skills from resume text using keyword matching against a comprehensive skill database."""
    text_lower = text.lower()
    found_skills = []
    seen = set()
    
    for category, skills in SKILL_DATABASE.items():
        for skill in skills:
            # Use word boundary matching to avoid false positives
            # e.g., "c" shouldn't match in "candidate"
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower) and skill not in seen:
                # Capitalize properly for display
                display_name = skill.title() if len(skill) > 3 else skill.upper()
                # Fix common capitalizations
                display_name = display_name.replace("Reactjs", "React.js").replace("Vuejs", "Vue.js")
                display_name = display_name.replace("Nodejs", "Node.js").replace("Nextjs", "Next.js")
                display_name = display_name.replace("Mongodb", "MongoDB").replace("Postgresql", "PostgreSQL")
                display_name = display_name.replace("Mysql", "MySQL").replace("Graphql", "GraphQL")
                display_name = display_name.replace("Tensorflow", "TensorFlow").replace("Pytorch", "PyTorch")
                display_name = display_name.replace("Fastapi", "FastAPI").replace("Jupyter", "Jupyter")
                display_name = display_name.replace("Sqlalchemy", "SQLAlchemy").replace("Sqlite", "SQLite")
                display_name = display_name.replace("Opencv", "OpenCV").replace("Sklearn", "scikit-learn")
                
                found_skills.append({
                    "name": display_name,
                    "category": category
                })
                seen.add(skill)
    
    return found_skills


def extract_experience_entries(text: str) -> list[dict]:
    """Extract work experience entries from resume text."""
    entries = []
    lines = text.split('\n')
    
    # Common patterns for experience entries
    # Pattern: "Job Title at Company" or "Job Title | Company" or "Job Title - Company"
    title_pattern = re.compile(
        r'^(.+?)\s*(?:at|@|\||-|–|—)\s*(.+?)$', re.IGNORECASE
    )
    # Pattern for dates like "Jan 2020 - Present", "2019-2021", "06/2020 - 12/2022"
    date_pattern = re.compile(
        r'((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|'
        r'\d{1,2}/\d{4}|\d{4})\s*(?:-|–|—|to)\s*'
        r'((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|'
        r'\d{1,2}/\d{4}|\d{4}|present|current|now)',
        re.IGNORECASE
    )
    
    in_experience_section = False
    current_entry = None
    
    for line in lines:
        stripped = line.strip()
        lower = stripped.lower()
        
        # Detect experience section
        if any(kw in lower for kw in ['experience', 'employment', 'work history', 'professional experience']):
            if len(stripped) < 35:
                in_experience_section = True
                continue
        
        # Detect end of experience section
        if in_experience_section and any(kw in lower for kw in ['education', 'skills', 'certifications', 'projects', 'awards']):
            if len(stripped) < 25:
                in_experience_section = False
                if current_entry:
                    entries.append(current_entry)
                    current_entry = None
                continue
        
        if not in_experience_section:
            continue
            
        # Try to find date range
        date_match = date_pattern.search(stripped)
        
        if date_match and len(stripped) < 80:
            # This line likely contains a job title and dates
            if current_entry:
                entries.append(current_entry)
            
            # Extract title from the non-date part
            title_part = stripped[:date_match.start()].strip().rstrip('|–—-,')
            current_entry = {
                "job_title": title_part if title_part else "Position",
                "company": "",
                "start_date": date_match.group(1).strip(),
                "end_date": date_match.group(2).strip(),
                "description": ""
            }
        elif current_entry:
            # Could be company name or description
            if not current_entry["company"] and len(stripped) < 60 and stripped:
                current_entry["company"] = stripped
            elif stripped:
                current_entry["description"] += stripped + " "
    
    if current_entry:
        entries.append(current_entry)
    
    return entries


def extract_education_entries(text: str) -> list[dict]:
    """Extract education entries from resume text."""
    entries = []
    lines = text.split('\n')
    
    degree_keywords = [
        "bachelor", "master", "phd", "ph.d", "doctorate", "associate",
        "b.s.", "b.a.", "m.s.", "m.a.", "m.b.a.", "b.tech", "m.tech",
        "b.e.", "m.e.", "b.sc", "m.sc", "bsc", "msc", "bca", "mca",
        "diploma", "certificate", "b.com", "m.com"
    ]
    
    in_education_section = False
    current_entry = None
    
    for line in lines:
        stripped = line.strip()
        lower = stripped.lower()
        
        # Detect education section
        if any(kw in lower for kw in ['education', 'academic background', 'qualifications']):
            if len(stripped) < 30:
                in_education_section = True
                continue
        
        # Detect end of education section
        if in_education_section and any(kw in lower for kw in ['experience', 'skills', 'projects', 'certifications', 'awards']):
            if len(stripped) < 25:
                in_education_section = False
                if current_entry:
                    entries.append(current_entry)
                    current_entry = None
                continue
        
        if not in_education_section or not stripped:
            continue
        
        # Check if this line contains a degree keyword
        has_degree = any(kw in lower for kw in degree_keywords)
        
        if has_degree:
            if current_entry:
                entries.append(current_entry)
            current_entry = {
                "degree": stripped,
                "institution": "",
                "start_date": "",
                "end_date": ""
            }
        elif current_entry:
            if not current_entry["institution"]:
                # Check for dates
                date_match = re.search(r'(\d{4})\s*(?:-|–|—|to)\s*(\d{4}|present)', stripped, re.IGNORECASE)
                if date_match:
                    current_entry["start_date"] = date_match.group(1)
                    current_entry["end_date"] = date_match.group(2)
                    institution_part = stripped[:date_match.start()].strip().rstrip('|–—-,')
                    if institution_part:
                        current_entry["institution"] = institution_part
                else:
                    current_entry["institution"] = stripped
    
    if current_entry:
        entries.append(current_entry)
    
    return entries
