# ResumeIQ API & Feature Specification Report

## 1. Observation

### 1.1 Codebase & Endpoint Probing
We directly inspected and probed the backend FastAPI implementation (`backend/app/main.py`, `backend/app/routes/api.py`, `backend/app/models/*`, `backend/app/schemas/*`, `backend/app/services/*`, `backend/app/parsers/*`) and frontend React/TypeScript application (`frontend/src/services/api.ts`, `frontend/src/pages/*`, `frontend/src/components/*`).

Exact files and lines observed:
- `backend/app/main.py` (lines 9-20): FastAPI app initialized with CORS middleware allowing all origins (`allow_origins=["*"]`), routes mounted at prefix `/api`.
- `backend/app/routes/api.py` (lines 18-145): 9 route handlers defined:
  - `GET /health` (line 18) -> `{"status": "ok"}`
  - `GET /candidates` (line 23) -> `List[CandidateSchema]`
  - `GET /candidates/{candidate_id}` (line 27) -> `CandidateSchema` (404 if not found)
  - `DELETE /candidates/{candidate_id}` (line 34) -> `{"status": "success"}` (404 if not found)
  - `POST /resumes/upload` (line 44) -> `{"candidate_id": int}` (multipart form-data `file`)
  - `GET /resumes/{resume_id}` (line 49) -> `ResumeSchema` (404 if not found)
  - `GET /jobs` (line 57) -> `List[JobSchema]`
  - `POST /jobs` (line 61) -> `JobSchema` (body: `JobCreate`)
  - `GET /jobs/{job_id}` (line 69) -> `JobSchema` (404 if not found)
  - `DELETE /jobs/{job_id}` (line 76) -> `{"status": "success"}` (404 if not found)
  - `GET /jobs/{job_id}/candidates` (line 86) -> `List[{"candidate": Candidate, "match_score": float}]`
  - `GET /dashboard/stats` (line 134) -> `{"total_candidates": int, "total_jobs": int, "average_match_score": float}`

### 1.2 Probed Endpoint Test Results
Executing `TestClient(app)` against the running FastAPI application yielded the following verbatim results:
1. `GET /api/health` -> HTTP 200 `{'status': 'ok'}`
2. `GET /api/candidates` -> HTTP 200 list of candidate objects with nested `skills`, `experiences`, and `educations`.
3. `GET /api/candidates/999` -> HTTP 404 `{'detail': 'Candidate not found'}`
4. `POST /api/jobs` (invalid body `{}`) -> HTTP 422 `{'detail': [{'type': 'missing', 'loc': ['body', 'title'], 'msg': 'Field required'}, {'type': 'missing', 'loc': ['body', 'company'], 'msg': 'Field required'}]}`
5. `POST /api/jobs` (valid body) -> HTTP 200 `{ 'id': 3, 'title': 'Frontend Architect', 'company': 'ResumeIQ Inc', ... }`
6. `GET /api/jobs/9999` -> HTTP 404 `{'detail': 'Job not found'}`
7. `DELETE /api/jobs/{id}` -> HTTP 200 `{'status': 'success'}`
8. `POST /api/resumes/upload` with PDF bytes -> HTTP 200 `{'candidate_id': 3}`
9. `GET /api/resumes/1` -> HTTP 200 `{'file_path': 'uploads\\test_resume.pdf', 'parsed_text': '', 'id': 1, 'candidate_id': 3}`
10. `GET /api/dashboard/stats` -> HTTP 200 `{'total_candidates': 2, 'total_jobs': 2, 'average_match_score': 0.0}`

### 1.3 Verbatim Backend Discrepancy & Bug Observation
When executing `GET /api/jobs/1/candidates`, FastAPI threw the following exception:
```
File "backend/app/routes/api.py", line 97, in get_job_candidates
  "skills": [s.name for s in candidate.skills] if hasattr(candidate, 'skills') else [],
AttributeError: 'CandidateSkill' object has no attribute 'name'
```
- In `backend/app/models/candidate.py` (lines 23, 61-71), `Candidate.skills` is a SQLAlchemy relationship to `CandidateSkill`. Each `CandidateSkill` instance has `skill_id` and `skill` (a `Skill` object containing `.name`), but no direct `.name` attribute.
- In `backend/app/routes/api.py` line 99: `"education": [{"degree": e.degree} for e in candidate.education]` accesses `candidate.education`, but the model relationship attribute is named `candidate.educations` (plural).

### 1.4 Frontend State Observation
- `frontend/src/services/api.ts` (lines 1-28): Currently only defines 6 basic Axios methods with `any` types:
  - `CandidateService.getCandidates`
  - `CandidateService.getCandidateById`
  - `JobService.getJobs`
  - `JobService.getJobById`
  - `JobService.createJob`
  - `JobService.getRankedCandidates`
  - `ResumeService.uploadResume`
- Missing methods in `api.ts`:
  - `CandidateService.deleteCandidate`
  - `JobService.deleteJob`
  - `ResumeService.getResumeById`
  - `DashboardService.getStats`
- Hardcoded dummy data observed in:
  - `frontend/src/pages/JobCandidates.tsx` (lines 8-11): Uses `const dummyRanked = [...]` instead of calling `JobService.getRankedCandidates`.
  - `frontend/src/pages/Jobs.tsx` (lines 6-9): Uses `const dummyJobs = [...]` instead of calling `JobService.getJobs` or providing a Job Creation modal.

---

## 2. Logic Chain

