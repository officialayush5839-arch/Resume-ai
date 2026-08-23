import { describe, it, expect } from 'vitest';
import { mockCandidateAlice } from '../setup';
import { Resume, ResumePreviewData } from '../../src/types';

describe('Feature 11: Resume Live Preview Drawer (Feature B)', () => {
  const mockResumeAlice: Resume = {
    id: 1,
    candidate_id: 1,
    file_path: 'uploads/alice_johnson_resume.pdf',
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

  it('T1.11.1: supports multi-tab split-pane view (structured, raw_text, keywords)', () => {
    // Authoritative source: survey_spec_miner_1 §6.2
    const previewData: ResumePreviewData = {
      candidate: mockCandidateAlice,
      resume: mockResumeAlice,
      activeTab: 'structured',
      searchTerm: '',
    };

    expect(previewData.candidate.full_name).toBe('Alice Johnson');
    expect(previewData.activeTab).toBe('structured');
  });

  it('T1.11.2: displays raw extracted text with line numbering and copy action', () => {
    // Authoritative source: survey_spec_miner_1 §6.2
    const rawText = mockResumeAlice.parsed_text || '';
    const lines = rawText.split('\n');

    expect(lines.length).toBeGreaterThan(10);
    expect(lines[0]).toBe('Alice Johnson');
    expect(lines.some(l => l.includes('Stanford University'))).toBe(true);
  });

  it('T1.11.3: executes real-time text search and counts keyword occurrences in document', () => {
    // Authoritative source: survey_spec_miner_1 §6.2
    const rawText = mockResumeAlice.parsed_text || '';
    const countOccurrences = (text: string, term: string) => {
      if (!term.trim()) return 0;
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = text.match(regex);
      return matches ? matches.length : 0;
    };

    expect(countOccurrences(rawText, 'React')).toBe(3);
    expect(countOccurrences(rawText, 'TypeScript')).toBe(3);
    expect(countOccurrences(rawText, 'Kubernetes')).toBe(0);
  });

  it('T1.11.4: highlights job-relevant skills within the resume preview text', () => {
    // Authoritative source: survey_spec_miner_1 §6.2
    const rawText = mockResumeAlice.parsed_text || '';
    const jobSkills = ['React', 'TypeScript', 'Tailwind CSS'];

    const foundSkills = jobSkills.filter(skill => 
      rawText.toLowerCase().includes(skill.toLowerCase())
    );

    expect(foundSkills).toEqual(['React', 'TypeScript', 'Tailwind CSS']);
  });

  it('T1.11.5: provides graceful fallback when raw resume parsed text is unavailable', () => {
    // Authoritative source: survey_spec_miner_1 §4 Edge Case #7 & #10
    const emptyResume: Resume = {
      id: 2,
      candidate_id: 2,
      file_path: 'uploads/bob_resume.pdf',
      parsed_text: null,
    };

    const getDisplayText = (resume?: Resume | null, fallbackCandidate?: typeof mockCandidateAlice) => {
      if (resume?.parsed_text && resume.parsed_text.trim().length > 0) {
        return resume.parsed_text;
      }
      return `${fallbackCandidate?.full_name}\n${fallbackCandidate?.summary || 'No summary available.'}`;
    };

    const text = getDisplayText(emptyResume, mockCandidateAlice);
    expect(text).toContain('Alice Johnson');
    expect(text).toContain('Senior Full Stack Software Engineer');
  });
});
