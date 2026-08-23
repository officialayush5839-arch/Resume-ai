import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Trophy,
  Award,
  Users,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Building2,
  MapPin,
  Clock,
  GraduationCap,
  Search,
  ExternalLink,
  RotateCw,
  XCircle,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Target,
} from 'lucide-react';
import { JobService, CandidateService } from '../services/api';
import type { Job, Candidate, DetailedScoreBreakdown } from '../types';
import {
  calculateDetailedMatch,
  getScoreTier,
  parseSkillList,
  extractCandidateSkillNames,
} from '../utils/matching';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface ScoredCandidate {
  candidate: Candidate;
  score: number;
  breakdown: DetailedScoreBreakdown;
  rank: number;
}

/**
 * Animated Circular Radial Score Gauge
 */
function RadialScoreGauge({ score, size = 110 }: { score: number; size?: number }) {
  const tierInfo = getScoreTier(score);
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Fill Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={tierInfo.color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      {/* Center Score Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
        <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">{Math.round(score)}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Match</span>
      </div>
    </div>
  );
}

export default function JobCandidates() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  // Data States
  const [job, setJob] = useState<Job | null>(null);
  const [rankedList, setRankedList] = useState<ScoredCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'score' | 'experience' | 'name'>('score');
  const [expandedCandidateId, setExpandedCandidateId] = useState<number | null>(null);

  // Fetch Job and Candidates with Resilient Fallback
  const loadJobAndCandidates = async () => {
    if (!jobId) {
      setError('Invalid or missing Job ID parameter.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Job Requisition Details
      const jobRes = await JobService.getJobById<Job>(jobId);
      const currentJob = jobRes.data;
      setJob(currentJob);

      // 2. Fetch Candidates & Compute/Merge Rankings
      let candidatesPool: Candidate[] = [];
      let rawRankedFromApi: any[] = [];

      try {
        const rankedRes = await JobService.getRankedCandidates(jobId);
        if (Array.isArray(rankedRes.data) && rankedRes.data.length > 0) {
          rawRankedFromApi = rankedRes.data;
        }
      } catch (e) {
        console.warn('Backend ranked endpoint returned error, activating resilient client-side calculation engine', e);
      }

      // If backend ranked returned structured candidates with candidate object
      if (rawRankedFromApi.length > 0 && rawRankedFromApi[0].candidate) {
        candidatesPool = rawRankedFromApi.map((item) => item.candidate);
      } else {
        // Fallback to fetching candidate pool directly
        const allCandidatesRes = await CandidateService.getCandidates<Candidate[]>();
        if (Array.isArray(allCandidatesRes.data)) {
          candidatesPool = allCandidatesRes.data;
        }
      }

      // 3. Compute Multi-Dimensional Match Engine for every candidate
      const scored: ScoredCandidate[] = candidatesPool.map((candidate) => {
        const breakdown = calculateDetailedMatch(candidate, currentJob);
        return {
          candidate,
          score: breakdown.overall_score,
          breakdown,
          rank: 0,
        };
      });

      // Sort descending by score
      scored.sort((a, b) => b.score - a.score);

      // Assign ranks (#1, #2, #3, ...)
      const rankedWithRanks = scored.map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));

      setRankedList(rankedWithRanks);
    } catch (err: any) {
      console.error('Error loading job or candidate matches:', err);
      setError(err?.message || 'Failed to load job requisition or candidate rankings.');
      toast.error('Unable to fetch job matches from server');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobAndCandidates();
  }, [jobId]);

  // Derived Filtered & Sorted Candidates
  const filteredRankedCandidates = useMemo(() => {
    return rankedList
      .filter((item) => {
        // 1. Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = (item.candidate.full_name || '').toLowerCase().includes(q);
          const emailMatch = (item.candidate.email || '').toLowerCase().includes(q);
          const skillMatch = extractCandidateSkillNames(item.candidate).some((s) => s.toLowerCase().includes(q));
          if (!nameMatch && !emailMatch && !skillMatch) return false;
        }

        // 2. Score Tier Filter
        if (selectedTier !== 'All') {
          if (selectedTier === 'Strong Match' && item.score < 85) return false;
          if (selectedTier === 'Good Match' && (item.score < 70 || item.score >= 85)) return false;
          if (selectedTier === 'Moderate Match' && (item.score < 50 || item.score >= 70)) return false;
          if (selectedTier === 'Weak Match' && item.score >= 50) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'experience') {
          return (b.candidate.total_experience_months || 0) - (a.candidate.total_experience_months || 0);
        }
        if (sortBy === 'name') {
          return (a.candidate.full_name || '').localeCompare(b.candidate.full_name || '');
        }
        return b.score - a.score;
      });
  }, [rankedList, searchQuery, selectedTier, sortBy]);

  // Top Metrics Calculation
  const totalEvaluated = rankedList.length;
  const topMatchScore = rankedList.length > 0 ? rankedList[0].score : 0;
  const qualifiedCount = rankedList.filter((c) => c.score >= 70).length;
  const avgMatchScore =
    rankedList.length > 0
      ? Math.round(rankedList.reduce((sum, c) => sum + c.score, 0) / rankedList.length)
      : 0;

  const requiredSkills = parseSkillList(job?.required_skills);
  const preferredSkills = parseSkillList(job?.preferred_skills);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/jobs')}
            className="cursor-pointer"
          >
            Back to Jobs
          </Button>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="hover:text-slate-800 dark:text-slate-200 cursor-pointer" onClick={() => navigate('/jobs')}>
              Requisitions
            </span>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px]">
              {job ? job.title : `Job #${jobId}`}
            </span>
            <span>/</span>
            <span className="text-indigo-400 font-semibold">Match Screening</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={() => {
              setIsRefreshing(true);
              loadJobAndCandidates();
            }}
            disabled={loading || isRefreshing}
          >
            Re-Score Pipeline
          </Button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !job && (
        <div className="space-y-6">
          <div className="glass-card p-6 h-48 animate-pulse bg-slate-50/70 dark:bg-slate-800/40" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-4 h-24 animate-pulse bg-slate-50/70 dark:bg-slate-800/40" />
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card p-6 h-40 animate-pulse bg-slate-50/70 dark:bg-slate-800/40" />
            ))}
          </div>
        </div>
      )}

      {/* Error View */}
      {error && !loading && (
        <div className="glass-card p-8 text-center space-y-4 border border-rose-500/30 bg-rose-500/10">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Unable to load candidate matches</h3>
            <p className="text-sm text-rose-300 max-w-md mx-auto">{error}</p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="secondary" size="md" onClick={() => navigate('/jobs')}>
              Back to Jobs
            </Button>
            <Button variant="danger" size="md" onClick={loadJobAndCandidates}>
              Retry Screening
            </Button>
          </div>
        </div>
      )}

      {/* Main Content when Job Loaded */}
      {job && (
        <>
          {/* Job Requisition Overview Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card-elevated p-6 sm:p-8 relative overflow-hidden border border-white/15"
          >
            {/* Ambient Background Glow Mesh */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Header Title & Badges */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      Requisition #{job.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Live Match Engine Active
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    {job.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      {job.company}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      {job.location || 'Remote'}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      {job.minimum_experience_years ? `${job.minimum_experience_years}+ Years Minimum` : 'Any Experience'}
                    </span>
                    {job.education_requirement && (
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <GraduationCap className="w-4 h-4 text-purple-400" />
                        {job.education_requirement}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Requisition Stats Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-200/60 dark:border-white/5 text-center min-w-[100px]">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Candidates</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 block">{totalEvaluated}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-200/60 dark:border-white/5 text-center min-w-[100px]">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Top Score</span>
                    <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{topMatchScore}%</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-200/60 dark:border-white/5 text-center min-w-[100px]">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Qualified</span>
                    <span className="text-xl font-bold text-indigo-400 mt-0.5 block">{qualifiedCount}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-200/60 dark:border-white/5 text-center min-w-[100px]">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Avg Match</span>
                    <span className="text-xl font-bold text-amber-400 mt-0.5 block">{avgMatchScore}%</span>
                  </div>
                </div>
              </div>

              {/* Job Description Excerpt */}
              {job.description && (
                <div className="pt-4 border-t border-slate-200/60 dark:border-white/5">
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl">
                    {job.description}
                  </p>
                </div>
              )}

              {/* Required & Preferred Skills Requirements Display */}
              <div className="pt-4 border-t border-slate-200/60 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Required Skills */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                      Required Skills ({requiredSkills.length})
                    </span>
                    <span className="text-[10px] text-indigo-400/80 font-medium">45% Match Weight</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {requiredSkills.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">No required skills specified</span>
                    ) : (
                      requiredSkills.map((skill, i) => (
                        <Badge key={i} variant="indigo" size="sm">
                          {skill}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* Preferred Skills */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Preferred Skills ({preferredSkills.length})
                    </span>
                    <span className="text-[10px] text-purple-400/80 font-medium">Bonus Weight</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {preferredSkills.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">No preferred skills specified</span>
                    ) : (
                      preferredSkills.map((skill, i) => (
                        <Badge key={i} variant="purple" size="sm">
                          {skill}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filtering & Sorting Controls Bar */}
          <div className="glass-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Filter ranked candidates by name or skill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              {/* Match Tier Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Score Tier:</span>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="All">All Tiers ({rankedList.length})</option>
                  <option value="Strong Match">Strong Match (85%+)</option>
                  <option value="Good Match">Good Match (70-84%)</option>
                  <option value="Moderate Match">Moderate (50-69%)</option>
                  <option value="Weak Match">Weak Match (&lt;50%)</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="score">Match Score (High-Low)</option>
                  <option value="experience">Experience (High-Low)</option>
                  <option value="name">Candidate Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Candidates Ranked Match Cards List */}
          {filteredRankedCandidates.length === 0 ? (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {rankedList.length === 0 ? 'No Candidates Evaluated' : 'No candidates match filter criteria'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {rankedList.length === 0
                    ? 'Upload resumes to populate the candidate database and run automated screening.'
                    : 'Try resetting the score tier filter or clearing your search term.'}
                </p>
              </div>
              {rankedList.length === 0 ? (
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<FileText className="w-4 h-4" />}
                  onClick={() => navigate('/upload')}
                >
                  Upload Resumes Now
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTier('All');
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredRankedCandidates.map((item) => {
                const { candidate, score, breakdown, rank } = item;
                const tierInfo = getScoreTier(score);
                const isExpanded = expandedCandidateId === candidate.id;

                const initials = candidate.full_name
                  ? candidate.full_name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'CD';

                const expYears = candidate.total_experience_months
                  ? `${(candidate.total_experience_months / 12).toFixed(1)} Yrs Experience`
                  : 'Experience Not Specified';

                return (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Card
                      variant="elevated"
                      className={`overflow-hidden transition-all duration-300 border ${
                        rank === 1
                          ? 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)] bg-slate-900/90'
                          : rank === 2
                          ? 'border-slate-400/30'
                          : rank === 3
                          ? 'border-amber-700/30'
                          : 'border-slate-200/80 dark:border-white/10'
                      }`}
                    >
                      <div className="space-y-6">
                        {/* Top Header Row: Medal, Identity, Radial Gauge & Action */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/60 dark:border-white/5">
                          {/* Left: Rank Medal & Candidate Avatar */}
                          <div className="flex items-start sm:items-center gap-4 flex-1">
                            {/* Rank Medal / Badge */}
                            <div className="shrink-0">
                              {rank === 1 ? (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-yellow-500/25 border border-amber-400/50 text-amber-300 font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.35)]">
                                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span>#1 Gold Trophy</span>
                                </div>
                              ) : rank === 2 ? (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-400/20 border border-slate-300/40 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-[0_0_15px_rgba(226,232,240,0.15)]">
                                  <Award className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                                  <span>#2 Silver Medal</span>
                                </div>
                              ) : rank === 3 ? (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-800/25 border border-amber-600/40 text-amber-300 font-bold text-xs">
                                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                                  <span>#3 Bronze Medal</span>
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-800/90 border border-slate-200/80 dark:border-white/10 flex items-center justify-center font-bold text-xs text-slate-500 dark:text-slate-400">
                                  #{rank}
                                </div>
                              )}
                            </div>

                            {/* Candidate Avatar & Main Info */}
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div
                                className={`w-13 h-13 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white font-bold text-lg shadow-md shrink-0 ${
                                  rank === 1
                                    ? 'bg-gradient-to-br from-amber-500 to-yellow-600 border border-amber-300/40 text-slate-950 font-black'
                                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/15'
                                }`}
                              >
                                {initials}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <Link
                                    to={`/candidates/${candidate.id}`}
                                    className="text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-300 transition-colors truncate"
                                  >
                                    {candidate.full_name}
                                  </Link>

                                  {/* AI Recommendation Badge */}
                                  <Badge variant={tierInfo.badgeVariant} size="sm">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    {breakdown.recommendation}
                                  </Badge>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                    {expYears}
                                  </span>
                                  {candidate.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                      {candidate.location}
                                    </span>
                                  )}
                                  {candidate.email && (
                                    <span className="text-slate-500 hidden md:inline">
                                      {candidate.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Radial Score Gauge & Quick Profile Link */}
                          <div className="flex items-center justify-between sm:justify-end gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-200/60 dark:border-white/5">
                            {/* Visual Animated Radial Gauge */}
                            <RadialScoreGauge score={score} size={96} />

                            {/* View Profile Action */}
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                                onClick={() => navigate(`/candidates/${candidate.id}`)}
                                className="shadow-md shadow-indigo-500/20"
                              >
                                View Profile
                              </Button>

                              <button
                                type="button"
                                onClick={() => setExpandedCandidateId(isExpanded ? null : candidate.id)}
                                className="inline-flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors py-1 cursor-pointer"
                              >
                                {isExpanded ? (
                                  <>
                                    <span>Hide Details</span>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </>
                                ) : (
                                  <>
                                    <span>Deep Breakdown</span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Multi-Factor Score Breakdown Progress Bars */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Multi-Factor Scoring Matrix
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Skills (45%) • Exp (25%) • NLP (20%) • Edu (10%)
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* 1. Skill Match */}
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-700 dark:text-slate-300 font-medium">Technical Skills</span>
                                <span className="font-bold text-indigo-400">{breakdown.skill_score}%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${breakdown.skill_score}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                />
                              </div>
                            </div>

                            {/* 2. Experience Match */}
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-700 dark:text-slate-300 font-medium">Experience Fit</span>
                                <span className="font-bold text-cyan-400">{breakdown.experience_score}%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${breakdown.experience_score}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                                />
                              </div>
                            </div>

                            {/* 3. Keyword / NLP Density */}
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-700 dark:text-slate-300 font-medium">Keyword / NLP</span>
                                <span className="font-bold text-emerald-400">{breakdown.keyword_score}%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${breakdown.keyword_score}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                />
                              </div>
                            </div>

                            {/* 4. Education Match */}
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-200/60 dark:border-white/5 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-700 dark:text-slate-300 font-medium">Education Fit</span>
                                <span className="font-bold text-purple-400">{breakdown.education_score}%</span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${breakdown.education_score}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Matching Skills vs Missing Required Skills Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {/* Matched Skills */}
                          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Matched Required & Preferred Skills ({breakdown.matching_skills.length})
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {breakdown.matching_skills.length === 0 ? (
                                <span className="text-xs text-slate-500 italic">No direct skill matches found</span>
                              ) : (
                                breakdown.matching_skills.map((skill, i) => (
                                  <Badge key={i} variant="emerald" size="sm" icon={<Check className="w-3 h-3 text-emerald-400" />}>
                                    {skill}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Missing Required Skills */}
                          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-400" />
                                Missing Required Skills ({breakdown.missing_skills.length})
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {breakdown.missing_skills.length === 0 ? (
                                <span className="text-xs text-emerald-300 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  All required skills verified in profile!
                                </span>
                              ) : (
                                breakdown.missing_skills.map((skill, i) => (
                                  <Badge key={i} variant="rose" size="sm" icon={<XCircle className="w-3 h-3 text-rose-400" />}>
                                    {skill}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Deep Analysis: AI Strengths & Weaknesses */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="pt-4 border-t border-slate-200/60 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
                            >
                              {/* AI Identified Strengths */}
                              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 space-y-2.5">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                  Key Candidate Strengths
                                </span>
                                {breakdown.strengths.length === 0 ? (
                                  <p className="text-xs text-slate-500 italic">No specific standout strengths highlighted.</p>
                                ) : (
                                  <ul className="space-y-1.5">
                                    {breakdown.strengths.map((str, i) => (
                                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                        <span>{str}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              {/* AI Identified Weaknesses & Gaps */}
                              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 space-y-2.5">
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                                  Screening Considerations & Gaps
                                </span>
                                {breakdown.weaknesses.length === 0 ? (
                                  <p className="text-xs text-emerald-300 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    No significant gaps identified against requisition.
                                  </p>
                                ) : (
                                  <ul className="space-y-1.5">
                                    {breakdown.weaknesses.map((weak, i) => (
                                      <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                        <span>{weak}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

