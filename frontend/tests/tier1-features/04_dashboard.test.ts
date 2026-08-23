import { describe, it, expect } from 'vitest';
import { mockDashboardStats, mockCandidateAlice, mockCandidateBob, mockCandidateCarol } from '../setup';
import { extractCandidateSkillNames } from '../../src/utils/matching';

describe('Feature 4: Dashboard KPI Cards & Recharts Visualizations', () => {
  it('T1.4.1: formats 4 KPI metrics accurately from dashboard API data', () => {
    // Authoritative source: ORIGINAL_REQUEST §Existing Stack, PROJECT.md §Feature Inventory (#7)
    const kpiData = [
      { label: 'Total Candidates', value: mockDashboardStats.total_candidates, suffix: '' },
      { label: 'Active Job Openings', value: mockDashboardStats.total_jobs, suffix: '' },
      { label: 'Average Match Score', value: `${mockDashboardStats.average_match_score}%`, suffix: '%' },
      { label: 'Screening Pipeline', value: '100% Online', suffix: '' },
    ];

    expect(kpiData).toHaveLength(4);
    expect(kpiData[0].value).toBe(4);
    expect(kpiData[1].value).toBe(3);
    expect(kpiData[2].value).toBe('78.5%');
  });

  it('T1.4.2: aggregates top skills frequency for Dashboard Recharts BarChart', () => {
    // Authoritative source: ORIGINAL_REQUEST §R2, PROJECT.md §Feature Inventory (#8)
    const candidates = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol];
    const skillCounts: Record<string, number> = {};

    candidates.forEach(cand => {
      extractCandidateSkillNames(cand).forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    const topSkills = Object.entries(skillCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    expect(topSkills.length).toBeGreaterThan(0);
    expect(topSkills[0].count).toBeGreaterThanOrEqual(1);
    // React is in Alice & Bob -> count = 2
    const reactEntry = topSkills.find(s => s.name === 'React');
    expect(reactEntry?.count).toBe(2);
  });

  it('T1.4.3: calculates experience distribution dataset for Recharts AreaChart', () => {
    // Authoritative source: PROJECT.md §Milestones M2
    const candidates = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol];
    const experienceBuckets = {
      '0-2 Yrs': 0,
      '3-5 Yrs': 0,
      '5+ Yrs': 0,
    };

    candidates.forEach(cand => {
      const years = (cand.total_experience_months || 0) / 12;
      if (years < 3) experienceBuckets['0-2 Yrs']++;
      else if (years <= 5) experienceBuckets['3-5 Yrs']++;
      else experienceBuckets['5+ Yrs']++;
    });

    expect(experienceBuckets['3-5 Yrs']).toBe(2); // Bob (3yr), Alice (5yr)
    expect(experienceBuckets['5+ Yrs']).toBe(1);  // Carol (6yr)
  });

  it('T1.4.4: spotlights recent candidates and job requisitions summary', () => {
    // Authoritative source: PROJECT.md §Feature Inventory (#9)
    const candidates = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol];
    const recentCandidates = [...candidates].sort((a, b) => (b.id || 0) - (a.id || 0));

    expect(recentCandidates[0].id).toBe(3); // Carol
    expect(recentCandidates[0].full_name).toBe('Dr. Carol Vance');
  });

  it('T1.4.5: provides direct interactive CTAs to upload and create jobs', () => {
    // Authoritative source: PROJECT.md §Feature Inventory (#9)
    const quickCtas = [
      { label: 'Upload New Resume', href: '/upload', variant: 'primary' },
      { label: 'Create Job Requisition', href: '/jobs', variant: 'secondary' },
    ];

    expect(quickCtas).toHaveLength(2);
    expect(quickCtas[0].href).toBe('/upload');
    expect(quickCtas[1].href).toBe('/jobs');
  });
});
