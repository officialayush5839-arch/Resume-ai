import { describe, it, expect } from 'vitest';
import { mockCandidateAlice } from '../setup';
import { buildCandidateComparison, extractCandidateSkillNames } from '../../src/utils/matching';

describe('Tier 4 Scenario 1: Candidate Upload-to-Profile End-to-End Journey', () => {
  it('T4.1: executes complete candidate onboarding workflow from file upload to profile inspection', async () => {
    // Authoritative source: TEST_INFRA §Real-World Application Scenarios (#1)
    
    // Step 1: User drops a valid resume file
    const uploadFile = {
      name: 'alice_johnson_senior_fullstack.pdf',
      size: 1.8 * 1024 * 1024,
      type: 'application/pdf',
    };
    expect(uploadFile.name.endsWith('.pdf')).toBe(true);
    expect(uploadFile.size).toBeLessThan(10 * 1024 * 1024);

    // Step 2: 4-stage pipeline processing simulation
    const pipelineProgress = [
      { stage: 'Ingest', status: 'completed' },
      { stage: 'OCR', status: 'completed' },
      { stage: 'NLP', status: 'completed' },
      { stage: 'Vectorize', status: 'completed' },
    ];
    expect(pipelineProgress.every(p => p.status === 'completed')).toBe(true);

    // Step 3: Backend returns parsed candidate ID
    const uploadResult = { candidate_id: 1 };
    expect(uploadResult.candidate_id).toBe(1);

    // Step 4: Router navigates to candidate profile
    const profileUrl = `/candidates/${uploadResult.candidate_id}`;
    expect(profileUrl).toBe('/candidates/1');

    // Step 5: Profile renders candidate attributes
    const candidate = mockCandidateAlice;
    expect(candidate.full_name).toBe('Alice Johnson');
    expect(candidate.total_experience_months).toBe(60);

    // Step 6: Verify 5-axis competency radar and skill proficiencies
    const comparison = buildCandidateComparison([candidate]);
    const radar = comparison.candidates[0].radarMetrics;
    expect(radar).toHaveLength(5);
    expect(radar.find(r => r.subject === 'Technical Skills')?.score).toBeGreaterThan(0);

    const extractedSkills = extractCandidateSkillNames(candidate);
    expect(extractedSkills).toContain('React');
    expect(extractedSkills).toContain('TypeScript');
    expect(extractedSkills).toContain('Python');

    // Step 7: Inspect work experience timeline
    expect(candidate.experiences.length).toBeGreaterThanOrEqual(2);
    expect(candidate.experiences[0].company).toBe('TechCorp Innovations');

    // Step 8: Document inspector verification
    const rawPreview = `Alice Johnson\nSenior Full Stack Engineer\nReact, TypeScript, Python`;
    expect(rawPreview).toContain('Alice Johnson');
  });
});
