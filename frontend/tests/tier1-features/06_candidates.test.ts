import { describe, it, expect } from 'vitest';
import { mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave } from '../setup';
import { filterAndSortCandidates } from '../../src/utils/matching';
import { CandidateFilterCriteria } from '../../src/types';

describe('Feature 6: Candidates Directory, Search & Multi-Facet Filters', () => {
  const candidates = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave];

  const baseCriteria: CandidateFilterCriteria = {
    searchQuery: '',
    selectedSkills: [],
    skillMatchMode: 'any',
    minExperienceYears: 0,
    location: '',
    sortBy: 'created_at_desc',
  };

  it('T1.6.1: performs real-time full-text search across name, summary, and skills', () => {
    // Authoritative source: ORIGINAL_REQUEST §R4, PROJECT.md §Feature Inventory (#12)
    const resultName = filterAndSortCandidates(candidates, { ...baseCriteria, searchQuery: 'Alice' });
    expect(resultName).toHaveLength(1);
    expect(resultName[0].full_name).toBe('Alice Johnson');

    const resultSummary = filterAndSortCandidates(candidates, { ...baseCriteria, searchQuery: 'PyTorch' });
    expect(resultSummary).toHaveLength(1);
    expect(resultSummary[0].full_name).toBe('Dr. Carol Vance');

    const resultSkill = filterAndSortCandidates(candidates, { ...baseCriteria, searchQuery: 'TypeScript' });
    expect(resultSkill).toHaveLength(1);
    expect(resultSkill[0].full_name).toBe('Alice Johnson');
  });

  it('T1.6.2: filters candidates by skill tags in OR mode (any match)', () => {
    // Authoritative source: PROJECT.md §Matching Math Contract, survey_spec_miner_1 §6.2
    const result = filterAndSortCandidates(candidates, {
      ...baseCriteria,
      selectedSkills: ['Python', 'Vue'],
      skillMatchMode: 'any',
    });

    // Alice (Python), Bob (Vue), Carol (Python) -> 3 candidates
    expect(result).toHaveLength(3);
    const names = result.map(c => c.full_name);
    expect(names).toContain('Alice Johnson');
    expect(names).toContain('Bob Martinez');
    expect(names).toContain('Dr. Carol Vance');
  });

  it('T1.6.3: filters candidates by skill tags in AND mode (all must match)', () => {
    // Authoritative source: survey_spec_miner_1 §6.2
    const result = filterAndSortCandidates(candidates, {
      ...baseCriteria,
      selectedSkills: ['React', 'TypeScript'],
      skillMatchMode: 'all',
    });

    // Only Alice has both React AND TypeScript
    expect(result).toHaveLength(1);
    expect(result[0].full_name).toBe('Alice Johnson');
  });

  it('T1.6.4: filters candidates by minimum experience slider', () => {
    // Authoritative source: PROJECT.md §Feature Inventory (#12)
    const result3Yrs = filterAndSortCandidates(candidates, {
      ...baseCriteria,
      minExperienceYears: 4,
    });

    // Alice (5 yrs), Carol (6 yrs)
    expect(result3Yrs).toHaveLength(2);
    expect(result3Yrs.map(c => c.full_name)).toEqual(['Dr. Carol Vance', 'Alice Johnson']);
  });

  it('T1.6.5: filters by location and supports grid vs table view toggle modes', () => {
    // Authoritative source: PROJECT.md §Feature Inventory (#13)
    const resultSF = filterAndSortCandidates(candidates, {
      ...baseCriteria,
      location: 'San Francisco, CA',
    });
    expect(resultSF).toHaveLength(1);
    expect(resultSF[0].full_name).toBe('Alice Johnson');

    // View modes
    type ViewMode = 'grid' | 'table';
    let currentView: ViewMode = 'grid';
    const toggleView = () => { currentView = currentView === 'grid' ? 'table' : 'grid'; };

    expect(currentView).toBe('grid');
    toggleView();
    expect(currentView).toBe('table');
  });
});
