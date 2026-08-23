import type { 
  Candidate, 
  Job, 
  DetailedScoreBreakdown, 
  CandidateFilterCriteria, 
  ComparisonMatrixData,
  CandidateComparisonItem,
  RadarMetric 
} from '../types';

/**
 * Normalizes common tech synonyms for robust matching.
 */
export function normalizeSkill(skill: string): string {
  if (!skill) return '';
  const s = skill.toLowerCase().trim();
  const mapping: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'node': 'node.js',
    'nodejs': 'node.js',
    'reactjs': 'react',
    'react.js': 'react',
    'vuejs': 'vue',
    'vue.js': 'vue',
    'postgres': 'postgresql',
    'psql': 'postgresql',
    'mongo': 'mongodb',
    'ml': 'machine learning',
    'dl': 'deep learning',
    'deep-learning': 'deep learning',
    'ai': 'artificial intelligence',
    'k8s': 'kubernetes',
    'golang': 'go',
    'py': 'python',
    'aws cloud': 'aws',
    'amazon web services': 'aws',
    'gcp': 'google cloud',
    'rest': 'rest api',
    'restful': 'rest api',
    'rest apis': 'rest api',
    'ci/cd': 'cicd',
    'tailwind': 'tailwind css',
    'tailwindcss': 'tailwind css',
  };
  return mapping[s] || s;
}

/**
 * Parses comma-separated skill strings into clean trimmed arrays.
 */
