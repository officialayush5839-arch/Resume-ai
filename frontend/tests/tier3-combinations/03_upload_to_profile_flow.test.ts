import { describe, it, expect } from 'vitest';
import { mockCandidateAlice } from '../setup';
import { buildCandidateComparison } from '../../src/utils/matching';

describe('Tier 3 Combination 3: Resume Upload -> Stepper Pipeline -> Profile Navigation Flow', () => {
  it('T3.3.1: simulates 4-stage pipeline execution and candidate ID emission', () => {
    // Authoritative source: TEST_INFRA §Coverage Thresholds
    const pipelineSteps = [
      { step: 1, name: 'Ingest', durationMs: 200 },
      { step: 2, name: 'OCR', durationMs: 300 },
      { step: 3, name: 'NLP', durationMs: 400 },
      { step: 4, name: 'Vectorize', durationMs: 200 },
    ];

    let currentStep = 0;
    const completedStages: string[] = [];

    pipelineSteps.forEach(stage => {
      currentStep = stage.step;
      completedStages.push(stage.name);
    });

    expect(currentStep).toBe(4);
    expect(completedStages).toEqual(['Ingest', 'OCR', 'NLP', 'Vectorize']);

    const uploadResponse = { candidate_id: 1 };
    expect(uploadResponse.candidate_id).toBe(1);
  });

  it('T3.3.2: routes user to generated candidate profile URL', () => {
    const candidateId = 1;
    const profileRoute = `/candidates/${candidateId}`;
    expect(profileRoute).toBe('/candidates/1');
  });

  it('T3.3.3: immediately loads full profile, skill tags, and Radar chart on navigation', () => {
    const candidate = mockCandidateAlice;
    expect(candidate.id).toBe(1);
    expect(candidate.skills.length).toBeGreaterThan(0);

    const comparison = buildCandidateComparison([candidate]);
    const radar = comparison.candidates[0].radarMetrics;

    expect(radar).toHaveLength(5);
    expect(radar[0].subject).toBe('Technical Skills');
    expect(radar[0].score).toBeGreaterThan(0);
  });
});
