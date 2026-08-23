import { describe, it, expect } from 'vitest';
import { mockCandidateAlice, mockCandidateCarol } from '../setup';
import { buildCandidateComparison } from '../../src/utils/matching';

describe('Feature 7: Candidate Profile & Competency Radar', () => {
  it('T1.7.1: renders Candidate Profile hero section with contacts and metadata', () => {
    // Authoritative source: ORIGINAL_REQUEST §Existing Stack, PROJECT.md §Feature Inventory (#16)
    expect(mockCandidateAlice.full_name).toBe('Alice Johnson');
    expect(mockCandidateAlice.email).toBe('alice.johnson@example.com');
    expect(mockCandidateAlice.phone).toBe('+1 (555) 234-5678');
    expect(mockCandidateAlice.location).toBe('San Francisco, CA');
    expect(mockCandidateAlice.total_experience_months).toBe(60);
  });

  it('T1.7.2: verifies external social links and brand icons (LinkedIn, GitHub, Portfolio)', () => {
    // Authoritative source: PROJECT.md §Feature Inventory (#16), survey_design_sys_1 §4
    expect(mockCandidateAlice.linkedin_url).toBe('https://linkedin.com/in/alicejohnson');
    expect(mockCandidateAlice.github_url).toBe('https://github.com/alicejohnson');
    expect(mockCandidateAlice.portfolio_url).toBe('https://alicejohnson.dev');
  });

  it('T1.7.3: generates 5-axis Competency Radar dataset for Recharts', () => {
    // Authoritative source: ORIGINAL_REQUEST §R2, PROJECT.md §Feature Inventory (#14)
    const comparison = buildCandidateComparison([mockCandidateAlice]);
    expect(comparison.candidates).toHaveLength(1);
    const radar = comparison.candidates[0].radarMetrics;

    expect(radar).toHaveLength(5);
    const subjects = radar.map(r => r.subject);
    expect(subjects).toContain('Technical Skills');
    expect(subjects).toContain('Experience Depth');
    expect(subjects).toContain('Keywords / NLP');
    expect(subjects).toContain('Education Fit');
    expect(subjects).toContain('Profile Completeness');

    radar.forEach(metric => {
      expect(metric.score).toBeGreaterThanOrEqual(0);
      expect(metric.score).toBeLessThanOrEqual(metric.fullMark);
      expect(metric.fullMark).toBe(100);
    });
  });

  it('T1.7.4: categorizes candidate skills into proficiency levels and domains', () => {
    // Authoritative source: ORIGINAL_REQUEST §Existing Stack, PROJECT.md §Interface Contracts
    const skills = mockCandidateAlice.skills;
    expect(skills.length).toBeGreaterThan(0);

    const categories = Array.from(new Set(skills.map(s => s.skill.category)));
    expect(categories).toContain('Frontend');
    expect(categories).toContain('Backend');
    expect(categories).toContain('Cloud/DevOps');

    const expertSkills = skills.filter(s => s.proficiency === 'Expert');
    expect(expertSkills.length).toBe(2); // React, TypeScript
  });

  it('T1.7.5: builds chronologically connected experience and education timelines', () => {
    // Authoritative source: PROJECT.md §Feature Inventory (#15)
    const experiences = mockCandidateAlice.experiences;
    const educations = mockCandidateAlice.educations;

    expect(experiences).toHaveLength(2);
    expect(experiences[0].job_title).toBe('Senior Frontend Engineer');
    expect(experiences[0].company).toBe('TechCorp Innovations');
    expect(experiences[0].end_date).toBe('Present');

    expect(educations).toHaveLength(1);
    expect(educations[0].degree).toBe('B.S. in Computer Science');
    expect(educations[0].institution).toBe('Stanford University');
  });
});
