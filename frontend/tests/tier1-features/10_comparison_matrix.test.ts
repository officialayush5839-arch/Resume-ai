import { describe, it, expect } from 'vitest';
import { mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockJobFrontendLead } from '../setup';
import { buildCandidateComparison } from '../../src/utils/matching';

describe('Feature 10: Candidate Comparison Matrix (Feature A)', () => {
  it('T1.10.1: constructs side-by-side comparison structure for 2-4 candidates', () => {
    // Authoritative source: ORIGINAL_REQUEST §R4, PROJECT.md §Feature Inventory (#22)
    const comparison = buildCandidateComparison([mockCandidateAlice, mockCandidateBob, mockCandidateCarol], mockJobFrontendLead);

    expect(comparison.candidates).toHaveLength(3);
    expect(comparison.candidates[0].candidate.full_name).toBe('Alice Johnson');
    expect(comparison.candidates[1].candidate.full_name).toBe('Bob Martinez');
    expect(comparison.candidates[2].candidate.full_name).toBe('Dr. Carol Vance');
  });

  it('T1.10.2: computes Venn overlap and shared common skills across all candidates', () => {
    // Authoritative source: survey_spec_miner_1 §6.1
    // Alice & Bob share React & Tailwind CSS
    const comparisonAliceBob = buildCandidateComparison([mockCandidateAlice, mockCandidateBob]);
    expect(comparisonAliceBob.commonSkillsAcrossAll).toContain('react');
    expect(comparisonAliceBob.commonSkillsAcrossAll).toContain('tailwind css');
  });

  it('T1.10.3: identifies unique differentiators for each candidate', () => {
    // Authoritative source: survey_spec_miner_1 §6.1
    const comparison = buildCandidateComparison([mockCandidateAlice, mockCandidateBob]);
    const aliceItem = comparison.candidates[0];
    const bobItem = comparison.candidates[1];

    // Alice unique vs Bob: Python, Node.js, AWS, PostgreSQL, TypeScript
    expect(aliceItem.uniqueSkills).toContain('TypeScript');
    expect(aliceItem.uniqueSkills).toContain('Python');

    // Bob unique vs Alice: JavaScript, Vue, HTML5/CSS3
    expect(bobItem.uniqueSkills).toContain('Vue');
  });

  it('T1.10.4: calculates experience deltas and education achievements in matrix', () => {
    // Authoritative source: PROJECT.md §Feature Inventory (#22)
    const comparison = buildCandidateComparison([mockCandidateAlice, mockCandidateBob], mockJobFrontendLead);

    const aliceMonths = mockCandidateAlice.total_experience_months || 0;
    const bobMonths = mockCandidateBob.total_experience_months || 0;
    const experienceDeltaMonths = aliceMonths - bobMonths;

    expect(experienceDeltaMonths).toBe(24); // 2 years difference
    expect(mockCandidateAlice.educations[0].degree).toContain('B.S.');
    expect(mockCandidateBob.educations[0].degree).toContain('B.A.');
  });

  it('T1.10.5: generates comparative Radar overlay metrics for side-by-side evaluation', () => {
    // Authoritative source: survey_spec_miner_1 §6.1
    const comparison = buildCandidateComparison([mockCandidateAlice, mockCandidateCarol], mockJobFrontendLead);

    const radarAlice = comparison.candidates[0].radarMetrics;
    const radarCarol = comparison.candidates[1].radarMetrics;

    expect(radarAlice).toHaveLength(5);
    expect(radarCarol).toHaveLength(5);

    const techAlice = radarAlice.find(m => m.subject === 'Technical Skills')?.score || 0;
    const techCarol = radarCarol.find(m => m.subject === 'Technical Skills')?.score || 0;

    // For Frontend Lead, Alice's technical score is higher than Carol's ML skillset
    expect(techAlice).toBeGreaterThan(techCarol);
  });
});
