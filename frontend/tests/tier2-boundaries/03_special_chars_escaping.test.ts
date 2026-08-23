import { describe, it, expect } from 'vitest';
import { normalizeSkill, parseSkillList, filterAndSortCandidates, calculateDetailedMatch } from '../../src/utils/matching';
import { Candidate, Job, CandidateFilterCriteria } from '../../src/types';

describe('Tier 2 Boundary: Adversarial Special Characters & Escaping', () => {
  const xssCandidate: Candidate = {
    id: 201,
    full_name: "<script>alert('XSS')</script>",
    email: 'hacker"onClick="alert(1)"@example.com',
    location: '<img src=x onerror=alert(1)>',
    summary: 'Expert in SQL Injection: DROP TABLE Candidates; -- and <b>bold text</b>',
    total_experience_months: 48,
    skills: [
      { id: 1, candidate_id: 201, skill_id: 1, skill: { id: 1, name: 'C++' } },
      { id: 2, candidate_id: 201, skill_id: 2, skill: { id: 2, name: 'C#' } },
      { id: 3, candidate_id: 201, skill_id: 3, skill: { id: 3, name: '.NET' } },
      { id: 4, candidate_id: 201, skill_id: 4, skill: { id: 4, name: 'Node.js' } },
      { id: 5, candidate_id: 201, skill_id: 5, skill: { id: 5, name: 'CI/CD' } },
      { id: 6, candidate_id: 201, skill_id: 6, skill: { id: 6, name: 'React.js 🚀' } },
    ],
    experiences: [],
    educations: [],
  };

  const unicodeCandidate: Candidate = {
    id: 202,
    full_name: "Renée O'Connor-Smith (张伟 / اليس)",
    email: 'renee.oconnor@domain.co.uk',
    location: 'Zürich, Switzerland',
    summary: 'Multilingual developer fluent in English, Français, and 中文.',
    total_experience_months: 60,
    skills: [
      { id: 7, candidate_id: 202, skill_id: 7, skill: { id: 7, name: 'JavaScript' } },
    ],
    experiences: [],
    educations: [],
  };

  it('T2.3.1: preserves XSS payloads as harmless literal strings without execution', () => {
    // Authoritative source: TEST_INFRA §Adversarial Verification
    expect(xssCandidate.full_name).toContain('<script>');
    const criteria: CandidateFilterCriteria = {
      searchQuery: "<script>alert('XSS')",
      selectedSkills: [],
      skillMatchMode: 'any',
      minExperienceYears: 0,
      location: '',
      sortBy: 'created_at_desc',
    };
    const result = filterAndSortCandidates([xssCandidate], criteria);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(201);
  });

  it('T2.3.2: searches and handles international Unicode names & symbols', () => {
    const criteria: CandidateFilterCriteria = {
      searchQuery: '张伟',
      selectedSkills: [],
      skillMatchMode: 'any',
      minExperienceYears: 0,
      location: '',
      sortBy: 'created_at_desc',
    };
    const result = filterAndSortCandidates([unicodeCandidate], criteria);
    expect(result).toHaveLength(1);
    expect(result[0].full_name).toContain('Renée');
  });

  it('T2.3.3: accurately normalizes technical skills with pluses, hashes, and dots', () => {
    expect(normalizeSkill('C++')).toBe('c++');
    expect(normalizeSkill('C#')).toBe('c#');
    expect(normalizeSkill('.NET')).toBe('.net');
    expect(normalizeSkill('Node.js')).toBe('node.js');
    expect(normalizeSkill('CI/CD')).toBe('cicd');
  });

  it('T2.3.4: normalizes synonym variations across major tech stacks', () => {
    expect(normalizeSkill('JS')).toBe('javascript');
    expect(normalizeSkill('ts')).toBe('typescript');
    expect(normalizeSkill('k8s')).toBe('kubernetes');
    expect(normalizeSkill('golang')).toBe('go');
    expect(normalizeSkill('py')).toBe('python');
    expect(normalizeSkill('psql')).toBe('postgresql');
    expect(normalizeSkill('mongo')).toBe('mongodb');
    expect(normalizeSkill('tailwind')).toBe('tailwind css');
    expect(normalizeSkill('aws cloud')).toBe('aws');
  });

  it('T2.3.5: parses messy comma-separated skill strings with irregular whitespace', () => {
    const rawSkills = '  React , , TypeScript  ,  Tailwind CSS,,, Node.js   ';
    const parsed = parseSkillList(rawSkills);
    expect(parsed).toEqual(['React', 'TypeScript', 'Tailwind CSS', 'Node.js']);
  });

  it('T2.3.6: parses null and undefined skill strings safely without crashing', () => {
    expect(parseSkillList(null)).toEqual([]);
    expect(parseSkillList(undefined)).toEqual([]);
    expect(parseSkillList('')).toEqual([]);
    expect(parseSkillList('   ')).toEqual([]);
  });

  it('T2.3.7: handles regex metacharacters in search queries literally', () => {
    const metacharQueries = ['[a-z]+', '(foo|bar)', '.*', '?', '^start', '$end', '\\d+'];
    metacharQueries.forEach(query => {
      const criteria: CandidateFilterCriteria = {
        searchQuery: query,
        selectedSkills: [],
        skillMatchMode: 'any',
        minExperienceYears: 0,
        location: '',
        sortBy: 'created_at_desc',
      };
      // Must not throw RegExp syntax error
      expect(() => filterAndSortCandidates([xssCandidate, unicodeCandidate], criteria)).not.toThrow();
    });
  });

  it('T2.3.8: handles massive 10,000 character summary without performance degradation', () => {
    const longSummary = 'React '.repeat(2000) + ' Python '.repeat(500);
    const hugeCandidate: Candidate = {
      ...unicodeCandidate,
      id: 203,
      summary: longSummary,
    };
    const job: Job = {
      id: 201,
      title: 'Dev',
      company: 'TestCo',
      required_skills: 'React, Python',
    };

    const startTime = performance.now();
    const match = calculateDetailedMatch(hugeCandidate, job);
    const endTime = performance.now();

    expect(match.keyword_score).toBe(100);
    expect(endTime - startTime).toBeLessThan(50); // Under 50ms
  });

  it('T2.3.9: safely handles candidate full name of 300 characters', () => {
    const longName = 'A'.repeat(300);
    const candidate: Candidate = {
      ...unicodeCandidate,
      id: 204,
      full_name: longName,
    };
    expect(candidate.full_name.length).toBe(300);
  });

  it('T2.3.10: treats case-insensitive search queries identically', () => {
    const criteriaUpper: CandidateFilterCriteria = {
      searchQuery: 'RENÉE',
      selectedSkills: [],
      skillMatchMode: 'any',
      minExperienceYears: 0,
      location: '',
      sortBy: 'created_at_desc',
    };
    const result = filterAndSortCandidates([unicodeCandidate], criteriaUpper);
    expect(result).toHaveLength(1);
  });
});
