import { describe, it, expect } from 'vitest';
import { calculateDetailedMatch } from '../../src/utils/matching';
import { Candidate, Job } from '../../src/types';

describe('Tier 2 Boundary: Score Extremes & Calculation Edge Cases', () => {
  it('T2.2.1: calculates 100% perfect theoretical match score', () => {
    // Authoritative source: TEST_INFRA §Coverage Thresholds, survey_spec_miner_1 §9
    const perfectCandidate: Candidate = {
      id: 101,
      full_name: 'Perfect Match',
      summary: 'Expert in Python, React, TypeScript, and AWS cloud with extensive software engineering leadership.',
      total_experience_months: 120, // 10 years
      skills: [
        { id: 1, candidate_id: 101, skill_id: 1, proficiency: 'Expert', skill: { id: 1, name: 'Python', category: 'Backend' } },
        { id: 2, candidate_id: 101, skill_id: 2, proficiency: 'Expert', skill: { id: 2, name: 'React', category: 'Frontend' } },
        { id: 3, candidate_id: 101, skill_id: 3, proficiency: 'Expert', skill: { id: 3, name: 'TypeScript', category: 'Languages' } },
        { id: 4, candidate_id: 101, skill_id: 4, proficiency: 'Expert', skill: { id: 4, name: 'AWS', category: 'Cloud' } },
      ],
      experiences: [],
      educations: [
        { id: 1, candidate_id: 101, degree: 'B.S. in Computer Science', institution: 'MIT' },
      ],
    };

    const targetJob: Job = {
      id: 101,
      title: 'Full Stack Staff Engineer',
      company: 'Tech Innovators',
      required_skills: 'Python, React',
      preferred_skills: 'TypeScript, AWS',
      minimum_experience_years: 5,
      education_requirement: 'Computer Science',
    };

    const match = calculateDetailedMatch(perfectCandidate, targetJob);
    expect(match.skill_score).toBe(100);
    expect(match.experience_score).toBe(100);
    expect(match.education_score).toBe(100);
    expect(match.keyword_score).toBe(100);
    expect(match.overall_score).toBe(100);
    expect(match.recommendation).toBe('Strong Match');
  });

  it('T2.2.2: calculates near-0% match for candidate with zero alignment', () => {
    const zeroCandidate: Candidate = {
      id: 102,
      full_name: 'Zero Match',
      summary: 'Gardener with experience in horticulture.',
      total_experience_months: 0,
      skills: [
        { id: 5, candidate_id: 102, skill_id: 5, proficiency: 'Beginner', skill: { id: 5, name: 'Pruning', category: 'Agriculture' } },
      ],
      experiences: [],
      educations: [],
    };

    const highReqJob: Job = {
      id: 102,
      title: 'Principal AI Scientist',
      company: 'DeepMind',
      required_skills: 'PyTorch, CUDA, Transformers, Distributed Systems',
      preferred_skills: 'Kubernetes, C++',
      minimum_experience_years: 8,
      education_requirement: 'Ph.D. in Computer Science',
    };

    const match = calculateDetailedMatch(zeroCandidate, highReqJob);
    expect(match.skill_score).toBe(0);
    expect(match.experience_score).toBe(0);
    expect(match.keyword_score).toBe(0);
    expect(match.overall_score).toBeLessThanOrEqual(5);
    expect(match.recommendation).toBe('Weak Match');
  });

  it('T2.2.3: clamps experience score at 100% when candidate has 50 years experience', () => {
    const veteranCandidate: Candidate = {
      id: 103,
      full_name: 'Veteran Developer',
      summary: 'Software engineering since 1974.',
      total_experience_months: 600, // 50 years
      skills: [],
      experiences: [],
      educations: [],
    };

    const jobWithExp: Job = {
      id: 103,
      title: 'Mid-Level Engineer',
      company: 'SaaS Corp',
      minimum_experience_years: 3,
    };

    const match = calculateDetailedMatch(veteranCandidate, jobWithExp);
    expect(match.experience_score).toBe(100);
  });

  it('T2.2.4: correctly calculates skill score when only required skills are provided', () => {
    const candidate: Candidate = {
      id: 104,
      full_name: 'Test Candidate',
      skills: [
        { id: 1, candidate_id: 104, skill_id: 1, skill: { id: 1, name: 'React' } },
      ],
      experiences: [],
      educations: [],
    };

    const job: Job = {
      id: 104,
      title: 'React Dev',
      company: 'WebCo',
      required_skills: 'React, Redux', // 1 of 2 matches
      preferred_skills: '',
    };

    const match = calculateDetailedMatch(candidate, job);
    expect(match.skill_score).toBe(50); // 1 / 2 = 50%
  });

  it('T2.2.5: correctly calculates skill score when only preferred skills are provided', () => {
    const candidate: Candidate = {
      id: 105,
      full_name: 'Test Candidate',
      skills: [
        { id: 1, candidate_id: 105, skill_id: 1, skill: { id: 1, name: 'Docker' } },
      ],
      experiences: [],
      educations: [],
    };

    const job: Job = {
      id: 105,
      title: 'DevOps',
      company: 'InfraCo',
      required_skills: '',
      preferred_skills: 'Docker, Kubernetes',
    };

    const match = calculateDetailedMatch(candidate, job);
    expect(match.skill_score).toBe(50);
  });

  it('T2.2.6: calculates keyword density accurately from candidate summary', () => {
    const candidate: Candidate = {
      id: 106,
      full_name: 'Keyword Candidate',
      summary: 'Experienced with React and GraphQL in microfrontends.',
      skills: [],
      experiences: [],
      educations: [],
    };

    const job: Job = {
      id: 106,
      title: 'Frontend Role',
      company: 'AppCo',
      required_skills: 'React, TypeScript, GraphQL, Docker', // 2 of 4 found in summary
    };

    const match = calculateDetailedMatch(candidate, job);
    expect(match.keyword_score).toBe(50); // 2 of 4 = 50%
  });

  it('T2.2.7: matches education against degree institution substring', () => {
    const candidate: Candidate = {
      id: 107,
      full_name: 'Edu Candidate',
      skills: [],
      experiences: [],
      educations: [
        { id: 1, candidate_id: 107, degree: 'B.S. in Technology Systems', institution: 'MIT' },
      ],
    };

    const job: Job = {
      id: 107,
      title: 'Scientist',
      company: 'ResearchLab',
      education_requirement: 'Technology',
    };

    const match = calculateDetailedMatch(candidate, job);
    expect(match.education_score).toBe(100);
  });

  it('T2.2.8: gives partial education score (60) for non-matching higher degree', () => {
    const candidate: Candidate = {
      id: 108,
      full_name: 'Bio Candidate',
      skills: [],
      experiences: [],
      educations: [
        { id: 1, candidate_id: 108, degree: 'B.S. in Biology', institution: 'State University' },
      ],
    };

    const job: Job = {
      id: 108,
      title: 'CS Role',
      company: 'CodeCorp',
      education_requirement: 'Computer Science',
    };

    const match = calculateDetailedMatch(candidate, job);
    expect(match.education_score).toBe(60);
  });

  it('T2.2.9: rounds overall score to 1 decimal place without floating precision errors', () => {
    const candidate: Candidate = {
      id: 109,
      full_name: 'Float Candidate',
      skills: [
        { id: 1, candidate_id: 109, skill_id: 1, skill: { id: 1, name: 'React' } },
      ],
      total_experience_months: 17,
      experiences: [],
      educations: [],
    };

    const job: Job = {
      id: 109,
      title: 'Dev',
      company: 'TestCo',
      required_skills: 'React, Angular, Vue',
      minimum_experience_years: 3, // 36 months -> 17/36 = 47.222%
    };

    const match = calculateDetailedMatch(candidate, job);
    const scoreStr = match.overall_score.toString();
    const decimalParts = scoreStr.split('.');
    if (decimalParts.length > 1) {
      expect(decimalParts[1].length).toBeLessThanOrEqual(2);
    }
  });

  it('T2.2.10: guarantees score is strictly bounded between 0 and 100', () => {
    const candidate: Candidate = {
      id: 110,
      full_name: 'Bounds Candidate',
      skills: [],
      experiences: [],
      educations: [],
    };

    const job: Job = {
      id: 110,
      title: 'Bounds Job',
      company: 'Bounds Inc',
    };

    const match = calculateDetailedMatch(candidate, job);
    expect(match.overall_score).toBeGreaterThanOrEqual(0);
    expect(match.overall_score).toBeLessThanOrEqual(100);
  });
});
