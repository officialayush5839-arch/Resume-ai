import { describe, it, expect } from 'vitest';
import { mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave } from '../setup';
import { filterAndSortCandidates, extractCandidateSkillNames } from '../../src/utils/matching';
import { Candidate, CandidateFilterCriteria } from '../../src/types';

describe('Tier 4 Scenario 4: Filtered Talent Search by Experience & Skills Journey', () => {
  it('T4.4: executes advanced multi-facet talent search with live inspection', async () => {
    // Authoritative source: TEST_INFRA §Real-World Application Scenarios (#4)
    
    // Step 1: Synthesize a realistic 10-candidate talent pool
    const extraCandidates: Candidate[] = [
      {
        id: 5,
        full_name: 'Elena Rostova',
        email: 'elena.rostova@tech.io',
        location: 'San Francisco, CA',
        summary: 'Staff Frontend Engineer specialized in React, TypeScript, and WebGL with 8 years experience.',
        total_experience_months: 96,
        skills: [
          { id: 21, candidate_id: 5, skill_id: 1, skill: { id: 1, name: 'React' } },
          { id: 22, candidate_id: 5, skill_id: 2, skill: { id: 2, name: 'TypeScript' } },
          { id: 23, candidate_id: 5, skill_id: 15, skill: { id: 15, name: 'WebGL' } },
        ],
        experiences: [],
        educations: [],
      },
      {
        id: 6,
        full_name: 'Frank Chen',
        email: 'frank.chen@dev.com',
        location: 'San Francisco, CA',
        summary: 'Frontend Engineer with React and Next.js experience.',
        total_experience_months: 24,
        skills: [
          { id: 24, candidate_id: 6, skill_id: 1, skill: { id: 1, name: 'React' } },
          { id: 25, candidate_id: 6, skill_id: 16, skill: { id: 16, name: 'Next.js' } },
        ],
        experiences: [],
        educations: [],
      },
    ];

    const talentPool = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave, ...extraCandidates];
    expect(talentPool).toHaveLength(6);

    // Step 2: Recruiter applies multi-facet filter criteria
    // Criteria: Location = 'San Francisco, CA', Skills = ['React', 'TypeScript'] in 'all' mode, Min Exp = 4 years
    const criteria: CandidateFilterCriteria = {
      searchQuery: '',
      selectedSkills: ['React', 'TypeScript'],
      skillMatchMode: 'all',
      minExperienceYears: 4,
      location: 'San Francisco, CA',
      sortBy: 'experience_desc',
    };

    const searchResults = filterAndSortCandidates(talentPool, criteria);

    // Step 3: Verify filtered and sorted results
    // Only Elena (8 yrs) and Alice (5 yrs) qualify
    expect(searchResults).toHaveLength(2);
    expect(searchResults[0].full_name).toBe('Elena Rostova');
    expect(searchResults[1].full_name).toBe('Alice Johnson');

    // Step 4: Verify search results meet all criteria
    searchResults.forEach(cand => {
      expect(cand.location).toBe('San Francisco, CA');
      expect((cand.total_experience_months || 0) / 12).toBeGreaterThanOrEqual(4);
      const candSkills = extractCandidateSkillNames(cand);
      expect(candSkills).toContain('React');
      expect(candSkills).toContain('TypeScript');
    });

    // Step 5: Quick preview verification on top candidate
    const topCandidate = searchResults[0];
    expect(topCandidate.summary).toContain('Staff Frontend Engineer');
  });
});
