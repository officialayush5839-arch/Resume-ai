import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Briefcase,
  Plus,
  Search,
  Building2,
  MapPin,
  Clock,
  GraduationCap,
  Users,
  Trash2,
  ArrowRight,
  Sparkles,
  AlertCircle,
  X,
  Layers,
  TrendingUp,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { JobService, CandidateService, DashboardService } from '../services/api';
import type { Job, JobCreatePayload, Candidate, DashboardStats } from '../types';
import { parseSkillList } from '../utils/matching';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import { SkeletonCard, SkeletonStatCard } from '../components/ui/Skeleton';

interface FormState {
  title: string;
  company: string;
  description: string;
  location: string;
  minimumExperienceYears: string;
  educationRequirement: string;
  requiredSkills: string[];
  preferredSkills: string[];
}

const initialFormState: FormState = {
  title: '',
  company: '',
  description: '',
  location: '',
  minimumExperienceYears: '',
  educationRequirement: '',
  requiredSkills: [],
  preferredSkills: [],
};

export default function Jobs() {
  const navigate = useNavigate();

  // Data States
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedExpFilter, setSelectedExpFilter] = useState<number>(0);

  // Modal & Form States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [reqSkillInput, setReqSkillInput] = useState('');
  const [prefSkillInput, setPrefSkillInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion States
  const [deleteConfirmJob, setDeleteConfirmJob] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Jobs & Context Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsRes, candidatesRes, statsRes] = await Promise.allSettled([
        JobService.getJobs<Job[]>(),
        CandidateService.getCandidates<Candidate[]>(),
        DashboardService.getStats<DashboardStats>(),
      ]);

      if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value.data)) {
        setJobs(jobsRes.value.data);
      } else {
        setJobs([]);
      }

      if (candidatesRes.status === 'fulfilled' && Array.isArray(candidatesRes.value.data)) {
        setCandidates(candidatesRes.value.data);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        setStats(statsRes.value.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load job requisitions.');
      toast.error('Could not connect to job requisitions service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Metrics
  const activeRequisitionsCount = jobs.length;
  const candidatePoolSize = stats?.total_candidates ?? candidates.length;
  const avgExpRequirement = useMemo(() => {
    if (jobs.length === 0) return '0.0 Yrs';
    const totalExp = jobs.reduce((sum, j) => sum + (j.minimum_experience_years || 0), 0);
    return `${(totalExp / jobs.length).toFixed(1)} Yrs`;
  }, [jobs]);

  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    jobs.forEach((j) => {
      if (j.location && j.location.trim()) {
        locs.add(j.location.trim());
      }
    });
    return ['All', ...Array.from(locs)];
  }, [jobs]);

  // Dynamic Skill Tag Inputs
  const handleAddRequiredSkill = (value: string) => {
    const trimmed = value.trim().replace(/^,+|,+$/g, '');
    if (!trimmed) return;
    if (formState.requiredSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`"${trimmed}" is already in required skills`);
      return;
    }
    setFormState((prev) => ({
      ...prev,
      requiredSkills: [...prev.requiredSkills, trimmed],
    }));
    setReqSkillInput('');
    if (formErrors.requiredSkills) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.requiredSkills;
        return next;
      });
    }
  };

  const handleRemoveRequiredSkill = (skillToRemove: string) => {
    setFormState((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleAddPreferredSkill = (value: string) => {
    const trimmed = value.trim().replace(/^,+|,+$/g, '');
    if (!trimmed) return;
    if (formState.preferredSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`"${trimmed}" is already in preferred skills`);
      return;
    }
    setFormState((prev) => ({
      ...prev,
      preferredSkills: [...prev.preferredSkills, trimmed],
    }));
    setPrefSkillInput('');
  };

  const handleRemovePreferredSkill = (skillToRemove: string) => {
    setFormState((prev) => ({
      ...prev,
      preferredSkills: prev.preferredSkills.filter((s) => s !== skillToRemove),
    }));
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formState.title.trim()) {
      errors.title = 'Job title is required';
    }
    if (!formState.company.trim()) {
      errors.company = 'Company name is required';
    }
    if (formState.minimumExperienceYears && Number(formState.minimumExperienceYears) < 0) {
      errors.minimumExperienceYears = 'Experience cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create Job Handler
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    const payload: JobCreatePayload = {
      title: formState.title.trim(),
      company: formState.company.trim(),
      description: formState.description.trim() || undefined,
      required_skills: formState.requiredSkills.length > 0 ? formState.requiredSkills.join(', ') : undefined,
      preferred_skills: formState.preferredSkills.length > 0 ? formState.preferredSkills.join(', ') : undefined,
      minimum_experience_years: formState.minimumExperienceYears ? Number(formState.minimumExperienceYears) : undefined,
      education_requirement: formState.educationRequirement.trim() || undefined,
      location: formState.location.trim() || undefined,
    };

    try {
      const res = await JobService.createJob<Job>(payload);
      const newJob = res.data || {
        ...payload,
        id: Date.now(),
        created_at: new Date().toISOString(),
      };
      setJobs((prev) => [newJob, ...prev]);
      toast.success(`Requisition for "${newJob.title}" created successfully!`);
      setIsCreateModalOpen(false);
      setFormState(initialFormState);
      setReqSkillInput('');
      setPrefSkillInput('');
      setFormErrors({});
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to create job requisition');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Job Handler
  const handleDeleteJob = async () => {
    if (!deleteConfirmJob) return;
    setIsDeleting(true);
    try {
      await JobService.deleteJob(deleteConfirmJob.id);
      setJobs((prev) => prev.filter((j) => j.id !== deleteConfirmJob.id));
      toast.success(`Deleted requisition for "${deleteConfirmJob.title}"`);
      setDeleteConfirmJob(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to delete job');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & Search Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (job.title || '').toLowerCase().includes(q);
        const companyMatch = (job.company || '').toLowerCase().includes(q);
        const descMatch = (job.description || '').toLowerCase().includes(q);
        const reqSkillMatch = (job.required_skills || '').toLowerCase().includes(q);
        const prefSkillMatch = (job.preferred_skills || '').toLowerCase().includes(q);
        const locMatch = (job.location || '').toLowerCase().includes(q);

        if (!titleMatch && !companyMatch && !descMatch && !reqSkillMatch && !prefSkillMatch && !locMatch) {
          return false;
        }
      }

      // 2. Location Filter
      if (selectedLocation !== 'All') {
        const jobLoc = (job.location || '').toLowerCase().trim();
        if (jobLoc !== selectedLocation.toLowerCase().trim()) {
          return false;
        }
      }

      // 3. Experience Filter
      if (selectedExpFilter > 0) {
        const jobExp = job.minimum_experience_years || 0;
        if (jobExp < selectedExpFilter) {
          return false;
        }
      }

      return true;
    });
  }, [jobs, searchQuery, selectedLocation, selectedExpFilter]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Page Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Talent Acquisition
            </span>
            <span className="text-xs text-slate-500 font-medium">Requisition Hub</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            Open Job <span className="gradient-brand-text">Requisitions</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Create, manage, and screen talent pipelines against structured job criteria with real-time NLP candidate matching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchData}
            title="Refresh Requisitions"
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-lg shadow-indigo-500/25"
          >
            Create Job Requisition
          </Button>
        </div>
      </div>

      {/* Top Metrics KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Metric 1: Active Requisitions */}
        {loading ? (
          <SkeletonStatCard />
        ) : (
          <Card variant="glow" glowColor="indigo" className="relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Requisitions</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-slate-100">{activeRequisitionsCount}</span>
                  <span className="text-xs text-indigo-400 font-medium flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Live Positions
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>Ready for AI Screening</span>
              <span className="text-indigo-300 font-medium">100% Pipeline Coverage</span>
            </div>
          </Card>
        )}

        {/* Metric 2: Candidate Pool */}
        {loading ? (
          <SkeletonStatCard />
        ) : (
          <Card variant="glow" glowColor="emerald" className="relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Candidate Talent Pool</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-slate-100">{candidatePoolSize}</span>
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-0.5">
                    <Sparkles className="w-3.5 h-3.5" /> Parsed Profiles
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>Available for Instant Match</span>
              <span className="text-emerald-300 font-medium">FastAPI Engine</span>
            </div>
          </Card>
        )}

        {/* Metric 3: Avg Experience Requirement */}
        {loading ? (
          <SkeletonStatCard />
        ) : (
          <Card variant="glow" glowColor="cyan" className="relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Exp Requirement</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-slate-100">{avgExpRequirement}</span>
                  <span className="text-xs text-cyan-400 font-medium flex items-center gap-0.5">
                    <Layers className="w-3.5 h-3.5" /> Seniority Baseline
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>Weighted across requisitions</span>
              <span className="text-cyan-300 font-medium">Auto-Normalized</span>
            </div>
          </Card>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by job title, company, skill, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 backdrop-blur-md transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Location Filter */}
          {uniqueLocations.length > 2 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Location:</span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
              >
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc} className="bg-slate-900 text-slate-200">
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Min Experience Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Min Exp:</span>
            <select
              value={selectedExpFilter}
              onChange={(e) => setSelectedExpFilter(Number(e.target.value))}
              className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value={0} className="bg-slate-900 text-slate-200">
                All Experience
              </option>
              <option value={1} className="bg-slate-900 text-slate-200">
                1+ Years
              </option>
              <option value={3} className="bg-slate-900 text-slate-200">
                3+ Years
              </option>
              <option value={5} className="bg-slate-900 text-slate-200">
                5+ Years
              </option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(searchQuery || selectedLocation !== 'All' || selectedExpFilter > 0) && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-xs text-slate-400 flex-wrap">
            <span>Active filters:</span>
            {searchQuery && (
              <Badge variant="indigo" size="sm" onRemove={() => setSearchQuery('')}>
                Query: "{searchQuery}"
              </Badge>
            )}
            {selectedLocation !== 'All' && (
              <Badge variant="cyan" size="sm" onRemove={() => setSelectedLocation('All')}>
                Location: {selectedLocation}
              </Badge>
            )}
            {selectedExpFilter > 0 && (
              <Badge variant="amber" size="sm" onRemove={() => setSelectedExpFilter(0)}>
                Min Exp: {selectedExpFilter}+ Yrs
              </Badge>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLocation('All');
                setSelectedExpFilter(0);
              }}
              className="text-xs text-slate-400 hover:text-indigo-300 underline ml-auto cursor-pointer"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
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

      {/* Jobs Grid Section */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Briefcase className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-lg font-semibold text-slate-100">
              {jobs.length === 0 ? 'No Job Requisitions Yet' : 'No matching requisitions found'}
            </h3>
            <p className="text-sm text-slate-400">
              {jobs.length === 0
                ? 'Create your first job requisition to begin scoring and ranking candidates automatically.'
                : 'Try adjusting your search query or removing active filters to see more requisitions.'}
            </p>
          </div>
          {jobs.length === 0 ? (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create First Requisition
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedLocation('All');
                setSelectedExpFilter(0);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.06 },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredJobs.map((job) => {
            const requiredSkillsList = parseSkillList(job.required_skills);
            const preferredSkillsList = parseSkillList(job.preferred_skills);

            return (
              <motion.div
                key={job.id}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } },
                }}
                className="h-full flex"
              >
                <Card
                  variant="interactive"
                  className="flex flex-col justify-between h-full w-full group relative overflow-hidden"
                  onClick={() => navigate(`/jobs/${job.id}/candidates`)}
                >
                  {/* Top Ambient Highlight */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                  {/* Card Header & Title */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-base shadow-sm group-hover:border-indigo-400/60 transition-colors shrink-0">
                          {job.company ? job.company.charAt(0).toUpperCase() : <Building2 className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                            {job.title}
                          </h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 line-clamp-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{job.company}</span>
                          </p>
                        </div>
                      </div>

                      {/* Delete Quick Action */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmJob(job);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors focus:outline-none cursor-pointer"
                        title="Delete Requisition"
                        aria-label={`Delete ${job.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Metadata Badges (Location, Exp, Education) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="slate" size="sm" icon={<MapPin className="w-3 h-3 text-slate-400" />}>
                        {job.location || 'Remote'}
                      </Badge>

                      <Badge variant="indigo" size="sm" icon={<Clock className="w-3 h-3 text-indigo-400" />}>
                        {job.minimum_experience_years ? `${job.minimum_experience_years}+ Yrs Exp` : 'Any Exp'}
                      </Badge>

                      {job.education_requirement && (
                        <Badge variant="purple" size="sm" icon={<GraduationCap className="w-3 h-3 text-purple-400" />}>
                          {job.education_requirement}
                        </Badge>
                      )}
                    </div>

                    {/* Description Excerpt */}
                    {job.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                    )}

                    {/* Required Skills Chips */}
                    {requiredSkillsList.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Required Skills ({requiredSkillsList.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {requiredSkillsList.slice(0, 4).map((skill, i) => (
                            <Badge key={i} variant="cyan" size="sm">
                              {skill}
                            </Badge>
                          ))}
                          {requiredSkillsList.length > 4 && (
                            <Badge variant="slate" size="sm">
                              +{requiredSkillsList.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Preferred Skills Chips */}
                    {preferredSkillsList.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Preferred Skills
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {preferredSkillsList.slice(0, 3).map((skill, i) => (
                            <Badge key={i} variant="purple" size="sm">
                              {skill}
                            </Badge>
                          ))}
                          {preferredSkillsList.length > 3 && (
                            <Badge variant="slate" size="sm">
                              +{preferredSkillsList.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer & CTA */}
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-medium text-slate-300">{candidatePoolSize}</span> Candidates
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/jobs/${job.id}/candidates`);
                      }}
                      className="text-xs group-hover:border-indigo-400 group-hover:bg-indigo-500/15"
                    >
                      Rank & Screen
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Create Job Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsCreateModalOpen(false);
            setFormState(initialFormState);
            setFormErrors({});
          }
        }}
        title="Create Job Requisition"
        subtitle="Define requirements, experience levels, and skill tags for AI candidate screening"
        size="2xl"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={isSubmitting}
              onClick={() => {
                setIsCreateModalOpen(false);
                setFormState(initialFormState);
                setFormErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={handleCreateJob}
            >
              Create Requisition
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <Input
              label="Job Title *"
              placeholder="e.g. Senior Frontend Architect"
              value={formState.title}
              onChange={(e) => {
                setFormState({ ...formState, title: e.target.value });
                if (formErrors.title) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.title;
                    return next;
                  });
                }
              }}
              error={formErrors.title}
              disabled={isSubmitting}
            />

            {/* Company */}
            <Input
              label="Company Name *"
              placeholder="e.g. ResumeIQ Technologies"
              value={formState.company}
              onChange={(e) => {
                setFormState({ ...formState, company: e.target.value });
                if (formErrors.company) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.company;
                    return next;
                  });
                }
              }}
              error={formErrors.company}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Location */}
            <Input
              label="Location"
              placeholder="e.g. San Francisco, CA / Remote"
              value={formState.location}
              onChange={(e) => setFormState({ ...formState, location: e.target.value })}
              leftIcon={<MapPin className="w-4 h-4" />}
              disabled={isSubmitting}
            />

            {/* Minimum Experience */}
            <Input
              label="Min Experience (Years)"
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 4"
              value={formState.minimumExperienceYears}
              onChange={(e) => {
                setFormState({ ...formState, minimumExperienceYears: e.target.value });
                if (formErrors.minimumExperienceYears) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.minimumExperienceYears;
                    return next;
                  });
                }
              }}
              error={formErrors.minimumExperienceYears}
              leftIcon={<Clock className="w-4 h-4" />}
              disabled={isSubmitting}
            />

            {/* Education */}
            <Input
              label="Education Requirement"
              placeholder="e.g. B.S. in Computer Science"
              value={formState.educationRequirement}
              onChange={(e) => setFormState({ ...formState, educationRequirement: e.target.value })}
              leftIcon={<GraduationCap className="w-4 h-4" />}
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <Textarea
            label="Job Description & Responsibilities"
            placeholder="Describe role objectives, team scope, and primary deliverables..."
            rows={3}
            value={formState.description}
            onChange={(e) => setFormState({ ...formState, description: e.target.value })}
            disabled={isSubmitting}
          />

          {/* Dynamic Required Skills Tag Input */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Required Technical Skills (45% Match Weight)
              </label>
              <span className="text-[11px] text-slate-500">Press Enter or comma to add tag</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Type skill (e.g. React, TypeScript, GraphQL) and hit Enter..."
                  value={reqSkillInput}
                  onChange={(e) => setReqSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddRequiredSkill(reqSkillInput);
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 backdrop-blur-md"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAddRequiredSkill(reqSkillInput)}
                disabled={!reqSkillInput.trim() || isSubmitting}
              >
                Add
              </Button>
            </div>

            {/* Rendered Required Skill Badges */}
            <div className="flex flex-wrap gap-2 min-h-[32px] p-2.5 rounded-xl bg-slate-900/50 border border-white/5 items-center">
              {formState.requiredSkills.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No required skills added yet</span>
              ) : (
                formState.requiredSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="indigo"
                    size="md"
                    onRemove={isSubmitting ? undefined : () => handleRemoveRequiredSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Dynamic Preferred Skills Tag Input */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Preferred / Nice-to-Have Skills
              </label>
              <span className="text-[11px] text-slate-500">Press Enter or comma to add tag</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Type bonus skill (e.g. AWS, Docker, Next.js) and hit Enter..."
                  value={prefSkillInput}
                  onChange={(e) => setPrefSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddPreferredSkill(prefSkillInput);
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 backdrop-blur-md"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAddPreferredSkill(prefSkillInput)}
                disabled={!prefSkillInput.trim() || isSubmitting}
              >
                Add
              </Button>
            </div>

            {/* Rendered Preferred Skill Badges */}
            <div className="flex flex-wrap gap-2 min-h-[32px] p-2.5 rounded-xl bg-slate-900/50 border border-white/5 items-center">
              {formState.preferredSkills.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No preferred skills added yet</span>
              ) : (
                formState.preferredSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="purple"
                    size="md"
                    onRemove={isSubmitting ? undefined : () => handleRemovePreferredSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog Modal */}
      <Modal
        isOpen={deleteConfirmJob !== null}
        onClose={() => {
          if (!isDeleting) setDeleteConfirmJob(null);
        }}
        title="Delete Job Requisition"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              size="md"
              disabled={isDeleting}
              onClick={() => setDeleteConfirmJob(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={isDeleting}
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={handleDeleteJob}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-200">
              Are you sure you want to delete the requisition for{' '}
              <strong className="text-slate-100 font-semibold">{deleteConfirmJob?.title}</strong> at{' '}
              <strong className="text-slate-100 font-semibold">{deleteConfirmJob?.company}</strong>?
            </p>
            <p className="text-xs text-slate-400">
              This will remove the job criteria and candidate screening rankings associated with this requisition.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

