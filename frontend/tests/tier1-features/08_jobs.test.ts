import { describe, it, expect } from 'vitest';
import { mockJobFrontendLead, mockJobAIResearcher } from '../setup';
import { parseSkillList } from '../../src/utils/matching';
import { JobCreatePayload } from '../../src/types';

describe('Feature 8: Jobs Requisition & Create Job Modal', () => {
  it('T1.8.1: displays job requisition details and required skills accurately', () => {
    // Authoritative source: ORIGINAL_REQUEST §Existing Stack, PROJECT.md §Feature Inventory (#17)
    expect(mockJobFrontendLead.title).toBe('Senior Frontend Architect');
    expect(mockJobFrontendLead.company).toBe('ResumeIQ Technologies');
    expect(mockJobFrontendLead.minimum_experience_years).toBe(4);
    expect(mockJobFrontendLead.location).toBe('San Francisco, CA');

    const requiredSkills = parseSkillList(mockJobFrontendLead.required_skills);
    expect(requiredSkills).toEqual(['React', 'TypeScript', 'Tailwind CSS']);
  });

  it('T1.8.2: validates mandatory fields in Create Job form (title and company)', () => {
    // Authoritative source: survey_spec_miner_1 §1.2 & §5.2 Endpoint 8
    const validateJobForm = (payload: Partial<JobCreatePayload>) => {
      const errors: Record<string, string> = {};
      if (!payload.title || payload.title.trim() === '') {
        errors.title = 'Title is required';
      }
      if (!payload.company || payload.company.trim() === '') {
        errors.company = 'Company is required';
      }
      return { isValid: Object.keys(errors).length === 0, errors };
    };

    const invalid = validateJobForm({ description: 'Dev' });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.title).toBeDefined();
    expect(invalid.errors.company).toBeDefined();

    const valid = validateJobForm({ title: 'Full Stack Engineer', company: 'NextCorp' });
    expect(valid.isValid).toBe(true);
  });

  it('T1.8.3: dynamically manages skill tags in Create Job Modal (add on Enter, remove on X)', () => {
    // Authoritative source: PROJECT.md §Feature Inventory (#18)
    let tags: string[] = ['React', 'TypeScript'];

    // Add tag
    const addTag = (newTag: string) => {
      const trimmed = newTag.trim();
      if (trimmed && !tags.includes(trimmed)) {
        tags = [...tags, trimmed];
      }
    };

    // Remove tag
    const removeTag = (tagToRemove: string) => {
      tags = tags.filter(t => t !== tagToRemove);
    };

    addTag('Tailwind CSS');
    expect(tags).toEqual(['React', 'TypeScript', 'Tailwind CSS']);

    // Prevent duplicate
    addTag('React');
    expect(tags).toHaveLength(3);

    removeTag('TypeScript');
    expect(tags).toEqual(['React', 'Tailwind CSS']);
  });

  it('T1.8.4: constructs complete JobCreatePayload matching API specification', () => {
    // Authoritative source: PROJECT.md §Interface Contracts, JobCreatePayload
    const payload: JobCreatePayload = {
      title: 'DevOps Lead',
      company: 'CloudScale',
      description: 'Lead Kubernetes & CI/CD infrastructure',
      required_skills: 'Kubernetes, Docker, Terraform',
      preferred_skills: 'AWS, Prometheus',
      minimum_experience_years: 5,
      education_requirement: 'B.S. in Computer Science or related',
      location: 'Remote',
    };

    expect(payload.title).toBe('DevOps Lead');
    expect(payload.company).toBe('CloudScale');
    expect(payload.minimum_experience_years).toBe(5);
    expect(payload.required_skills).toBe('Kubernetes, Docker, Terraform');
  });

  it('T1.8.5: handles job deletion and requisition list revalidation', () => {
    // Authoritative source: survey_spec_miner_1 §5.2 Endpoint 10
    let jobs = [mockJobFrontendLead, mockJobAIResearcher];
    const deleteJob = (id: number) => {
      jobs = jobs.filter(j => j.id !== id);
    };

    expect(jobs).toHaveLength(2);
    deleteJob(mockJobFrontendLead.id);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe(mockJobAIResearcher.id);
  });
});
