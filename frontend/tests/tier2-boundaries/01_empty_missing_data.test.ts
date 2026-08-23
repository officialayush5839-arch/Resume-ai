import { describe, it, expect } from 'vitest';
import { calculateDetailedMatch, extractCandidateSkillNames, filterAndSortCandidates } from '../../src/utils/matching';
import { Candidate, Job, CandidateFilterCriteria } from '../../src/types';

describe('Tier 2 Boundary: Empty & Missing Data Handling', () => {
  const minimalCandidate: Candidate = {
    id: 99,
    full_name: 'No Skill Candidate',
    email: null,
    phone: null,
    location: null,
    linkedin_url: null,
    github_url: null,
    portfolio_url: null,
    summary: null,
    total_experience_months: 0,
    skills: [],
    experiences: [],
    educations: [],
  };

  const minimalJob: Job = {
    id: 99,
    title: 'Open Position',
    company: 'Generic Corp',
    description: null,
    required_skills: null,
    preferred_skills: null,
    minimum_experience_years: null,
    education_requirement: null,
    location: null,
  };

  it('T2.1.1: handles candidate with 0 skills without NaN or division by zero', () => {
    // Authoritative source: TEST_INFRA §Coverage Thresholds, survey_spec_miner_1 §4
    const match = calculateDetailedMatch(minimalCandidate, minimalJob);
    expect(Number.isNaN(match.overall_score)).toBe(false);
    expect(Number.isNaN(match.skill_score)).toBe(false);
    expect(match.skill_score).toBe(100); // 0 required skills -> default 100
  });

  it('T2.1.2: handles candidate with 0 experience months safely', () => {
    const jobWithExp: Job = { ...minimalJob, minimum_experience_years: 3 };
    const match = calculateDetailedMatch(minimalCandidate, jobWithExp);
    expect(match.experience_score).toBe(0);
    expect(Number.isNaN(match.experience_score)).toBe(false);
  });

  it('T2.1.3: handles candidate with all null/undefined optional fields', () => {
    const candidateSkills = extractCandidateSkillNames(minimalCandidate);
    expect(candidateSkills).toEqual([]);
  });

  it('T2.1.4: handles candidate with empty string summary', () => {
    const candWithEmptySummary: Candidate = { ...minimalCandidate, summary: '' };
    const jobWithSkills: Job = { ...minimalJob, required_skills: 'React, Node' };
    const match = calculateDetailedMatch(candWithEmptySummary, jobWithSkills);
    expect(match.keyword_score).toBe(0);
  });

  it('T2.1.5: handles candidate with empty educations array', () => {
    const jobWithEdu: Job = { ...minimalJob, education_requirement: 'Master of Science' };
    const match = calculateDetailedMatch(minimalCandidate, jobWithEdu);
    expect(match.education_score).toBe(20); // Fallback base score for missing education
  });

  it('T2.1.6: handles candidate with empty experiences array', () => {
    expect(minimalCandidate.experiences).toEqual([]);
    expect(minimalCandidate.total_experience_months).toBe(0);
  });

  it('T2.1.7: handles job with 0 required and 0 preferred skills', () => {
    const match = calculateDetailedMatch(minimalCandidate, minimalJob);
    expect(match.skill_score).toBe(100);
  });

  it('T2.1.8: handles job with empty education_requirement string', () => {
    const match = calculateDetailedMatch(minimalCandidate, { ...minimalJob, education_requirement: '' });
    expect(match.education_score).toBe(100); // No requirement = 100% match
  });

  it('T2.1.9: handles job with null minimum_experience_years', () => {
    const match = calculateDetailedMatch(minimalCandidate, { ...minimalJob, minimum_experience_years: null });
    expect(match.experience_score).toBe(100);
  });

  it('T2.1.10: handles filtering over completely empty candidate pool', () => {
    const criteria: CandidateFilterCriteria = {
      searchQuery: 'React',
      selectedSkills: ['TypeScript'],
      skillMatchMode: 'all',
      minExperienceYears: 5,
      location: 'NYC',
      sortBy: 'experience_desc',
    };
    const result = filterAndSortCandidates([], criteria);
    expect(result).toEqual([]);
  });
});
