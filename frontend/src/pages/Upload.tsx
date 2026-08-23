import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers,
  Zap,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ResumeService } from '../services/api';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

const UPLOAD_STAGES = [
  { step: 1, title: 'Document Ingestion', desc: 'Validating file integrity & signature', icon: Layers },
  { step: 2, title: 'OCR & Text Extraction', desc: 'Parsing layout structure and raw text', icon: FileText },
  { step: 3, title: 'NLP Entity Recognition', desc: 'Extracting skills, roles, and dates', icon: Cpu },
  { step: 4, title: 'Competency Vectorization', desc: 'Generating AI matching embeddings', icon: Sparkles },
];

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedCandidateId, setUploadedCandidateId] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const validateFile = (file: File): { valid: boolean; error: string | null } => {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }
    if (file.size <= 0) {
      return { valid: false, error: 'File is empty (0 bytes)' };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
      };
    }
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported file format '${ext}'. Please upload .PDF or .DOCX files only.`,
      };
    }
    return { valid: true, error: null };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const { valid, error } = validateFile(file);
    if (!valid) {
      setValidationError(error);
      toast.error(error || 'Invalid file');
      return;
    }
    setValidationError(null);
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startUploadPipeline = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(15);
    setCurrentStage(1);

    // Progress stage simulation aligned with actual async API request
    const stepInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 88) {
          return 88;
        }
        const next = prev + 12;
        if (next >= 75) setCurrentStage(4);
        else if (next >= 50) setCurrentStage(3);
        else if (next >= 25) setCurrentStage(2);
        return next;
      });
    }, 400);

    try {
      const response = await ResumeService.uploadResume(selectedFile);
      clearInterval(stepInterval);
      setCurrentStage(4);
      setUploadProgress(100);
      
      const candidateId = response.data?.candidate_id;
      setUploadedCandidateId(candidateId);
      toast.success('Resume parsed and vectorized successfully!');
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsUploading(false);
      setUploadProgress(0);
      const msg = err.response?.data?.detail || 'Failed to parse resume. Please verify backend service.';
      toast.error(msg);
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setCurrentStage(1);
    setUploadedCandidateId(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* 1. Header with Quantum Glass Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
          <span>Neural Resume Ingestion Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Upload & Screen Resumes
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Drop a PDF or Word document to instantly extract contact details, work experience, education,
          and vectorize candidate competencies.
        </p>

        <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
          <Badge variant="indigo" size="sm">
            PDF & DOCX
          </Badge>
          <Badge variant="cyan" size="sm">
            Max 10MB
          </Badge>
          <Badge variant="emerald" size="sm">
            OCR & NLP Extraction
          </Badge>
        </div>
      </motion.div>

      {/* 2. Main Upload Surface */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-2xl">
          {/* Ambient Glow mesh inside card */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx"
            onChange={handleChange}
          />

          <AnimatePresence mode="wait">
            {/* STATE A: POST-UPLOAD SUCCESS STATE */}
            {uploadedCandidateId !== null ? (
              <motion.div
                key="uploaded-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-6 sm:py-8 space-y-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-glow-emerald">
                  <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Resume Parsed Successfully!
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    The document was fully ingested, extracted into structured profile records, and vectorized for
                    matching.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-800/80 border border-white/10 text-xs font-semibold text-indigo-300">
                      Candidate Record ID: #{uploadedCandidateId}
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <Button
                    variant="emerald"
                    size="lg"
                    rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
                    onClick={() => navigate(`/candidates/${uploadedCandidateId}`)}
                    className="min-h-[44px] w-full sm:w-auto shadow-glow-emerald font-semibold"
                  >
                    View Candidate Profile
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    leftIcon={<RefreshCw className="w-4 h-4" aria-hidden="true" />}
                    onClick={resetAll}
                    className="min-h-[44px] w-full sm:w-auto font-medium"
                  >
                    Upload Another Resume
                  </Button>
                </div>
              </motion.div>
            ) : isUploading ? (
              /* STATE B: 4-STAGE ANIMATED NLP STEPPER */
              <motion.div
                key="uploading-stepper"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="py-4 space-y-8"
              >
                {/* Progress Bar & Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" aria-hidden="true" />
                        AI Extraction in Progress...
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Processing: <span className="font-semibold text-slate-200">{selectedFile?.name}</span>
                      </p>
                    </div>
                    <span className="text-xl font-extrabold text-indigo-400">
                      {uploadProgress}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
                      initial={{ width: '0%' }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: 'easeOut', duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* 4-Stage Vertical Stepper */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {UPLOAD_STAGES.map((stage) => {
                    const isCompleted = currentStage > stage.step || uploadProgress === 100;
                    const isActive = currentStage === stage.step && uploadProgress < 100;
                    const StageIcon = stage.icon;

                    return (
                      <div
                        key={stage.step}
                        className={`p-4 rounded-xl border transition-all duration-300 backdrop-blur-md flex items-start gap-3.5 ${
                          isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : isActive
                            ? 'bg-indigo-500/15 border-indigo-500/50 shadow-glow-indigo'
                            : 'bg-slate-800/30 border-white/5 opacity-60'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                            isCompleted
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                              : isActive
                              ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 animate-pulse'
                              : 'bg-slate-800 border-white/10 text-slate-500'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                          ) : (
                            <StageIcon className="w-4 h-4" aria-hidden="true" />
                          )}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Stage {stage.step}
                            </span>
                            {isActive && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                              </span>
                            )}
                          </div>
                          <p
                            className={`font-semibold text-sm ${
                              isCompleted ? 'text-emerald-300' : isActive ? 'text-white' : 'text-slate-400'
                            }`}
                          >
                            {stage.title}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{stage.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : selectedFile ? (
              /* STATE C: PRE-UPLOAD FILE SUMMARY & CONFIRMATION */
              <motion.div
                key="file-summary"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div className="p-5 rounded-2xl bg-slate-800/60 border border-white/15 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-base truncate">{selectedFile.name}</p>
                        <Badge variant="indigo" size="sm">
                          {selectedFile.name.split('.').pop()?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>{formatBytes(selectedFile.size)}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Ready for Parsing
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="self-end sm:self-center p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition-colors focus:outline-none cursor-pointer"
                    aria-label="Remove selected file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {validationError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto text-slate-300"
                  >
                    Change File
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<Sparkles className="w-4 h-4" aria-hidden="true" />}
                    onClick={startUploadPipeline}
                    className="w-full sm:w-auto min-h-[44px] shadow-glow-indigo font-bold"
                  >
                    Start AI Extraction
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* STATE D: FROSTED DROPZONE */
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-indigo-400 bg-indigo-500/15 scale-[1.01] shadow-glow-indigo'
                    : 'border-white/15 hover:border-indigo-500/50 hover:bg-slate-800/40'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
                  <div
                    className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
                      dragActive
                        ? 'bg-indigo-500/30 border-indigo-400 text-white scale-110 shadow-glow-indigo'
                        : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400'
                    }`}
                  >
                    <UploadCloud className="w-8 h-8" aria-hidden="true" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-lg sm:text-xl font-bold text-white">
                      Drag and drop candidate resume here
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400">
                      or click the button below to browse from your computer
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 min-h-[44px] px-8 shadow-glow-indigo font-semibold"
                  >
                    Browse Files
                  </Button>

                  <p className="text-[11px] text-slate-500 pt-2">
                    Accepted file formats: <span className="text-slate-300 font-semibold">.PDF, .DOCX</span> (Maximum size 10MB)
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* 3. Feature Highlights & Architecture Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
        <Card className="p-5 space-y-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit">
            <FileText className="w-4 h-4" aria-hidden="true" />
          </div>
          <h3 className="font-semibold text-sm text-white">OCR Layout Parsing</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Multi-column layout analysis and PDF/DOCX tokenization preserving experience hierarchies.
          </p>
        </Card>

        <Card className="p-5 space-y-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit">
            <Cpu className="w-4 h-4" aria-hidden="true" />
          </div>
          <h3 className="font-semibold text-sm text-white">NLP Entity Detection</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Extracts 200+ technical competencies, job titles, start/end dates, and educational degrees.
          </p>
        </Card>

        <Card className="p-5 space-y-2.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 w-fit">
            <Zap className="w-4 h-4" aria-hidden="true" />
          </div>
          <h3 className="font-semibold text-sm text-white">Instant Vector Scoring</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Calculates weighted multi-dimensional match scores against all active job requisitions.
          </p>
        </Card>
      </div>
    </div>
  );
}