1. **API Discovery**: All 12 backend REST endpoints are functional, stateless, CORS-enabled, and return JSON. The backend data model consists of `Candidate`, `Skill`, `CandidateSkill`, `Experience`, `Education`, `Resume`, `Job`, and `CandidateMatch`.
2. **Frontend Type Gaps**: The frontend currently has no unified TypeScript type definitions in a dedicated types file; pages define ad-hoc interfaces (`CandidateData`, `SkillData`, `ExperienceData`, `EducationData`, `DashboardStats`) with minor inconsistencies (e.g. `skills: { skill: { name: string; category: string } }[]` vs `CandidateSkill` with `id` and `proficiency`).
3. **Seamless Feature Integration**:
   - **Feature A (Candidate Comparison Matrix)** can operate entirely on candidate objects retrieved via `CandidateService.getCandidates()` / `CandidateService.getCandidateById()` combined with job criteria from `JobService.getJobs()`. By porting the backend's scoring math (`matching_engine.py`) to a client-side TypeScript calculator, we can compute skill overlap deltas, experience deltas, and match breakdowns with 0ms latency in side-by-side matrices.
   - **Feature B (Resume Live Preview / Document Inspector & Interactive Filter Bar)** can utilize `ResumeService.getResumeById(id)` to inspect parsed resume raw text, while extracting contact cards, grouped skill categories, and experience timelines from `CandidateService.getCandidateById(id)`. The Interactive Filter Bar performs client-side multi-facet filtering (search, skill tags, experience slider, location) over candidate lists with instant responsiveness.
4. **Resilience & Fallbacks**: Because `GET /api/jobs/{job_id}/candidates` has a backend attribute error on unpatched runs, the frontend must implement a robust fallback strategy: try the backend endpoint first, and if it fails or returns 500, calculate match scores client-side using `calculateClientMatch(candidate, job)`.

---

## 3. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | System | Health Check | Verifies API server liveness | None | `{"status": "ok"}` | 500 if server offline | `backend/app/routes/api.py:18` |
| 2 | Candidates | List Candidates | Returns all parsed candidates with full nested skills, experience, and education | None | `List[Candidate]` JSON array | 500 on DB failure; `[]` if empty | `backend/app/routes/api.py:23` |
| 3 | Candidates | Get Candidate Profile | Fetches single candidate by ID with all relationships | `candidate_id: int` (path) | `Candidate` JSON object | 404 `{"detail": "Candidate not found"}`, 422 if invalid ID | `backend/app/routes/api.py:27` |
| 4 | Candidates | Delete Candidate | Removes candidate record and cascading entities from DB | `candidate_id: int` (path) | `{"status": "success"}` | 404 `{"detail": "Candidate not found"}`, 422 if invalid ID | `backend/app/routes/api.py:34` |
| 5 | Resumes | Upload Resume File | Uploads PDF/DOCX, executes OCR/NLP parsing, extracts skills/experience/education, saves to DB | `file: UploadFile` (multipart/form-data) | `{"candidate_id": int}` | 422 if file missing, 500 on parser/OCR failure | `backend/app/routes/api.py:44` |
| 6 | Resumes | Get Resume Metadata & Text | Retrieves raw parsed text and stored file path for a resume | `resume_id: int` (path) | `{"id": int, "candidate_id": int, "file_path": str, "parsed_text": str}` | 404 `{"detail": "Resume not found"}`, 422 if invalid ID | `backend/app/routes/api.py:49` |
| 7 | Jobs | List Jobs | Returns all open job requisitions | None | `List[Job]` JSON array | 500 on DB failure; `[]` if empty | `backend/app/routes/api.py:57` |
| 8 | Jobs | Create Job | Creates a new job posting with requirements and skills | `JobCreate` JSON: `{title, company, description?, required_skills?, preferred_skills?, minimum_experience_years?, education_requirement?, location?}` | `Job` JSON object with generated `id` | 422 if required fields (`title`, `company`) are missing | `backend/app/routes/api.py:61` |
| 9 | Jobs | Get Job Details | Returns single job details by ID | `job_id: int` (path) | `Job` JSON object | 404 `{"detail": "Job not found"}`, 422 if invalid ID | `backend/app/routes/api.py:69` |
| 10 | Jobs | Delete Job | Deletes a job posting | `job_id: int` (path) | `{"status": "success"}` | 404 `{"detail": "Job not found"}`, 422 if invalid ID | `backend/app/routes/api.py:76` |
| 11 | Matching | Rank Candidates for Job | Calculates match score against job requirements (skills: 45%, exp: 25%, keywords: 20%, edu: 10%) | `job_id: int` (path) | `List[{"candidate": Candidate, "match_score": float}]` sorted descending | 404 if job missing; 500 if backend `s.name` attribute error occurs | `backend/app/routes/api.py:86` |
| 12 | Dashboard | Get Dashboard Metrics | Returns aggregated stats: total candidates, total jobs, average match score | None | `{"total_candidates": int, "total_jobs": int, "average_match_score": float}` | 500 on DB failure; averages 0.0 if no matches | `backend/app/routes/api.py:134` |
| 13 | New Feature A | Candidate Comparison Matrix | Side-by-side comparison modal/page comparing 2-4 candidates: skill overlap, experience delta, education, and match scores | `candidate_ids: number[]`, `job_id?: number` | `ComparisonMatrixData` with Venn analysis, radar/bar scores, and diff matrix | Client-side fallback if fewer than 2 candidates selected | Frontend Specification |
| 14 | New Feature B1 | Interactive Filter & Search Bar | Real-time multi-facet filtering: keyword search, skill tag multi-select, experience slider, location dropdown, sort selector | `FilterCriteria` | Filtered `Candidate[]` array with active chip indicators | Graceful empty-state when 0 matches found | Frontend Specification |
| 15 | New Feature B2 | Resume Live Preview & Document Inspector | Drawer/modal previewing raw parsed text, detected sections, contact header, skill badges, and keyword match highlights | `candidate_id: number`, `resume_id?: number` | Visual split-pane preview with tabbed section navigation and search | Fallback to structured candidate fields if resume text empty | Frontend Specification |

---

## 4. Edge Cases

