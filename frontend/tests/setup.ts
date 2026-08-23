import { Candidate, Job, DashboardStats, DetailedScoreBreakdown, ComparisonMatrixData } from '../src/types';

/**
 * High-fidelity test fixtures for ResumeIQ Test Suite
 */

export const mockCandidateAlice: Candidate = {
  id: 1,
  full_name: 'Alice Johnson',
  email: 'alice.johnson@example.com',
  phone: '+1 (555) 234-5678',
  location: 'San Francisco, CA',
  linkedin_url: 'https://linkedin.com/in/alicejohnson',
  github_url: 'https://github.com/alicejohnson',
  portfolio_url: 'https://alicejohnson.dev',
  summary: 'Senior Full Stack Software Engineer with 5+ years of experience building modern web applications using React, TypeScript, Node.js, Python, and AWS cloud infrastructure. Passionate about performant UI and microservices.',
  total_experience_months: 60, // 5.0 years
  created_at: '2026-08-20T10:00:00Z',
  updated_at: '2026-08-20T10:00:00Z',
  skills: [
    { id: 1, candidate_id: 1, skill_id: 1, proficiency: 'Expert', skill: { id: 1, name: 'React', category: 'Frontend' } },
    { id: 2, candidate_id: 1, skill_id: 2, proficiency: 'Expert', skill: { id: 2, name: 'TypeScript', category: 'Languages' } },
    { id: 3, candidate_id: 1, skill_id: 3, proficiency: 'Advanced', skill: { id: 3, name: 'Python', category: 'Backend' } },
    { id: 4, candidate_id: 1, skill_id: 4, proficiency: 'Advanced', skill: { id: 4, name: 'Node.js', category: 'Backend' } },
    { id: 5, candidate_id: 1, skill_id: 5, proficiency: 'Intermediate', skill: { id: 5, name: 'AWS', category: 'Cloud/DevOps' } },
    { id: 6, candidate_id: 1, skill_id: 6, proficiency: 'Intermediate', skill: { id: 6, name: 'PostgreSQL', category: 'Database' } },
    { id: 7, candidate_id: 1, skill_id: 7, proficiency: 'Advanced', skill: { id: 7, name: 'Tailwind CSS', category: 'Frontend' } },
  ],
  experiences: [
    {
      id: 1,
      candidate_id: 1,
      job_title: 'Senior Frontend Engineer',
      company: 'TechCorp Innovations',
      start_date: '2022-03',
      end_date: 'Present',
      description: 'Architected React & TypeScript design systems, improved web performance by 40%, and led a team of 6 engineers.',
    },
    {
      id: 2,
      candidate_id: 1,
      job_title: 'Software Developer',
      company: 'DataFlow Systems',
      start_date: '2019-06',
      end_date: '2022-02',
      description: 'Developed Python & Node.js REST APIs and real-time dashboard visualizations for financial analytics.',
    },
  ],
  educations: [
    {
      id: 1,
      candidate_id: 1,
      degree: 'B.S. in Computer Science',
      institution: 'Stanford University',
      start_date: '2015',
      end_date: '2019',
    },
  ],
};

export const mockCandidateBob: Candidate = {
  id: 2,
  full_name: 'Bob Martinez',
  email: 'bob.martinez@example.com',
  phone: '+1 (555) 876-5432',
  location: 'New York, NY',
  linkedin_url: 'https://linkedin.com/in/bobmartinez',
  github_url: 'https://github.com/bobmartinez',
  portfolio_url: null,
  summary: 'Frontend specialist focused on React, JavaScript, Vue, and CSS styling. 3 years experience creating responsive SPAs.',
  total_experience_months: 36, // 3.0 years
  created_at: '2026-08-21T14:30:00Z',
  updated_at: '2026-08-21T14:30:00Z',
  skills: [
    { id: 8, candidate_id: 2, skill_id: 1, proficiency: 'Advanced', skill: { id: 1, name: 'React', category: 'Frontend' } },
    { id: 9, candidate_id: 2, skill_id: 8, proficiency: 'Intermediate', skill: { id: 8, name: 'JavaScript', category: 'Languages' } },
    { id: 10, candidate_id: 2, skill_id: 9, proficiency: 'Intermediate', skill: { id: 9, name: 'Vue', category: 'Frontend' } },
    { id: 11, candidate_id: 2, skill_id: 7, proficiency: 'Advanced', skill: { id: 7, name: 'Tailwind CSS', category: 'Frontend' } },
    { id: 12, candidate_id: 2, skill_id: 10, proficiency: 'Beginner', skill: { id: 10, name: 'HTML5/CSS3', category: 'Frontend' } },
  ],
  experiences: [
    {
      id: 3,
      candidate_id: 2,
      job_title: 'Frontend Developer',
      company: 'Creative Pixel Studio',
      start_date: '2021-08',
      end_date: 'Present',
      description: 'Built interactive customer portals and responsive landing pages using React and Tailwind.',
    },
  ],
  educations: [
    {
      id: 2,
      candidate_id: 2,
      degree: 'B.A. in Digital Arts & Information Science',
      institution: 'New York University',
      start_date: '2017',
      end_date: '2021',
    },
  ],
};

