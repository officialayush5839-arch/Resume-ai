import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertCircle,
  Trash2,
  Check,
  ExternalLink,
  Building2,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Brain,
  RotateCw,
  Sun,
  Moon,
} from 'lucide-react';
import { CandidateService, JobService } from '../services/api';
import type { Candidate, Job, DetailedScoreBreakdown, RadarMetric } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  calculateDetailedMatch,
  buildCandidateComparison,
  getScoreTier,
} from '../utils/matching';
import { LinkedinIcon, GithubIcon, PortfolioIcon, PulseDot, BrainCircuitIcon } from '../utils/icons';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Data States
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Job Match Evaluator State
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  // Skill Category Filter Tab
  const [activeSkillCategory, setActiveSkillCategory] = useState<string>('All');
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>('');

  // Copy Feedback State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Candidate Profile & Jobs
  const fetchProfileData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [candRes, jobsRes] = await Promise.allSettled([
        CandidateService.getCandidateById<Candidate>(id),
        JobService.getJobs<Job[]>(),
      ]);

      if (candRes.status === 'fulfilled' && candRes.value.data) {
        setCandidate(candRes.value.data);
      } else {
        setError('Candidate profile not found or could not be loaded.');
      }

      if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value.data)) {
        setJobs(jobsRes.value.data);
        if (jobsRes.value.data.length > 0) {
          setSelectedJobId(String(jobsRes.value.data[0].id));
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load candidate profile.');
      toast.error('Could not connect to candidate profile service');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Selected Job for Evaluator
  const selectedJob = useMemo(() => {
    return jobs.find((j) => String(j.id) === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  // Real-time Match Calculation against selected job
  const matchBreakdown: DetailedScoreBreakdown | null = useMemo(() => {
    if (!candidate || !selectedJob) return null;
    return calculateDetailedMatch(candidate, selectedJob);
  }, [candidate, selectedJob]);

  // 5-Axis Competency Radar Dataset
  const radarDataset: RadarMetric[] = useMemo(() => {
    if (!candidate) return [];
    const comparison = buildCandidateComparison([candidate], selectedJob);
    return comparison.candidates[0]?.radarMetrics || [];
  }, [candidate, selectedJob]);

  // Unique Skill Categories
  const skillCategories = useMemo(() => {
    if (!candidate || !candidate.skills) return ['All'];
    const cats = new Set<string>();
    candidate.skills.forEach((cs) => {
      const cat = cs.skill?.category || 'Other';
      cats.add(cat);
    });
    return ['All', ...Array.from(cats)];
  }, [candidate]);

  // Filtered Skills List
  const filteredSkills = useMemo(() => {
    if (!candidate || !candidate.skills) return [];
    return candidate.skills.filter((cs) => {
      const name = cs.skill?.name || '';
      const category = cs.skill?.category || 'Other';

      // Category filter
      if (activeSkillCategory !== 'All' && category !== activeSkillCategory) {
        return false;
      }

      // Search query filter
      if (skillSearchQuery.trim()) {
        const q = skillSearchQuery.toLowerCase();
        if (!name.toLowerCase().includes(q) && !category.toLowerCase().includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [candidate, activeSkillCategory, skillSearchQuery]);

  // Copy to Clipboard Helper
  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Delete Candidate Handler
  const handleDelete = async () => {
    if (!candidate) return;
    setIsDeleting(true);
    try {
      await CandidateService.deleteCandidate(candidate.id);
      toast.success(`Deleted profile for "${candidate.full_name}"`);
      navigate('/candidates');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to delete candidate');
    } finally {
      setIsDeleting(false);
    }
  };

  // Skill proficiency percentage helper
  const getProficiencyPercentage = (proficiency?: string | null): number => {
    if (!proficiency) return 70;
    const p = proficiency.toLowerCase();
    if (p.includes('expert')) return 95;
    if (p.includes('advanced')) return 80;
    if (p.includes('intermediate')) return 65;
    if (p.includes('beginner')) return 40;
    return 70;
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-16">
        {/* Back Button Skeleton */}
        <div className="w-36 h-9 bg-slate-800/60 rounded-xl animate-shimmer" />

        {/* Hero Card Skeleton */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Skeleton variant="circular" className="w-24 h-24 shrink-0" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <div className="flex gap-3">
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-20 w-32 rounded-2xl" />
          </div>
        </div>

        {/* Grid Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Candidate Not Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'The requested candidate profile does not exist.'}</p>
        </div>
        <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/candidates')}>
          Return to Candidates Directory
        </Button>
      </div>
    );
  }

  const initials = candidate.full_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const totalExpYears = candidate.total_experience_months
    ? (candidate.total_experience_months / 12).toFixed(1)
    : '0.0';

  const matchTier = matchBreakdown ? getScoreTier(matchBreakdown.overall_score) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-20 max-w-7xl mx-auto"
    >
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/candidates')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-300 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Candidates Directory</span>
        </button>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            onClick={toggleTheme}
          >
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchProfileData}
          >
            Refresh
          </Button>

          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete Profile
          </Button>
        </div>
      </div>

      {/* Hero Profile Banner Card */}
      <Card variant="glow" glowColor="indigo" className="p-8 border border-slate-200/80 dark:border-white/10 relative overflow-hidden">
        {/* Ambient Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Avatar & Core Bio */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1">
            {/* Avatar Circle */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center text-3xl font-extrabold text-slate-900 dark:text-white shadow-2xl shadow-indigo-500/30 border border-indigo-300/30 shrink-0 group-hover:scale-105 transition-transform">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 border border-slate-200/80 dark:border-white/10">
                <PulseDot color="bg-emerald-400" />
              </div>
            </div>

            {/* Name, Headline & Metadata */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {candidate.full_name}
                </h1>
                <Badge variant="slate" size="md">
                  ID: #{candidate.id}
                </Badge>
                <Badge variant="emerald" size="md" dot pulse>
                  Verified AI Parse
                </Badge>
              </div>

              {/* Location & Experience Pill */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                {candidate.location && (
                  <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {candidate.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> {totalExpYears} Years Experience
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <Award className="w-3.5 h-3.5 text-purple-400" /> {candidate.skills?.length || 0} Extracted Skills
                </span>
              </div>
            </div>
          </div>

          {/* Quick Experience Badge Highlight */}
          <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 p-5 rounded-2xl shrink-0 backdrop-blur-xl shadow-xl">
            <div className="text-center px-3 border-r border-slate-200/80 dark:border-white/10">
              <p className="text-2xl font-black text-indigo-400">{totalExpYears}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Years Exp</p>
            </div>
            <div className="text-center px-3 border-r border-slate-200/80 dark:border-white/10">
              <p className="text-2xl font-black text-emerald-400">{candidate.skills?.length || 0}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Skills</p>
            </div>
            <div className="text-center px-3">
              <p className="text-2xl font-black text-cyan-400">{candidate.experiences?.length || 0}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Tenures</p>
            </div>
          </div>
        </div>

        {/* Professional Summary Box */}
        {candidate.summary && (
          <div className="mt-6 pt-6 border-t border-slate-200/80 dark:border-white/10">
            <div className="glass-card p-4 bg-slate-100/80 dark:bg-slate-900/50 border-slate-200/60 dark:border-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuitIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  AI Career Summary & Overview
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "{candidate.summary}"
              </p>
            </div>
          </div>
        )}

        {/* Contact Pills & External Links */}
        <div className="mt-6 pt-6 border-t border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Click to Copy Contacts */}
          <div className="flex flex-wrap items-center gap-2.5">
            {candidate.email && (
              <button
                type="button"
                onClick={() => handleCopy(candidate.email!, 'email', 'Email')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:text-indigo-300 hover:border-indigo-400/50 transition-all cursor-pointer group shadow-sm"
                title="Click to copy email address"
              >
                {copiedKey === 'email' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Mail className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                )}
                <span>{candidate.email}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider ml-1">Copy</span>
              </button>
            )}

            {candidate.phone && (
              <button
                type="button"
                onClick={() => handleCopy(candidate.phone!, 'phone', 'Phone number')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:text-emerald-300 hover:border-emerald-400/50 transition-all cursor-pointer group shadow-sm"
                title="Click to copy phone number"
              >
                {copiedKey === 'phone' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Phone className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                )}
                <span>{candidate.phone}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider ml-1">Copy</span>
              </button>
            )}
          </div>

          {/* Social Links (Verified SVG Brand Icons) */}
          <div className="flex items-center gap-2.5">
            {candidate.linkedin_url && (
              <a
                href={candidate.linkedin_url.startsWith('http') ? candidate.linkedin_url : `https://${candidate.linkedin_url}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400 transition-all shadow-sm"
              >
                <LinkedinIcon className="w-4 h-4 text-blue-400" />
                <span className="font-medium">LinkedIn</span>
                <ExternalLink className="w-3 h-3 text-blue-400/70" />
              </a>
            )}

            {candidate.github_url && (
              <a
                href={candidate.github_url.startsWith('http') ? candidate.github_url : `https://${candidate.github_url}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-white/15 text-slate-800 dark:text-slate-200 hover:bg-slate-700 hover:border-white/30 transition-all shadow-sm"
              >
                <GithubIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span className="font-medium">GitHub</span>
                <ExternalLink className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              </a>
            )}

            {candidate.portfolio_url && (
              <a
                href={candidate.portfolio_url.startsWith('http') ? candidate.portfolio_url : `https://${candidate.portfolio_url}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all shadow-sm"
              >
                <PortfolioIcon className="w-4 h-4 text-emerald-400" />
                <span className="font-medium">Portfolio</span>
                <ExternalLink className="w-3 h-3 text-emerald-400/70" />
              </a>
            )}
          </div>
        </div>
      </Card>

      {/* Grid: Recharts Competency Radar + Real-Time Job Match Evaluator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 5-Axis Competency Radar (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="h-full flex flex-col justify-between border border-slate-200/80 dark:border-white/10">
            <div>
              <CardHeader className="mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-400" />
                    <CardTitle>5-Axis Competency Radar</CardTitle>
                  </div>
                  <CardDescription>
                    Multi-dimensional alignment across skill coverage, experience, and profile metrics
                  </CardDescription>
                </div>
              </CardHeader>

              {/* Radar Chart Container */}
              <div className="w-full h-72 py-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarDataset} margin={{ top: 10, right: 25, bottom: 10, left: 25 }}>
                    <PolarGrid stroke="rgba(255, 255, 255, 0.12)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      stroke="#94A3B8"
                      tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      stroke="rgba(255, 255, 255, 0.08)"
                      tick={{ fill: '#64748B', fontSize: 9 }}
                    />
                    <Radar
                      name="Candidate Competency"
                      dataKey="score"
                      stroke="#818CF8"
                      strokeWidth={2.5}
                      fill="url(#radarGradient)"
                      fillOpacity={0.65}
                    />
                    <defs>
                      <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#A855F7" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderColor: 'rgba(99, 102, 241, 0.4)',
                        borderRadius: '0.75rem',
                        color: '#F8FAFC',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
                      }}
                      formatter={(val: any) => [`${val} / 100`, 'Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Metric Breakdown Progress Bars */}
              <div className="space-y-2.5 pt-4 border-t border-slate-200/60 dark:border-white/5">
                {radarDataset.map((metric) => (
                  <div key={metric.subject} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{metric.subject}</span>
                      <span className="font-bold text-indigo-400">{metric.score}%</span>
                    </div>
                    <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${metric.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Normalized Metric Model
              </span>
              <span className="text-indigo-300 font-medium">Recharts Engine</span>
            </div>
          </Card>
        </div>

        {/* Right Column: Inline Real-Time Job Match Evaluator (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card variant="glow" glowColor="emerald" className="h-full flex flex-col justify-between border border-slate-200/80 dark:border-white/10">
            <div>
              <CardHeader className="mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <CardTitle>Real-Time Job Match Evaluator</CardTitle>
                  </div>
                  <CardDescription>
                    Screen candidate skills & credentials against any active job requisition
                  </CardDescription>
                </div>
              </CardHeader>

              {/* Job Selector Dropdown */}
              <div className="space-y-2 mb-6">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Select Target Requisition:
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-200/80 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                >
                  {jobs.length === 0 ? (
                    <option value="">No active jobs available</option>
                  ) : (
                    jobs.map((j) => (
                      <option key={j.id} value={String(j.id)} className="bg-slate-900 text-slate-900 dark:text-slate-100">
                        {j.title} — {j.company} ({j.minimum_experience_years || 0}+ yrs exp)
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Evaluator Score Card */}
              {matchBreakdown && matchTier ? (
                <div className="space-y-6">
                  {/* Gauge Header */}
                  <div className={`p-5 rounded-2xl border ${matchTier.bg} ${matchTier.border} flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg`}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 flex items-center justify-center shadow-inner">
                        <span className={`text-2xl font-black ${matchTier.textClass}`}>
                          {matchBreakdown.overall_score}%
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{matchTier.tier}</h4>
                          <Badge variant={matchTier.badgeVariant} size="sm">
                            {matchBreakdown.recommendation}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Weighted match against {selectedJob?.title}
                        </p>
                      </div>
                    </div>

                    {selectedJob && (
                      <Button
                        variant="secondary"
                        size="sm"
                        rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                        onClick={() => navigate(`/jobs/${selectedJob.id}/candidates`)}
                        className="text-xs shrink-0 self-start sm:self-auto"
                      >
                        Rank Pool
                      </Button>
                    )}
                  </div>

                  {/* Multi-Dimensional Breakdown Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Skills Score */}
                    <div className="glass-card p-3.5 space-y-1.5 bg-slate-100/80 dark:bg-slate-900/50">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Technical Skills (45%)</span>
                        <span className="font-bold text-emerald-400">{matchBreakdown.skill_score}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full"
                          style={{ width: `${matchBreakdown.skill_score}%` }}
                        />
                      </div>
                    </div>

                    {/* Experience Score */}
                    <div className="glass-card p-3.5 space-y-1.5 bg-slate-100/80 dark:bg-slate-900/50">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Experience Fit (25%)</span>
                        <span className="font-bold text-indigo-400">{matchBreakdown.experience_score}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-400 h-full rounded-full"
                          style={{ width: `${matchBreakdown.experience_score}%` }}
                        />
                      </div>
                    </div>

                    {/* Keywords Score */}
                    <div className="glass-card p-3.5 space-y-1.5 bg-slate-100/80 dark:bg-slate-900/50">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Keyword / NLP (20%)</span>
                        <span className="font-bold text-cyan-400">{matchBreakdown.keyword_score}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-400 h-full rounded-full"
                          style={{ width: `${matchBreakdown.keyword_score}%` }}
                        />
                      </div>
                    </div>

                    {/* Education Score */}
                    <div className="glass-card p-3.5 space-y-1.5 bg-slate-100/80 dark:bg-slate-900/50">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Education (10%)</span>
                        <span className="font-bold text-purple-400">{matchBreakdown.education_score}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-400 h-full rounded-full"
                          style={{ width: `${matchBreakdown.education_score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Matching vs Missing Skills */}
                  <div className="space-y-4 pt-2">
                    {/* Matching Skills */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Matched Required Skills ({matchBreakdown.matching_skills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {matchBreakdown.matching_skills.length > 0 ? (
                          matchBreakdown.matching_skills.map((s, idx) => (
                            <Badge key={idx} variant="emerald" size="sm">
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">No direct required skill matches</span>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    {matchBreakdown.missing_skills.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Missing Required Skills ({matchBreakdown.missing_skills.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {matchBreakdown.missing_skills.map((s, idx) => (
                            <Badge key={idx} variant="rose" size="sm">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  Select a job requisition above to calculate real-time match scores.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>FastAPI Matching Algorithm</span>
              <span className="text-emerald-300 font-medium">Multi-Dimensional Fit</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Extracted Skills & Proficiency Bars */}
      <Card className="border border-slate-200/80 dark:border-white/10">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <CardTitle>Extracted Skills & Proficiency</CardTitle>
            </div>
            <CardDescription>
              Categorized technical competencies with NLP proficiency estimation
            </CardDescription>
          </div>

          {/* Search inside skills */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Filter skills..."
              value={skillSearchQuery}
              onChange={(e) => setSkillSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
            />
          </div>
        </CardHeader>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200/60 dark:border-white/5 scrollbar-none">
          {skillCategories.map((category) => {
            const isActive = activeSkillCategory === category;
            const count =
              category === 'All'
                ? candidate.skills?.length || 0
                : candidate.skills?.filter((s) => (s.skill?.category || 'Other') === category).length || 0;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveSkillCategory(category)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-slate-900 dark:text-white shadow-md'
                    : 'bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-white/5'
                }`}
              >
                <span>{category}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-slate-900 dark:text-white' : 'bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Skills Grid */}
        <div className="pt-5">
          {filteredSkills.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-6 text-center">
              No skills found matching the current filter.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.map((cs) => {
                const skillName = cs.skill?.name || 'Skill';
                const category = cs.skill?.category || 'General';
                const proficiency = cs.proficiency || 'Advanced';
                const percentage = getProficiencyPercentage(proficiency);

                return (
                  <div
                    key={cs.id || skillName}
                    className="glass-card p-4 space-y-2 bg-slate-900/40 border border-slate-200/60 dark:border-white/5 hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{skillName}</h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{category}</span>
                      </div>
                      <Badge variant={percentage >= 90 ? 'emerald' : percentage >= 75 ? 'indigo' : 'cyan'} size="sm">
                        {proficiency}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span>Proficiency</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            percentage >= 90
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : percentage >= 75
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-400'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Connected Work Experience & Education Timelines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Work Experience Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-slate-200/80 dark:border-white/10 h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <CardTitle>Work Experience Timeline</CardTitle>
              </div>
              <CardDescription>
                Chronological career progression extracted from parsed employment history
              </CardDescription>
            </CardHeader>

            <div className="pt-2">
              {candidate.experiences && candidate.experiences.length > 0 ? (
                <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500/50 before:to-transparent">
                  {candidate.experiences.map((exp, idx) => (
                    <div key={idx} className="relative group">
                      {/* Pulsing Node */}
                      <div className="absolute -left-[27px] top-1">
                        <PulseDot color="bg-indigo-400" ping={idx === 0} />
                      </div>

                      {/* Experience Card */}
                      <div className="glass-card p-5 space-y-2 border border-slate-200/60 dark:border-white/5 group-hover:border-indigo-500/30 transition-all bg-slate-100/80 dark:bg-slate-900/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                            {exp.job_title || 'Software Engineer'}
                          </h3>
                          <Badge variant="indigo" size="sm" icon={<Calendar className="w-3 h-3 text-indigo-400" />}>
                            {exp.start_date || 'Past'} — {exp.end_date || 'Present'}
                          </Badge>
                        </div>

                        <p className="text-xs text-indigo-300 font-semibold flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{exp.company || 'Enterprise Corporation'}</span>
                        </p>

                        {exp.description && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-200/60 dark:border-white/5">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-8 text-center text-xs text-slate-500 italic">
                  No structured work experience records extracted from this resume.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Education Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-slate-200/80 dark:border-white/10 h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-400" />
                <CardTitle>Education & Credentials</CardTitle>
              </div>
              <CardDescription>
                Academic degrees, universities, and qualifications
              </CardDescription>
            </CardHeader>

            <div className="pt-2">
              {candidate.educations && candidate.educations.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-purple-500 before:via-pink-500/50 before:to-transparent">
                  {candidate.educations.map((edu, idx) => (
                    <div key={idx} className="relative group">
                      {/* Node */}
                      <div className="absolute -left-[27px] top-1">
                        <PulseDot color="bg-purple-400" ping={idx === 0} />
                      </div>

                      {/* Education Card */}
                      <div className="glass-card p-5 space-y-2 border border-slate-200/60 dark:border-white/5 group-hover:border-purple-500/30 transition-all bg-slate-100/80 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {edu.degree || 'Degree Program'}
                          </h4>
                          {(edu.start_date || edu.end_date) && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {edu.start_date || ''} {edu.end_date ? `— ${edu.end_date}` : ''}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-purple-300 font-medium flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                          <span>{edu.institution || 'University / College'}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-8 text-center text-xs text-slate-500 italic">
                  No formal education records extracted.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) setIsDeleteModalOpen(false);
        }}
        title="Delete Candidate Profile"
        subtitle="This action is irreversible and permanently removes all profile records"
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={isDeleting}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              isLoading={isDeleting}
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={handleDelete}
            >
              Delete Profile
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Are you sure you want to permanently delete the profile for{' '}
            <strong className="text-slate-900 dark:text-white font-bold">{candidate.full_name}</strong>?
          </p>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
            All associated resume records, skill extractions, and timeline events for ID #{candidate.id} will be immediately erased.
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