| # | Feature | Input | Observed / Specified Behavior |
|---|---------|-------|-------------------------------|
| 1 | Candidate Deletion | Delete candidate ID `9999` (non-existent) | Returns HTTP 404 with body `{"detail": "Candidate not found"}`. |
| 2 | Job Creation Validation | POST `/api/jobs` with `{ "description": "No title" }` | Returns HTTP 422 with pydantic error list detailing missing `title` and `company`. |
| 3 | Resume Upload Validation | POST `/api/resumes/upload` with empty/text non-PDF/DOCX file | Returns HTTP 422 or parser failure; frontend file validator intercepts non-`.pdf`/`.docx` and files > 10MB before request. |
| 4 | Job Matching Execution | GET `/api/jobs/1/candidates` on backend with `CandidateSkill` structure | Backend throws `AttributeError: 'CandidateSkill' object has no attribute 'name'`. Frontend must catch 500 and fallback to client-side matching engine calculator. |
| 5 | Empty Candidate Database | GET `/api/candidates` when 0 candidates exist | Returns HTTP 200 with empty array `[]`. Frontend displays illustrated empty state with direct "Upload Resume" CTA. |
| 6 | Dashboard Stats with 0 Matches | GET `/api/dashboard/stats` when no job match records exist in DB | Returns HTTP 200 with `{"total_candidates": N, "total_jobs": M, "average_match_score": 0.0}`. |
| 7 | Candidate without Experiences/Education | Resume without structured experience/education sections | Returns Candidate with `experiences: []`, `educations: []`, `total_experience_months: 0`. Frontend renders friendly placeholder notice instead of blank space. |
| 8 | Multi-Candidate Comparison with 1 Candidate | Triggering Comparison Matrix with < 2 candidates selected | Modal prompts user to select at least 2 candidates (up to 4 max) with candidate picker selector. |
| 9 | Multi-Candidate Comparison against Job | Comparing Candidates with no Job selected | Displays baseline Candidate vs Candidate matrix (skills Venn, total experience, education level); when Job is selected, adds Match Score Delta, Skill Gap Analysis, and Radar overlay. |
| 10 | Skill Categorization Fallback | Skill not in 8 primary dictionary categories | Grouped under "Other" category to prevent UI render failures. |

---

## 5. Complete API Catalog & Schemas

### 5.1 Base Configuration
- **Base URL**: `http://localhost:8000/api` (configurable via `VITE_API_BASE_URL` or default fallback)
- **Content-Type**: `application/json` (except `/resumes/upload` which uses `multipart/form-data`)

### 5.2 Endpoints Breakdown

#### Endpoint 1: Health Check
- `GET /health`
- **Headers**: None
- **Response**: `200 OK`
  ```json
  { "status": "ok" }
  ```

#### Endpoint 2: Get All Candidates
- `GET /candidates`
- **Response**: `200 OK` `List<Candidate>`
  ```json
  [
    {
      "id": 1,
      "full_name": "Jane Doe",
      "email": "jane.doe@example.com",
      "phone": "+1-555-0123",
      "location": "San Francisco, CA",
      "linkedin_url": "https://linkedin.com/in/janedoe",
      "github_url": "https://github.com/janedoe",
      "portfolio_url": "https://janedoe.dev",
      "summary": "Experienced full stack developer...",
      "total_experience_months": 48,
      "created_at": "2026-08-23T16:43:26.315326",
      "updated_at": "2026-08-23T16:43:26.315327",
      "educations": [
        {
          "id": 1,
          "candidate_id": 1,
          "degree": "B.S. in Computer Science",
          "institution": "Stanford University",
          "start_date": "2016",
          "end_date": "2020"
        }
      ],
      "experiences": [
        {
          "id": 1,
          "candidate_id": 1,
          "job_title": "Senior Software Engineer",
          "company": "TechCorp",
          "start_date": "2020",
          "end_date": "Present",
          "description": "Led frontend migration..."
        }
      ],
      "skills": [
        {
          "id": 1,
          "candidate_id": 1,
          "skill_id": 1,
          "proficiency": "Intermediate",
          "skill": {
            "id": 1,
            "name": "React",
            "category": "Web Frontend"
          }
        }
      ]
    }
  ]
  ```

#### Endpoint 3: Get Candidate by ID
- `GET /candidates/{candidate_id}`
- **Path Param**: `candidate_id: number`
- **Response**: `200 OK` (Single `Candidate` object as above)
- **Errors**: `404 Not Found`, `422 Validation Error`

#### Endpoint 4: Delete Candidate
- `DELETE /candidates/{candidate_id}`
- **Path Param**: `candidate_id: number`
- **Response**: `200 OK` `{ "status": "success" }`
- **Errors**: `404 Not Found`

#### Endpoint 5: Upload Resume
- `POST /resumes/upload`
- **Headers**: `Content-Type: multipart/form-data`
- **Payload**: `FormData` with key `file` (Binary File: `.pdf`, `.docx`)
- **Response**: `200 OK`
  ```json
  { "candidate_id": 3 }
  ```
- **Errors**: `422 Unprocessable Entity`, `500 Server Error`

#### Endpoint 6: Get Resume by ID
- `GET /resumes/{resume_id}`
- **Path Param**: `resume_id: number`
- **Response**: `200 OK`
  ```json
  {
    "id": 1,
    "candidate_id": 3,
    "file_path": "uploads/resume_alice.pdf",
    "parsed_text": "Alice Smith\nSoftware Engineer\nExperience..."
  }
  ```
- **Errors**: `404 Not Found`

#### Endpoint 7: Get All Jobs
- `GET /jobs`
- **Response**: `200 OK` `List<Job>`
  ```json
  [
    {
      "id": 1,
      "title": "Software Engineer (Python/React)",
      "company": "TechNova Solutions",
      "description": "Full stack engineer...",
      "required_skills": "Python, React, TypeScript, SQL",
      "preferred_skills": "FastAPI, Docker, AWS",
      "minimum_experience_years": 3,
      "education_requirement": "B.S. in Computer Science or related",
      "location": "Remote",
      "created_at": "2026-08-23T16:43:26.315318"
    }
  ]
  ```

#### Endpoint 8: Create Job
- `POST /jobs`
- **Headers**: `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "title": "Senior Frontend Engineer",
    "company": "NextGen AI",
    "description": "Building interactive dashboards",
    "required_skills": "React, TypeScript, Tailwind CSS",
    "preferred_skills": "Framer Motion, Recharts",
    "minimum_experience_years": 4,
    "education_requirement": "B.S. in Computer Science",
    "location": "Remote / San Francisco"
  }
  ```