export const mockCandidateCarol: Candidate = {
  id: 3,
  full_name: 'Dr. Carol Vance',
  email: 'carol.vance@example.com',
  phone: '+1 (555) 345-6789',
  location: 'Seattle, WA',
  linkedin_url: 'https://linkedin.com/in/carolvance',
  github_url: 'https://github.com/carolvance',
  portfolio_url: 'https://carolvance.ai',
  summary: 'AI / Machine Learning Engineer with Ph.D. in Computer Science. Specialized in Python, PyTorch, Deep Learning, Natural Language Processing, and LLM fine-tuning with 6 years experience.',
  total_experience_months: 72, // 6.0 years
  created_at: '2026-08-22T09:15:00Z',
  updated_at: '2026-08-22T09:15:00Z',
  skills: [
    { id: 13, candidate_id: 3, skill_id: 3, proficiency: 'Expert', skill: { id: 3, name: 'Python', category: 'Backend' } },
    { id: 14, candidate_id: 3, skill_id: 11, proficiency: 'Expert', skill: { id: 11, name: 'Machine Learning', category: 'AI/ML' } },
    { id: 15, candidate_id: 3, skill_id: 12, proficiency: 'Expert', skill: { id: 12, name: 'Deep Learning', category: 'AI/ML' } },
    { id: 16, candidate_id: 3, skill_id: 13, proficiency: 'Advanced', skill: { id: 13, name: 'PyTorch', category: 'AI/ML' } },
    { id: 17, candidate_id: 3, skill_id: 14, proficiency: 'Advanced', skill: { id: 14, name: 'FastAPI', category: 'Backend' } },
    { id: 18, candidate_id: 3, skill_id: 5, proficiency: 'Intermediate', skill: { id: 5, name: 'AWS', category: 'Cloud/DevOps' } },
  ],
  experiences: [
    {
      id: 4,
      candidate_id: 3,
      job_title: 'Lead AI Researcher',
      company: 'NeuralVision AI',
      start_date: '2020-01',
      end_date: 'Present',
      description: 'Led development of generative AI pipelines, published 4 conference papers, deployed FastAPI inference services.',
    },
  ],
  educations: [
    {
      id: 3,
      candidate_id: 3,
      degree: 'Ph.D. in Computer Science',
      institution: 'University of Washington',
      start_date: '2015',
      end_date: '2019',
    },
    {
      id: 4,
      candidate_id: 3,
      degree: 'M.S. in Computer Science',
      institution: 'University of Washington',
      start_date: '2013',
      end_date: '2015',
    },
  ],
};

export const mockCandidateDave: Candidate = {
  id: 4,
  full_name: 'Dave Wilson',
  email: 'dave.wilson@example.com',
  phone: '+1 (555) 999-0000',
  location: 'Austin, TX',
  linkedin_url: null,
  github_url: null,
  portfolio_url: null,
  summary: 'Junior developer with foundational knowledge in HTML, CSS, and basic JavaScript.',
  total_experience_months: 6, // 0.5 years
  created_at: '2026-08-23T08:00:00Z',
  updated_at: '2026-08-23T08:00:00Z',
  skills: [
    { id: 19, candidate_id: 4, skill_id: 8, proficiency: 'Beginner', skill: { id: 8, name: 'JavaScript', category: 'Languages' } },
    { id: 20, candidate_id: 4, skill_id: 10, proficiency: 'Beginner', skill: { id: 10, name: 'HTML5/CSS3', category: 'Frontend' } },
  ],
  experiences: [
    {
      id: 5,
      candidate_id: 4,
      job_title: 'Junior Web Intern',
      company: 'Austin Startup Hub',
      start_date: '2024-01',
      end_date: '2024-06',
      description: 'Assisted in building basic web forms and fixing CSS bugs.',
    },
  ],
  educations: [
    {
      id: 5,
      candidate_id: 4,
      degree: 'High School Diploma',
      institution: 'Austin Central High',
      start_date: '2019',
      end_date: '2023',
    },
  ],
};

export const mockJobFrontendLead: Job = {
  id: 1,
  title: 'Senior Frontend Architect',
  company: 'ResumeIQ Technologies',
  description: 'Looking for a Senior Frontend Architect to lead our React, TypeScript, and Tailwind web platform.',
  required_skills: 'React, TypeScript, Tailwind CSS',
  preferred_skills: 'Node.js, AWS, PostgreSQL',
  minimum_experience_years: 4,
  education_requirement: 'B.S. in Computer Science',
  location: 'San Francisco, CA',
  created_at: '2026-08-19T12:00:00Z',
};

export const mockJobAIResearcher: Job = {
  id: 2,
  title: 'Lead AI/ML Engineer',
  company: 'Synthetix Intelligence',
  description: 'Seeking an experienced AI engineer to design NLP models and deploy FastAPI inference services.',
  required_skills: 'Python, Machine Learning, Deep Learning, PyTorch',
  preferred_skills: 'FastAPI, AWS, Docker',
  minimum_experience_years: 5,
  education_requirement: 'Computer Science',
  location: 'Seattle, WA',
  created_at: '2026-08-19T14:00:00Z',
};

export const mockJobGeneralDev: Job = {
  id: 3,
  title: 'Junior Full Stack Developer',
  company: 'NextWave Digital',
  description: 'Entry-level developer role for web development projects.',
  required_skills: 'JavaScript, React',
  preferred_skills: 'Node.js, HTML5/CSS3',
  minimum_experience_years: 1,
  education_requirement: '',
  location: 'Remote',
  created_at: '2026-08-20T10:00:00Z',
};

export const mockDashboardStats: DashboardStats = {
  total_candidates: 4,
  total_jobs: 3,
  average_match_score: 78.5,
};
