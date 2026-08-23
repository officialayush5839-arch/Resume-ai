import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Trash2,
  Eye,
  Check,
  Sparkles,
  AlertCircle,
  Plus,
  Scale,
  Layers,
  RotateCw,
  X,
  Clock,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { CandidateService, JobService } from '../services/api';
import type { Candidate, Job, CandidateFilterCriteria, SortOption, ComparisonMatrixData } from '../types';
import {
  filterAndSortCandidates,
  buildCandidateComparison,
  getScoreTier,
  normalizeSkill,
  extractCandidateSkillNames,
} from '../utils/matching';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { SkeletonCard, SkeletonStatCard } from '../components/ui/Skeleton';

// Category mapping for talent domains
const CATEGORY_MAP: Record<string, string[]> = {
  'All': [],
  'Web Frontend': [
    'react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 
    'tailwind css', 'tailwind', 'frontend', 'nextjs', 'svelte', 'redux', 'web'
  ],
  'Backend & Systems': [
    'python', 'node.js', 'node', 'java', 'go', 'golang', 'c++', 'c#', 'rust', 
    'postgresql', 'postgres', 'psql', 'mongodb', 'mongo', 'sql', 'fastapi', 
    'django', 'backend', 'express', 'spring', 'redis', 'graphql'
  ],
  'Data & AI': [
    'python', 'machine learning', 'deep learning', 'pytorch', 'tensorflow', 
    'ai', 'data science', 'pandas', 'nlp', 'llm', 'computer vision', 'data', 'scikit-learn'
  ],
  'DevOps & Cloud': [
    'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'k8s', 'cicd', 'ci/cd', 
    'terraform', 'linux', 'cloud', 'devops', 'git', 'ansible'
  ],
};

const CATEGORIES = ['All', 'Web Frontend', 'Backend & Systems', 'Data & AI', 'DevOps & Cloud'] as const;

