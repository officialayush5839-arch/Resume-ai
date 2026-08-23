import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  FileText,
  Sparkles,
  Brain,
  Mail,
  Phone,
  MapPin,
  Clock,
  GraduationCap,
  Briefcase,
  Search,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Candidate, Job, Resume, DetailedScoreBreakdown } from '../../types';
import {
  calculateDetailedMatch,
  getScoreTier,
  extractCandidateSkillNames,
  normalizeSkill,
} from '../../utils/matching';
import { ResumeService, JobService } from '../../services/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface ResumePreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  resume?: Resume | null;
  job?: Job | null;
  jobs?: Job[];
  initialTab?: 'structured' | 'raw_text' | 'keywords' | 'insights';
  initialSearchTerm?: string;
  onViewFullProfile?: (candidateId: number) => void;
}

/**
 * Mini Circular Radial Score Gauge
 */
function MiniRadialGauge({ score, size = 48 }: { score: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;
  const tier = getScoreTier(normalizedScore);

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={tier.color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">
        <span className="text-xs font-bold text-slate-100">{Math.round(normalizedScore)}%</span>
      </div>
    </div>
  );
}

/**
 * Generates tailored interview questions based on candidate profile and skills
 */
function generateInterviewQuestions(candidate: Candidate, matchBreakdown?: DetailedScoreBreakdown | null): string[] {
  const questions: string[] = [];
  const skills = extractCandidateSkillNames(candidate);
  const primarySkills = skills.slice(0, 3);
  const expYears = (candidate.total_experience_months || 0) / 12;

  // Technical architecture question
  if (primarySkills.length > 0) {
    questions.push(
      `Can you walk us through a challenging technical problem you solved using ${primarySkills.join(' and ')}, and how you architected the solution?`
    );
  } else {
    questions.push(
      'Can you describe a complex software project you led from initial specification to production deployment?'
    );
  }

  // Experience level question
  if (expYears >= 5) {
    questions.push(
      `Given your ${expYears.toFixed(1)} years of experience, how do you approach mentoring junior engineers, conducting design reviews, and driving technical standards?`
    );
  } else {
    questions.push(
      'How do you stay up-to-date with emerging tools and technologies, and how do you decide when to adopt a new library or paradigm?'
    );
  }

  // Missing skills / Growth area probe
  if (matchBreakdown?.missing_skills && matchBreakdown.missing_skills.length > 0) {
    const missing = matchBreakdown.missing_skills.slice(0, 2).join(', ');
    questions.push(
      `The target role requires experience with ${missing}. How would you ramp up quickly on these technologies, and what adjacent tools have you worked with?`
    );
  } else {
    questions.push(
      'How do you approach performance optimization, observability, and debugging latency issues in distributed web applications?'
    );
  }

  // Behavioral / Collaboration
  questions.push(
    'Describe a scenario where you had a strong technical disagreement with a product manager or teammate. How did you arrive at consensus?'
  );

  return questions;
}

export function ResumePreviewDrawer({
  isOpen,
  onClose,
  candidate,
  resume: initialResume,
  job: initialJob,
  jobs: initialJobs,
  initialTab = 'structured',
  initialSearchTerm = '',
  onViewFullProfile,
}: ResumePreviewDrawerProps) {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'structured' | 'raw_text' | 'keywords' | 'insights'>(initialTab);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedContact, setCopiedContact] = useState<string | null>(null);

  // Resume Text Data State
  const [resumeData, setResumeData] = useState<Resume | null>(initialResume || null);
  const [loadingResume, setLoadingResume] = useState(false);

  // Jobs state for context selector
  const [jobs, setJobs] = useState<Job[]>(initialJobs || []);
  const [selectedJobId, setSelectedJobId] = useState<string>(
    initialJob ? String(initialJob.id) : 'none'
  );

  // Sync initial tab & search term when drawer opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchTerm(initialSearchTerm);
    }
  }, [isOpen, initialTab, initialSearchTerm]);

  // Load jobs if needed
  useEffect(() => {
    if (!initialJobs || initialJobs.length === 0) {
      JobService.getJobs<Job[]>()
        .then((res) => {
          if (Array.isArray(res.data)) {
            setJobs(res.data);
          }
        })
        .catch(() => {});
    } else {
      setJobs(initialJobs);
    }
  }, [initialJobs]);

  // Fetch Resume parsed text from ResumeService if candidate has ID
  useEffect(() => {
    if (candidate && !initialResume) {
      setLoadingResume(true);
      ResumeService.getResumeById<Resume>(candidate.id)
        .then((res) => {
          if (res.data) {
            setResumeData(res.data);
          }
        })
        .catch(() => {
          // Graceful fallback to null
          setResumeData(null);
        })
        .finally(() => {
          setLoadingResume(false);
        });
    } else if (initialResume) {
      setResumeData(initialResume);
    }
  }, [candidate, initialResume]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Resolve target Job context
  const activeJob = useMemo(() => {
    if (selectedJobId !== 'none') {
      return jobs.find((j) => String(j.id) === selectedJobId) || initialJob || null;
    }
    return initialJob || null;
  }, [jobs, selectedJobId, initialJob]);

  // Calculate detailed match scoring
  const matchBreakdown = useMemo(() => {
    if (!candidate) return null;
    if (activeJob) {
      return calculateDetailedMatch(candidate, activeJob);
    }
    return null;
  }, [candidate, activeJob]);

  // Determine raw display text with fallback
  const rawTextContent = useMemo(() => {
    if (resumeData?.parsed_text && resumeData.parsed_text.trim().length > 0) {
      return resumeData.parsed_text;
    }
    if (!candidate) return '';

    // Structured fallback string
    const skillList = extractCandidateSkillNames(candidate).join(', ');
    const expList = (candidate.experiences || [])
      .map(
        (e) =>
          `• ${e.job_title || 'Role'} at ${e.company || 'Company'} (${e.start_date || ''} - ${e.end_date || 'Present'})\n  ${e.description || ''}`
      )
      .join('\n\n');
    const eduList = (candidate.educations || [])
      .map((e) => `• ${e.degree || 'Degree'} from ${e.institution || 'Institution'}`)
      .join('\n');

    return `${candidate.full_name}\nEmail: ${candidate.email || 'N/A'} | Phone: ${candidate.phone || 'N/A'} | Location: ${candidate.location || 'N/A'}\n\nSUMMARY:\n${candidate.summary || 'No summary text available.'}\n\nSKILLS:\n${skillList}\n\nEXPERIENCE:\n${expList}\n\nEDUCATION:\n${eduList}`;
  }, [resumeData, candidate]);

  // Raw text lines for line numbering
  const textLines = useMemo(() => {
    return rawTextContent.split('\n');
  }, [rawTextContent]);

  // Search match count
  const searchMatchCount = useMemo(() => {
    if (!searchTerm.trim()) return 0;
    try {
      const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = rawTextContent.match(regex);
      return matches ? matches.length : 0;
    } catch {
      return 0;
    }
  }, [rawTextContent, searchTerm]);

  // Keyword match occurrences in resume text
  const keywordOccurrences = useMemo(() => {
    if (!activeJob) return [];
    const required = (activeJob.required_skills || '').split(',').map((s) => s.trim()).filter(Boolean);
    const preferred = (activeJob.preferred_skills || '').split(',').map((s) => s.trim()).filter(Boolean);
    const allJobSkills = [...required, ...preferred];

    return allJobSkills.map((skill) => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = rawTextContent.match(regex);
      const count = matches ? matches.length : rawTextContent.toLowerCase().includes(skill.toLowerCase()) ? 1 : 0;
      const isRequired = required.includes(skill);
      return {
        skill,
        count,
        isRequired,
        isMatched: count > 0,
      };
    });
  }, [activeJob, rawTextContent]);

  // Copy full raw text
  const handleCopyRawText = () => {
    navigator.clipboard.writeText(rawTextContent);
    setCopiedText(true);
    toast.success('Resume text copied to clipboard!');
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Copy contact helper
  const handleCopyContact = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContact(key);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedContact(null), 2000);
  };

  // Tailored AI interview questions
  const interviewQuestions = useMemo(() => {
    if (!candidate) return [];
    return generateInterviewQuestions(candidate, matchBreakdown);
  }, [candidate, matchBreakdown]);

  if (!isOpen || !candidate) return null;

  const candidateInitials = candidate.full_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const expYears = ((candidate.total_experience_months || 0) / 12).toFixed(1);
  const skillsList = extractCandidateSkillNames(candidate);
  const overallScore = matchBreakdown?.overall_score ?? Math.min(100, Math.round(((candidate.total_experience_months || 0) / 12) * 10 + skillsList.length * 4));
  const scoreTier = getScoreTier(overallScore);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Frosted Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Slide-over Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="relative z-10 w-full max-w-3xl bg-slate-950/95 border-l border-white/15 shadow-2xl shadow-black/90 backdrop-blur-2xl flex flex-col h-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 border-b border-white/10 bg-slate-900/80 backdrop-blur-md shrink-0 space-y-4">
            <div className="flex items-start justify-between gap-4">
              {/* Candidate Info + Avatar */}
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30 shrink-0">
                  {candidateInitials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-100 truncate">{candidate.full_name}</h2>
                    <span className="text-xs text-slate-500 font-mono">#{candidate.id}</span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{candidate.location || 'Location Not Specified'}</span>
                  </p>
                </div>
              </div>

              {/* Gauge & Close Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Fit Score</span>
                  <Badge variant={scoreTier.badgeVariant} size="sm">
                    {scoreTier.tier}
                  </Badge>
                </div>
                <MiniRadialGauge score={overallScore} size={48} />
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
                  aria-label="Close preview drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contact Pills & Profile Link */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {candidate.email && (
                  <button
                    type="button"
                    onClick={() => handleCopyContact(candidate.email!, 'email', 'Email')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-white/10 text-slate-300 hover:text-indigo-300 hover:border-indigo-400/30 transition-colors cursor-pointer"
                    title="Click to copy email"
                  >
                    {copiedContact === 'email' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span className="truncate max-w-[180px]">{candidate.email}</span>
                  </button>
                )}

                {candidate.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopyContact(candidate.phone!, 'phone', 'Phone')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-white/10 text-slate-300 hover:text-indigo-300 hover:border-indigo-400/30 transition-colors cursor-pointer"
                    title="Click to copy phone"
                  >
                    {copiedContact === 'phone' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{candidate.phone}</span>
                  </button>
                )}
              </div>

              {onViewFullProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewFullProfile(candidate.id)}
                  rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Full Profile
                </Button>
              )}
            </div>

            {/* Navigation Tabs Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('structured')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${
                  activeTab === 'structured'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('raw_text')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${
                  activeTab === 'raw_text'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Raw Text</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('keywords')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${
                  activeTab === 'keywords'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Keywords</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('insights')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none ${
                  activeTab === 'insights'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>AI Insights</span>
              </button>
            </div>
          </div>

          {/* Drawer Scrollable Content Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
            {/* ======================================================== */}
            {/* TAB 1: STRUCTURED PROFILE                                */}
            {/* ======================================================== */}
            {activeTab === 'structured' && (
              <div className="space-y-6">
                {/* 4 Metric Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="glass-card p-3.5 border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" /> Experience
                    </span>
                    <p className="text-base font-bold text-slate-100">{expYears} Yrs</p>
                  </div>

                  <div className="glass-card p-3.5 border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" /> Skills
                    </span>
                    <p className="text-base font-bold text-slate-100">{skillsList.length} Tags</p>
                  </div>

                  <div className="glass-card p-3.5 border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-purple-400" /> Education
                    </span>
                    <p className="text-xs font-bold text-slate-100 truncate" title={candidate.educations?.[0]?.degree || 'N/A'}>
                      {candidate.educations?.[0]?.degree || 'Entry / N/A'}
                    </p>
                  </div>

                  <div className="glass-card p-3.5 border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-emerald-400" /> Positions
                    </span>
                    <p className="text-base font-bold text-slate-100">
                      {candidate.experiences?.length || 0} Roles
                    </p>
                  </div>
                </div>

                {/* Professional Summary */}
                <div className="glass-card p-5 border border-white/10 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-400" /> Professional Summary
                  </h3>
                  <p className="text-sm text-slate-200 leading-relaxed italic">
                    "{candidate.summary || 'No professional summary extracted.'}"
                  </p>
                </div>

                {/* Extracted Skills */}
                <div className="glass-card p-5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" /> Categorized Skills ({skillsList.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((skill, idx) => (
                      <Badge key={idx} variant="cyan" size="md">
                        {skill}
                      </Badge>
                    ))}
                    {skillsList.length === 0 && (
                      <span className="text-xs text-slate-500 italic">No skills extracted.</span>
                    )}
                  </div>
                </div>

                {/* Experience History */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-emerald-400" /> Experience History
                  </h3>

                  {candidate.experiences && candidate.experiences.length > 0 ? (
                    <div className="space-y-3">
                      {candidate.experiences.map((exp, idx) => (
                        <div key={idx} className="glass-card p-4 space-y-2 border border-white/5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <h4 className="font-bold text-slate-100 text-sm">{exp.job_title || 'Position'}</h4>
                            <Badge variant="indigo" size="sm">
                              {exp.start_date || 'N/A'} — {exp.end_date || 'Present'}
                            </Badge>
                          </div>
                          <p className="text-xs text-indigo-400 font-semibold">{exp.company || 'Company'}</p>
                          {exp.description && (
                            <p className="text-xs text-slate-300 leading-relaxed pt-1 whitespace-pre-line">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 text-center text-xs text-slate-500 italic">
                      No experience records found.
                    </div>
                  )}
                </div>

                {/* Education */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-purple-400" /> Education & Credentials
                  </h3>

                  {candidate.educations && candidate.educations.length > 0 ? (
                    <div className="space-y-3">
                      {candidate.educations.map((edu, idx) => (
                        <div key={idx} className="glass-card p-4 space-y-1 border border-white/5">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-100 text-sm">{edu.degree || 'Degree'}</h4>
                            <span className="text-xs text-slate-400">
                              {edu.start_date || ''} {edu.end_date ? `— ${edu.end_date}` : ''}
                            </span>
                          </div>
                          <p className="text-xs text-purple-400 font-medium">{edu.institution || 'Institution'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 text-center text-xs text-slate-500 italic">
                      No education records found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: RAW EXTRACTED TEXT                                */}
            {/* ======================================================== */}
            {activeTab === 'raw_text' && (
              <div className="space-y-4">
                {/* Search & Action Toolbar */}
                <div className="glass-card p-4 border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* In-Viewer Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search within extracted resume..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Occurrences Counter & Copy Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {searchTerm.trim() && (
                      <span className="text-xs font-semibold text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                        {searchMatchCount} match{searchMatchCount !== 1 ? 'es' : ''}
                      </span>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      onClick={handleCopyRawText}
                      className="text-xs"
                    >
                      {copiedText ? 'Copied' : 'Copy Text'}
                    </Button>
                  </div>
                </div>

                {/* Document Viewer with Line Numbers */}
                <div className="rounded-2xl border border-white/10 bg-slate-950/90 overflow-hidden shadow-2xl">
                  <div className="px-4 py-2.5 bg-slate-900/90 border-b border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      {resumeData?.file_path || 'parsed_resume_output.txt'}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      {loadingResume && <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />}
                      {textLines.length} lines
                    </span>
                  </div>

                  <div className="p-4 max-h-[500px] overflow-y-auto font-mono text-xs leading-relaxed space-y-1 select-text">
                    {loadingResume ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                        <span className="text-xs">Loading resume text...</span>
                      </div>
                    ) : (
                      textLines.map((line, lineIdx) => {
                        const lineNum = lineIdx + 1;
                        const hasSearchTerm =
                          searchTerm.trim() &&
                          line.toLowerCase().includes(searchTerm.toLowerCase().trim());

                        return (
                          <div
                            key={lineIdx}
                            className={`flex items-start gap-3 py-0.5 rounded px-1.5 transition-colors ${
                              hasSearchTerm ? 'bg-indigo-950/40 border border-indigo-500/30' : 'hover:bg-white/5'
                            }`}
                          >
                            {/* Line Number */}
                            <span className="text-slate-600 select-none text-right w-8 shrink-0 font-mono text-[11px]">
                              {lineNum}
                            </span>

                            {/* Line Text Content with Highlight */}
                            <span className="text-slate-200 flex-1 break-words">
                              {searchTerm.trim() && hasSearchTerm ? (
                                <HighlightedText text={line} highlight={searchTerm.trim()} />
                              ) : (
                                line || '\u00A0'
                              )}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: KEYWORD MATCH HIGHLIGHTS                          */}
            {/* ======================================================== */}
            {activeTab === 'keywords' && (
              <div className="space-y-5">
                {/* Target Job Requisition Selector */}
                <div className="glass-card p-4 border border-white/10 space-y-2">
                  <label htmlFor="preview-job-select" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-indigo-400" /> Screen Against Requisition:
                  </label>
                  <select
                    id="preview-job-select"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-400"
                  >
                    <option value="none">Select a Job Requisition...</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={String(j.id)}>
                        {j.title} — {j.company} ({j.minimum_experience_years || 0}+ yrs exp)
                      </option>
                    ))}
                  </select>
                </div>

                {activeJob && matchBreakdown ? (
                  <div className="space-y-5">
                    {/* Dimensional Score Breakdown Card */}
                    <div className="glass-card p-5 border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Requisition Alignment Breakdown
                        </h4>
                        <span className="text-base font-extrabold text-indigo-400">
                          {matchBreakdown.overall_score}%
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Technical Skills (45%):</span>
                            <span className="font-bold text-slate-200">{matchBreakdown.skill_score}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${matchBreakdown.skill_score}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Total Experience (25%):</span>
                            <span className="font-bold text-slate-200">{matchBreakdown.experience_score}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${matchBreakdown.experience_score}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">NLP Keyword Density (20%):</span>
                            <span className="font-bold text-slate-200">{matchBreakdown.keyword_score}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${matchBreakdown.keyword_score}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Education Alignment (10%):</span>
                            <span className="font-bold text-slate-200">{matchBreakdown.education_score}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${matchBreakdown.education_score}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Matched Keywords Grid with Occurrences */}
                    <div className="glass-card p-5 border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Matched Skills Found in Resume ({matchBreakdown.matching_skills.length})
                        </h4>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {matchBreakdown.matching_skills.map((skill, idx) => {
                          const occ = keywordOccurrences.find(
                            (k) => normalizeSkill(k.skill) === normalizeSkill(skill)
                          );
                          return (
                            <Badge
                              key={idx}
                              variant="emerald"
                              size="md"
                              icon={<Check className="w-3 h-3 text-emerald-400" />}
                            >
                              <span>{skill}</span>
                              {occ && occ.count > 0 && (
                                <span className="text-[10px] text-emerald-300 font-bold ml-1">
                                  ({occ.count}x)
                                </span>
                              )}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    {/* Missing Required Skills */}
                    {matchBreakdown.missing_skills.length > 0 && (
                      <div className="glass-card p-5 border border-rose-500/20 bg-rose-500/5 space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                            Missing Required Skills ({matchBreakdown.missing_skills.length})
                          </h4>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {matchBreakdown.missing_skills.map((skill, idx) => (
                            <Badge key={idx} variant="rose" size="md">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 glass-card text-center text-slate-400 space-y-2 border border-white/5">
                    <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-200">Select a Target Job Requisition</p>
                    <p className="text-xs text-slate-500">
                      Choose a job above to view keyword occurrences, score breakdowns, and missing requirements.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: AI SCREENING INSIGHTS                             */}
            {/* ======================================================== */}
            {activeTab === 'insights' && (
              <div className="space-y-5">
                {/* Fit Recommendation Banner */}
                <div
                  className={`p-5 rounded-2xl border ${scoreTier.bg} ${scoreTier.border} space-y-2 shadow-lg`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-indigo-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        AI Fit Recommendation
                      </span>
                    </div>
                    <Badge variant={scoreTier.badgeVariant} size="md">
                      {matchBreakdown?.recommendation || scoreTier.tier}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {matchBreakdown
                      ? `Candidate demonstrates a ${matchBreakdown.recommendation.toLowerCase()} (${matchBreakdown.overall_score}%) for the target role with ${skillsList.length} total parsed competencies.`
                      : `Candidate profile has ${skillsList.length} verified technical skills and ${expYears} years of total industry tenure.`}
                  </p>
                </div>

                {/* Candidate Strengths */}
                <div className="glass-card p-5 border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Key Strengths & Differentiators
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-200">
                    {matchBreakdown?.strengths && matchBreakdown.strengths.length > 0 ? (
                      matchBreakdown.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                          <span>{str}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                          <span>Strong foundational technical skill alignment with {skillsList.length} verified skills</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                          <span>Consistent career tenure ({expYears} years total experience)</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Areas for Growth / Weaknesses */}
                {matchBreakdown?.weaknesses && matchBreakdown.weaknesses.length > 0 && (
                  <div className="glass-card p-5 border border-amber-500/20 bg-amber-500/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Areas for Growth & Potential Gaps
                      </h4>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-200">
                      {matchBreakdown.weaknesses.map((weak, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                          <span>{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Interview Questions */}
                <div className="glass-card p-5 border border-indigo-500/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Suggested Interview Questions
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {interviewQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                          Question #{idx + 1}
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed font-medium">"{q}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/80 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ResumeIQ AI Parser Verified</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
                Close Drawer
              </Button>
              {onViewFullProfile && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onViewFullProfile(candidate.id)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  className="text-xs shadow-lg shadow-indigo-500/20"
                >
                  View Full Profile
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Text search highlight helper component
 */
function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <>{text}</>;

  const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark
            key={i}
            className="bg-amber-400/30 text-amber-200 px-0.5 rounded border border-amber-400/40 font-bold"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default ResumePreviewDrawer;
