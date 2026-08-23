import { describe, it, expect } from 'vitest';
import { mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave } from '../setup';
import { calculateDetailedMatch, getScoreTier } from '../../src/utils/matching';
import { Job, JobCreatePayload } from '../../src/types';

describe('Tier 4 Scenario 2: Job Creation & Automated Candidate Ranking Screening Journey', () => {
  it('T4.2: creates job requisition and ranks full talent pool with visual score gauges', async () => {
    // Authoritative source: TEST_INFRA §Real-World Application Scenarios (#2)
    
    // Step 1: Hiring manager fills Create Job form
    const newJobPayload: JobCreatePayload = {
      title: 'Principal AI Engineer',
      company: 'NeuroPulse Systems',
      description: 'Lead research in Large Language Models and Deep Learning architectures.',
      required_skills: 'Python, PyTorch, Deep Learning, Machine Learning',
      preferred_skills: 'FastAPI, AWS, Docker',
      minimum_experience_years: 5,
      education_requirement: 'Computer Science',
      location: 'Seattle, WA',
    };

    expect(newJobPayload.title).toBe('Principal AI Engineer');
    expect(newJobPayload.minimum_experience_years).toBe(5);

    // Step 2: System creates job record with ID
    const createdJob: Job = {
      ...newJobPayload,
      id: 50,
      created_at: new Date().toISOString(),
    };

    // Step 3: Fetch full talent pool and calculate match scores
    const talentPool = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave];
    const candidateRankings = talentPool.map(candidate => {
      const breakdown = calculateDetailedMatch(candidate, createdJob);
      const scoreTier = getScoreTier(breakdown.overall_score);
      return {
        candidate,
        breakdown,
        scoreTier,
      };
    }).sort((a, b) => b.breakdown.overall_score - a.breakdown.overall_score);

    // Step 4: Verify ranking hierarchy
    // Dr. Carol Vance (Ph.D. CS, 6 yrs, PyTorch/Deep Learning/Python) MUST rank #1
    expect(candidateRankings[0].candidate.full_name).toBe('Dr. Carol Vance');
    expect(candidateRankings[0].breakdown.overall_score).toBeGreaterThanOrEqual(85);
    expect(candidateRankings[0].scoreTier.tier).toBe('Excellent Match');
    expect(candidateRankings[0].scoreTier.color).toBe('#10B981'); // Emerald

    // Step 5: Verify missing skills on non-matching candidates
    const aliceRank = candidateRankings.find(r => r.candidate.full_name === 'Alice Johnson');
    expect(aliceRank).toBeDefined();
    expect(aliceRank?.breakdown.missing_skills).toContain('PyTorch');
    expect(aliceRank?.breakdown.missing_skills).toContain('Deep Learning');

    // Step 6: Verify hiring recommendation synthesis
    expect(candidateRankings[0].breakdown.recommendation).toBe('Strong Match');
    expect(candidateRankings[0].breakdown.strengths.length).toBeGreaterThan(0);
  });
});
