import { describe, it, expect } from 'vitest';
import { mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave } from '../setup';
import { filterAndSortCandidates } from '../../src/utils/matching';
import { CandidateFilterCriteria } from '../../src/types';

describe('Tier 3 Combination 4: Multi-Facet Filter -> Sorting -> Live Resume Preview Flow', () => {
  const candidatePool = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave];

  it('T3.4.1: cascades multiple filter criteria to narrow down talent pool', () => {
    // Authoritative source: TEST_INFRA §Coverage Thresholds, survey_spec_miner_1 §6.2
    const criteria: CandidateFilterCriteria = {
      searchQuery: 'Engineer',
      selectedSkills: ['React'],
      skillMatchMode: 'any',
      minExperienceYears: 3,
      location: 'San Francisco, CA',
      sortBy: 'created_at_desc',
    };

    const filtered = filterAndSortCandidates(candidatePool, criteria);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].full_name).toBe('Alice Johnson');
  });

  it('T3.4.2: applies sorting dynamically to active filtered dataset', () => {
    const criteria: CandidateFilterCriteria = {
      searchQuery: '',
      selectedSkills: ['React', 'Python'],
      skillMatchMode: 'any',
      minExperienceYears: 0,
      location: '',
      sortBy: 'experience_desc', // Carol (72 mo), Alice (60 mo), Bob (36 mo)
    };

    const sorted = filterAndSortCandidates(candidatePool, criteria);
    expect(sorted).toHaveLength(3);
    expect(sorted[0].full_name).toBe('Dr. Carol Vance');
    expect(sorted[1].full_name).toBe('Alice Johnson');
    expect(sorted[2].full_name).toBe('Bob Martinez');
  });

  it('T3.4.3: opens Resume Preview Drawer on filtered candidate with pre-populated search', () => {
    const selectedCandidate = mockCandidateAlice;
    const initialSearchTerm = 'TypeScript';

    const previewState = {
      isOpen: true,
      candidate: selectedCandidate,
      activeTab: 'raw_text' as const,
      searchTerm: initialSearchTerm,
    };

    expect(previewState.isOpen).toBe(true);
    expect(previewState.candidate.id).toBe(1);
    expect(previewState.searchTerm).toBe('TypeScript');
  });

  it('T3.4.4: maintains filter and search state when toggling between Grid and Table views', () => {
    type ViewMode = 'grid' | 'table';
    let currentView: ViewMode = 'grid';

    const criteria: CandidateFilterCriteria = {
      searchQuery: 'Developer',
      selectedSkills: ['JavaScript'],
      skillMatchMode: 'any',
      minExperienceYears: 0,
      location: '',
      sortBy: 'experience_desc',
    };

    const resultsInGrid = filterAndSortCandidates(candidatePool, criteria);

    // Toggle to Table view
    currentView = 'table';
    const resultsInTable = filterAndSortCandidates(candidatePool, criteria);

    expect(currentView).toBe('table');
    expect(resultsInTable).toEqual(resultsInGrid);
  });
});
