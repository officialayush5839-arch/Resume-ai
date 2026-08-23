import { describe, it, expect } from 'vitest';
import { mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockJobFrontendLead } from '../setup';
import { buildCandidateComparison } from '../../src/utils/matching';

describe('Tier 4 Scenario 3: Multi-Candidate Shortlisting & Matrix Comparison Journey', () => {
  it('T4.3: executes complete multi-candidate head-to-head comparison workflow against target job requisition', async () => {
    // Authoritative source: TEST_INFRA §Real-World Application Scenarios (#3)
    
    // Step 1: Recruiter selects 3 candidates from directory
    const selectedCandidates = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol];
    expect(selectedCandidates.length).toBe(3);

    // Step 2: Open comparison matrix with target job
    const matrix = buildCandidateComparison(selectedCandidates, mockJobFrontendLead);

    // Step 3: Verify comparison structure
    expect(matrix.job?.title).toBe('Senior Frontend Architect');
    expect(matrix.candidates).toHaveLength(3);

    // Step 4: Verify Venn analysis across candidates
    expect(matrix.allComparedSkills.length).toBeGreaterThan(5);
    
    // Step 5: Verify candidate individual score breakdowns
    const aliceData = matrix.candidates.find(c => c.candidate.full_name === 'Alice Johnson');
    const bobData = matrix.candidates.find(c => c.candidate.full_name === 'Bob Martinez');
    const carolData = matrix.candidates.find(c => c.candidate.full_name === 'Dr. Carol Vance');

    expect(aliceData).toBeDefined();
    expect(bobData).toBeDefined();
    expect(carolData).toBeDefined();

    // Alice is best fit for Frontend Lead
    expect(aliceData?.matchScore).toBeGreaterThan(bobData?.matchScore || 0);
    expect(aliceData?.matchScore).toBeGreaterThan(carolData?.matchScore || 0);

    // Step 6: Verify Radar overlay multi-axis comparison
    expect(aliceData?.radarMetrics).toHaveLength(5);
    expect(bobData?.radarMetrics).toHaveLength(5);
    expect(carolData?.radarMetrics).toHaveLength(5);

    // Step 7: Evaluate experience delta
    const expYearsAlice = (mockCandidateAlice.total_experience_months || 0) / 12;
    const expYearsBob = (mockCandidateBob.total_experience_months || 0) / 12;
    expect(expYearsAlice).toBe(5.0);
    expect(expYearsBob).toBe(3.0);
    expect(expYearsAlice - expYearsBob).toBe(2.0);
  });
});