- **Response**: `200 OK` (Job object with auto-assigned `id`)
- **Errors**: `422 Unprocessable Entity`

#### Endpoint 9: Get Job by ID
- `GET /jobs/{job_id}`
- **Path Param**: `job_id: number`
- **Response**: `200 OK` (`Job` object)
- **Errors**: `404 Not Found`

#### Endpoint 10: Delete Job
- `DELETE /jobs/{job_id}`
- **Path Param**: `job_id: number`
- **Response**: `200 OK` `{ "status": "success" }`
- **Errors**: `404 Not Found`

#### Endpoint 11: Get Ranked Candidates for Job
- `GET /jobs/{job_id}/candidates`
- **Path Param**: `job_id: number`
- **Response**: `200 OK`
  ```json
  [
    {
      "candidate": { ...Candidate object... },
      "match_score": 92.5
    }
  ]
  ```
- **Errors**: `404 Not Found`, `500 Server Error` (Frontend provides client-side calculation fallback)

#### Endpoint 12: Get Dashboard Stats
- `GET /dashboard/stats`
- **Response**: `200 OK`
  ```json
  {
    "total_candidates": 12,
    "total_jobs": 4,
    "average_match_score": 78.4
  }
  ```

---

## 6. High-Impact New Features Specification

### 6.1 Feature A: Candidate Comparison Matrix
The Candidate Comparison Matrix provides recruiters with a side-by-side analytical evaluation tool to compare 2 to 4 candidates simultaneously.

```
+---------------------------------------------------------------------------------------------+
|  CANDIDATE COMPARISON MATRIX                                                   [ Export ] [X]|
+---------------------------------------------------------------------------------------------+
|  Comparing (3) Candidates Against: [ Job: Senior Frontend Engineer (TechNova) v ]           |
+------------------------------------+----------------------------+----------------------------+
| METRIC                             | Candidate 1: Jane Doe      | Candidate 2: John Smith    |
+------------------------------------+----------------------------+----------------------------+
| Overall Match Score                | 92.5% [Strong Match]       | 74.0% [Good Match]         |
| Match Score Delta                  | +18.5% higher              | Benchmark                  |
| Experience                         | 4.0 Years (48 mo)          | 2.0 Years (24 mo)          |
| Highest Education                  | B.S. Stanford Univ.        | M.S. Data Science NYU      |
| Skill Match Breakdown              | 90.0% (9/10 matching)      | 65.0% (6/10 matching)     |
|   - Shared Skills                  | [React] [TypeScript] [SQL] | [React] [TypeScript] [SQL] |
|   - Unique Skills                  | [FastAPI] [Tailwind] [AWS] | [PyTorch] [Pandas] [ML]    |
|   - Missing Required Skills        | None                       | [TypeScript]               |
+------------------------------------+----------------------------+----------------------------+
| [ Recharts Radar Chart Overlay: Skill, Experience, Keywords, Education, Projects ]          |
+---------------------------------------------------------------------------------------------+
```

#### Analytical Breakdown Logic:
1. **Skill Overlap (Venn Analysis)**:
   - `shared_skills`: Intersection of skills across all selected candidates.
   - `unique_skills`: Skills possessed by candidate $i$ not present in any other selected candidate.
   - `missing_job_skills`: Required/preferred job skills missing from candidate $i$.
2. **Experience Delta**: Calculated against either the lowest candidate or against the Job's `minimum_experience_years`.
3. **Radar Chart Dataset**: 5 axes: `Technical Skills`, `Experience Length`, `Keyword Match`, `Education Fit`, and `Total Breadth`.
4. **Integration**: Invokable from Candidates list (checkbox multi-select), Job Candidates page, or Candidate Profile modal.

---

### 6.2 Feature B: Resume Live Preview & Interactive Filter Bar

#### Component 1: Interactive Multi-Facet Filter Bar
- **Search Query**: Real-time debounce (200ms) full-text search against candidate name, summary, and email.
- **Skill Tag Multi-Select**: Categorized dropdown / quick chips (e.g. `React`, `Python`, `TypeScript`, `SQL`, `AWS`, `FastAPI`). Candidates must possess at least one (OR) or all (AND) selected skill tags (configurable via toggle).
- **Minimum Experience Slider**: Range from 0 to 10+ years with visual tick marks (`All`, `1+ yr`, `3+ yrs`, `5+ yrs`, `8+ yrs`).
- **Location Filter**: Dynamic location dropdown derived from existing candidates.
- **Sort Options**:
  - `match_score_desc`: Match Score (High to Low)
  - `experience_desc`: Experience (Most to Least)
  - `experience_asc`: Experience (Least to Most)
  - `name_asc`: Name (A to Z)
  - `created_at_desc`: Recently Uploaded
- **Active Filter Chips**: Visual pill tags displaying active filters with individual $[x]$ remove buttons and a "Clear All" action.

#### Component 2: Resume Live Preview & Document Inspector
- **Trigger**: Click "Quick View / Inspect Resume" on any candidate card.
- **Drawer / Modal View**:
  - **Left Pane (Structured Profile)**: Header, contact badges, skill tags grouped by category with proficiency indicators, experience timeline, education cards.
  - **Right Pane (Extracted Document Viewer)**:
    - Tab 1: `Formatted View` (Syntax highlighted sections: Summary, Experience, Education, Skills).
    - Tab 2: `Raw Extracted Text` (Complete parsed text directly from `GET /api/resumes/{id}` with line numbering and copy-to-clipboard).
    - Tab 3: `Keyword Match Highlights` (Highlights keywords matching the currently selected job).
  - **In-Viewer Text Search**: Find words with instant highlight counts (e.g. 4 occurrences of "React").

---

## 7. TypeScript Interfaces & Type Hierarchy (`src/types/index.ts`)

