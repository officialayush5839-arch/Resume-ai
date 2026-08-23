import { describe, it, expect } from 'vitest';
import {
  normalizeSkill,
  parseSkillList,
  extractCandidateSkillNames,
  calculateDetailedMatch,
  filterAndSortCandidates,
  buildCandidateComparison,
  getScoreTier,
} from '../src/utils/matching';
import type { Candidate, Job, CandidateFilterCriteria } from '../src/types';

describe('Empirical Adversarial Stress Tests: Matching Engine Math & Utilities', () => {

  describe('1. Skill Normalization & String Parsing Edge Cases', () => {
    it('handles null, undefined, whitespace, and empty strings gracefully', () => {
      expect(normalizeSkill('')).toBe('');
      expect(normalizeSkill('   ')).toBe('');
      expect(normalizeSkill(null as unknown as string)).toBe('');
      expect(normalizeSkill(undefined as unknown as string)).toBe('');
    });

    it('normalizes 25+ tech synonyms correctly with mixed case and whitespace', () => {
      expect(normalizeSkill('  React.js  ')).toBe('react');
      expect(normalizeSkill('REACTJS')).toBe('react');
      expect(normalizeSkill('TypeScript')).toBe('typescript');
      expect(normalizeSkill('TS')).toBe('typescript');
      expect(normalizeSkill('JS')).toBe('javascript');
      expect(normalizeSkill('NodeJS')).toBe('node.js');
      expect(normalizeSkill('Node')).toBe('node.js');
      expect(normalizeSkill('Postgres')).toBe('postgresql');
      expect(normalizeSkill('PSQL')).toBe('postgresql');
      expect(normalizeSkill('k8s')).toBe('kubernetes');
      expect(normalizeSkill('Golang')).toBe('go');
      expect(normalizeSkill('py')).toBe('python');
      expect(normalizeSkill('AWS Cloud')).toBe('aws');
      expect(normalizeSkill('Amazon Web Services')).toBe('aws');
      expect(normalizeSkill('GCP')).toBe('google cloud');
      expect(normalizeSkill('CI/CD')).toBe('cicd');
      expect(normalizeSkill('TailwindCSS')).toBe('tailwind css');
      expect(normalizeSkill('ML')).toBe('machine learning');
      expect(normalizeSkill('DL')).toBe('deep learning');
      expect(normalizeSkill('Deep-Learning')).toBe('deep learning');
      expect(normalizeSkill('AI')).toBe('artificial intelligence');
      expect(normalizeSkill('REST')).toBe('rest api');
      expect(normalizeSkill('RESTful')).toBe('rest api');
      expect(normalizeSkill('REST APIs')).toBe('rest api');
    });

    it('preserves non-mapped tech names cleanly in lowercase', () => {
      expect(normalizeSkill('Rust')).toBe('rust');
      expect(normalizeSkill('C++')).toBe('c++');
      expect(normalizeSkill('C#')).toBe('c#');
      expect(normalizeSkill('.NET Core')).toBe('.net core');
      expect(normalizeSkill('GraphQL')).toBe('graphql');
      expect(normalizeSkill('Solidity')).toBe('solidity');
    });

    it('parseSkillList handles malformed strings, trailing commas, whitespace, newlines & tabs', () => {
      expect(parseSkillList(null)).toEqual([]);
      expect(parseSkillList(undefined)).toEqual([]);
      expect(parseSkillList('')).toEqual([]);
      expect(parseSkillList('   ')).toEqual([]);
      expect(parseSkillList(',,,,')).toEqual([]);
      expect(parseSkillList('React, , TypeScript, , Node.js, ')).toEqual(['React', 'TypeScript', 'Node.js']);
      expect(parseSkillList('  Python \n, Java\t  ,  Go  ')).toEqual(['Python', 'Java', 'Go']);
      expect(parseSkillList('React, React, react')).toEqual(['React', 'React', 'react']);
      expect(parseSkillList('C++, C#, .NET, Node.js')).toEqual(['C++', 'C#', '.NET', 'Node.js']);
    });

    it('extractCandidateSkillNames handles varied candidate schema formats, objects, empty objects and nulls', () => {
      const emptyCandidate: Candidate = {
        id: 1,
        full_name: 'Empty Candidate',
        email: 'empty@example.com',
      };
      expect(extractCandidateSkillNames(emptyCandidate)).toEqual([]);

      const stringSkillsCandidate: Candidate = {
        id: 2,
        full_name: 'String Skills',
        email: 'string@example.com',
        skills: ['React', 'TypeScript', 'Tailwind CSS'] as unknown as Candidate['skills'],
      };
      expect(extractCandidateSkillNames(stringSkillsCandidate)).toEqual(['React', 'TypeScript', 'Tailwind CSS']);

      const objectSkillsCandidate: Candidate = {
        id: 3,
        full_name: 'Object Skills',
        email: 'object@example.com',
        skills: [
          { id: 1, candidate_id: 3, skill_id: 1, skill: { id: 1, name: 'Python' } },
          { id: 2, candidate_id: 3, skill_id: 2, skill: { id: 2, name: 'FastAPI' } },
          { id: 3, candidate_id: 3, skill_id: 3, skill: { id: 3, name: '' } }, // Empty name
          { id: 4, candidate_id: 3, skill_id: 4, skill: undefined }, // Missing skill object
          { id: 5, candidate_id: 3, skill_id: 5, skill: null as unknown as { id: number; name: string } }, // Null skill object
        ],
      };
      expect(extractCandidateSkillNames(objectSkillsCandidate)).toEqual(['Python', 'FastAPI']);

      // Degraded / completely malformed candidate object
      expect(extractCandidateSkillNames({} as Candidate)).toEqual([]);
      expect(extractCandidateSkillNames(null as unknown as Candidate)).toEqual([]);
      expect(extractCandidateSkillNames(undefined as unknown as Candidate)).toEqual([]);
    });
  });

  describe('2. Detailed Match Scoring Mathematical Correctness & Extreme Boundaries', () => {
    const defaultJob: Job = {
      id: 101,
      title: 'Senior Full Stack Engineer',
      company: 'TechCorp',
      required_skills: 'React, TypeScript, Node.js, PostgreSQL',
      preferred_skills: 'AWS, Docker, GraphQL',
      minimum_experience_years: 5,
      education_requirement: 'Bachelor',
    };

    it('Case 1: 100% Perfect Candidate (all required + preferred skills, 5+ yrs exp, exact degree, keywords in summary)', () => {
      const perfectCandidate: Candidate = {
        id: 1,
        full_name: 'Alice Perfect',
        email: 'alice@perfect.com',
        total_experience_months: 60, // 5 years
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'GraphQL'] as unknown as Candidate['skills'],
        summary: 'Expert in React, TypeScript, Node.js, PostgreSQL, AWS, Docker, GraphQL with 5 years building scalable web apps.',
        educations: [{ id: 1, candidate_id: 1, degree: 'Bachelor of Science in Computer Science', institution: 'MIT' }],
        experiences: [{ id: 1, candidate_id: 1, job_title: 'Senior Engineer', description: 'Full stack development with React, Node, AWS' }],
      };

      const result = calculateDetailedMatch(perfectCandidate, defaultJob);
      expect(result.skill_score).toBe(100);
      expect(result.experience_score).toBe(100);
      expect(result.education_score).toBe(100);
      expect(result.keyword_score).toBe(100);
      expect(result.overall_score).toBe(100);
      expect(result.recommendation).toBe('Strong Match');
      expect(result.missing_skills).toHaveLength(0);
      expect(result.strengths.length).toBeGreaterThanOrEqual(3);
      expect(result.weaknesses).toHaveLength(0);
    });

    it('Case 2: 0% Extreme Candidate (0 skills, 0 experience, no education, empty summary)', () => {
      const zeroCandidate: Candidate = {
        id: 2,
        full_name: 'Bob Zero',
        email: 'bob@zero.com',
        total_experience_months: 0,
        skills: [],
        summary: '',
        educations: [],
        experiences: [],
      };

      const result = calculateDetailedMatch(zeroCandidate, defaultJob);
      // Skill: 0%
      expect(result.skill_score).toBe(0);
      // Exp: 0 / 60 = 0%
      expect(result.experience_score).toBe(0);
      // Edu: no education = 20%
      expect(result.education_score).toBe(20);
      // Keywords: 0 / 7 = 0%
      expect(result.keyword_score).toBe(0);
      // Overall = 0*0.45 + 0*0.25 + 0*0.20 + 20*0.10 = 2.0
      expect(result.overall_score).toBe(2);
      expect(result.recommendation).toBe('Weak Match');
      expect(result.missing_skills).toEqual(['React', 'TypeScript', 'Node.js', 'PostgreSQL']);
      expect(result.weaknesses.length).toBeGreaterThanOrEqual(2);
    });

    it('Case 3: Zero-Requirement Job (Job with no required skills, no preferred skills, 0 yrs exp, no education requirement)', () => {
      const emptyJob: Job = {
        id: 102,
        title: 'Open Intern',
        company: 'Startup',
        required_skills: '',
        preferred_skills: '',
        minimum_experience_years: 0,
        education_requirement: '',
      };

      const noviceCandidate: Candidate = {
        id: 3,
        full_name: 'Charlie Novice',
        email: 'charlie@novice.com',
        total_experience_months: 0,
        skills: [],
        summary: '',
        educations: [],
      };

      const result = calculateDetailedMatch(noviceCandidate, emptyJob);
      expect(result.skill_score).toBe(100);
      expect(result.experience_score).toBe(100);
      expect(result.education_score).toBe(100);
      expect(result.keyword_score).toBe(100);
      expect(result.overall_score).toBe(100);
      expect(result.recommendation).toBe('Strong Match');
    });

    it('Case 4: Extreme Experience Requirements (Job asks for 100 years vs candidate with 10 years, and vice-versa)', () => {
      const centuryJob: Job = {
        id: 103,
        title: 'Ancient Wizard',
        minimum_experience_years: 100, // 1200 months
        required_skills: 'Magic',
      };

      const veteranCandidate: Candidate = {
        id: 4,
        full_name: 'Dave Veteran',
        total_experience_months: 120, // 10 years
        skills: ['Magic'] as unknown as Candidate['skills'],
        summary: 'Magic practitioner',
      };

      const result1 = calculateDetailedMatch(veteranCandidate, centuryJob);
      // expScore = (120 / 1200) * 100 = 10%
      expect(result1.experience_score).toBe(10);
      expect(result1.skill_score).toBe(100);

      // Candidate with 150 years (1800 months) against 5 years requirement
      const immortalCandidate: Candidate = {
        id: 5,
        full_name: 'Eve Immortal',
        total_experience_months: 1800,
        skills: ['React'] as unknown as Candidate['skills'],
      };
      const result2 = calculateDetailedMatch(immortalCandidate, { ...defaultJob, required_skills: 'React', preferred_skills: '' });
      // Experience should cap at 100%
      expect(result2.experience_score).toBe(100);
    });

    it('Case 5: Synonym Matching and Case Insensitivity (TS -> typescript, K8s -> kubernetes, AWS Cloud -> aws)', () => {
      const synonymCandidate: Candidate = {
        id: 6,
        full_name: 'Frank Synonyms',
        email: 'frank@syn.com',
        total_experience_months: 60,
        // Using synonym variations
        skills: ['reactjs', 'TS', 'node', 'psql', 'k8s', 'amazon web services'] as unknown as Candidate['skills'],
        summary: 'Built cloud native services using ts, reactjs, node, and psql.',
      };

      const jobWithSynonyms: Job = {
        id: 104,
        title: 'Cloud Engineer',
        required_skills: 'React, TypeScript, Node.js, PostgreSQL',
        preferred_skills: 'Kubernetes, AWS',
        minimum_experience_years: 5,
      };

      const result = calculateDetailedMatch(synonymCandidate, jobWithSynonyms);
      // All 4 required skills matched via synonyms (React, TS->TypeScript, Node->Node.js, PSQL->PostgreSQL)
      // Both 2 preferred skills matched (k8s->kubernetes, amazon web services->aws)
      expect(result.skill_score).toBe(100);
      expect(result.missing_skills).toHaveLength(0);
      expect(result.matching_skills.length).toBeGreaterThanOrEqual(4);
    });

    it('Case 6: Education Fallback Logic (Direct Match = 100, Partial/Non-matching Edu = 60, Missing Edu = 20, No Req = 100)', () => {
      const jobWithEdu: Job = {
        id: 105,
        title: 'Data Scientist',
        education_requirement: 'Master',
      };

      const candidateWithDirectEdu: Candidate = {
        id: 7,
        full_name: 'Master Graduate',
        educations: [{ id: 1, candidate_id: 7, degree: 'Master of Science in AI', institution: 'Stanford' }],
      };
      expect(calculateDetailedMatch(candidateWithDirectEdu, jobWithEdu).education_score).toBe(100);

      const candidateWithOtherEdu: Candidate = {
        id: 8,
        full_name: 'Bachelor Graduate',
        educations: [{ id: 2, candidate_id: 8, degree: 'Associate Degree in Arts', institution: 'Community College' }],
      };
      expect(calculateDetailedMatch(candidateWithOtherEdu, jobWithEdu).education_score).toBe(60);

      const candidateWithNoEdu: Candidate = {
        id: 9,
        full_name: 'Self Taught',
        educations: [],
      };
      expect(calculateDetailedMatch(candidateWithNoEdu, jobWithEdu).education_score).toBe(20);
    });

    it('Case 7: Mathematical Weighting Formula Invariance (Skills 45% + Exp 25% + Keywords 20% + Edu 10%)', () => {
      const customJob: Job = {
        id: 106,
        title: 'Backend Dev',
        required_skills: 'Go, PostgreSQL',
        minimum_experience_years: 4, // 48 months
        education_requirement: 'Bachelor',
      };

      const testCandidate: Candidate = {
        id: 10,
        full_name: 'Grace Formula',
        total_experience_months: 24, // 24/48 = 50% Exp score
        skills: ['Go'] as unknown as Candidate['skills'], // 1/2 = 50% Skill score
        summary: 'Experience with Go and distributed databases', // 1/2 skills mentioned in summary = 50% Keyword score
        educations: [{ id: 1, candidate_id: 10, degree: 'High School Diploma', institution: 'School' }], // non-matching degree = 60% Edu score
      };

      const result = calculateDetailedMatch(testCandidate, customJob);
      // Skill: 50
      // Exp: 50
      // Keyword: 50 (only 'Go' is in summary/text, 'PostgreSQL' is not)
      // Edu: 60
      // Overall = 50*0.45 (22.5) + 50*0.25 (12.5) + 50*0.20 (10.0) + 60*0.10 (6.0) = 51.0
      expect(result.skill_score).toBe(50);
      expect(result.experience_score).toBe(50);
      expect(result.keyword_score).toBe(50);
      expect(result.education_score).toBe(60);
      expect(result.overall_score).toBe(51.0);
      expect(result.recommendation).toBe('Moderate Match');
    });

    it('Case 8: Clamping and Negative/Out-of-bound Values', () => {
      const negativeExpCandidate: Candidate = {
        id: 11,
        full_name: 'Negative Exp',
        total_experience_months: -24,
        skills: [],
      };
      const result = calculateDetailedMatch(negativeExpCandidate, defaultJob);
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
    });

    it('Case 9: Substring / Partial Keyword matching characteristics', () => {
      const jobWithShortKeywords: Job = {
        id: 107,
        title: 'Systems Programmer',
        required_skills: 'Go, C, R',
      };

      const candidateWithSuperstrings: Candidate = {
        id: 12,
        full_name: 'Superstring Dev',
        skills: ['Docker'] as unknown as Candidate['skills'],
        // 'Go' is in 'Google', 'C' is in 'Cloud', 'R' is in 'Docker'
        summary: 'Working at Google Cloud with Docker and Algorithms.',
      };

      const result = calculateDetailedMatch(candidateWithSuperstrings, jobWithShortKeywords);
      // Skill score is 0 (Docker does not match Go, C, R)
      expect(result.skill_score).toBe(0);
      // Substring check in fullCandidateText:
      // 'go' is in 'google'
      // 'c' is in 'cloud'
      // 'r' is in 'docker'
      // Thus all 3 short tokens match as substrings in keyword search
      expect(result.keyword_score).toBe(100);
    });
  });

  describe('3. filterAndSortCandidates Multi-Facet Engine Stress Tests', () => {
    const candidatePool: Candidate[] = [
      {
        id: 1,
        full_name: 'Aaron Designer',
        email: 'aaron@design.com',
        location: 'San Francisco, CA',
        total_experience_months: 36, // 3 yrs
        skills: ['Figma', 'UI/UX', 'Tailwind CSS', 'HTML', 'CSS'] as unknown as Candidate['skills'],
        summary: 'Senior UI/UX designer specializing in design systems.',
      },
      {
        id: 2,
        full_name: 'Brenda Backend',
        email: 'brenda@backend.com',
        location: 'New York, NY',
        total_experience_months: 96, // 8 yrs
        skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'AWS'] as unknown as Candidate['skills'],
        summary: 'Backend architect with distributed systems expertise.',
      },
      {
        id: 3,
        full_name: 'Carlos FullStack',
        email: 'carlos@fullstack.com',
        location: 'San Francisco, CA',
        total_experience_months: 60, // 5 yrs
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'] as unknown as Candidate['skills'],
        summary: 'Full stack engineer building modern cloud applications.',
      },
      {
        id: 4,
        full_name: 'Diana Data',
        email: 'diana@data.com',
        location: 'Austin, TX',
        total_experience_months: 48, // 4 yrs
        skills: ['Python', 'Machine Learning', 'PyTorch', 'SQL', 'FastAPI'] as unknown as Candidate['skills'],
        summary: 'AI/ML specialist with PyTorch experience.',
      },
    ];

    it('handles empty input candidate lists and null/undefined safely', () => {
      const defaultCriteria: CandidateFilterCriteria = {
        searchQuery: '',
        minExperienceYears: 0,
        location: 'All',
        selectedSkills: [],
        skillMatchMode: 'any',
        sortBy: 'created_at_desc',
      };
      expect(filterAndSortCandidates([], defaultCriteria)).toEqual([]);
      expect(filterAndSortCandidates(null as unknown as Candidate[], defaultCriteria)).toEqual([]);
      expect(filterAndSortCandidates(undefined as unknown as Candidate[], defaultCriteria)).toEqual([]);
    });

    it('filters correctly by full-text search across name, email, location, skills, and summary', () => {
      // Search by name
      const byName = filterAndSortCandidates(candidatePool, {
        searchQuery: 'aaron',
        minExperienceYears: 0,
        location: 'All',
        selectedSkills: [],
        skillMatchMode: 'any',
        sortBy: 'created_at_desc',
      });
      expect(byName).toHaveLength(1);
      expect(byName[0].full_name).toBe('Aaron Designer');

      // Search by email
      const byEmail = filterAndSortCandidates(candidatePool, {
        searchQuery: 'brenda@backend.com',
        minExperienceYears: 0,
        location: 'All',
        selectedSkills: [],
        skillMatchMode: 'any',
        sortBy: 'created_at_desc',
      });
      expect(byEmail).toHaveLength(1);
      expect(byEmail[0].full_name).toBe('Brenda Backend');

      // Search by skill
      const bySkill = filterAndSortCandidates(candidatePool, {
        searchQuery: 'pytorch',
        minExperienceYears: 0,
        location: 'All',
        selectedSkills: [],
        skillMatchMode: 'any',
        sortBy: 'created_at_desc',
      });
      expect(bySkill).toHaveLength(1);
      expect(bySkill[0].full_name).toBe('Diana Data');

      // Search with regex special characters like "(", "[", "*" (should not crash)
      const specialQuery = filterAndSortCandidates(candidatePool, {
        searchQuery: '***([a-z])???',
        minExperienceYears: 0,
        location: 'All',
        selectedSkills: [],
        skillMatchMode: 'any',
        sortBy: 'created_at_desc',
      });
      expect(specialQuery).toHaveLength(0);
    });

    it('filters correctly by minimum experience threshold', () => {
      const min5Years = filterAndSortCandidates(candidatePool, {
        searchQuery: '',
        minExperienceYears: 5,
        location: 'All',
        selectedSkills: [],
        skillMatchMode: 'any',
        sortBy: 'created_at_desc',
      });
      // Brenda (8 yrs) and Carlos (5 yrs)
      expect(min5Years.map(c => c.full_name)).toEqual(['Carlos FullStack', 'Brenda Backend']);
    });

    it('filters correctly by location substring match', () => {
      const sfCandidates = filterAndSortCandidates(candidatePool, {
        searchQuery: '',
        minExperienceYears: 0,
        location: 'San Francisco',
        selectedSkills: [],
        skillMatchMode: 'any',
        sortBy: 'created_at_desc',
      });
      expect(sfCandidates).toHaveLength(2);
      expect(sfCandidates.map(c => c.full_name)).toContain('Aaron Designer');
      expect(sfCandidates.map(c => c.full_name)).toContain('Carlos FullStack');
    });

    it('skill filter: tests ANY mode vs ALL mode rigorously', () => {
      // ANY mode: candidates with Python OR React
      const anyMode = filterAndSortCandidates(candidatePool, {
        searchQuery: '',
        minExperienceYears: 0,
        location: 'All',
        selectedSkills: ['Python', 'React'],
        skillMatchMode: 'any',
        sortBy: 'created_at_desc',
      });
      // Brenda (Python), Carlos (React), Diana (Python)
      expect(anyMode).toHaveLength(3);

      // ALL mode: candidates with Python AND Docker
      const allMode = filterAndSortCandidates(candidatePool, {
        searchQuery: '',
        minExperienceYears: 0,
        location: 'All',
        selectedSkills: ['Python', 'Docker'],
        skillMatchMode: 'all',
        sortBy: 'created_at_desc',
      });
      // Only Brenda has BOTH Python and Docker
      expect(allMode).toHaveLength(1);
      expect(allMode[0].full_name).toBe('Brenda Backend');

      // ALL mode with non-existent skill combo
      const impossibleMode = filterAndSortCandidates(candidatePool, {
        searchQuery: '',
        minExperienceYears: 0,
        location: 'All',
        selectedSkills: ['Figma', 'PyTorch'],
        skillMatchMode: 'all',
        sortBy: 'created_at_desc',
      });
      expect(impossibleMode).toHaveLength(0);
    });

    it('sorting criteria tests: experience_desc, experience_asc, name_asc, match_score_desc, created_at_desc', () => {
      // 1. Experience DESC (Brenda 96m > Carlos 60m > Diana 48m > Aaron 36m)
      const expDesc = filterAndSortCandidates(candidatePool, {
        searchQuery: '',
        minExperienceYears: 0,
        location: 'All',
        selectedSkills: [],
        skillMatchMode: 'any',
        sortBy: 'experience_desc',
      });
      expect(expDesc.map(c => c.id)).toEqual([2, 3, 4, 1]);

      // 2. Experience ASC (Aaron 36m < Diana 48m < Carlos 60m < Brenda 96m)
      const expAsc = filterAndSortCandidates(candidatePool, {
        searchQuery: '',
        minExperienceYears: 0,
        location: 'All',
        selectedSkills: [],
        skillMatchMode: 'any',
        sortBy: 'experience_asc',
      });
      expect(expAsc.map(c => c.id)).toEqual([1, 4, 3, 2]);

      // 3. Name ASC (Aaron, Brenda, Carlos, Diana)
      const nameAsc = filterAndSortCandidates(candidatePool, {
        searchQuery: '',
        minExperienceYears: 0,
        location: 'All',
        selectedSkills: [],
        skillMatchMode: 'any',
        sortBy: 'name_asc',
      });
      expect(nameAsc.map(c => c.full_name)).toEqual([
        'Aaron Designer',
        'Brenda Backend',
        'Carlos FullStack',
        'Diana Data',
      ]);

      // 4. Match Score DESC with Job Context
      const job: Job = {
        id: 99,
        title: 'Full Stack React Engineer',
        required_skills: 'React, TypeScript, Node.js',
        minimum_experience_years: 4,
      };
      const matchSort = filterAndSortCandidates(
        candidatePool,
        {
          searchQuery: '',
          minExperienceYears: 0,
          location: 'All',
          selectedSkills: [],
          skillMatchMode: 'any',
          sortBy: 'match_score_desc',
        },
        job
      );
      // Carlos has highest match for React/TS/Node
      expect(matchSort[0].full_name).toBe('Carlos FullStack');

      // 5. Created At DESC (Default: ID 4, 3, 2, 1)
      const createdDesc = filterAndSortCandidates(candidatePool, {
        searchQuery: '',
        minExperienceYears: 0,
        location: 'All',
        selectedSkills: [],
        skillMatchMode: 'any',
        sortBy: 'created_at_desc',
      });
      expect(createdDesc.map(c => c.id)).toEqual([4, 3, 2, 1]);
    });

    it('sorting stability with identical values', () => {
      const tiedCandidates: Candidate[] = [
        { id: 10, full_name: 'Same Name', total_experience_months: 24 },
        { id: 20, full_name: 'Same Name', total_experience_months: 24 },
        { id: 30, full_name: 'Same Name', total_experience_months: 24 },
      ];

      const sorted = filterAndSortCandidates(tiedCandidates, {
        searchQuery: '',
        minExperienceYears: 0,
        location: 'All',
        selectedSkills: [],
        skillMatchMode: 'any',
        sortBy: 'name_asc',
      });
      expect(sorted).toHaveLength(3);
    });
  });

  describe('4. buildCandidateComparison Matrix Stress Tests (1, 2, 4, 5 candidates)', () => {
    const c1: Candidate = {
      id: 1,
      full_name: 'Dev 1',
      total_experience_months: 36,
      skills: ['React', 'TypeScript', 'Tailwind CSS'] as unknown as Candidate['skills'],
      email: 'dev1@example.com',
      phone: '+1-555-0101',
      summary: 'Frontend specialist',
      linkedin_url: 'https://linkedin.com/in/dev1',
      experiences: [{ id: 1, candidate_id: 1, job_title: 'UI Dev' }],
    };

    const c2: Candidate = {
      id: 2,
      full_name: 'Dev 2',
      total_experience_months: 48,
      skills: ['React', 'Node.js', 'PostgreSQL'] as unknown as Candidate['skills'],
      email: 'dev2@example.com',
      phone: '+1-555-0102',
      summary: 'Fullstack specialist',
    };

    const c3: Candidate = {
      id: 3,
      full_name: 'Dev 3',
      total_experience_months: 60,
      skills: ['React', 'Python', 'FastAPI'] as unknown as Candidate['skills'],
      email: 'dev3@example.com',
    };

    const c4: Candidate = {
      id: 4,
      full_name: 'Dev 4',
      total_experience_months: 72,
      skills: ['React', 'Docker', 'Kubernetes'] as unknown as Candidate['skills'],
    };

    const c5: Candidate = {
      id: 5,
      full_name: 'Dev 5',
      total_experience_months: 84,
      skills: ['React', 'AWS', 'Terraform'] as unknown as Candidate['skills'],
    };

    it('handles empty candidate list gracefully', () => {
      const result = buildCandidateComparison([]);
      expect(result.candidates).toHaveLength(0);
      expect(result.commonSkillsAcrossAll).toHaveLength(0);
      expect(result.allComparedSkills).toHaveLength(0);
    });

    it('handles 1 candidate edge case', () => {
      const result = buildCandidateComparison([c1]);
      expect(result.candidates).toHaveLength(1);
      // For 1 candidate, all their skills are common to the set
      expect(result.commonSkillsAcrossAll).toEqual(['react', 'typescript', 'tailwind css']);
      // All skills are unique to this candidate (no other candidate in set)
      expect(result.candidates[0].uniqueSkills).toEqual(['React', 'TypeScript', 'Tailwind CSS']);
      expect(result.candidates[0].radarMetrics).toHaveLength(5);
    });

    it('handles 2 candidates (standard pair comparison)', () => {
      const result = buildCandidateComparison([c1, c2]);
      expect(result.candidates).toHaveLength(2);
      // Shared skill: 'react'
      expect(result.commonSkillsAcrossAll).toEqual(['react']);
      // c1 unique: TypeScript, Tailwind CSS
      expect(result.candidates[0].uniqueSkills).toEqual(['TypeScript', 'Tailwind CSS']);
      // c2 unique: Node.js, PostgreSQL
      expect(result.candidates[1].uniqueSkills).toEqual(['Node.js', 'PostgreSQL']);
      expect(result.allComparedSkills).toContain('react');
      expect(result.allComparedSkills).toContain('typescript');
      expect(result.allComparedSkills).toContain('node.js');
    });

    it('handles 4 candidates (multi-candidate matrix)', () => {
      const result = buildCandidateComparison([c1, c2, c3, c4]);
      expect(result.candidates).toHaveLength(4);
      // 'react' is present in ALL 4 candidates
      expect(result.commonSkillsAcrossAll).toEqual(['react']);
      // Verify radar metrics exist on every candidate item
      result.candidates.forEach(candItem => {
        expect(candItem.radarMetrics).toHaveLength(5);
        expect(candItem.radarMetrics.map(r => r.subject)).toEqual([
          'Technical Skills',
          'Experience Depth',
          'Keywords / NLP',
          'Education Fit',
          'Profile Completeness',
        ]);
        candItem.radarMetrics.forEach(metric => {
          expect(metric.score).toBeGreaterThanOrEqual(0);
          expect(metric.score).toBeLessThanOrEqual(100);
        });
      });
    });

    it('handles 5 candidates (beyond standard UI 4-slot limit)', () => {
      const result = buildCandidateComparison([c1, c2, c3, c4, c5]);
      expect(result.candidates).toHaveLength(5);
      expect(result.commonSkillsAcrossAll).toEqual(['react']);
      expect(result.allComparedSkills).toHaveLength(11); // react, ts, tailwind, node, postgres, python, fastapi, docker, k8s, aws, terraform
    });

    it('computes comparison with active Job context vs default fallback score', () => {
      const targetJob: Job = {
        id: 201,
        title: 'Full Stack TS Engineer',
        required_skills: 'React, TypeScript',
        preferred_skills: 'Node.js',
        minimum_experience_years: 3,
      };

      const resultWithJob = buildCandidateComparison([c1, c2], targetJob);
      expect(resultWithJob.job).toBe(targetJob);
      // c1 matches React + TypeScript (100% required, 0% preferred -> 70% skillScore)
      expect(resultWithJob.candidates[0].scoreBreakdown).toBeDefined();
      expect(resultWithJob.candidates[0].matchScore).toBe(79.8);
      expect(resultWithJob.candidates[0].missingJobSkills).toHaveLength(0);

      // c2 matches React but misses TypeScript -> lower match score
      expect(resultWithJob.candidates[1].scoreBreakdown).toBeDefined();
      expect(resultWithJob.candidates[1].missingJobSkills).toEqual(['TypeScript']);
    });

    it('radar metrics profile completeness calculation checks all 5 completeness fields', () => {
      const completeCandidate: Candidate = {
        id: 99,
        full_name: 'Complete Cand',
        email: 'comp@test.com', // +20
        phone: '+1 800 555',    // +20
        summary: 'Summary here', // +20
        linkedin_url: 'https://linkedin.com/in/comp', // +20
        experiences: [{ id: 1, candidate_id: 99, job_title: 'Engineer' }], // +20
      };

      const result = buildCandidateComparison([completeCandidate]);
      const completenessMetric = result.candidates[0].radarMetrics.find(m => m.subject === 'Profile Completeness');
      expect(completenessMetric?.score).toBe(100);

      const minimalCandidate: Candidate = {
        id: 100,
        full_name: 'Minimal Cand',
      };
      const resultMinimal = buildCandidateComparison([minimalCandidate]);
      const minimalMetric = resultMinimal.candidates[0].radarMetrics.find(m => m.subject === 'Profile Completeness');
      expect(minimalMetric?.score).toBe(0);
    });
  });

  describe('5. getScoreTier Visual & Semantic Token Output', () => {
    it('returns exact emerald token styling for Excellent Match (>= 85)', () => {
      const tier100 = getScoreTier(100);
      expect(tier100.tier).toBe('Excellent Match');
      expect(tier100.color).toBe('#10B981');
      expect(tier100.badgeVariant).toBe('emerald');

      const tier85 = getScoreTier(85);
      expect(tier85.tier).toBe('Excellent Match');
      expect(tier85.color).toBe('#10B981');
    });

    it('returns exact indigo token styling for Good Match (70 - 84.9)', () => {
      const tier84 = getScoreTier(84.9);
      expect(tier84.tier).toBe('Good Match');
      expect(tier84.color).toBe('#6366F1');
      expect(tier84.badgeVariant).toBe('indigo');

      const tier70 = getScoreTier(70);
      expect(tier70.tier).toBe('Good Match');
    });

    it('returns exact amber token styling for Moderate Match (50 - 69.9)', () => {
      const tier69 = getScoreTier(69.9);
      expect(tier69.tier).toBe('Moderate Match');
      expect(tier69.color).toBe('#F59E0B');
      expect(tier69.badgeVariant).toBe('amber');

      const tier50 = getScoreTier(50);
      expect(tier50.tier).toBe('Moderate Match');
    });

    it('returns exact rose token styling for Low Match (< 50)', () => {
      const tier49 = getScoreTier(49.9);
      expect(tier49.tier).toBe('Low Match');
      expect(tier49.color).toBe('#F43F5E');
      expect(tier49.badgeVariant).toBe('rose');

      const tier0 = getScoreTier(0);
      expect(tier0.tier).toBe('Low Match');
    });
  });

});
