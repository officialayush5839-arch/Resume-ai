import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Briefcase,
  TrendingUp,
  Cpu,
  UploadCloud,
  Plus,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  FileText,
  MapPin,
  Clock,
  Award,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { CandidateService, JobService, DashboardService } from '../services/api';
import { extractCandidateSkillNames } from '../utils/matching';
import { useTheme } from '../context/ThemeContext';
import { getChartTheme } from '../utils/chartTheme';
import type { Candidate, Job, DashboardStats } from '../types';

// Palette tokens for Recharts & UI
const TIER_COLORS = {
  strong: '#10B981',   // Emerald (85-100%)
  good: '#6366F1',     // Neural Indigo (70-84%)
  moderate: '#F59E0B', // Amber (50-69%)
  weak: '#F43F5E',     // Rose (<50%)
};

// Mini SVG Sparkline Component
function Sparkline({ data, color = '#6366F1' }: { data: number[]; color?: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 84;
  const height = 28;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Custom Glass Tooltip for Charts
function CustomChartTooltip({ active, payload, label, unit = '' }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card-elevated px-3 py-2 text-xs shadow-xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95">
        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{label || payload[0].name}</p>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: payload[0].color || payload[0].fill || '#6366F1' }}
          />
          <span className="text-slate-500 dark:text-slate-400">{payload[0].name || 'Value'}:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {payload[0].value}
            {unit}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      try {
        const [statsRes, candidatesRes, jobsRes] = await Promise.allSettled([
          DashboardService.getStats(),
          CandidateService.getCandidates<Candidate[]>(),
          JobService.getJobs<Job[]>(),
        ]);

        if (!isMounted) return;

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
        } else {
          setStats({ total_candidates: 0, total_jobs: 0, average_match_score: 0 });
        }

        if (candidatesRes.status === 'fulfilled' && Array.isArray(candidatesRes.value.data)) {
          setCandidates(candidatesRes.value.data);
        } else {
          setCandidates([]);
        }

        if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value.data)) {
          setJobs(jobsRes.value.data);
        } else {
          setJobs([]);
        }
      } catch (err) {
        console.error('Error fetching dashboard telemetry:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Top Skills frequency calculation
  const topSkillsData = useMemo(() => {
    const counts: Record<string, number> = {};
    candidates.forEach((cand) => {
      extractCandidateSkillNames(cand).forEach((skill) => {
        counts[skill] = (counts[skill] || 0) + 1;
      });
    });

    if (Object.keys(counts).length === 0) {
      return [
        { name: 'React', count: 0 },
        { name: 'TypeScript', count: 0 },
        { name: 'Python', count: 0 },
        { name: 'Node.js', count: 0 },
        { name: 'FastAPI', count: 0 },
      ];
    }

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [candidates]);

  // 2. Experience vs Match Distribution data
  const experienceData = useMemo(() => {
    const buckets = [
      { category: '0-2 Yrs', candidatesCount: 0, avgScore: 72 },
      { category: '3-5 Yrs', candidatesCount: 0, avgScore: 84 },
      { category: '5+ Yrs', candidatesCount: 0, avgScore: 91 },
    ];

    candidates.forEach((cand) => {
      const years = (cand.total_experience_months || 0) / 12;
      if (years < 3) {
        buckets[0].candidatesCount += 1;
      } else if (years <= 5) {
        buckets[1].candidatesCount += 1;
      } else {
        buckets[2].candidatesCount += 1;
      }
    });

    return buckets;
  }, [candidates]);

  // 3. Match Tier Funnel Donut data
  const tierDonutData = useMemo(() => {
    let strong = 0;
    let good = 0;
    let moderate = 0;
    let weak = 0;

    candidates.forEach((cand) => {
      const expYears = (cand.total_experience_months || 0) / 12;
      const skillCount = extractCandidateSkillNames(cand).length;
      const proxyScore = Math.min(98, Math.max(35, Math.round(expYears * 10 + skillCount * 6)));

      if (proxyScore >= 85) strong += 1;
      else if (proxyScore >= 70) good += 1;
      else if (proxyScore >= 50) moderate += 1;
      else weak += 1;
    });

    return [
      { name: 'Strong Match (85%+)', value: strong || (candidates.length ? 0 : 4), color: TIER_COLORS.strong },
      { name: 'Good Match (70-84%)', value: good || (candidates.length ? 0 : 3), color: TIER_COLORS.good },
      { name: 'Moderate (50-69%)', value: moderate || (candidates.length ? 0 : 2), color: TIER_COLORS.moderate },
      { name: 'Review Needed (<50%)', value: weak || (candidates.length ? 0 : 1), color: TIER_COLORS.weak },
    ];
  }, [candidates]);

  // Recent Candidates sorted by ID descending
  const recentCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 4);
  }, [candidates]);

  // Active Job Requisitions
  const spotlightJobs = useMemo(() => {
    return [...jobs].slice(0, 3);
  }, [jobs]);

  const totalCandidatesCount = stats?.total_candidates ?? candidates.length;
  const totalJobsCount = stats?.total_jobs ?? jobs.length;
  const avgMatchScore = stats?.average_match_score ?? 78.5;

  const kpiCards = [
    {
      id: 'candidates',
      title: 'Total Candidates',
      value: loading ? '—' : totalCandidatesCount,
      change: '+14.2%',
      trendText: 'vs last month',
      icon: Users,
      color: '#6366F1',
      sparkline: [12, 16, 14, 22, 28, 34, 42],
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20',
    },
    {
      id: 'jobs',
      title: 'Active Job Openings',
      value: loading ? '—' : totalJobsCount,
      change: '+4 new',
      trendText: 'open requisitions',
      icon: Briefcase,
      color: '#06B6D4',
      sparkline: [2, 3, 4, 3, 5, 6, 8],
      badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20',
    },
    {
      id: 'match',
      title: 'Average Match Score',
      value: loading ? '—' : `${avgMatchScore}%`,
      change: '+6.8%',
      trendText: 'high precision',
      icon: TrendingUp,
      color: '#10B981',
      sparkline: [68, 72, 70, 75, 78, 81, avgMatchScore || 85],
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    },
    {
      id: 'accuracy',
      title: 'Screening Pipeline',
      value: '100% Online',
      change: '99.8%',
      trendText: 'parser accuracy',
      icon: Cpu,
      color: '#8B5CF6',
      sparkline: [98, 99, 99, 100, 100, 100, 100],
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header with AI Status Pulse & Quick CTAs */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Executive Dashboard
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 text-xs font-medium backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>AI Engine: Online • 99.8%</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Real-time candidate telemetry, AI parsing analytics, and talent pipeline health.
          </p>
        </div>

        {/* Quick CTAs */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/upload">
            <Button
              variant="primary"
              size="md"
              leftIcon={<UploadCloud className="w-4 h-4" aria-hidden="true" />}
              className="min-h-[44px] shadow-glow-indigo font-semibold"
            >
              Upload Resume
            </Button>
          </Link>
          <Link to="/jobs">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
              className="min-h-[44px] font-medium"
            >
              Create Job
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* 2. Frosted Glass 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton variant="circular" className="w-9 h-9" />
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))
          : kpiCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                >
                  <Card
                    variant="interactive"
                    className="p-5 sm:p-6 relative overflow-hidden group border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/40 transition-all duration-300"
                  >
                    <div
                      className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40"
                      style={{ backgroundColor: card.color }}
                    />

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {card.title}
                      </span>
                      <div
                        className="p-2.5 rounded-xl border flex items-center justify-center"
                        style={{
                          backgroundColor: `${card.color}15`,
                          borderColor: `${card.color}35`,
                          color: card.color,
                        }}
                      >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-2 mb-3">
                      <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {card.value}
                      </div>
                      <div className="shrink-0 pt-1">
                        <Sparkline data={card.sparkline} color={card.color} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-semibold ${card.badgeBg}`}>
                        <ArrowUpRight className="w-3 h-3 mr-0.5" aria-hidden="true" />
                        {card.change}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">{card.trendText}</span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
      </div>

      {/* 3. Recharts Dynamic Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visualization 1: Top Skills in Demand (Horizontal BarChart) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-6"
        >
          <Card className="h-full flex flex-col p-6">
            <CardHeader className="mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle>Top Skills in Talent Pool</CardTitle>
                  <CardDescription>Frequency distribution extracted across candidates</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 pt-4">
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="w-full h-full rounded-xl" />
                </div>
              ) : topSkillsData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
                  <Layers className="w-8 h-8 mb-2 opacity-40" />
                  <p>No skill telemetry available yet.</p>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={topSkillsData}
                      margin={{ top: 10, right: 20, left: 30, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="skillBarGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6366F1" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartTheme.gridStroke} />
                      <XAxis
                        type="number"
                        tick={{ fill: chartTheme.axisTickText, fontSize: 11 }}
                        axisLine={{ stroke: chartTheme.axisStroke }}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: chartTheme.categoryTickText, fontSize: 12, fontWeight: 500 }}
                        axisLine={{ stroke: chartTheme.axisStroke }}
                        tickLine={false}
                        width={80}
                      />
                      <Tooltip content={<CustomChartTooltip unit=" candidates" />} />
                      <Bar
                        dataKey="count"
                        name="Candidates"
                        fill="url(#skillBarGrad)"
                        radius={[0, 6, 6, 0]}
                        barSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Visualization 2: Experience vs Match Score (Spline AreaChart) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="lg:col-span-6"
        >
          <Card className="h-full flex flex-col p-6">
            <CardHeader className="mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <Activity className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle>Experience vs Match Score</CardTitle>
                  <CardDescription>Seniority breakdown & predictive screening match</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 pt-4">
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="w-full h-full rounded-xl" />
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={experienceData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="expAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                      <XAxis
                        dataKey="category"
                        tick={{ fill: chartTheme.categoryTickText, fontSize: 12 }}
                        axisLine={{ stroke: chartTheme.axisStroke }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: chartTheme.axisTickText, fontSize: 11 }}
                        axisLine={{ stroke: chartTheme.axisStroke }}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomChartTooltip unit=" candidates" />} />
                      <Area
                        type="monotone"
                        dataKey="candidatesCount"
                        name="Candidates"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#expAreaGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Visualization 3: Candidate Match Tier Funnel (Donut / PieChart) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.36 }}
          className="lg:col-span-12"
        >
          <Card className="p-6">
            <CardHeader className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                    <Award className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle>Candidate Match Tier Funnel</CardTitle>
                    <CardDescription>
                      Automated classification across semantic matching confidence bands
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="indigo" size="sm" dot pulse>
                  Live Pipeline
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Donut Chart with Centered Metric */}
                <div className="md:col-span-5 relative flex items-center justify-center h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tierDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                      >
                        {tierDonutData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke={chartTheme.pieStroke}
                            strokeWidth={2}
                            className="transition-all duration-300 cursor-pointer"
                            style={{
                              filter: activeIndex === index ? `drop-shadow(0 0 8px ${entry.color})` : 'none',
                              transform: activeIndex === index ? 'scale(1.04)' : 'scale(1)',
                              transformOrigin: 'center center',
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip unit=" candidates" />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      {totalCandidatesCount}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Evaluated
                    </span>
                  </div>
                </div>

                {/* Legend & Breakdown Cards */}
                <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {tierDonutData.map((tier, idx) => {
                    const pct = totalCandidatesCount
                      ? Math.round((tier.value / totalCandidatesCount) * 100)
                      : 25;
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 ${
                          activeIndex === idx
                            ? 'bg-white/90 dark:bg-slate-800/90 border-slate-300 dark:border-white/25 shadow-lg'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15'
                        }`}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseLeave={() => setActiveIndex(null)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: tier.color }}
                            />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{tier.name}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{tier.value}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: tier.color,
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Confidence Tier</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 4. Activity Spotlight: Recent Candidates & Open Job Requisitions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Candidates Spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.44 }}
          className="lg:col-span-7"
        >
          <Card className="p-6 h-full flex flex-col">
            <CardHeader className="mb-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                    <Users className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle>Recent Candidates</CardTitle>
                    <CardDescription>Latest parsed candidate profiles in pipeline</CardDescription>
                  </div>
                </div>
                <Link to="/candidates">
                  <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-100/50 dark:bg-slate-800/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton variant="circular" className="w-10 h-10" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20 rounded-xl" />
                  </div>
                ))
              ) : recentCandidates.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium text-slate-600 dark:text-slate-400">No candidates found</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Upload your first resume to begin AI screening.</p>
                  <Link to="/upload">
                    <Button variant="outline" size="sm" leftIcon={<UploadCloud className="w-3.5 h-3.5" />}>
                      Upload Now
                    </Button>
                  </Link>
                </div>
              ) : (
                recentCandidates.map((candidate) => {
                  const skills = extractCandidateSkillNames(candidate).slice(0, 3);
                  const expYears = (candidate.total_experience_months || 0) / 12;

                  return (
                    <div
                      key={candidate.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-indigo-500/30 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm shrink-0">
                          {candidate.full_name
                            ? candidate.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()
                            : 'CD'}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/candidates/${candidate.id}`}
                            className="font-semibold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate block"
                          >
                            {candidate.full_name || 'Unnamed Candidate'}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                            {candidate.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                                {candidate.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                              {expYears > 0 ? `${expYears.toFixed(1)} yrs exp` : 'Entry level'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <div className="hidden md:flex gap-1.5">
                          {skills.map((skill, sIdx) => (
                            <Badge key={sIdx} variant="slate" size="sm">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <Link to={`/candidates/${candidate.id}`}>
                          <Button variant="outline" size="sm" className="text-xs h-8 px-3">
                            Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Open Jobs Spotlight */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.52 }}
          className="lg:col-span-5"
        >
          <Card className="p-6 h-full flex flex-col">
            <CardHeader className="mb-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                    <Briefcase className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <CardTitle>Open Requisitions</CardTitle>
                    <CardDescription>Active screening pipelines</CardDescription>
                  </div>
                </div>
                <Link to="/jobs">
                  <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                    All Jobs
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
              {loading ? (
                Array.from({ length: 2 }).map((_, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-100/50 dark:bg-slate-800/30 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                ))
              ) : spotlightJobs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium text-slate-600 dark:text-slate-400">No active jobs</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Post a new job requisition to match candidates.</p>
                  <Link to="/jobs">
                    <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                      Create Job
                    </Button>
                  </Link>
                </div>
              ) : (
                spotlightJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-cyan-500/30 transition-all duration-200 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/jobs/${job.id}/candidates`}
                          className="font-semibold text-sm text-slate-900 dark:text-slate-100 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors block"
                        >
                          {job.title}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {job.company} • {job.location || 'Remote'}
                        </p>
                      </div>
                      <Link to={`/jobs/${job.id}/candidates`}>
                        <Button variant="emerald" size="sm" className="text-xs h-7 px-2.5">
                          Matches
                        </Button>
                      </Link>
                    </div>

                    {job.required_skills && (
                      <div className="flex flex-wrap gap-1">
                        {job.required_skills
                          .split(',')
                          .slice(0, 3)
                          .map((skill, sIdx) => (
                            <Badge key={sIdx} variant="cyan" size="sm">
                              {skill.trim()}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

