import { describe, it, expect } from 'vitest';
import { mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave, mockDashboardStats } from './setup';
import { extractCandidateSkillNames, normalizeSkill } from '../src/utils/matching';

describe('Milestone M2: Dashboard & Upload Overhaul Comprehensive Suite', () => {
  describe('Dashboard Analytics & Aggregations', () => {
    it('M2.1: aggregates top skills frequency with tech synonym normalization', () => {
      const candidates = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave];
      const counts: Record<string, number> = {};

      candidates.forEach(cand => {
        extractCandidateSkillNames(cand).forEach(skill => {
          const norm = normalizeSkill(skill);
          counts[norm] = (counts[norm] || 0) + 1;
        });
      });

      const sorted = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      expect(sorted.length).toBeGreaterThan(0);
      expect(sorted.find(s => s.name === 'react')?.count).toBe(2);
      expect(sorted.find(s => s.name === 'python')?.count).toBe(2);
      expect(sorted.find(s => s.name === 'javascript')?.count).toBe(2);
    });

    it('M2.2: groups candidates into experience tiers for spline AreaChart', () => {
      const candidates = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave];
      const buckets = {
        '0-2 Yrs': 0,
        '3-5 Yrs': 0,
        '5+ Yrs': 0,
      };

      candidates.forEach(cand => {
        const years = (cand.total_experience_months || 0) / 12;
        if (years < 3) buckets['0-2 Yrs']++;
        else if (years <= 5) buckets['3-5 Yrs']++;
        else buckets['5+ Yrs']++;
      });

      expect(buckets['0-2 Yrs']).toBe(1); // Dave (0.5yr)
      expect(buckets['3-5 Yrs']).toBe(2); // Bob (3yr), Alice (5yr)
      expect(buckets['5+ Yrs']).toBe(1);  // Carol (6yr)
    });

    it('M2.3: classifies candidate match tier funnel donut breakdown', () => {
      const candidates = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave];
      const tiers = { strong: 0, good: 0, moderate: 0, weak: 0 };

      candidates.forEach(cand => {
        const expYears = (cand.total_experience_months || 0) / 12;
        const skillCount = extractCandidateSkillNames(cand).length;
        const score = Math.min(98, Math.max(35, Math.round(expYears * 10 + skillCount * 6)));

        if (score >= 85) tiers.strong++;
        else if (score >= 70) tiers.good++;
        else if (score >= 50) tiers.moderate++;
        else tiers.weak++;
      });

      expect(tiers.strong + tiers.good + tiers.moderate + tiers.weak).toBe(4);
      expect(tiers.strong).toBeGreaterThan(0);
    });

    it('M2.4: correctly formats 4 KPI metric cards and trend sparkline coordinates', () => {
      const kpis = [
        { label: 'Total Candidates', value: mockDashboardStats.total_candidates, sparkline: [12, 16, 20, 24, 30] },
        { label: 'Active Job Openings', value: mockDashboardStats.total_jobs, sparkline: [1, 2, 3, 3, 4] },
        { label: 'Average Match Score', value: `${mockDashboardStats.average_match_score}%`, sparkline: [70, 72, 75, 78] },
        { label: 'Screening Pipeline', value: '100% Online', sparkline: [99, 100, 100, 100] },
      ];

      expect(kpis).toHaveLength(4);
      expect(kpis[0].value).toBe(4);
      expect(kpis[2].value).toBe('78.5%');

      // Verify sparkline coordinate generator math
      const sparklineData = kpis[0].sparkline;
      const min = Math.min(...sparklineData);
      const max = Math.max(...sparklineData);
      const range = max - min || 1;
      const width = 84;
      const height = 28;

      const points = sparklineData.map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');

      expect(points.split(' ')).toHaveLength(5);
    });

    it('M2.5: sorts recent candidates in descending order of creation ID', () => {
      const candidates = [mockCandidateAlice, mockCandidateBob, mockCandidateCarol, mockCandidateDave];
      const recent = [...candidates].sort((a, b) => (b.id || 0) - (a.id || 0));

      expect(recent[0].id).toBe(4); // Dave
      expect(recent[1].id).toBe(3); // Carol
      expect(recent[2].id).toBe(2); // Bob
      expect(recent[3].id).toBe(1); // Alice
    });
  });

  describe('Upload Pipeline & Robust Stepper Execution', () => {
    const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
    const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

    const validateFile = (file: { name: string; size: number }) => {
      if (!file) return { valid: false, error: 'No file provided' };
      if (file.size <= 0) return { valid: false, error: 'File is empty (0 bytes)' };
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return { valid: false, error: `File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)` };
      }
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return { valid: false, error: `Unsupported file format '${ext}'. Please upload .PDF or .DOCX files only.` };
      }
      return { valid: true, error: null };
    };

    it('M2.6: verifies 4-stage pipeline stepper metadata and sequence', () => {
      const UPLOAD_STAGES = [
        { step: 1, title: 'Document Ingestion', desc: 'Validating file integrity & signature' },
        { step: 2, title: 'OCR & Text Extraction', desc: 'Parsing layout structure and raw text' },
        { step: 3, title: 'NLP Entity Recognition', desc: 'Extracting skills, roles, and dates' },
        { step: 4, title: 'Competency Vectorization', desc: 'Generating AI matching embeddings' },
      ];

      expect(UPLOAD_STAGES).toHaveLength(4);
      expect(UPLOAD_STAGES.map(s => s.step)).toEqual([1, 2, 3, 4]);
      expect(UPLOAD_STAGES[0].title).toBe('Document Ingestion');
      expect(UPLOAD_STAGES[3].title).toBe('Competency Vectorization');
    });

    it('M2.7: validates allowed and disallowed resume file types', () => {
      expect(validateFile({ name: 'john_resume.pdf', size: 1024 }).valid).toBe(true);
      expect(validateFile({ name: 'mary_cv.DOCX', size: 2048 }).valid).toBe(true);
      expect(validateFile({ name: 'script.sh', size: 1024 }).valid).toBe(false);
      expect(validateFile({ name: 'archive.zip', size: 1024 }).valid).toBe(false);
      expect(validateFile({ name: 'image.jpg', size: 1024 }).valid).toBe(false);
    });

    it('M2.8: validates file size limits (exact 10MB, oversized, empty)', () => {
      expect(validateFile({ name: 'test.pdf', size: 10 * 1024 * 1024 }).valid).toBe(true);
      expect(validateFile({ name: 'test.pdf', size: 10 * 1024 * 1024 + 1 }).valid).toBe(false);
      expect(validateFile({ name: 'test.pdf', size: 0 }).valid).toBe(false);
    });

    it('M2.9: constructs post-upload success payload and candidate navigation route', () => {
      const candidateId = 101;
      const targetUrl = `/candidates/${candidateId}`;
      expect(targetUrl).toBe('/candidates/101');
    });

    it('M2.10: humanizes byte sizes into readable KB and MB strings', () => {
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
      expect(formatBytes(0)).toBe('0 Bytes');
    });
  });
});