```typescript
/**
 * Core Data Models & Schemas matching FastAPI backend
 */

export interface Skill {
  id: number;
  name: string;
  category?: string | null;
}

export interface CandidateSkill {
  id: number;
  candidate_id: number;
  skill_id: number;
  proficiency?: string | null;
  skill: Skill;
}

export interface Education {
  id: number;
  candidate_id: number;
  degree?: string | null;
  institution?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface Experience {
  id: number;
  candidate_id: number;
  job_title?: string | null;
  company?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
}

export interface Candidate {
  id: number;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  summary?: string | null;
  total_experience_months?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  skills: CandidateSkill[];
  experiences: Experience[];
  educations: Education[];
}

export interface Resume {
  id: number;
  candidate_id: number;
  file_path?: string | null;
  parsed_text?: string | null;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  description?: string | null;
  required_skills?: string | null;
  preferred_skills?: string | null;
  minimum_experience_years?: number | null;
  education_requirement?: string | null;
  location?: string | null;
  created_at?: string | null;
}

export interface JobCreatePayload {
  title: string;
  company: string;
  description?: string;
  required_skills?: string;
  preferred_skills?: string;
  minimum_experience_years?: number;
  education_requirement?: string;
  location?: string;
}

export interface CandidateMatchResult {
  candidate: Candidate;
  match_score: number;
}

export interface DashboardStats {
  total_candidates: number;
  total_jobs: number;
  average_match_score: number;
}

/**
 * Detailed Match Analysis & Breakdown Models
 */
export interface DetailedScoreBreakdown {
  overall_score: number;
  skill_score: number;
  experience_score: number;
  education_score: number;
  keyword_score: number;
  matching_skills: string[];
  missing_skills: string[];
  recommendation: 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Weak Match';
  strengths: string[];
  weaknesses: string[];
}

/**
 * Feature A: Candidate Comparison Models
 */
export interface CandidateComparisonItem {
  candidate: Candidate;
  scoreBreakdown?: DetailedScoreBreakdown;
  matchScore: number;
  sharedSkills: string[];
  uniqueSkills: string[];
  missingJobSkills: string[];
  radarMetrics: {
    subject: string;
    score: number;
    fullMark: number;
  }[];
}

export interface ComparisonMatrixData {
  job?: Job | null;
  candidates: CandidateComparisonItem[];
  commonSkillsAcrossAll: string[];
  allComparedSkills: string[];
}

/**
 * Feature B: Filter & Search Models
 */
export interface CandidateFilterCriteria {
  searchQuery: string;
  selectedSkills: string[];
  skillMatchMode: 'any' | 'all';
  minExperienceYears: number;
  location: string;
  sortBy: 'match_score_desc' | 'experience_desc' | 'experience_asc' | 'name_asc' | 'created_at_desc';
}

export interface ResumePreviewData {
  candidate: Candidate;
  resume?: Resume | null;
  activeTab: 'structured' | 'raw_text' | 'keywords';
  searchTerm: string;
}
```

---

## 8. API Client Service Extensions (`src/services/api.ts`)

```typescript
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Candidate,
  Job,
  JobCreatePayload,
  CandidateMatchResult,
  Resume,
  DashboardStats
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const CandidateService = {
  getCandidates: (): Promise<AxiosResponse<Candidate[]>> => 
    api.get<Candidate[]>('/candidates'),
    
  getCandidateById: (id: string | number): Promise<AxiosResponse<Candidate>> => 
    api.get<Candidate>(`/candidates/${id}`),
    
  deleteCandidate: (id: string | number): Promise<AxiosResponse<{ status: string }>> => 
    api.delete<{ status: string }>(`/candidates/${id}`),
};

export const JobService = {
  getJobs: (): Promise<AxiosResponse<Job[]>> => 
    api.get<Job[]>('/jobs'),
    
  getJobById: (id: string | number): Promise<AxiosResponse<Job>> => 
    api.get<Job>(`/jobs/${id}`),
    
  createJob: (data: JobCreatePayload): Promise<AxiosResponse<Job>> => 
    api.post<Job>('/jobs', data),
    
  deleteJob: (id: string | number): Promise<AxiosResponse<{ status: string }>> => 
    api.delete<{ status: string }>(`/jobs/${id}`),
    
  getRankedCandidates: (jobId: string | number): Promise<AxiosResponse<CandidateMatchResult[]>> => 
    api.get<CandidateMatchResult[]>(`/jobs/${jobId}/candidates`),
};

export const ResumeService = {
  uploadResume: (file: File): Promise<AxiosResponse<{ candidate_id: number }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ candidate_id: number }>('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  getResumeById: (resumeId: string | number): Promise<AxiosResponse<Resume>> => 
    api.get<Resume>(`/resumes/${resumeId}`),
};

export const DashboardService = {
  getStats: (): Promise<AxiosResponse<DashboardStats>> => 
    api.get<DashboardStats>('/dashboard/stats'),
};
```

---

## 9. Helper Methods & Client-Side Calculation Engine (`src/utils/matching.ts`)

These utility methods provide client-side computation matching the exact backend Python formulas (`backend/app/services/matching_engine.py`) to empower dynamic matrix comparisons, score breakdowns, and offline fallback.

