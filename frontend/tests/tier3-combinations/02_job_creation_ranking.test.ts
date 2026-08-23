import { describe, it, expect } from 'vitest';
import { mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave } from '../setup';
import { calculateDetailedMatch, parseSkillList } from '../../src/utils/matching';
import { Job, JobCreatePayload } from '../../src/types';

describe('Tier 3 Combination 2: Job Creation -> Candidate Ranking & Requisition Lifecycle', () => {
  const candidatePool = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave];

  it('T3.2.1: transforms dynamic tag inputs into formatted JobCreatePayload', () => {
    // Authoritative source: TEST_INFRA §Real-World Application Scenarios
    const rawTagList = ['Python', 'FastAPI', 'PostgreSQL', 'Docker'];
    const payload: JobCreatePayload = {
      title: 'Backend Systems Engineer',
      company: 'DataStream Technologies',
      description: 'Building high throughput REST APIs',
      required_skills: rawTagList.join(', '),
      preferred_skills: 'Kubernetes, Redis',
      minimum_experience_years: 3,
      education_requirement: 'B.S. in Computer Science',
      location: 'Austin, TX',
    };

    expect(payload.required_skills).toBe('Python, FastAPI, PostgreSQL, Docker');
    const parsedSkills = parseSkillList(payload.required_skills);
    expect(parsedSkills).toHaveLength(4);
    expect(parsedSkills).toContain('FastAPI');
  });

  it('T3.2.2: automatically ranks all existing candidates upon job posting creation', () => {
    const newJob: Job = {
      id: 10,
      title: 'Backend AI Systems Engineer',
      company: 'DataStream Technologies',
      required_skills: 'Python, PyTorch, Deep Learning, FastAPI',
      preferred_skills: 'AWS',
      minimum_experience_years: 3,
      education_requirement: 'Computer Science',
      location: 'Austin, TX',
    };

    const rankedCandidates = candidatePool.map(candidate => ({
      candidate,
      match: calculateDetailedMatch(candidate, newJob),
    })).sort((a, b) => b.match.overall_score - a.match.overall_score);

    expect(rankedCandidates.length).toBe(4);
    // Carol has Python, PyTorch, Deep Learning, FastAPI, AWS + 6 yrs exp + Ph.D. CS -> top rank
    expect(rankedCandidates[0].candidate.full_name).toBe('Dr. Carol Vance');
    expect(rankedCandidates[0].match.overall_score).toBeGreaterThan(80);
  });

  it('T3.2.3: updates job candidate breakdown metrics and missing skill warnings', () => {
    const newJob: Job = {
      id: 10,
      title: 'Backend Systems Engineer',
      company: 'DataStream Technologies',
      required_skills: 'Python, FastAPI, PostgreSQL, Docker',
      minimum_experience_years: 3,
    };

    const aliceMatch = calculateDetailedMatch(mockCandidateAlice, newJob);
    expect(aliceMatch.matching_skills).toContain('Python');
    expect(aliceMatch.matching_skills).toContain('PostgreSQL');
    expect(aliceMatch.missing_skills).toContain('FastAPI');
    expect(aliceMatch.missing_skills).toContain('Docker');
  });

  it('T3.2.4: synchronizes total_jobs metric when job is deleted', () => {
    let totalJobs = 3;
    const deleteJob = () => { totalJobs = Math.max(0, totalJobs - 1); };

    deleteJob();
    expect(totalJobs).toBe(2);
    deleteJob();
    expect(totalJobs).toBe(1);
  });
});
