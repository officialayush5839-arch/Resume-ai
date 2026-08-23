/**
 * ResumeIQ Unified TypeScript Domain Definitions & Contracts
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
  created_at?: string | null;
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
 * Candidate Comparison Matrix Models (Feature A)
 */
export interface RadarMetric {
  subject: string;
  score: number;
  fullMark: number;
}

export interface CandidateComparisonItem {
  candidate: Candidate;
  scoreBreakdown?: DetailedScoreBreakdown;
  matchScore: number;
  sharedSkills: string[];
  uniqueSkills: string[];
  missingJobSkills: string[];
  radarMetrics: RadarMetric[];
}

export interface ComparisonMatrixData {
  job?: Job | null;
  candidates: CandidateComparisonItem[];
  commonSkillsAcrossAll: string[];
  allComparedSkills: string[];
}

/**
 * Filter & Search Models (Feature B)
 */
export type SortOption = 
  | 'match_score_desc' 
  | 'experience_desc' 
  | 'experience_asc' 
  | 'name_asc' 
  | 'created_at_desc';

export interface CandidateFilterCriteria {
  searchQuery: string;
  selectedSkills: string[];
  skillMatchMode: 'any' | 'all';
  minExperienceYears: number;
  location: string;
  sortBy: SortOption;
}

export interface ResumePreviewData {
  candidate: Candidate;
  resume?: Resume | null;
  activeTab: 'structured' | 'raw_text' | 'keywords';
  searchTerm: string;
}

/**
 * UI & Navigation Models
 */
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string | number;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}
