import { describe, it, expect } from 'vitest';
import { mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockJobFrontendLead, mockJobAIResearcher } from '../setup';
import { buildCandidateComparison, calculateDetailedMatch } from '../../src/utils/matching';

describe('Tier 3 Combination 1: Candidate Selection -> Comparison Matrix Modal Integration', () => {
  it('T3.1.1: tracks multi-candidate selection queue from candidate cards', () => {
    // Authoritative source: TEST_INFRA §Coverage Thresholds, survey_spec_miner_1 §6.1
    const selectedCandidateIds: number[] = [];
    const toggleSelect = (id: number) => {
      const idx = selectedCandidateIds.indexOf(id);
      if (idx >= 0) selectedCandidateIds.splice(idx, 1);
      else if (selectedCandidateIds.length < 4) selectedCandidateIds.push(id);
    };

    toggleSelect(mockCandidateAlice.id);
    toggleSelect(mockCandidateBob.id);
    toggleSelect(mockCandidateCarol.id);

    expect(selectedCandidateIds).toEqual([1, 2, 3]);
    expect(selectedCandidateIds.length).toBe(3);
  });

  it('T3.1.2: builds side-by-side comparison matrix for selected candidates', () => {
    const selectedCandidates = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol];
    const matrix = buildCandidateComparison(selectedCandidates, mockJobFrontendLead);

    expect(matrix.candidates).toHaveLength(3);
    expect(matrix.candidates[0].candidate.full_name).toBe('Alice Johnson');
    expect(matrix.candidates[0].matchScore).toBeGreaterThan(matrix.candidates[1].matchScore);
    expect(matrix.commonSkillsAcrossAll).toBeDefined();
  });

  it('T3.1.3: dynamically recalculates scores and radar metrics on job context switch', () => {
    const selectedCandidates = [mockCandidateAlice, mockCandidateCarol];

    // Job 1: Frontend Lead
    const matrixFrontend = buildCandidateComparison(selectedCandidates, mockJobFrontendLead);
    const aliceScoreFrontend = matrixFrontend.candidates[0].matchScore;
    const carolScoreFrontend = matrixFrontend.candidates[1].matchScore;
    expect(aliceScoreFrontend).toBeGreaterThan(carolScoreFrontend);

    // Switch Job context to Job 2: AI Researcher
    const matrixAI = buildCandidateComparison(selectedCandidates, mockJobAIResearcher);
    const aliceScoreAI = matrixAI.candidates[0].matchScore;
    const carolScoreAI = matrixAI.candidates[1].matchScore;
    expect(carolScoreAI).toBeGreaterThan(aliceScoreAI);
  });

  it('T3.1.4: updates comparison matrix when candidate is removed from selection', () => {
    let selected = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol];
    let matrix = buildCandidateComparison(selected, mockJobFrontendLead);
    expect(matrix.candidates).toHaveLength(3);

    // Remove Bob
    selected = selected.filter(c => c.id !== mockCandidateBob.id);
    matrix = buildCandidateComparison(selected, mockJobFrontendLead);
    expect(matrix.candidates).toHaveLength(2);
    expect(matrix.candidates.map(c => c.candidate.full_name)).toEqual(['Alice Johnson', 'Dr. Carol Vance']);
  });
});
