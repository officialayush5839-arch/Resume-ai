import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Briefcase,
  Scale,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  GraduationCap,
  Printer,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  Zap,
  Tag,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';
import type { Candidate, Job, ComparisonMatrixData } from '../../types';
import {
  buildCandidateComparison,
  getScoreTier,
} from '../../utils/matching';
import { JobService } from '../../services/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface CandidateComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  jobs?: Job[];
  initialJobId?: string | number | null;
  onSelectCandidate?: (candidate: Candidate) => void;
  onViewProfile?: (candidateId: number) => void;
}

// Distinct candidate color palettes for radar chart & styling
const CANDIDATE_THEMES = [
  {
    name: 'Neural Indigo',
    primary: '#6366F1',
    fill: 'rgba(99, 102, 241, 0.25)',
    border: 'border-indigo-500/40',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    gradient: 'from-indigo-500 to-purple-600',
    badgeVariant: 'indigo' as const,
  },
  {
    name: 'Quantum Emerald',
    primary: '#10B981',
    fill: 'rgba(16, 185, 129, 0.25)',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-600',
    badgeVariant: 'emerald' as const,
  },
  {
    name: 'Solar Amber',
    primary: '#F59E0B',
    fill: 'rgba(245, 158, 11, 0.25)',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-600',
    badgeVariant: 'amber' as const,
  },
  {
    name: 'Cyber Rose',
    primary: '#EC4899',
    fill: 'rgba(236, 72, 153, 0.25)',
    border: 'border-pink-500/40',
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    gradient: 'from-pink-500 to-rose-600',
    badgeVariant: 'rose' as const,
  },
];

/**
 * Circular Radial Score Gauge Component with SVG path
 */
function RadialScoreGauge({
  score,
  size = 76,
  strokeWidth = 6,
  themeColor,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  themeColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;
  const tier = getScoreTier(normalizedScore);
  const color = themeColor || tier.color;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
        <span className="text-base font-extrabold text-slate-100 tracking-tight leading-none">
          {Math.round(normalizedScore)}
          <span className="text-[10px] text-slate-400 font-semibold">%</span>
        </span>
      </div>
    </div>
  );
}