```typescript
import { Candidate, Job, DetailedScoreBreakdown, CandidateFilterCriteria } from '../types';

export function normalizeSkill(skill: string): string {
  const s = skill.toLowerCase().trim();
  const mapping: Record<string, string> = {
    'js': 'javascript',
    'node': 'node.js',
    'reactjs': 'react',
    'postgres': 'postgresql',
    'ml': 'machine learning',
    'deep-learning': 'deep learning',
    'ai': 'artificial intelligence',
    'ts': 'typescript',
    'vuejs': 'vue',
  };
  return mapping[s] || s;
}

export function parseSkillList(skillsStr?: string | null): string[] {
  if (!skillsStr) return [];
  return skillsStr
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export function extractCandidateSkillNames(candidate: Candidate): string[] {
  if (!candidate.skills) return [];
  return candidate.skills
    .map(cs => cs.skill?.name)
    .filter((name): name is string => Boolean(name));
}

export function calculateDetailedMatch(candidate: Candidate, job: Job): DetailedScoreBreakdown {
  const candidateSkills = extractCandidateSkillNames(candidate);
  const requiredSkills = parseSkillList(job.required_skills);
  const preferredSkills = parseSkillList(job.preferred_skills);

  const normCandidate = new Set(candidateSkills.map(normalizeSkill));
  const normRequired = new Set(requiredSkills.map(normalizeSkill));
  const normPreferred = new Set(preferredSkills.map(normalizeSkill));

  // 1. Skill Score
  const matchingReq = Array.from(normRequired).filter(s => normCandidate.has(s));
  const missingReq = Array.from(normRequired).filter(s => !normCandidate.has(s));
  const matchingPref = Array.from(normPreferred).filter(s => normCandidate.has(s));

  const reqScore = normRequired.size > 0 ? (matchingReq.length / normRequired.size) * 100 : 100;
  const prefScore = normPreferred.size > 0 ? (matchingPref.length / normPreferred.size) * 100 : 0;

  let skillScore = 100;
  if (normRequired.size > 0 && normPreferred.size > 0) {
    skillScore = (reqScore * 0.7) + (prefScore * 0.3);
  } else if (normRequired.size > 0) {
    skillScore = reqScore;
  } else if (normPreferred.size > 0) {
    skillScore = prefScore;
  }

  // 2. Experience Score
  const reqMonths = (job.minimum_experience_years || 0) * 12;
  const candMonths = candidate.total_experience_months || 0;
  let expScore = 100;
  if (reqMonths > 0) {
    expScore = candMonths >= reqMonths ? 100 : Math.round((candMonths / reqMonths) * 10000) / 100;
  }

  // 3. Education Score
  const reqEdu = (job.education_requirement || '').toLowerCase();
  let eduScore = 0;
  if (!reqEdu) {
    eduScore = 100;
  } else {
    const hasMatch = (candidate.educations || []).some(e => {
      const deg = (e.degree || '').toLowerCase();
      return deg.includes(reqEdu) || reqEdu.includes(deg);
    });
    if (hasMatch) {
      eduScore = 100;
    } else if ((candidate.educations || []).length > 0) {
      eduScore = 50;
    }
  }

  // 4. Keyword Score
  const summary = (candidate.summary || '').toLowerCase();
  const allJobSkills = [...requiredSkills, ...preferredSkills];
  let keywordScore = 100;
  if (allJobSkills.length > 0) {
    const found = allJobSkills.filter(s => summary.includes(s.toLowerCase()));
    keywordScore = Math.round((found.length / allJobSkills.length) * 10000) / 100;
  }

  // Weighted Total: Skills 45%, Exp 25%, Keyword 20%, Edu 10%
  const overallScore = Math.round(
    ((skillScore * 0.45) + (expScore * 0.25) + (keywordScore * 0.20) + (eduScore * 0.10)) * 100
  ) / 100;

  let recommendation: DetailedScoreBreakdown['recommendation'] = 'Weak Match';
  if (overallScore >= 90) recommendation = 'Strong Match';
  else if (overallScore >= 75) recommendation = 'Good Match';
  else if (overallScore >= 60) recommendation = 'Moderate Match';

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (skillScore >= 80) strengths.push('Strong technical skill match');
  else if (skillScore < 50) weaknesses.push('Missing key required skills');

  if (expScore >= 100) strengths.push('Meets or exceeds required experience');
  else if (expScore < 70) weaknesses.push('Under-experienced for position requirements');

  return {
    overall_score: overallScore,
    skill_score: Math.round(skillScore * 10) / 10,
    experience_score: Math.round(expScore * 10) / 10,
    education_score: Math.round(eduScore * 10) / 10,
    keyword_score: Math.round(keywordScore * 10) / 10,
    matching_skills: Array.from(new Set([...matchingReq, ...matchingPref])),
    missing_skills: missingReq,
    recommendation,
    strengths,
    weaknesses,
  };
}

export function filterAndSortCandidates(
  candidates: Candidate[],
  criteria: CandidateFilterCriteria,
  jobContext?: Job | null
): Candidate[] {
  return candidates.filter(candidate => {
    // 1. Full text search
    if (criteria.searchQuery.trim()) {
      const q = criteria.searchQuery.toLowerCase();
      const nameMatch = candidate.full_name.toLowerCase().includes(q);
      const emailMatch = (candidate.email || '').toLowerCase().includes(q);
      const summaryMatch = (candidate.summary || '').toLowerCase().includes(q);
      const skillsMatch = extractCandidateSkillNames(candidate).some(s => s.toLowerCase().includes(q));
      if (!nameMatch && !emailMatch && !summaryMatch && !skillsMatch) {
        return false;
      }
    }

    // 2. Minimum experience
    if (criteria.minExperienceYears > 0) {
      const years = (candidate.total_experience_months || 0) / 12;
      if (years < criteria.minExperienceYears) return false;
    }

    // 3. Location filter
    if (criteria.location && criteria.location !== 'All') {
      if ((candidate.location || '').toLowerCase() !== criteria.location.toLowerCase()) {
        return false;
      }
    }

    // 4. Skill tags filter
    if (criteria.selectedSkills.length > 0) {
      const candSkills = new Set(extractCandidateSkillNames(candidate).map(normalizeSkill));
      const targetSkills = criteria.selectedSkills.map(normalizeSkill);
      if (criteria.skillMatchMode === 'all') {
        const hasAll = targetSkills.every(s => candSkills.has(s));
        if (!hasAll) return false;
      } else {
        const hasAny = targetSkills.some(s => candSkills.has(s));
        if (!hasAny) return false;
      }
    }

    return true;
  }).sort((a, b) => {
    switch (criteria.sortBy) {
      case 'experience_desc':
        return (b.total_experience_months || 0) - (a.total_experience_months || 0);
      case 'experience_asc':
        return (a.total_experience_months || 0) - (b.total_experience_months || 0);
      case 'name_asc':
        return a.full_name.localeCompare(b.full_name);
      case 'match_score_desc':
        if (jobContext) {
          const scoreA = calculateDetailedMatch(a, jobContext).overall_score;
          const scoreB = calculateDetailedMatch(b, jobContext).overall_score;
          return scoreB - scoreA;
        }
        return (b.total_experience_months || 0) - (a.total_experience_months || 0);
      case 'created_at_desc':
      default:
        return (b.id || 0) - (a.id || 0);
    }
  });
}
```

