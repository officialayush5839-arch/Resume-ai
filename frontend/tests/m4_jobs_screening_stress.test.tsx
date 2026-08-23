import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Jobs from '../src/pages/Jobs';
import JobCandidates from '../src/pages/JobCandidates';
import { calculateDetailedMatch, getScoreTier, parseSkillList, normalizeSkill } from '../src/utils/matching';
import { mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave, mockJobFrontendLead, mockJobAIResearcher } from './setup';
import type { Job, JobCreatePayload } from '../src/types';

describe('Milestone 4: Jobs Requisition Hub & Candidate Screening Comprehensive Verification', () => {

  describe('1. Jobs Component Server-Side & Static Structure Verification', () => {
    it('M4.1: renders Jobs Requisition Hub markup with glassmorphism, headers and CTAs', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/jobs']}>
          <Jobs />
        </MemoryRouter>
      );

      // Verify Header and Title
      expect(html).toContain('Open Job');
      expect(html).toContain('Requisitions');
      expect(html).toContain('Talent Acquisition');
      expect(html).toContain('Create Job Requisition');
      expect(html).toContain('Search by job title');
    });

    it('M4.2: validates JobCreatePayload schema formation and skill list parsing', () => {
      const formSkills = ['React', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit'];
      const payload: JobCreatePayload = {
        title: 'Lead Frontend Engineer',
        company: 'Quantum Dynamics',
        description: 'Building next-gen AI interfaces with React 19',
        required_skills: formSkills.join(', '),
        preferred_skills: 'Framer Motion, WebSockets',
        minimum_experience_years: 5,
        education_requirement: 'B.S. in Computer Science',
        location: 'Remote',
      };

      expect(payload.title).toBe('Lead Frontend Engineer');
      expect(payload.company).toBe('Quantum Dynamics');
      expect(payload.minimum_experience_years).toBe(5);

      const parsedReq = parseSkillList(payload.required_skills);
      expect(parsedReq).toEqual(['React', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit']);
      expect(parsedReq).toHaveLength(4);

      const parsedPref = parseSkillList(payload.preferred_skills);
      expect(parsedPref).toEqual(['Framer Motion', 'WebSockets']);
    });
  });

  describe('2. Job Candidates Match Screening & Multi-Dimensional Logic', () => {
    it('M4.3: renders JobCandidates Page with back link and screening container', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/jobs/1/candidates']}>
          <JobCandidates />
        </MemoryRouter>
      );

      expect(html).toContain('Back to Jobs');
      expect(html).toContain('Match Screening');
    });

    it('M4.4: correctly ranks and assigns gold (#1), silver (#2), bronze (#3) medals', () => {
      const candidates = [mockCandidateDave, mockCandidateBob, mockCandidateAlice, mockCandidateCarol];
      const scored = candidates.map(candidate => ({
        candidate,
        breakdown: calculateDetailedMatch(candidate, mockJobFrontendLead),
      })).sort((a, b) => b.breakdown.overall_score - a.breakdown.overall_score);

      // Assign ranks
      const rankedWithMedals = scored.map((item, idx) => ({
        ...item,
        rank: idx + 1,
        medal: idx === 0 ? 'Gold Trophy' : idx === 1 ? 'Silver Medal' : idx === 2 ? 'Bronze Medal' : `#${idx + 1}`,
      }));

      // Top rank must be Alice Johnson with Gold
      expect(rankedWithMedals[0].candidate.full_name).toBe('Alice Johnson');
      expect(rankedWithMedals[0].rank).toBe(1);
      expect(rankedWithMedals[0].medal).toBe('Gold Trophy');
      expect(rankedWithMedals[0].breakdown.overall_score).toBeGreaterThanOrEqual(85);

      // Second rank
      expect(rankedWithMedals[1].rank).toBe(2);
      expect(rankedWithMedals[1].medal).toBe('Silver Medal');

      // Third rank
      expect(rankedWithMedals[2].rank).toBe(3);
      expect(rankedWithMedals[2].medal).toBe('Bronze Medal');
    });

    it('M4.5: verifies 4-factor scoring breakdown components sum correctly', () => {
      const breakdown = calculateDetailedMatch(mockCandidateAlice, mockJobFrontendLead);

      // All 4 factors present
      expect(breakdown.skill_score).toBeDefined();
      expect(breakdown.experience_score).toBeDefined();
      expect(breakdown.keyword_score).toBeDefined();
      expect(breakdown.education_score).toBeDefined();

      // Weighted calculation verification
      // (Skills * 0.45) + (Exp * 0.25) + (Keyword * 0.20) + (Edu * 0.10)
      const expectedOverall = Math.round(
        ((breakdown.skill_score * 0.45) +
         (breakdown.experience_score * 0.25) +
         (breakdown.keyword_score * 0.20) +
         (breakdown.education_score * 0.10)) * 10
      ) / 10;

      expect(breakdown.overall_score).toBeCloseTo(expectedOverall, 1);
    });

    it('M4.6: maps scores to exact semantic radial gauge tiers and color tokens', () => {
      // 85%+ -> Emerald (#10B981)
      const tier88 = getScoreTier(88);
      expect(tier88.tier).toBe('Excellent Match');
      expect(tier88.color).toBe('#10B981');
      expect(tier88.badgeVariant).toBe('emerald');

      // 70-84% -> Indigo (#6366F1)
      const tier75 = getScoreTier(75);
      expect(tier75.tier).toBe('Good Match');
      expect(tier75.color).toBe('#6366F1');
      expect(tier75.badgeVariant).toBe('indigo');

      // 50-69% -> Amber (#F59E0B)
      const tier60 = getScoreTier(60);
      expect(tier60.tier).toBe('Moderate Match');
      expect(tier60.color).toBe('#F59E0B');
      expect(tier60.badgeVariant).toBe('amber');

      // <50% -> Rose (#F43F5E)
      const tier35 = getScoreTier(35);
      expect(tier35.tier).toBe('Low Match');
      expect(tier35.color).toBe('#F43F5E');
      expect(tier35.badgeVariant).toBe('rose');
    });

    it('M4.7: isolates matching vs missing required skills for hiring managers', () => {
      const breakdownBob = calculateDetailedMatch(mockCandidateBob, mockJobFrontendLead);

      // Job required: React, TypeScript, Tailwind CSS
      // Bob has: React, JavaScript, Vue, Tailwind CSS (Missing TypeScript)
      expect(breakdownBob.matching_skills).toContain('React');
      expect(breakdownBob.matching_skills).toContain('Tailwind CSS');
      expect(breakdownBob.missing_skills).toContain('TypeScript');
      expect(breakdownBob.missing_skills).not.toContain('React');
    });

    it('M4.8: AI recommendation badge & strengths synthesis resilience', () => {
      const matchAlice = calculateDetailedMatch(mockCandidateAlice, mockJobFrontendLead);
      expect(['Strong Match', 'Good Match']).toContain(matchAlice.recommendation);
      expect(matchAlice.strengths.length).toBeGreaterThan(0);

      // Missing skill triggers weakness alert
      const matchBob = calculateDetailedMatch(mockCandidateBob, mockJobFrontendLead);
      expect(matchBob.weaknesses.some(w => w.includes('TypeScript') || w.includes('Missing'))).toBe(true);
    });
  });
});
