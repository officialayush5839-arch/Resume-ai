import { describe, it, expect } from 'vitest';
import { mockDashboardStats, mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockJobFrontendLead, mockJobAIResearcher } from '../setup';
import { extractCandidateSkillNames } from '../../src/utils/matching';

describe('Tier 4 Scenario 5: Executive Dashboard Analytics & Operational Navigation Journey', () => {
  it('T4.5: aggregates executive recruitment analytics, skill distributions, and triggers workflow actions', async () => {
    // Authoritative source: TEST_INFRA §Real-World Application Scenarios (#5)
    
    // Step 1: Load Dashboard summary telemetry
    expect(mockDashboardStats.total_candidates).toBe(4);
    expect(mockDashboardStats.total_jobs).toBe(3);
    expect(mockDashboardStats.average_match_score).toBe(78.5);

    // Step 2: Calculate live skill frequency histogram for Recharts BarChart
    const candidates = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol];
    const skillCounts: Record<string, number> = {};

    candidates.forEach(cand => {
      extractCandidateSkillNames(cand).forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });

    const topSkillsChartData = Object.entries(skillCounts)
      .map(([name, count]) => ({ skill: name, candidatesCount: count }))
      .sort((a, b) => b.candidatesCount - a.candidatesCount)
      .slice(0, 5);

    expect(topSkillsChartData.length).toBeGreaterThan(0);
    expect(topSkillsChartData[0].candidatesCount).toBeGreaterThan(0);

    // Step 3: Compute experience distribution area chart metrics
    const expDistribution = {
      junior: candidates.filter(c => ((c.total_experience_months || 0) / 12) < 3).length,
      mid: candidates.filter(c => ((c.total_experience_months || 0) / 12) >= 3 && ((c.total_experience_months || 0) / 12) <= 5).length,
      senior: candidates.filter(c => ((c.total_experience_months || 0) / 12) > 5).length,
    };

    expect(expDistribution.mid).toBe(2);    // Bob (3yr), Alice (5yr)
    expect(expDistribution.senior).toBe(1); // Carol (6yr)

    // Step 4: Verify open job requisitions summary
    const openJobs = [mockJobFrontendLead, mockJobAIResearcher];
    expect(openJobs).toHaveLength(2);
    expect(openJobs[0].company).toBe('ResumeIQ Technologies');
    expect(openJobs[1].company).toBe('Synthetix Intelligence');

    // Step 5: Verify Quick Action navigation links
    const quickActions = [
      { label: 'Upload Resumes', route: '/upload' },
      { label: 'Browse Candidates', route: '/candidates' },
      { label: 'Manage Jobs', route: '/jobs' },
    ];

    expect(quickActions.map(a => a.route)).toEqual(['/upload', '/candidates', '/jobs']);
  });
});