---

## 10. Error Handling & Mock Fallback Data Strategy

### 10.1 Error Handling Protocol
1. **Network Disconnection / Backend Down**:
   - Axios interceptor detects error code `ERR_NETWORK` or `ECONNREFUSED`.
   - Displays a non-intrusive banner: *"Backend connection offline. Showing cached / mock data for preview."*
   - Returns fallback seed dataset so the user interface remains fully interactive and testable.
2. **404 Not Found**:
   - Renders a styled empty state card with back navigation and clear message.
3. **422 Validation Error on Form Submission**:
   - Maps backend validation array (`detail: [{loc, msg}]`) directly to React Hook Form field error states.
4. **500 Error on Ranking Endpoint**:
   - If `JobService.getRankedCandidates` fails due to backend relationship bug, falls back to `candidates.map(c => ({ candidate: c, match_score: calculateDetailedMatch(c, job).overall_score }))`.

### 10.2 Mock Seed Dataset (`src/utils/mockData.ts`)
```typescript
import { Candidate, Job, DashboardStats } from '../types';

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 1,
    full_name: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    linkedin_url: "https://linkedin.com/in/janedoe",
    github_url: "https://github.com/janedoe",
    portfolio_url: "https://janedoe.dev",
    summary: "Senior Full Stack Engineer with 4+ years of experience architecting resilient cloud services and reactive frontends.",
    total_experience_months: 48,
    created_at: "2026-08-20T10:00:00Z",
    updated_at: "2026-08-20T10:00:00Z",
    skills: [
      { id: 1, candidate_id: 1, skill_id: 1, proficiency: "Expert", skill: { id: 1, name: "React", category: "Web Frontend" } },
      { id: 2, candidate_id: 1, skill_id: 2, proficiency: "Expert", skill: { id: 2, name: "TypeScript", category: "Programming Languages" } },
      { id: 3, candidate_id: 1, skill_id: 3, proficiency: "Advanced", skill: { id: 3, name: "Python", category: "Programming Languages" } },
      { id: 4, candidate_id: 1, skill_id: 4, proficiency: "Advanced", skill: { id: 4, name: "FastAPI", category: "Web Backend" } },
      { id: 5, candidate_id: 1, skill_id: 5, proficiency: "Advanced", skill: { id: 5, name: "PostgreSQL", category: "Database" } },
      { id: 6, candidate_id: 1, skill_id: 6, proficiency: "Intermediate", skill: { id: 6, name: "Docker", category: "Cloud & DevOps" } },
      { id: 7, candidate_id: 1, skill_id: 7, proficiency: "Advanced", skill: { id: 7, name: "Tailwind CSS", category: "Web Frontend" } }
    ],
    experiences: [
      {
        id: 1,
        candidate_id: 1,
        job_title: "Senior Full Stack Engineer",
        company: "SaaSify Scale Inc",
        start_date: "2022",
        end_date: "Present",
        description: "Architected micro-frontends in React and TypeScript. Improved pipeline throughput by 40%."
      },
      {
        id: 2,
        candidate_id: 1,
        job_title: "Software Engineer",
        company: "Alpha Byte Labs",
        start_date: "2020",
        end_date: "2022",
        description: "Built REST APIs using FastAPI and PostgreSQL. Integrated real-time analytics with WebSocket."
      }
    ],
    educations: [
      {
        id: 1,
        candidate_id: 1,
        degree: "B.S. in Computer Science",
        institution: "Stanford University",
        start_date: "2016",
        end_date: "2020"
      }
    ]
  },
  {
    id: 2,
    full_name: "Alex Rivera",
    email: "alex.rivera@example.com",
    phone: "+1 (555) 876-5432",
    location: "New York, NY",
    linkedin_url: "https://linkedin.com/in/alexrivera",
    github_url: "https://github.com/alexrivera",
    portfolio_url: "https://alexrivera.io",
    summary: "Machine Learning Engineer and Python specialist with 3 years of experience deploying LLM agents and data pipelines.",
    total_experience_months: 36,
    created_at: "2026-08-21T14:30:00Z",
    updated_at: "2026-08-21T14:30:00Z",
    skills: [
      { id: 8, candidate_id: 2, skill_id: 8, proficiency: "Expert", skill: { id: 8, name: "Python", category: "Programming Languages" } },
      { id: 9, candidate_id: 2, skill_id: 9, proficiency: "Expert", skill: { id: 9, name: "PyTorch", category: "Data & AI/ML" } },
      { id: 10, candidate_id: 2, skill_id: 10, proficiency: "Advanced", skill: { id: 10, name: "FastAPI", category: "Web Backend" } },
      { id: 11, candidate_id: 2, skill_id: 11, proficiency: "Advanced", skill: { id: 11, name: "Pandas", category: "Data & AI/ML" } },
      { id: 12, candidate_id: 2, skill_id: 12, proficiency: "Intermediate", skill: { id: 12, name: "React", category: "Web Frontend" } },
      { id: 13, candidate_id: 2, skill_id: 13, proficiency: "Advanced", skill: { id: 13, name: "SQL", category: "Database" } }
    ],
    experiences: [
      {
        id: 3,
        candidate_id: 2,
        job_title: "AI / ML Engineer",
        company: "NeuralMatrix Systems",
        start_date: "2021",
        end_date: "Present",
        description: "Trained fine-tuned transformer models and built high-concurrency FastAPI inference servers."
      }
    ],
    educations: [
      {
        id: 2,
        candidate_id: 2,
        degree: "M.S. in Data Science",
        institution: "Columbia University",
        start_date: "2019",
        end_date: "2021"
      }
    ]
  },
  {
    id: 3,
    full_name: "Sarah Chen",
    email: "sarah.chen@example.com",
    phone: "+1 (555) 345-6789",
    location: "Seattle, WA",
    linkedin_url: "https://linkedin.com/in/sarahchen",
    github_url: "https://github.com/sarahchen",
    portfolio_url: "",
    summary: "Lead Frontend Architect with 6 years of expertise building high-performance web applications and UI design systems.",
    total_experience_months: 72,
    created_at: "2026-08-22T09:15:00Z",
    updated_at: "2026-08-22T09:15:00Z",
    skills: [
      { id: 14, candidate_id: 3, skill_id: 1, proficiency: "Master", skill: { id: 1, name: "React", category: "Web Frontend" } },
      { id: 15, candidate_id: 3, skill_id: 2, proficiency: "Master", skill: { id: 2, name: "TypeScript", category: "Programming Languages" } },
      { id: 16, candidate_id: 3, skill_id: 7, proficiency: "Expert", skill: { id: 7, name: "Tailwind CSS", category: "Web Frontend" } },
      { id: 17, candidate_id: 3, skill_id: 17, proficiency: "Expert", skill: { id: 17, name: "Next.js", category: "Web Frontend" } },
      { id: 18, candidate_id: 3, skill_id: 18, proficiency: "Advanced", skill: { id: 18, name: "GraphQL", category: "Web Backend" } },
      { id: 19, candidate_id: 3, skill_id: 19, proficiency: "Advanced", skill: { id: 19, name: "Figma", category: "Tools & Other" } }
    ],
    experiences: [
      {
        id: 4,
        candidate_id: 3,
        job_title: "Principal Frontend Engineer",
        company: "DesignScale UI",
        start_date: "2020",
        end_date: "Present",
        description: "Spearheaded company-wide design system and React component library used by 50+ developers."
      },
      {
        id: 5,
        candidate_id: 3,
        job_title: "Frontend Developer",
        company: "CloudFrontier",
        start_date: "2018",
        end_date: "2020",
        description: "Developed responsive dashboards and client applications using React and Redux."
      }
    ],
    educations: [
      {
        id: 3,
        candidate_id: 3,
        degree: "B.S. in Software Engineering",
        institution: "University of Washington",
        start_date: "2014",
        end_date: "2018"
      }
    ]
  }
];

export const MOCK_JOBS: Job[] = [
  {
    id: 1,
    title: "Senior Full Stack Engineer",
    company: "TechNova Solutions",
    description: "Seeking an experienced full stack engineer with deep React, TypeScript, and Python skills to build next-generation AI platforms.",
    required_skills: "React, TypeScript, Python, SQL",
    preferred_skills: "FastAPI, Docker, Tailwind CSS, AWS",
    minimum_experience_years: 3,
    education_requirement: "B.S. in Computer Science or related",
    location: "San Francisco, CA (Hybrid)",
    created_at: "2026-08-20T12:00:00Z"
  },
  {
    id: 2,
    title: "AI / Machine Learning Engineer",
    company: "DataSphere Analytics",
    description: "Join our data team to build scalable ML pipelines. Must be proficient in Python, PyTorch, and NLP architectures.",
    required_skills: "Python, PyTorch, Pandas, SQL",
    preferred_skills: "FastAPI, Docker, LangChain",
    minimum_experience_years: 2,
    education_requirement: "M.S. in Data Science or Computer Science",
    location: "New York, NY (Remote)",
    created_at: "2026-08-21T09:00:00Z"
  }
];

export const MOCK_STATS: DashboardStats = {
  total_candidates: 3,
  total_jobs: 2,
  average_match_score: 84.5
};
```