export default function Candidates() {
  const navigate = useNavigate();

  // Data States
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [minExpYears, setMinExpYears] = useState<number>(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillMatchMode, setSkillMatchMode] = useState<'any' | 'all'>('any');
  const [sortBy, setSortBy] = useState<SortOption>('created_at_desc');
  const [selectedJobContextId, setSelectedJobContextId] = useState<string>('none');

  // View Mode: Grid vs Table
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Selection for Multi-Candidate Comparison (Feature A)
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Preview Drawer/Modal State (Feature B)
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(null);
  const [previewActiveTab, setPreviewActiveTab] = useState<'summary' | 'experience' | 'skills' | 'education'>('summary');

  // Delete Candidate Modal State
  const [deleteCandidateTarget, setDeleteCandidateTarget] = useState<Candidate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Candidates & Jobs
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [candRes, jobsRes] = await Promise.allSettled([
        CandidateService.getCandidates<Candidate[]>(),
        JobService.getJobs<Job[]>(),
      ]);

      if (candRes.status === 'fulfilled' && Array.isArray(candRes.value.data)) {
        setCandidates(candRes.value.data);
      } else {
        setCandidates([]);
      }

      if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value.data)) {
        setJobs(jobsRes.value.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load candidates directory.');
      toast.error('Could not connect to candidates service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Selected Job Context for Match Scoring
  const selectedJobContext = useMemo(() => {
    if (selectedJobContextId === 'none') return null;
    return jobs.find((j) => String(j.id) === selectedJobContextId) || null;
  }, [jobs, selectedJobContextId]);

  // Extract all unique locations
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    candidates.forEach((c) => {
      if (c.location && c.location.trim()) {
        locs.add(c.location.trim());
      }
    });
    return ['All', ...Array.from(locs)];
  }, [candidates]);

  // Extract popular skills across talent pool
  const popularSkills = useMemo(() => {
    const counts: Record<string, number> = {};
    candidates.forEach((c) => {
      extractCandidateSkillNames(c).forEach((s) => {
        const key = s.trim();
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([s]) => s);
  }, [candidates]);

  // Compute Active Filtered Candidates using matching engine
  const filteredCandidates = useMemo(() => {
    // Combine explicit selected skills with active category domain skills if category is selected
    let effectiveSkills = [...selectedSkills];
    if (activeCategory !== 'All' && CATEGORY_MAP[activeCategory]?.length > 0) {
      effectiveSkills = Array.from(new Set([...effectiveSkills, ...CATEGORY_MAP[activeCategory]]));
    }

    const criteria: CandidateFilterCriteria = {
      searchQuery,
      selectedSkills: effectiveSkills,
      skillMatchMode: activeCategory !== 'All' && selectedSkills.length === 0 ? 'any' : skillMatchMode,
      minExperienceYears: minExpYears,
      location: selectedLocation,
      sortBy,
    };

    return filterAndSortCandidates(candidates, criteria, selectedJobContext);
  }, [candidates, searchQuery, activeCategory, selectedLocation, minExpYears, selectedSkills, skillMatchMode, sortBy, selectedJobContext]);

  // Selection Helpers
  const toggleSelectCandidate = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        toast.error('You can compare a maximum of 4 candidates at once');
        return prev;
      }
      return [...prev, id];
    });
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Comparison Matrix Data
  const selectedCandidatesList = useMemo(() => {
    return candidates.filter((c) => selectedIds.includes(c.id));
  }, [candidates, selectedIds]);

  const comparisonData: ComparisonMatrixData = useMemo(() => {
    return buildCandidateComparison(selectedCandidatesList, selectedJobContext);
  }, [selectedCandidatesList, selectedJobContext]);

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete Candidate Handler
  const handleDeleteCandidate = async () => {
    if (!deleteCandidateTarget) return;
    setIsDeleting(true);
    try {
      await CandidateService.deleteCandidate(deleteCandidateTarget.id);
      setCandidates((prev) => prev.filter((c) => c.id !== deleteCandidateTarget.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deleteCandidateTarget.id));
      toast.success(`Deleted candidate profile for "${deleteCandidateTarget.full_name}"`);
      setDeleteCandidateTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to delete candidate');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveCategory('All');
    setSelectedLocation('All');
    setMinExpYears(0);
    setSelectedSkills([]);
    setSkillMatchMode('any');
    setSortBy('created_at_desc');
    setSelectedJobContextId('none');
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    activeCategory !== 'All' ||
    selectedLocation !== 'All' ||
    minExpYears > 0 ||
    selectedSkills.length > 0 ||
    selectedJobContextId !== 'none';

  // Overall Directory Metrics
  const avgExpYears = useMemo(() => {
    if (candidates.length === 0) return '0.0';
    const totalMonths = candidates.reduce((sum, c) => sum + (c.total_experience_months || 0), 0);
    return (totalMonths / candidates.length / 12).toFixed(1);
  }, [candidates]);

  const totalSkillsIdentified = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      extractCandidateSkillNames(c).forEach((s) => set.add(normalizeSkill(s)));
    });
    return set.size;
  }, [candidates]);

  return (
    <div className="space-y-8 pb-20">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Talent Intelligence
            </span>
            <span className="text-xs text-slate-500 font-medium">Directory & Screening</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Candidate <span className="gradient-brand-text">Directory</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-2xl">
            Explore, filter, and compare candidate profiles parsed automatically from uploaded resumes with multi-dimensional scoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchData}
            title="Refresh Talent Pool"
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/upload')}
            className="shadow-lg shadow-indigo-500/25"
          >
            Upload Resume
          </Button>
        </div>
      </div>

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            {/* Card 1: Total Candidates */}
            <Card variant="glow" glowColor="indigo" className="relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Talent Pool</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{candidates.length}</span>
                    <span className="text-xs text-indigo-400 font-medium flex items-center gap-0.5">
                      <Users className="w-3.5 h-3.5" /> Profiles
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Active in database</span>
                <span className="text-indigo-300 font-medium">100% Vectorized</span>
              </div>
            </Card>

            {/* Card 2: Avg Experience */}
            <Card variant="glow" glowColor="emerald" className="relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Experience</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{avgExpYears}</span>
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-0.5">
                      <Clock className="w-3.5 h-3.5" /> Years
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Weighted tenure</span>
                <span className="text-emerald-300 font-medium">Mid-to-Senior</span>
              </div>
            </Card>

            {/* Card 3: Extracted Tech Skills */}
            <Card variant="glow" glowColor="cyan" className="relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Unique Skills</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalSkillsIdentified}</span>
                    <span className="text-xs text-cyan-400 font-medium flex items-center gap-0.5">
                      <Sparkles className="w-3.5 h-3.5" /> Tech Tags
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Across all domains</span>
                <span className="text-cyan-300 font-medium">NLP Classified</span>
              </div>
            </Card>

            {/* Card 4: Selected for Comparison */}
            <Card variant="glow" glowColor="amber" className="relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Comparison Queue</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{selectedIds.length}</span>
                    <span className="text-xs text-amber-400 font-medium flex items-center gap-0.5">
                      / 4 Selected
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Scale className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{selectedIds.length >= 2 ? 'Ready for matrix' : 'Select 2-4 candidates'}</span>
                {selectedIds.length >= 2 ? (
                  <button
                    onClick={() => setIsCompareModalOpen(true)}
                    className="text-amber-300 font-bold hover:underline cursor-pointer"
                  >
                    Compare Now →
                  </button>
                ) : (
                  <span className="text-slate-500">Pick from list</span>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Multi-Facet Filter & Search Toolbar */}
      <div className="glass-card p-5 space-y-5 border border-slate-200/80 dark:border-white/10 shadow-xl">
        {/* Row 1: Search Input + View Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by candidate name, email, skills, summary, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 backdrop-blur-md transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <div className="flex items-center p-1 bg-slate-900/90 border border-slate-200/80 dark:border-white/10 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-slate-900 dark:text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-white/5'
                }`}
                title="Glass Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-slate-900 dark:text-white shadow-md'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-white/5'
                }`}
                title="Dense Table View"
                aria-label="Table View"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Domain:
          </span>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer select-none border ${
                  isActive
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Row 3: Facet Dropdowns & Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-200/60 dark:border-white/5">
          {/* Min Experience Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Min Experience:
              </span>
              <span className="font-bold text-indigo-300">
                {minExpYears === 0 ? 'All Experience' : `${minExpYears}+ Years`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={minExpYears}
              onChange={(e) => setMinExpYears(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
            />
          </div>

          {/* Location Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Location:
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            >
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc} className="bg-slate-900 text-slate-800 dark:text-slate-200">
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" /> Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="created_at_desc" className="bg-slate-900 text-slate-800 dark:text-slate-200">
                Date Added (Newest First)
              </option>
              <option value="experience_desc" className="bg-slate-900 text-slate-800 dark:text-slate-200">
                Experience (High to Low)
              </option>
              <option value="experience_asc" className="bg-slate-900 text-slate-800 dark:text-slate-200">
                Experience (Low to High)
              </option>
              <option value="name_asc" className="bg-slate-900 text-slate-800 dark:text-slate-200">
                Candidate Name (A-Z)
              </option>
              <option value="match_score_desc" className="bg-slate-900 text-slate-800 dark:text-slate-200">
                Match Score (Highest First)
              </option>
            </select>
          </div>

          {/* Job Context Selector (for Score Sorting) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" /> Match Context:
            </label>
            <select
              value={selectedJobContextId}
              onChange={(e) => setSelectedJobContextId(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="none" className="bg-slate-900 text-slate-800 dark:text-slate-200">
                No Job (Raw Profile Score)
              </option>
              {jobs.map((job) => (
                <option key={job.id} value={String(job.id)} className="bg-slate-900 text-slate-800 dark:text-slate-200">
                  {job.title} ({job.company})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Popular Skill Filter Tags & Match Mode */}
        {popularSkills.length > 0 && (
          <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" /> Filter by Popular Tech:
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span>Match Mode:</span>
                <button
                  type="button"
                  onClick={() => setSkillMatchMode((m) => (m === 'any' ? 'all' : 'any'))}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                    skillMatchMode === 'all'
                      ? 'bg-indigo-600/30 border-indigo-400 text-indigo-300'
                      : 'bg-slate-200 dark:bg-slate-800 border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                  title="Toggle between Any (OR) and All (AND) match"
                >
                  {skillMatchMode.toUpperCase()}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {popularSkills.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      setSelectedSkills((prev) =>
                        prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
                      );
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all select-none border cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 shadow-sm'
                        : 'bg-slate-100/80 dark:bg-slate-900/50 border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:border-white/15'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Filters Row */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Active filters:</span>
            {searchQuery && (
              <Badge variant="indigo" size="sm" onRemove={() => setSearchQuery('')}>
                Search: "{searchQuery}"
              </Badge>
            )}
            {activeCategory !== 'All' && (
              <Badge variant="cyan" size="sm" onRemove={() => setActiveCategory('All')}>
                Domain: {activeCategory}
              </Badge>
            )}
            {selectedLocation !== 'All' && (
              <Badge variant="emerald" size="sm" onRemove={() => setSelectedLocation('All')}>
                Location: {selectedLocation}
              </Badge>
            )}
            {minExpYears > 0 && (
              <Badge variant="amber" size="sm" onRemove={() => setMinExpYears(0)}>
                Min Exp: {minExpYears}+ Yrs
              </Badge>
            )}
            {selectedSkills.map((skill) => (
              <Badge
                key={skill}
                variant="purple"
                size="sm"
                onRemove={() => setSelectedSkills((prev) => prev.filter((s) => s !== skill))}
              >
                Skill: {skill}
              </Badge>
            ))}
            {selectedJobContext && (
              <Badge variant="rose" size="sm" onRemove={() => setSelectedJobContextId('none')}>
                Context: {selectedJobContext.title}
              </Badge>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline ml-auto font-medium cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card p-4 border border-rose-500/30 bg-rose-500/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-300">{error}</p>
          </div>
          <Button variant="danger" size="sm" onClick={fetchData}>
            Retry
          </Button>
        </div>
      )}

      {/* Directory Results Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-800 dark:text-slate-200">{filteredCandidates.length}</strong> of{' '}
          <strong className="text-slate-800 dark:text-slate-200">{candidates.length}</strong> total candidates
        </span>
        {selectedIds.length > 0 && (
          <span className="text-amber-400 font-semibold flex items-center gap-1">
            <Scale className="w-3.5 h-3.5" /> {selectedIds.length} candidate{selectedIds.length !== 1 ? 's' : ''} in comparison queue
          </span>
        )}
      </div>

      {/* Candidate Cards Grid or Dense Table */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {candidates.length === 0 ? 'No Candidates in Directory' : 'No matching candidates found'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {candidates.length === 0
                ? 'Upload your first resume file (PDF or DOCX) to parse structured candidate profiles.'
                : 'Try broadening your search criteria or resetting filters to view more candidates.'}
            </p>
          </div>
          {candidates.length === 0 ? (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/upload')}
            >
              Upload First Resume
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Glass Grid View */
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCandidates.map((candidate) => {
            const isSelected = selectedIds.includes(candidate.id);
            const initials = candidate.full_name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            const expYearsNum = ((candidate.total_experience_months || 0) / 12).toFixed(1);
            const skillsList = extractCandidateSkillNames(candidate);

            return (
              <motion.div
                key={candidate.id}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } },
                }}
                className="h-full flex"
              >
                <Card
                  variant="interactive"
                  className={`flex flex-col justify-between h-full w-full group relative overflow-hidden transition-all duration-300 ${
                    isSelected ? 'ring-2 ring-indigo-500 bg-slate-900/90 shadow-indigo-500/20' : ''
                  }`}
                  onClick={() => navigate(`/candidates/${candidate.id}`)}
                >
                  {/* Top Ambient Glow Strip */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity" />

                  {/* Card Header & Controls */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Checkbox for comparison & Avatar */}
                      <div className="flex items-start gap-3">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectCandidate(candidate.id);
                          }}
                          className="pt-1 cursor-pointer"
                          title="Select for comparison"
                        >
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-500 text-slate-900 dark:text-white'
                                : 'bg-slate-800/80 border-white/20 text-transparent hover:border-indigo-400'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>

                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-slate-900 dark:text-white font-bold text-base shadow-lg shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                          {initials}
                        </div>

                        {/* Name & ID */}
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                            {candidate.full_name}
                          </h3>
                          <p className="text-xs text-slate-500 font-mono">
                            ID: #{candidate.id}
                          </p>
                        </div>
                      </div>

                      {/* Delete Quick Action */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteCandidateTarget(candidate);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors focus:outline-none cursor-pointer"
                        title="Delete Profile"
                        aria-label={`Delete ${candidate.full_name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Metadata Badges: Location & Experience */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="slate"
                        size="sm"
                        icon={<MapPin className="w-3 h-3 text-slate-500 dark:text-slate-400" />}
                      >
                        {candidate.location || 'Location Not Specified'}
                      </Badge>

                      <Badge
                        variant="indigo"
                        size="sm"
                        icon={<Clock className="w-3 h-3 text-indigo-400" />}
                      >
                        {candidate.total_experience_months
                          ? `${expYearsNum} Yrs Exp`
                          : 'Entry / Not Specified'}
                      </Badge>
                    </div>

                    {/* Summary Excerpt */}
                    {candidate.summary && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic">
                        "{candidate.summary}"
                      </p>
                    )}

                    {/* Contacts Quick Pill with Click to Copy */}
                    <div className="flex flex-wrap gap-2 pt-1 text-xs">
                      {candidate.email && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(candidate.email!, `email-${candidate.id}`, 'Email');
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:text-indigo-300 hover:border-indigo-400/30 transition-colors cursor-pointer"
                          title="Click to copy email"
                        >
                          {copiedId === `email-${candidate.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Mail className="w-3 h-3 text-indigo-400" />
                          )}
                          <span className="truncate max-w-[160px]">{candidate.email}</span>
                        </button>
                      )}

                      {candidate.phone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(candidate.phone!, `phone-${candidate.id}`, 'Phone');
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:text-indigo-300 hover:border-indigo-400/30 transition-colors cursor-pointer"
                          title="Click to copy phone"
                        >
                          {copiedId === `phone-${candidate.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Phone className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>{candidate.phone}</span>
                        </button>
                      )}
                    </div>

                    {/* Categorized Skills Chips */}
                    {skillsList.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Skills ({skillsList.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {skillsList.slice(0, 5).map((skill, i) => (
                            <Badge key={i} variant="cyan" size="sm">
                              {skill}
                            </Badge>
                          ))}
                          {skillsList.length > 5 && (
                            <Badge variant="slate" size="sm">
                              +{skillsList.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer & Action Buttons */}
                  <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewCandidate(candidate);
                        setPreviewActiveTab('summary');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Quick Resume Preview"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Preview</span>
                    </button>

                    <Button
                      variant="outline"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/candidates/${candidate.id}`);
                      }}
                      className="text-xs group-hover:border-indigo-400 group-hover:bg-indigo-500/15"
                    >
                      View Profile
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* Dense Data Table View */
        <div className="glass-card overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4 w-12 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Experience</th>
                  <th className="p-4">Top Skills</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredCandidates.map((candidate) => {
                  const isSelected = selectedIds.includes(candidate.id);
                  const initials = candidate.full_name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const skillsList = extractCandidateSkillNames(candidate);
                  const expYearsNum = ((candidate.total_experience_months || 0) / 12).toFixed(1);

                  return (
                    <tr
                      key={candidate.id}
                      onClick={() => navigate(`/candidates/${candidate.id}`)}
                      className={`hover:bg-slate-100/60 dark:bg-slate-800/50 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox Column */}
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div
                          onClick={() => toggleSelectCandidate(candidate.id)}
                          className="inline-flex cursor-pointer"
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-500 text-slate-900 dark:text-white'
                                : 'bg-slate-200 dark:bg-slate-800 border-white/20 text-transparent hover:border-indigo-400'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                      </td>

                      {/* Candidate Column */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-slate-900 dark:text-white font-bold text-xs shadow-md shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-300 transition-colors">
                              {candidate.full_name}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <span>#{candidate.id}</span>
                              {candidate.email && <span>• {candidate.email}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location Column */}
                      <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {candidate.location || 'Remote / Unspecified'}
                        </span>
                      </td>

                      {/* Experience Column */}
                      <td className="p-4">
                        <Badge variant="indigo" size="sm">
                          {candidate.total_experience_months
                            ? `${expYearsNum} Yrs`
                            : 'Entry Level'}
                        </Badge>
                      </td>

                      {/* Skills Column */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {skillsList.slice(0, 3).map((s, i) => (
                            <Badge key={i} variant="cyan" size="sm">
                              {s}
                            </Badge>
                          ))}
                          {skillsList.length > 3 && (
                            <Badge variant="slate" size="sm">
                              +{skillsList.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewCandidate(candidate);
                              setPreviewActiveTab('summary');
                            }}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            title="Quick Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/candidates/${candidate.id}`)}
                            className="text-xs"
                          >
                            Profile
                          </Button>

                          <button
                            type="button"
                            onClick={() => setDeleteCandidateTarget(candidate)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Selection Dock (Multi-Candidate Comparison Action Bar) */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl bg-slate-900/90 border border-indigo-500/40 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl shadow-black/80 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {selectedIds.length} Candidate{selectedIds.length !== 1 ? 's' : ''} Selected
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedIds.length < 2
                    ? 'Select at least 1 more candidate to compare'
                    : 'Ready for side-by-side competency comparison'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100"
              >
                Clear
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={selectedIds.length < 2}
                onClick={() => setIsCompareModalOpen(true)}
                leftIcon={<Scale className="w-4 h-4" />}
                className="shadow-lg shadow-indigo-500/30"
              >
                Compare ({selectedIds.length})
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-Candidate Comparison Matrix Modal (Feature A) */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="Candidate Comparison Matrix"
        subtitle={`Side-by-side competency alignment & Venn skill analysis (${selectedCandidatesList.length} candidates)`}
        size="4xl"
      >
        <div className="space-y-6">
          {/* Job Context Selector */}
          <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Screen against Job Requisition:</span>
            </div>
            <select
              value={selectedJobContextId}
              onChange={(e) => setSelectedJobContextId(e.target.value)}
              className="bg-slate-200 dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400"
            >
              <option value="none">No Specific Job (Baseline Profile Match)</option>
              {jobs.map((j) => (
                <option key={j.id} value={String(j.id)}>
                  {j.title} ({j.company})
                </option>
              ))}
            </select>
          </div>

          {/* Common Skills Across ALL Selected Candidates */}
          {comparisonData.commonSkillsAcrossAll.length > 0 && (
            <div className="glass-card p-4 space-y-2 border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Common Skills Overlap ({comparisonData.commonSkillsAcrossAll.length})
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {comparisonData.commonSkillsAcrossAll.map((s, idx) => (
                  <Badge key={idx} variant="emerald" size="sm">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Side-by-side Candidate Columns Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-${Math.min(comparisonData.candidates.length, 3)} gap-4`}>
            {comparisonData.candidates.map((item) => {
              const cand = item.candidate;
              const initials = cand.full_name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
              const tier = getScoreTier(item.matchScore);

              return (
                <div key={cand.id} className="glass-card p-5 space-y-4 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
                  {/* Candidate Header */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-slate-900 dark:text-white font-bold text-xs shadow-md">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{cand.full_name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{cand.location || 'Remote'}</p>
                      </div>
                    </div>

                    {/* Match Score Gauge */}
                    <div className={`p-3 rounded-xl border ${tier.bg} ${tier.border} flex items-center justify-between`}>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Match Score</p>
                        <p className={`text-xl font-extrabold ${tier.textClass}`}>{item.matchScore}%</p>
                      </div>
                      <Badge variant={tier.badgeVariant} size="sm">
                        {tier.tier}
                      </Badge>
                    </div>

                    {/* Experience & Education */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400">Experience:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {cand.total_experience_months ? `${(cand.total_experience_months / 12).toFixed(1)} Yrs` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400">Education:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[140px]">
                          {cand.educations?.[0]?.degree || 'Unspecified'}
                        </span>
                      </div>
                    </div>

                    {/* Unique Skills (Differentiators) */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Unique Differentiators ({item.uniqueSkills.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.uniqueSkills.length > 0 ? (
                          item.uniqueSkills.map((s, idx) => (
                            <Badge key={idx} variant="purple" size="sm">
                              {s}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">No unique skills</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Link */}
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setIsCompareModalOpen(false);
                      navigate(`/candidates/${cand.id}`);
                    }}
                    className="text-xs mt-2"
                  >
                    View Full Profile
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Quick Resume Live Preview Modal (Feature B) */}
      <Modal
        isOpen={Boolean(previewCandidate)}
        onClose={() => setPreviewCandidate(null)}
        title={previewCandidate ? `Resume Preview: ${previewCandidate.full_name}` : 'Resume Preview'}
        subtitle="Extracted unstructured text and verified metadata"
        size="3xl"
      >
        {previewCandidate && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-white/10 pb-3">
              {(['summary', 'experience', 'skills', 'education'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPreviewActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    previewActiveTab === tab
                      ? 'bg-indigo-600 text-slate-900 dark:text-white shadow-md'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            {previewActiveTab === 'summary' && (
              <div className="glass-card p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Professional Summary</h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed italic">
                  {previewCandidate.summary || 'No summary text extracted from resume.'}
                </p>
                <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Email: </span>
                    <span className="text-slate-800 dark:text-slate-200">{previewCandidate.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Phone: </span>
                    <span className="text-slate-800 dark:text-slate-200">{previewCandidate.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Location: </span>
                    <span className="text-slate-800 dark:text-slate-200">{previewCandidate.location || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Experience: </span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {previewCandidate.total_experience_months
                        ? `${(previewCandidate.total_experience_months / 12).toFixed(1)} years`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {previewActiveTab === 'experience' && (
              <div className="space-y-3">
                {previewCandidate.experiences && previewCandidate.experiences.length > 0 ? (
                  previewCandidate.experiences.map((exp, idx) => (
                    <div key={idx} className="glass-card p-4 space-y-1.5 border border-slate-200/60 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{exp.job_title || 'Position'}</h4>
                        <Badge variant="indigo" size="sm">
                          {exp.start_date || 'N/A'} — {exp.end_date || 'Present'}
                        </Badge>
                      </div>
                      <p className="text-xs text-indigo-400 font-medium">{exp.company || 'Company'}</p>
                      {exp.description && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">{exp.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-4 text-center">No experience entries found.</p>
                )}
              </div>
            )}

            {previewActiveTab === 'skills' && (
              <div className="glass-card p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Extracted Skills ({previewCandidate.skills?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {extractCandidateSkillNames(previewCandidate).map((s, idx) => (
                    <Badge key={idx} variant="cyan" size="md">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {previewActiveTab === 'education' && (
              <div className="space-y-3">
                {previewCandidate.educations && previewCandidate.educations.length > 0 ? (
                  previewCandidate.educations.map((edu, idx) => (
                    <div key={idx} className="glass-card p-4 space-y-1 border border-slate-200/60 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{edu.degree || 'Degree'}</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {edu.start_date || ''} {edu.end_date ? `— ${edu.end_date}` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-purple-400">{edu.institution || 'Institution'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-4 text-center">No education entries found.</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Candidate Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteCandidateTarget)}
        onClose={() => {
          if (!isDeleting) setDeleteCandidateTarget(null);
        }}
        title="Delete Candidate Profile"
        subtitle="This action is permanent and will remove all parsed skills, timeline records, and resumes"
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={isDeleting}
              onClick={() => setDeleteCandidateTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              isLoading={isDeleting}
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={handleDeleteCandidate}
            >
              Delete Candidate
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Are you sure you want to delete the parsed profile for{' '}
            <strong className="text-slate-900 dark:text-white font-bold">{deleteCandidateTarget?.full_name}</strong>?
          </p>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
            All extracted experiences, educations, and skill vectors for Candidate #{deleteCandidateTarget?.id} will be immediately deleted.
          </div>
        </div>
      </Modal>
    </div>
  );
}
