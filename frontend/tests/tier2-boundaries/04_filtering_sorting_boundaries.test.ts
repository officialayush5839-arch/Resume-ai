import { describe, it, expect } from 'vitest';
import { mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave } from '../setup';
import { filterAndSortCandidates } from '../../src/utils/matching';
import { Candidate, CandidateFilterCriteria } from '../../src/types';

describe('Tier 2 Boundary: Filtering & Sorting Corner Cases', () => {
  const candidatePool: Candidate[] = [
    mockCandidateAlice, // 60 mo, Alice Johnson
    mockCandidateBob,   // 36 mo, Bob Martinez
    mockCandidateCarol, // 72 mo, Dr. Carol Vance
    mockCandidateDave,  // 6 mo, Dave Wilson
  ];

  it('T2.4.1: treats whitespace-only search queries as neutral (returns all)', () => {
    // Authoritative source: TEST_INFRA §Coverage Thresholds
    const criteria: CandidateFilterCriteria = {
      searchQuery: '     ',
      selectedSkills: [],
      skillMatchMode: 'any',
      minExperienceYears: 0,
      location: '',
      sortBy: 'created_at_desc',
    };
    const result = filterAndSortCandidates(candidatePool, criteria);
    expect(result).toHaveLength(4);
  });

  it('T2.4.2: handles minExperienceYears = 0 without excluding zero-experience candidates', () => {
    const criteria: CandidateFilterCriteria = {
      searchQuery: '',
      selectedSkills: [],
      skillMatchMode: 'any',
      minExperienceYears: 0,
      location: '',
      sortBy: 'created_at_desc',
    };
    const result = filterAndSortCandidates(candidatePool, criteria);
    expect(result).toHaveLength(4);
  });

  it('T2.4.3: filters out all candidates when minExperienceYears exceeds talent pool max', () => {
    const criteria: CandidateFilterCriteria = {
      searchQuery: '',
      selectedSkills: [],
      skillMatchMode: 'any',
      minExperienceYears: 20, // 240 months
      location: '',
      sortBy: 'created_at_desc',
    };
    const result = filterAndSortCandidates(candidatePool, criteria);
    expect(result).toHaveLength(0);
  });

  it('T2.4.4: returns empty array when location filter matches nothing', () => {
    const criteria: CandidateFilterCriteria = {
      searchQuery: '',
      selectedSkills: [],
      skillMatchMode: 'any',
      minExperienceYears: 0,
      location: 'Antarctica',
      sortBy: 'created_at_desc',
    };
    const result = filterAndSortCandidates(candidatePool, criteria);
    expect(result).toHaveLength(0);
  });

  it('T2.4.5: returns empty array when skillMatchMode is "all" with mutually exclusive skills', () => {
    // No single candidate in mock pool has PyTorch (Carol) AND Vue (Bob)
    const criteria: CandidateFilterCriteria = {
      searchQuery: '',
      selectedSkills: ['PyTorch', 'Vue'],
      skillMatchMode: 'all',
      minExperienceYears: 0,
      location: '',
      sortBy: 'created_at_desc',
    };
    const result = filterAndSortCandidates(candidatePool, criteria);
    expect(result).toHaveLength(0);
  });

  it('T2.4.6: returns matching candidates when skillMatchMode is "any" with disjoint skills', () => {
    const criteria: CandidateFilterCriteria = {
      searchQuery: '',
      selectedSkills: ['PyTorch', 'Vue'],
      skillMatchMode: 'any',
      minExperienceYears: 0,
      location: '',
      sortBy: 'created_at_desc',
    };
    const result = filterAndSortCandidates(candidatePool, criteria);
    expect(result).toHaveLength(2); // Bob (Vue) + Carol (PyTorch)
  });

  it('T2.4.7: sorts candidates by experience descending (most to least)', () => {
    const criteria: CandidateFilterCriteria = {
      searchQuery: '',
      selectedSkills: [],
      skillMatchMode: 'any',
      minExperienceYears: 0,
      location: '',
      sortBy: 'experience_desc',
    };
    const result = filterAndSortCandidates(candidatePool, criteria);
    const months = result.map(c => c.total_experience_months || 0);
    expect(months).toEqual([72, 60, 36, 6]); // Carol, Alice, Bob, Dave
  });

  it('T2.4.8: sorts candidates by experience ascending (least to most)', () => {
    const criteria: CandidateFilterCriteria = {
      searchQuery: '',
      selectedSkills: [],
      skillMatchMode: 'any',
      minExperienceYears: 0,
      location: '',
      sortBy: 'experience_asc',
    };
    const result = filterAndSortCandidates(candidatePool, criteria);
    const months = result.map(c => c.total_experience_months || 0);
    expect(months).toEqual([6, 36, 60, 72]); // Dave, Bob, Alice, Carol
  });

  it('T2.4.9: sorts candidates alphabetically by name A to Z', () => {
    const criteria: CandidateFilterCriteria = {
      searchQuery: '',
      selectedSkills: [],
      skillMatchMode: 'any',
      minExperienceYears: 0,
      location: '',
      sortBy: 'name_asc',
    };
    const result = filterAndSortCandidates(candidatePool, criteria);
    const names = result.map(c => c.full_name);
    expect(names).toEqual(['Alice Johnson', 'Bob Martinez', 'Dave Wilson', 'Dr. Carol Vance']);
  });

  it('T2.4.10: maintains deterministic order when sorting candidates with null experience', () => {
    const nullExpCandidate: Candidate = {
      ...mockCandidateDave,
      id: 999,
      total_experience_months: null,
    };
    const pool = [mockCandidateAlice, nullExpCandidate];
    const criteria: CandidateFilterCriteria = {
      searchQuery: '',
      selectedSkills: [],
      skillMatchMode: 'any',
      minExperienceYears: 0,
      location: '',
      sortBy: 'experience_desc',
    };
    const result = filterAndSortCandidates(pool, criteria);
    expect(result[0].id).toBe(1); // Alice (60 mo) first
    expect(result[1].id).toBe(999); // null treated as 0
  });
});