export function CandidateComparisonModal({
  isOpen,
  onClose,
  candidates,
  jobs: initialJobs,
  initialJobId,
  onSelectCandidate,
  onViewProfile,
}: CandidateComparisonModalProps) {
  // Available jobs state
  const [jobs, setJobs] = useState<Job[]>(initialJobs || []);
  const [selectedJobId, setSelectedJobId] = useState<string>(
    initialJobId ? String(initialJobId) : 'none'
  );
  const [benchmarkCandidateId, setBenchmarkCandidateId] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Load jobs if not provided as props
  useEffect(() => {
    if (!initialJobs || initialJobs.length === 0) {
      JobService.getJobs<Job[]>()
        .then((res) => {
          if (Array.isArray(res.data)) {
            setJobs(res.data);
          }
        })
        .catch(() => {
          // Non-blocking fallback
        });
    } else {
      setJobs(initialJobs);
    }
  }, [initialJobs]);

  // Set default benchmark candidate
  useEffect(() => {
    if (candidates.length > 0 && (!benchmarkCandidateId || !candidates.some((c) => c.id === benchmarkCandidateId))) {
      setBenchmarkCandidateId(candidates[0].id);
    }
  }, [candidates, benchmarkCandidateId]);

  // Handle escape key
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

  // Resolve current active Job context
  const activeJob = useMemo(() => {
    if (selectedJobId === 'none') return null;
    return jobs.find((j) => String(j.id) === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  // Calculate comparison data
  const comparisonData: ComparisonMatrixData = useMemo(() => {
    return buildCandidateComparison(candidates, activeJob);
  }, [candidates, activeJob]);

  // Benchmark candidate reference item
  const benchmarkItem = useMemo(() => {
    return comparisonData.candidates.find((c) => c.candidate.id === benchmarkCandidateId) || comparisonData.candidates[0];
  }, [comparisonData.candidates, benchmarkCandidateId]);

  // Transform radar data for Recharts multi-candidate radar overlay
  const radarChartData = useMemo(() => {
    const subjects = [
      'Technical Skills',
      'Experience Depth',
      'Keywords / NLP',
      'Education Fit',
      'Profile Completeness',
    ];

    return subjects.map((subject) => {
      const row: Record<string, any> = { subject };
      comparisonData.candidates.forEach((item) => {
        const metric = item.radarMetrics.find((m) => m.subject === subject);
        row[`candidate_${item.candidate.id}`] = metric ? metric.score : 0;
      });
      return row;
    });
  }, [comparisonData]);

  // Export comparison summary report to clipboard
  const handleExportReport = useCallback(() => {
    if (comparisonData.candidates.length === 0) return;

    const lines: string[] = [
      `============================================================`,
      `RESUMEIQ CANDIDATE COMPARISON REPORT`,
      `Generated: ${new Date().toLocaleString()}`,
      `Target Job: ${activeJob ? `${activeJob.title} (${activeJob.company})` : 'Baseline Profile Fit (No Specific Job)'}`,
      `Candidates Compared: ${comparisonData.candidates.map((c) => c.candidate.full_name).join(', ')}`,
      `============================================================\n`,
      `--- SHARED COMMON SKILLS OVERLAP ---`,
      comparisonData.commonSkillsAcrossAll.length > 0
        ? comparisonData.commonSkillsAcrossAll.join(', ')
        : 'No unanimous skills shared across all candidates',
      `\n--- CANDIDATE BREAKDOWNS ---`,
    ];

    comparisonData.candidates.forEach((cItem, idx) => {
      const c = cItem.candidate;
      const expYrs = c.total_experience_months ? (c.total_experience_months / 12).toFixed(1) : 'N/A';
      const deltaVsBenchmark = benchmarkItem
        ? cItem.matchScore - benchmarkItem.matchScore
        : 0;

      lines.push(
        `\n[Candidate #${idx + 1}] ${c.full_name} (ID: ${c.id})`,
        `  • Match Score: ${cItem.matchScore}% (${getScoreTier(cItem.matchScore).tier})`,
        `  • Delta vs Benchmark (${benchmarkItem?.candidate.full_name || 'N/A'}): ${deltaVsBenchmark >= 0 ? `+${deltaVsBenchmark}%` : `${deltaVsBenchmark}%`}`,
        `  • Total Experience: ${expYrs} years`,
        `  • Education: ${c.educations?.[0]?.degree || 'Unspecified'} (${c.educations?.[0]?.institution || 'N/A'})`,
        `  • Unique Skills: ${cItem.uniqueSkills.length > 0 ? cItem.uniqueSkills.join(', ') : 'None'}`,
        `  • Missing Job Skills: ${cItem.missingJobSkills.length > 0 ? cItem.missingJobSkills.join(', ') : 'None'}`,
        `  • AI Recommendation: ${cItem.scoreBreakdown?.recommendation || 'Evaluated'}`
      );
    });

    lines.push(`\n============================================================`);
    const reportText = lines.join('\n');

    navigator.clipboard.writeText(reportText);
    setIsCopied(true);
    toast.success('Comparison report copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2500);
  }, [comparisonData, activeJob, benchmarkItem]);

  // Print comparison report trigger
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Frosted Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-xl"
        />

        {/* Expansive Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative z-10 w-full max-w-7xl glass-card-elevated max-h-[94vh] flex flex-col my-auto border border-white/15 shadow-2xl shadow-black/90 overflow-hidden rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header Bar */}
          <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 bg-slate-900/70 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                    Candidate <span className="gradient-brand-text">Comparison Matrix</span>
                  </h2>
                  <Badge variant="indigo" size="sm">
                    {candidates.length} Selected
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Side-by-side competency alignment, Venn skill overlap, and multi-factor radar overlay
                </p>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center flex-wrap gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                onClick={handleExportReport}
                title="Export summary report to clipboard"
                className="text-xs"
              >
                {isCopied ? 'Report Copied!' : 'Export Report'}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={handlePrint}
                title="Print or Save PDF"
                className="text-xs hidden sm:inline-flex"
              >
                Print / PDF
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
                aria-label="Close comparison modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub-Header: Job Requisition Context Selector & Benchmark Picker */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-900/90 border-b border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
            {/* Job Selector Dropdown */}
            <div className="flex items-center gap-2 flex-1 max-w-xl">
              <Briefcase className="w-4 h-4 text-indigo-400 shrink-0" />
              <label htmlFor="comparison-job-select" className="text-xs font-semibold text-slate-300 uppercase tracking-wider shrink-0">
                Target Requisition:
              </label>
              <select
                id="comparison-job-select"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/40"
              >
                <option value="none">No Specific Job (Baseline Profile Match)</option>
                {jobs.map((j) => (
                  <option key={j.id} value={String(j.id)}>
                    {j.title} — {j.company} ({j.minimum_experience_years || 0}+ yrs exp)
                  </option>
                ))}
              </select>
            </div>

            {/* Benchmark Candidate Indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Benchmark:</span>
              <select
                value={benchmarkCandidateId || ''}
                onChange={(e) => setBenchmarkCandidateId(Number(e.target.value))}
                className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-400"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} (ID: #{c.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-8">
            {candidates.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Scale className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-200">No candidates selected for comparison</p>
                <p className="text-xs text-slate-500 mt-1">Select 2 to 4 candidates from the candidate directory</p>
              </div>
            ) : (
              <>
                {/* 1. TOP SUMMARY ROW: Candidate Header Cards with Radial Gauges & Deltas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Candidate Alignment Summaries ({comparisonData.candidates.length})
                    </h3>
                    <span className="text-xs text-slate-500">
                      Benchmark: <strong className="text-indigo-300">{benchmarkItem?.candidate.full_name}</strong>
                    </span>
                  </div>

                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 ${
                      comparisonData.candidates.length === 3
                        ? 'lg:grid-cols-3'
                        : comparisonData.candidates.length >= 4
                        ? 'lg:grid-cols-4'
                        : 'lg:grid-cols-2'
                    } gap-4`}
                  >
                    {comparisonData.candidates.map((item, idx) => {
                      const cand = item.candidate;
                      const theme = CANDIDATE_THEMES[idx % CANDIDATE_THEMES.length];
                      const isBenchmark = cand.id === benchmarkCandidateId;
                      const deltaVsBenchmark = benchmarkItem
                        ? item.matchScore - benchmarkItem.matchScore
                        : 0;
                      const tier = getScoreTier(item.matchScore);
                      const initials = cand.full_name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);

                      return (
                        <div
                          key={cand.id}
                          className={`glass-card p-5 space-y-4 border ${
                            isBenchmark ? 'border-indigo-500/50 shadow-indigo-500/10' : 'border-white/10'
                          } relative overflow-hidden flex flex-col justify-between group`}
                        >
                          {/* Accent glow bar */}
                          <div
                            className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient} opacity-80`}
                          />

                          <div className="space-y-4">
                            {/* Candidate Identity + Benchmark Badge */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}
                                >
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-slate-100 text-sm truncate group-hover:text-indigo-300 transition-colors">
                                    {cand.full_name}
                                  </h4>
                                  <p className="text-xs text-slate-400 truncate">
                                    {cand.location || 'Location Not Specified'}
                                  </p>
                                </div>
                              </div>

                              {isBenchmark ? (
                                <Badge variant="indigo" size="sm">
                                  Benchmark
                                </Badge>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setBenchmarkCandidateId(cand.id)}
                                  className="text-[11px] text-slate-400 hover:text-indigo-300 hover:underline cursor-pointer"
                                  title="Set as comparison benchmark"
                                >
                                  Set Bench
                                </button>
                              )}
                            </div>

                            {/* Radial Score Gauge + Delta vs Benchmark */}
                            <div className={`p-3.5 rounded-2xl border ${tier.bg} ${tier.border} flex items-center justify-between gap-3 shadow-inner`}>
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                  Overall Fit
                                </span>
                                <Badge variant={tier.badgeVariant} size="sm">
                                  {tier.tier}
                                </Badge>
                                {!isBenchmark && (
                                  <p
                                    className={`text-xs font-bold pt-1 flex items-center gap-1 ${
                                      deltaVsBenchmark >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                  >
                                    <TrendingUp
                                      className={`w-3.5 h-3.5 ${deltaVsBenchmark < 0 ? 'rotate-180' : ''}`}
                                    />
                                    {deltaVsBenchmark >= 0 ? `+${deltaVsBenchmark}%` : `${deltaVsBenchmark}%`} vs Bench
                                  </p>
                                )}
                              </div>

                              <RadialScoreGauge score={item.matchScore} size={68} themeColor={theme.primary} />
                            </div>

                            {/* Key Stats Pills */}
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between py-1 border-b border-white/5">
                                <span className="text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Experience:
                                </span>
                                <span className="text-slate-200 font-semibold">
                                  {cand.total_experience_months
                                    ? `${(cand.total_experience_months / 12).toFixed(1)} Yrs`
                                    : 'Entry / Unspecified'}
                                </span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-white/5">
                                <span className="text-slate-400 flex items-center gap-1">
                                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" /> Education:
                                </span>
                                <span className="text-slate-200 font-medium truncate max-w-[130px]" title={cand.educations?.[0]?.degree || 'Unspecified'}>
                                  {cand.educations?.[0]?.degree || 'Unspecified'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Profile CTA */}
                          <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              fullWidth
                              onClick={() => {
                                if (onViewProfile) {
                                  onViewProfile(cand.id);
                                } else if (onSelectCandidate) {
                                  onSelectCandidate(cand);
                                }
                              }}
                              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                              className="text-xs"
                            >
                              Inspect Profile
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. RECHARTS 5-AXIS RADAR CHART OVERLAY */}
                <div className="glass-card p-6 border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-400" />
                        5-Axis Multi-Candidate Radar Overlay
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Comparative competency footprint across Technical Skills, Experience, NLP Keywords, Education, and Completeness
                      </p>
                    </div>
                  </div>

                  <div className="h-80 sm:h-96 w-full flex items-center justify-center pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarChartData}>
                        <PolarGrid stroke="rgba(255, 255, 255, 0.12)" />
                        <PolarAngleAxis
                          dataKey="subject"
                          stroke="#94A3B8"
                          tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          stroke="#475569"
                          tick={{ fill: '#64748B', fontSize: 10 }}
                        />
                        {comparisonData.candidates.map((cItem, i) => {
                          const theme = CANDIDATE_THEMES[i % CANDIDATE_THEMES.length];
                          return (
                            <Radar
                              key={cItem.candidate.id}
                              name={cItem.candidate.full_name}
                              dataKey={`candidate_${cItem.candidate.id}`}
                              stroke={theme.primary}
                              strokeWidth={2}
                              fill={theme.fill}
                              fillOpacity={0.3}
                            />
                          );
                        })}
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            borderColor: 'rgba(99, 102, 241, 0.4)',
                            borderRadius: '0.75rem',
                            color: '#F8FAFC',
                            fontSize: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
                          }}
                          formatter={(value: any, name: any) => [`${value} / 100`, name]}
                        />
                        <Legend
                          wrapperStyle={{
                            paddingTop: '16px',
                            fontSize: '12px',
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. VENN SKILL OVERLAP MATRIX */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-400" />
                      Venn Skill Overlap Matrix
                    </h3>
                  </div>

                  {/* Section A: Shared Common Skills (Across ALL) */}
                  <div className="glass-card p-5 border border-emerald-500/25 bg-emerald-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-bold text-emerald-300">
                          Shared Common Skills Across All Candidates ({comparisonData.commonSkillsAcrossAll.length})
                        </h4>
                      </div>
                      <span className="text-xs text-emerald-400/80 font-medium">100% Unanimous Match</span>
                    </div>

                    {comparisonData.commonSkillsAcrossAll.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {comparisonData.commonSkillsAcrossAll.map((skill, sIdx) => (
                          <Badge key={sIdx} variant="emerald" size="md" icon={<Check className="w-3 h-3 text-emerald-400" />}>
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No single skill is unanimously shared across all {comparisonData.candidates.length} candidates.
                      </p>
                    )}
                  </div>

                  {/* Section B & C: Unique Skills & Missing Job Skills Per Candidate Grid */}
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 ${
                      comparisonData.candidates.length === 3
                        ? 'lg:grid-cols-3'
                        : comparisonData.candidates.length >= 4
                        ? 'lg:grid-cols-4'
                        : 'lg:grid-cols-2'
                    } gap-4`}
                  >
                    {comparisonData.candidates.map((item, idx) => {
                      const cand = item.candidate;
                      const theme = CANDIDATE_THEMES[idx % CANDIDATE_THEMES.length];

                      return (
                        <div key={cand.id} className="glass-card p-5 space-y-4 border border-white/10 flex flex-col justify-between">
                          <div className="space-y-4">
                            {/* Candidate mini header */}
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${theme.bg} border ${theme.border}`} />
                              <h5 className="text-xs font-bold text-slate-200 truncate">{cand.full_name}</h5>
                            </div>

                            {/* Unique Differentiators */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-indigo-300 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Unique Skills:
                                </span>
                                <span className="font-bold text-indigo-400">{item.uniqueSkills.length}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                                {item.uniqueSkills.length > 0 ? (
                                  item.uniqueSkills.map((s, sIdx) => (
                                    <Badge key={sIdx} variant="purple" size="sm">
                                      {s}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-500 italic">No unique differentiators</span>
                                )}
                              </div>
                            </div>

                            {/* Missing Required Skills (if job active) */}
                            {activeJob && (
                              <div className="space-y-2 pt-2 border-t border-white/5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-rose-300 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Missing Job Skills:
                                  </span>
                                  <span className="font-bold text-rose-400">{item.missingJobSkills.length}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                                  {item.missingJobSkills.length > 0 ? (
                                    item.missingJobSkills.map((s, sIdx) => (
                                      <Badge key={sIdx} variant="rose" size="sm">
                                        {s}
                                      </Badge>
                                    ))
                                  ) : (
                                    <Badge variant="emerald" size="sm" icon={<Check className="w-3 h-3" />}>
                                      All Required Skills Covered
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. MULTI-FACTOR BREAKDOWN MATRIX TABLE */}
                <div className="glass-card overflow-hidden border border-white/10 shadow-2xl">
                  <div className="p-4 bg-slate-900/80 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      Multi-Factor Comparison Matrix
                    </h3>
                    <span className="text-xs text-slate-400">Detailed dimension-by-dimension breakdown</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          <th className="p-4 w-48 shrink-0">Evaluation Factor</th>
                          {comparisonData.candidates.map((item, idx) => (
                            <th key={item.candidate.id} className="p-4 min-w-[200px]">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    CANDIDATE_THEMES[idx % CANDIDATE_THEMES.length].bg
                                  }`}
                                />
                                <span className="font-bold text-slate-200">{item.candidate.full_name}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                        {/* Row 1: Overall Match Score */}
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-semibold text-slate-200 bg-slate-900/30">Overall Fit Score</td>
                          {comparisonData.candidates.map((item) => {
                            const tier = getScoreTier(item.matchScore);
                            return (
                              <td key={item.candidate.id} className="p-4">
                                <div className="flex items-center gap-2">
                                  <span className={`text-base font-bold ${tier.textClass}`}>
                                    {item.matchScore}%
                                  </span>
                                  <Badge variant={tier.badgeVariant} size="sm">
                                    {tier.tier}
                                  </Badge>
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row 2: Total Experience */}
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-semibold text-slate-200 bg-slate-900/30">Total Experience</td>
                          {comparisonData.candidates.map((item) => {
                            const months = item.candidate.total_experience_months || 0;
                            const yrs = (months / 12).toFixed(1);
                            return (
                              <td key={item.candidate.id} className="p-4">
                                <span className="font-bold text-slate-100">{yrs} Years</span>{' '}
                                <span className="text-slate-500">({months} mos)</span>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row 3: Highest Education */}
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-semibold text-slate-200 bg-slate-900/30">Education Degree</td>
                          {comparisonData.candidates.map((item) => (
                            <td key={item.candidate.id} className="p-4">
                              <div className="font-medium text-slate-200">
                                {item.candidate.educations?.[0]?.degree || 'Unspecified'}
                              </div>
                              <div className="text-slate-500 text-[11px]">
                                {item.candidate.educations?.[0]?.institution || 'N/A'}
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Row 4: Technical Skills Fit (45% weight) */}
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-semibold text-slate-200 bg-slate-900/30">Technical Skills Fit</td>
                          {comparisonData.candidates.map((item) => {
                            const score = item.scoreBreakdown?.skill_score || 0;
                            return (
                              <td key={item.candidate.id} className="p-4">
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span className="font-semibold text-slate-200">{score}%</span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-indigo-500 h-full rounded-full"
                                      style={{ width: `${score}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row 5: Experience Depth Fit (25% weight) */}
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-semibold text-slate-200 bg-slate-900/30">Experience Fit</td>
                          {comparisonData.candidates.map((item) => {
                            const score = item.scoreBreakdown?.experience_score || 0;
                            return (
                              <td key={item.candidate.id} className="p-4">
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span className="font-semibold text-slate-200">{score}%</span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-emerald-500 h-full rounded-full"
                                      style={{ width: `${score}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row 6: NLP Keywords Fit (20% weight) */}
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-semibold text-slate-200 bg-slate-900/30">NLP Keywords Density</td>
                          {comparisonData.candidates.map((item) => {
                            const score = item.scoreBreakdown?.keyword_score || 0;
                            return (
                              <td key={item.candidate.id} className="p-4">
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span className="font-semibold text-slate-200">{score}%</span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-cyan-500 h-full rounded-full"
                                      style={{ width: `${score}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Row 7: AI Strengths */}
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-semibold text-slate-200 bg-slate-900/30">Key Strengths</td>
                          {comparisonData.candidates.map((item) => (
                            <td key={item.candidate.id} className="p-4">
                              {item.scoreBreakdown?.strengths && item.scoreBreakdown.strengths.length > 0 ? (
                                <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-300">
                                  {item.scoreBreakdown.strengths.map((str, sIdx) => (
                                    <li key={sIdx}>{str}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-slate-500 italic">No specific strengths flagged</span>
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* Row 8: AI Growth Areas */}
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-semibold text-slate-200 bg-slate-900/30">Growth Areas</td>
                          {comparisonData.candidates.map((item) => (
                            <td key={item.candidate.id} className="p-4">
                              {item.scoreBreakdown?.weaknesses && item.scoreBreakdown.weaknesses.length > 0 ? (
                                <ul className="space-y-1 list-disc list-inside text-[11px] text-rose-300">
                                  {item.scoreBreakdown.weaknesses.map((w, wIdx) => (
                                    <li key={wIdx}>{w}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-emerald-400 text-xs font-medium">None flagged</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-slate-950/70">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>
                Calculated dynamically via ResumeIQ NLP & Multi-Dimensional Scoring Engine
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button variant="secondary" size="md" onClick={onClose} className="text-xs">
                Dismiss
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                onClick={handleExportReport}
                className="text-xs shadow-lg shadow-indigo-500/25"
              >
                {isCopied ? 'Report Copied!' : 'Export Summary'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CandidateComparisonModal;
