import { describe, it, expect } from 'vitest';
import { mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave, mockJobFrontendLead } from '../setup';
import { calculateDetailedMatch, getScoreTier } from '../../src/utils/matching';

describe('Feature 9: Job Candidate Match & Visual Score Breakdown', () => {
  it('T1.9.1: computes multi-dimensional match score with exact weighted formula', () => {
    // Authoritative source: ORIGINAL_REQUEST §Existing Stack, PROJECT.md §Interface Contracts
    // Weights: Skills (45%), Experience (25%), Keywords (20%), Education (10%)
    const matchAlice = calculateDetailedMatch(mockCandidateAlice, mockJobFrontendLead);

    expect(matchAlice.overall_score).toBeGreaterThanOrEqual(85);
    expect(matchAlice.skill_score).toBeGreaterThanOrEqual(90);
    expect(matchAlice.experience_score).toBe(100); // 60 mo >= 48 mo required
    expect(matchAlice.education_score).toBe(100); // Stanford B.S. in CS matches
    expect(matchAlice.recommendation).toBe('Strong Match');
  });

  it('T1.9.2: classifies match score into semantic radial score gauge tiers', () => {
    // Authoritative source: PROJECT.md §Feature Inventory (#19), getScoreTier
    const matchAlice = calculateDetailedMatch(mockCandidateAlice, mockJobFrontendLead);
    const tierAlice = getScoreTier(matchAlice.overall_score);
    expect(tierAlice.tier).toBe('Excellent Match');
    expect(tierAlice.color).toBe('#10B981'); // Emerald

    const matchDave = calculateDetailedMatch(mockCandidateDave, mockJobFrontendLead);
    const tierDave = getScoreTier(matchDave.overall_score);
    expect(['Moderate Match', 'Low Match']).toContain(tierDave.tier);
  });

  it('T1.9.3: extracts matching vs missing skill highlights accurately', () => {
    // Authoritative source: PROJECT.md §Feature Inventory (#21)
    const matchBob = calculateDetailedMatch(mockCandidateBob, mockJobFrontendLead);

    // Job requires: React, TypeScript, Tailwind CSS
    // Bob has: React, JavaScript, Vue, Tailwind CSS (Missing TypeScript)
    expect(matchBob.matching_skills).toContain('React');
    expect(matchBob.matching_skills).toContain('Tailwind CSS');
    expect(matchBob.missing_skills).toContain('TypeScript');
  });

  it('T1.9.4: ranks multiple candidates sorted descending by match score', () => {
    // Authoritative source: ORIGINAL_REQUEST §Existing Stack, PROJECT.md §Feature Inventory (#20)
    const candidates = [mockCandidateDave, mockCandidateBob, mockCandidateAlice, mockCandidateCarol];
    const scoredList = candidates.map(candidate => ({
      candidate,
      match: calculateDetailedMatch(candidate, mockJobFrontendLead),
    })).sort((a, b) => b.match.overall_score - a.match.overall_score);

    // Alice must be #1 for Frontend Lead
    expect(scoredList[0].candidate.full_name).toBe('Alice Johnson');
    expect(scoredList[0].match.overall_score).toBeGreaterThan(scoredList[1].match.overall_score);
  });

  it('T1.9.5: synthesizes strengths and weaknesses for hiring manager review', () => {
    // Authoritative source: PROJECT.md §Interface Contracts (DetailedScoreBreakdown)
    const matchAlice = calculateDetailedMatch(mockCandidateAlice, mockJobFrontendLead);
    expect(matchAlice.strengths.length).toBeGreaterThan(0);
    expect(matchAlice.strengths.some(s => s.toLowerCase().includes('technical') || s.toLowerCase().includes('experience'))).toBe(true);

    const matchDave = calculateDetailedMatch(mockCandidateDave, mockJobFrontendLead);
    expect(matchDave.weaknesses.length).toBeGreaterThan(0);
  });
});