export function parseSkillList(skillsStr?: string | null): string[] {
  if (!skillsStr) return [];
  return skillsStr
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Extracts raw skill names safely from Candidate object.
 */
export function extractCandidateSkillNames(candidate: Candidate): string[] {
  if (!candidate || !candidate.skills) return [];
  return candidate.skills
    .map(cs => (typeof cs === 'string' ? cs : cs.skill?.name || ''))
    .filter((name): name is string => Boolean(name && name.trim().length > 0));
}

/**
 * Calculates a multi-dimensional match score between a Candidate and a Job
 * matching the exact FastAPI backend formula:
 * - Technical Skills: 45%
 * - Total Experience: 25%
 * - Keywords in Summary & Profile: 20%
 * - Education Requirement: 10%
 */
export function calculateDetailedMatch(candidate: Candidate, job: Job): DetailedScoreBreakdown {
  const candidateSkills = extractCandidateSkillNames(candidate);
  const requiredSkills = parseSkillList(job.required_skills);
  const preferredSkills = parseSkillList(job.preferred_skills);

  const normCandidate = new Set(candidateSkills.map(normalizeSkill));
  const normRequired = new Set(requiredSkills.map(normalizeSkill));
  const normPreferred = new Set(preferredSkills.map(normalizeSkill));

  // 1. Skill Score
  const matchingReq = Array.from(normRequired).filter(s => normCandidate.has(s));
  const missingReq = requiredSkills.filter(orig => !normCandidate.has(normalizeSkill(orig)));
  const matchingPref = Array.from(normPreferred).filter(s => normCandidate.has(s));

  const reqScore = normRequired.size > 0 ? (matchingReq.length / normRequired.size) * 100 : 100;
  const prefScore = normPreferred.size > 0 ? (matchingPref.length / normPreferred.size) * 100 : 0;

  let skillScore = 100;
  if (normRequired.size > 0 && normPreferred.size > 0) {
    skillScore = (reqScore * 0.7) + (prefScore * 0.3);
  } else if (normRequired.size > 0) {
    skillScore = reqScore;
  } else if (normPreferred.size > 0) {
    skillScore = prefScore;
  }

  // 2. Experience Score
  const reqMonths = (job.minimum_experience_years || 0) * 12;
  const candMonths = candidate.total_experience_months || 0;
  let expScore = 100;
  if (reqMonths > 0) {
    expScore = candMonths >= reqMonths ? 100 : Math.round((candMonths / reqMonths) * 10000) / 100;
  }

  // 3. Education Score
  const reqEdu = (job.education_requirement || '').toLowerCase().trim();
  let eduScore = 0;
  if (!reqEdu) {
    eduScore = 100;
  } else {
    const candidateEdu = candidate.educations || [];
    const hasMatch = candidateEdu.some(e => {
      const deg = (e.degree || '').toLowerCase();
      const inst = (e.institution || '').toLowerCase();
      return deg.includes(reqEdu) || reqEdu.includes(deg) || inst.includes(reqEdu) || reqEdu.includes(inst);
    });
    if (hasMatch) {
      eduScore = 100;
    } else if (candidateEdu.length > 0) {
      eduScore = 60;
    } else {
      eduScore = 20;
    }
  }

  // 4. Keyword Score (checked across summary, experiences, and skill sets)
  const expText = (candidate.experiences || []).map(e => `${e.job_title || ''} ${e.description || ''}`).join(' ');
  const fullCandidateText = `${candidate.summary || ''} ${expText} ${candidateSkills.join(' ')}`.toLowerCase();
  const allJobSkills = [...requiredSkills, ...preferredSkills];
  let keywordScore = 100;
  if (allJobSkills.length > 0) {
    const found = allJobSkills.filter(s => fullCandidateText.includes(s.toLowerCase()));
    keywordScore = Math.round((found.length / allJobSkills.length) * 10000) / 100;
  }

  // Weighted Overall Total: Skills 45%, Exp 25%, Keyword 20%, Edu 10%
  const overallScore = Math.round(
    ((skillScore * 0.45) + (expScore * 0.25) + (keywordScore * 0.20) + (eduScore * 0.10)) * 10
  ) / 10;

  // Recommendation Tier
  let recommendation: DetailedScoreBreakdown['recommendation'] = 'Weak Match';
  if (overallScore >= 85) recommendation = 'Strong Match';
  else if (overallScore >= 70) recommendation = 'Good Match';
  else if (overallScore >= 50) recommendation = 'Moderate Match';

  // Strengths & Weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (skillScore >= 80) strengths.push('Strong core technical alignment');
  else if (skillScore < 55) weaknesses.push(`Missing key required skills: ${missingReq.slice(0, 3).join(', ')}`);

  if (expScore >= 100) strengths.push(`Meets or exceeds experience requirement (${Math.round((candMonths / 12) * 10) / 10} yrs)`);
  else if (expScore < 70) weaknesses.push(`Below target experience (${Math.round((candMonths / 12) * 10) / 10} yrs vs ${job.minimum_experience_years} yrs)`);

  if (keywordScore >= 75) strengths.push('High keyword density in career summary & history');
  if (eduScore >= 90) strengths.push('Directly matches educational requirements');

  const matchingSkillNames = candidateSkills.filter(cs => {
    const norm = normalizeSkill(cs);
    return normRequired.has(norm) || normPreferred.has(norm);
  });

  return {
    overall_score: Math.min(100, Math.max(0, overallScore)),
    skill_score: Math.round(Math.min(100, skillScore) * 10) / 10,
    experience_score: Math.round(Math.min(100, expScore) * 10) / 10,
    education_score: Math.round(Math.min(100, eduScore) * 10) / 10,
    keyword_score: Math.round(Math.min(100, keywordScore) * 10) / 10,
    matching_skills: Array.from(new Set(matchingSkillNames)),
    missing_skills: missingReq,
    recommendation,
    strengths,
    weaknesses,
  };
}

/**
 * Filter & Sort Candidates with multi-facet filters
 */
export function filterAndSortCandidates(
  candidates: Candidate[],
  criteria: CandidateFilterCriteria,
  jobContext?: Job | null
): Candidate[] {
  if (!candidates || !Array.isArray(candidates)) return [];

  return candidates.filter(candidate => {
    // 1. Full text search
    if (criteria.searchQuery && criteria.searchQuery.trim()) {
      const q = criteria.searchQuery.toLowerCase().trim();
      const nameMatch = (candidate.full_name || '').toLowerCase().includes(q);
      const emailMatch = (candidate.email || '').toLowerCase().includes(q);
      const summaryMatch = (candidate.summary || '').toLowerCase().includes(q);
      const locationMatch = (candidate.location || '').toLowerCase().includes(q);
      const skillsMatch = extractCandidateSkillNames(candidate).some(s => s.toLowerCase().includes(q));
      
      if (!nameMatch && !emailMatch && !summaryMatch && !locationMatch && !skillsMatch) {
        return false;
      }
    }

    // 2. Minimum experience
    if (criteria.minExperienceYears > 0) {
      const years = (candidate.total_experience_months || 0) / 12;
      if (years < criteria.minExperienceYears) return false;
    }

    // 3. Location filter
    if (criteria.location && criteria.location !== 'All' && criteria.location.trim().length > 0) {
      const candLoc = (candidate.location || '').toLowerCase();
      const targetLoc = criteria.location.toLowerCase();
      if (!candLoc.includes(targetLoc)) {
        return false;
      }
    }

    // 4. Skill tags filter
    if (criteria.selectedSkills && criteria.selectedSkills.length > 0) {
      const candSkills = new Set(extractCandidateSkillNames(candidate).map(normalizeSkill));
      const targetSkills = criteria.selectedSkills.map(normalizeSkill);
      
      if (criteria.skillMatchMode === 'all') {
        const hasAll = targetSkills.every(s => candSkills.has(s));
        if (!hasAll) return false;
      } else {
        const hasAny = targetSkills.some(s => candSkills.has(s));
        if (!hasAny) return false;
      }
    }

    return true;
  }).sort((a, b) => {
    switch (criteria.sortBy) {
      case 'experience_desc':
        return (b.total_experience_months || 0) - (a.total_experience_months || 0);
      case 'experience_asc':
        return (a.total_experience_months || 0) - (b.total_experience_months || 0);
      case 'name_asc':
        return (a.full_name || '').localeCompare(b.full_name || '');
      case 'match_score_desc':
        if (jobContext) {
          const scoreA = calculateDetailedMatch(a, jobContext).overall_score;
          const scoreB = calculateDetailedMatch(b, jobContext).overall_score;
          return scoreB - scoreA;
        }
        return (b.total_experience_months || 0) - (a.total_experience_months || 0);
      case 'created_at_desc':
      default:
        return (b.id || 0) - (a.id || 0);
    }
  });
}

/**
 * Builds candidate comparison data for 2 to 4 candidates
 */
export function buildCandidateComparison(
  candidates: Candidate[],
  job?: Job | null
): ComparisonMatrixData {
  if (!candidates || candidates.length === 0) {
    return {
      job,
      candidates: [],
      commonSkillsAcrossAll: [],
      allComparedSkills: [],
    };
  }

  const allCandidateSkillsLists = candidates.map(c => 
    new Set(extractCandidateSkillNames(c).map(normalizeSkill))
  );

  // Collect all unique normalized skills across all candidates
  const allSkillsSet = new Set<string>();
  candidates.forEach(c => {
    extractCandidateSkillNames(c).forEach(s => allSkillsSet.add(normalizeSkill(s)));
  });

  // Find common skills present in ALL candidates
  const commonSkills = Array.from(allSkillsSet).filter(skill => 
    allCandidateSkillsLists.every(skillSet => skillSet.has(skill))
  );

  const comparisonItems: CandidateComparisonItem[] = candidates.map((cand, idx) => {
    const candSkillNames = extractCandidateSkillNames(cand);

    // Unique skills: skills cand has that no OTHER candidate in the list has
    const otherCandidateSkillSets = allCandidateSkillsLists.filter((_, i) => i !== idx);
    const uniqueSkills = candSkillNames.filter(s => {
      const norm = normalizeSkill(s);
      return !otherCandidateSkillSets.some(otherSet => otherSet.has(norm));
    });

    let scoreBreakdown: DetailedScoreBreakdown | undefined;
    let matchScore = 0;
    let missingJobSkills: string[] = [];

    if (job) {
      scoreBreakdown = calculateDetailedMatch(cand, job);
      matchScore = scoreBreakdown.overall_score;
      missingJobSkills = scoreBreakdown.missing_skills;
    } else {
      // Default score based on experience & skill depth
      const expYears = (cand.total_experience_months || 0) / 12;
      matchScore = Math.min(100, Math.round((expYears * 10) + (candSkillNames.length * 5)));
    }

    // Generate 5-axis Radar Metrics
    const radarMetrics: RadarMetric[] = [
      {
        subject: 'Technical Skills',
        score: scoreBreakdown ? scoreBreakdown.skill_score : Math.min(100, candSkillNames.length * 10),
        fullMark: 100,
      },
      {
        subject: 'Experience Depth',
        score: scoreBreakdown ? scoreBreakdown.experience_score : Math.min(100, ((cand.total_experience_months || 0) / 60) * 100),
        fullMark: 100,
      },
      {
        subject: 'Keywords / NLP',
        score: scoreBreakdown ? scoreBreakdown.keyword_score : 80,
        fullMark: 100,
      },
      {
        subject: 'Education Fit',
        score: scoreBreakdown ? scoreBreakdown.education_score : ((cand.educations || []).length > 0 ? 85 : 50),
        fullMark: 100,
      },
      {
        subject: 'Profile Completeness',
        score: Math.min(100, 
          (cand.email ? 20 : 0) + 
          (cand.phone ? 20 : 0) + 
          (cand.summary ? 20 : 0) + 
          (cand.linkedin_url || cand.github_url ? 20 : 0) + 
          (cand.experiences?.length ? 20 : 0)
        ),
        fullMark: 100,
      },
    ];

    return {
      candidate: cand,
      scoreBreakdown,
      matchScore,
      sharedSkills: commonSkills,
      uniqueSkills,
      missingJobSkills,
      radarMetrics,
    };
  });

  return {
    job,
    candidates: comparisonItems,
    commonSkillsAcrossAll: commonSkills,
    allComparedSkills: Array.from(allSkillsSet),
  };
}

/**
 * Returns color tiers and styling tokens for a given match percentage.
 */
export function getScoreTier(score: number) {
  if (score >= 85) {
    return {
      tier: 'Excellent Match',
      color: '#10B981',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
      textClass: 'text-emerald-400',
      badgeVariant: 'emerald' as const,
    };
  }
  if (score >= 70) {
    return {
      tier: 'Good Match',
      color: '#6366F1',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      glow: 'shadow-[0_0_20px_rgba(99,102,241,0.35)]',
      textClass: 'text-indigo-400',
      badgeVariant: 'indigo' as const,
    };
  }
  if (score >= 50) {
    return {
      tier: 'Moderate Match',
      color: '#F59E0B',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
      textClass: 'text-amber-400',
      badgeVariant: 'amber' as const,
    };
  }
  return {
    tier: 'Low Match',
    color: '#F43F5E',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.35)]',
    textClass: 'text-rose-400',
    badgeVariant: 'rose' as const,
  };
}
