import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { CandidateComparisonModal } from '../src/components/candidates/CandidateComparisonModal';
import { ResumePreviewDrawer } from '../src/components/candidates/ResumePreviewDrawer';
import {
  mockCandidateAlice,
  mockCandidateBob,
  mockCandidateCarol,
  mockCandidateDave,
  mockJobFrontendLead,
  mockJobAIResearcher,
} from './setup';
import type { Resume } from '../src/types';
import { buildCandidateComparison } from '../src/utils/matching';

describe('Milestone 5: High-Impact New Features Stress & Component Verification', () => {
  const mockResumeAlice: Resume = {
    id: 1,
    candidate_id: 1,
    file_path: 'resumes/alice_johnson_resume.pdf',
    parsed_text: `Alice Johnson
Senior Full Stack Engineer
Email: alice.johnson@example.com
Phone: +1 (555) 234-5678
Location: San Francisco, CA

SUMMARY:
Senior Full Stack Software Engineer with 5+ years of experience building modern web applications using React, TypeScript, Node.js, Python, and AWS cloud infrastructure.

SKILLS:
React, TypeScript, Python, Node.js, AWS, PostgreSQL, Tailwind CSS

EXPERIENCE:
Senior Frontend Engineer | TechCorp Innovations (2022 - Present)
Architected React & TypeScript design systems.

EDUCATION:
Stanford University - B.S. in Computer Science (2015 - 2019)`,
  };

  describe('1. CandidateComparisonModal Component Verification', () => {
    it('M5.1: renders CandidateComparisonModal with 3 candidates and job context', () => {
      const html = renderToString(
        <MemoryRouter>
          <CandidateComparisonModal
            isOpen={true}
            onClose={() => {}}
            candidates={[mockCandidateAlice, mockCandidateBob, mockCandidateCarol]}
            jobs={[mockJobFrontendLead, mockJobAIResearcher]}
            initialJobId={mockJobFrontendLead.id}
          />
        </MemoryRouter>
      );

      // Verify Header and Badges
      expect(html).toContain('Candidate');
      expect(html).toContain('Comparison Matrix');
      expect(html).toContain('Selected');
      expect(html).toContain('Export Report');
      expect(html).toContain('Print / PDF');

      // Verify Candidate Names
      expect(html).toContain('Alice Johnson');
      expect(html).toContain('Bob Martinez');
      expect(html).toContain('Dr. Carol Vance');

      // Verify Venn Matrix & Overlap
      expect(html).toContain('Venn Skill Overlap Matrix');
      expect(html).toContain('Shared Common Skills');

      // Verify Multi-Factor Comparison Matrix
      expect(html).toContain('Multi-Factor Comparison Matrix');
      expect(html).toContain('Overall Fit Score');
      expect(html).toContain('Total Experience');
      expect(html).toContain('Technical Skills Fit');
      expect(html).toContain('NLP Keywords Density');
      expect(html).toContain('Key Strengths');
    });

    it('M5.2: correctly computes shared skills and unique differentiators for 2 candidates', () => {
      const comparison = buildCandidateComparison([mockCandidateAlice, mockCandidateBob], mockJobFrontendLead);

      // Shared skills (React and Tailwind CSS)
      expect(comparison.commonSkillsAcrossAll).toContain('react');
      expect(comparison.commonSkillsAcrossAll).toContain('tailwind css');

      // Unique skills
      const aliceUnique = comparison.candidates[0].uniqueSkills;
      const bobUnique = comparison.candidates[1].uniqueSkills;

      expect(aliceUnique).toContain('TypeScript');
      expect(bobUnique).toContain('Vue');
    });

    it('M5.3: handles 4 candidates layout smoothly and renders benchmark comparisons', () => {
      const html = renderToString(
        <MemoryRouter>
          <CandidateComparisonModal
            isOpen={true}
            onClose={() => {}}
            candidates={[mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave]}
            jobs={[mockJobFrontendLead]}
          />
        </MemoryRouter>
      );

      expect(html).toContain('Selected');
      expect(html).toContain('Alice Johnson');
      expect(html).toContain('Bob Martinez');
      expect(html).toContain('Dr. Carol Vance');
      expect(html).toContain('Dave Wilson');
    });

    it('M5.4: returns null when isOpen is false', () => {
      const html = renderToString(
        <MemoryRouter>
          <CandidateComparisonModal
            isOpen={false}
            onClose={() => {}}
            candidates={[mockCandidateAlice, mockCandidateBob]}
          />
        </MemoryRouter>
      );

      expect(html).toBe('');
    });
  });

  describe('2. ResumePreviewDrawer Component Verification', () => {
    it('M5.5: renders ResumePreviewDrawer with Tab 1 (Structured Profile)', () => {
      const html = renderToString(
        <MemoryRouter>
          <ResumePreviewDrawer
            isOpen={true}
            onClose={() => {}}
            candidate={mockCandidateAlice}
            resume={mockResumeAlice}
            job={mockJobFrontendLead}
            initialTab="structured"
          />
        </MemoryRouter>
      );

      // Header
      expect(html).toContain('Alice Johnson');
      expect(html).toContain('alice.johnson@example.com');
      expect(html).toContain('+1 (555) 234-5678');
      expect(html).toContain('Fit Score');

      // Tab Buttons
      expect(html).toContain('Profile');
      expect(html).toContain('Raw Text');
      expect(html).toContain('Keywords');
      expect(html).toContain('AI Insights');

      // Tab 1 Contents
      expect(html).toContain('Professional Summary');
      expect(html).toContain('Categorized Skills');
      expect(html).toContain('Experience History');
      expect(html).toContain('Education &amp; Credentials');
      expect(html).toContain('TechCorp Innovations');
      expect(html).toContain('Stanford University');
    });

    it('M5.6: renders ResumePreviewDrawer with Tab 2 (Raw Extracted Text & Line Numbers)', () => {
      const html = renderToString(
        <MemoryRouter>
          <ResumePreviewDrawer
            isOpen={true}
            onClose={() => {}}
            candidate={mockCandidateAlice}
            resume={mockResumeAlice}
            job={mockJobFrontendLead}
            initialTab="raw_text"
            initialSearchTerm="React"
          />
        </MemoryRouter>
      );

      expect(html).toContain('Search within extracted resume...');
      expect(html).toContain('Copy Text');
      expect(html).toContain('resumes/alice_johnson_resume.pdf');
      expect(html).toContain('Senior Full Stack Engineer');
    });

    it('M5.7: renders ResumePreviewDrawer with Tab 3 (Keyword Match Highlights)', () => {
      const html = renderToString(
        <MemoryRouter>
          <ResumePreviewDrawer
            isOpen={true}
            onClose={() => {}}
            candidate={mockCandidateAlice}
            resume={mockResumeAlice}
            job={mockJobFrontendLead}
            initialTab="keywords"
          />
        </MemoryRouter>
      );

      expect(html).toContain('Screen Against Requisition');
      expect(html).toContain('Requisition Alignment Breakdown');
      expect(html).toContain('Technical Skills (45%)');
      expect(html).toContain('Matched Skills Found in Resume');
      expect(html).toContain('React');
      expect(html).toContain('TypeScript');
    });

    it('M5.8: renders ResumePreviewDrawer with Tab 4 (AI Screening Insights & Interview Questions)', () => {
      const html = renderToString(
        <MemoryRouter>
          <ResumePreviewDrawer
            isOpen={true}
            onClose={() => {}}
            candidate={mockCandidateAlice}
            resume={mockResumeAlice}
            job={mockJobFrontendLead}
            initialTab="insights"
          />
        </MemoryRouter>
      );

      expect(html).toContain('AI Fit Recommendation');
      expect(html).toContain('Key Strengths &amp; Differentiators');
      expect(html).toContain('Suggested Interview Questions');
      expect(html).toContain('Question #');
      expect(html).toContain('challenging technical problem');
    });

    it('M5.9: provides structured fallback when resume.parsed_text is null or undefined', () => {
      const emptyResume: Resume = {
        id: 99,
        candidate_id: mockCandidateBob.id,
        file_path: 'resumes/bob.pdf',
        parsed_text: null,
      };

      const html = renderToString(
        <MemoryRouter>
          <ResumePreviewDrawer
            isOpen={true}
            onClose={() => {}}
            candidate={mockCandidateBob}
            resume={emptyResume}
            initialTab="raw_text"
          />
        </MemoryRouter>
      );

      expect(html).toContain('Bob Martinez');
      expect(html).toContain('SKILLS:');
      expect(html).toContain('EXPERIENCE:');
    });

    it('M5.10: returns null when isOpen is false or candidate is null', () => {
      const htmlClosed = renderToString(
        <MemoryRouter>
          <ResumePreviewDrawer
            isOpen={false}
            onClose={() => {}}
            candidate={mockCandidateAlice}
          />
        </MemoryRouter>
      );
      expect(htmlClosed).toBe('');

      const htmlNullCand = renderToString(
        <MemoryRouter>
          <ResumePreviewDrawer
            isOpen={true}
            onClose={() => {}}
            candidate={null}
          />
        </MemoryRouter>
      );
      expect(htmlNullCand).toBe('');
    });
  });
});