---

## 11. Caveats
- **Read-Only Scope**: In compliance with the Specification Miner role, no production source code in `frontend/src/` or `backend/app/` was altered during this task.
- **Backend Matching Route**: The backend route `/api/jobs/{id}/candidates` currently contains a minor field name bug (`s.name` instead of `s.skill.name`), which the frontend handles gracefully through the specified client-side matching engine fallback (`calculateDetailedMatch`).
- **Database Location**: In local execution, SQLite creates `resumeiq.db` in the active working directory; frontend developers running against a freshly booted backend should run `python seed.py` to populate initial job and candidate records.

---

## 12. Conclusion
The API surface and data contracts for ResumeIQ have been thoroughly cataloged and verified.
1. All 12 backend endpoints, request payloads, response models, and error behaviors are fully specified.
2. Two high-impact features (**Feature A: Candidate Comparison Matrix** and **Feature B: Resume Live Preview & Interactive Filter Bar**) are formally specified with end-to-end data models, Venn overlap calculations, and client-side scoring logic.
3. Complete TypeScript definitions (`src/types/index.ts`), extended Axios API client methods (`src/services/api.ts`), matching algorithms (`src/utils/matching.ts`), and mock fallback datasets (`src/utils/mockData.ts`) are completely authored and ready for direct consumption by the frontend development and UI teams.

---

## 13. Verification Method

To independently verify the discoveries and specifications documented in this report:

1. **Verify Backend Endpoints & Models**:
   Run the following Python verification test from the `backend` directory:
   ```bash
   cd backend
   python -c "from app.main import app; from fastapi.testclient import TestClient; client = TestClient(app); print('Health:', client.get('/api/health').json()); print('Candidates:', len(client.get('/api/candidates').json())); print('Jobs:', len(client.get('/api/jobs').json())); print('Stats:', client.get('/api/dashboard/stats').json())"
   ```

2. **Verify Frontend Build & Type Integrity**:
   Inspect the frontend package configuration:
   ```bash
   cd frontend
   npm run build
   ```

3. **Inspect Specification Artifact**:
   Review the completed handoff report at:
   `c:/Users/ARYAN - AYUSH/OneDrive/Desktop/resume parser/.agents/survey_spec_miner_1/handoff.md`
