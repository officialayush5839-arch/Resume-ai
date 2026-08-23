# Project: ResumeIQ Frontend Redesign

## Architecture
ResumeIQ is an AI Resume Parser and Candidate Screening SaaS platform built with:
- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS 4 + custom CSS (`@theme` tokens, glassmorphism, obsidian canvas)
- **Animation & Physics**: Framer Motion (spring physics, layout animations, staggered entrances, page transitions)
- **Visualizations**: Recharts (Radar, Area, Bar, Donut/Pie charts)
- **Icons**: Lucide React + Custom SVG Brand Icons
- **HTTP Client**: Axios with complete TypeScript interfaces
- **Backend API**: FastAPI REST endpoints at `http://localhost:8000/api`

```
frontend/src/
├── types/
│   └── index.ts                 # Unified TypeScript schemas (Candidate, Job, Skill, Comparison, Filters)
├── services/
│   └── api.ts                   # Complete typed Axios client
├── utils/
│   ├── matching.ts              # Client-side matching calculation engine & filter algorithms
│   └── icons.tsx                # Brand SVG icons (Linkedin, Github, etc.)
├── components/
│   ├── ui/                      # Quantum Glass Primitives (Button, Card, Badge, Modal, Input, Tabs, Skeleton)
│   ├── layout/                  # Responsive Shell (Sidebar, Topbar, LayoutShell, MobileNav, AmbientGlow)
│   └── candidates/              # High-Impact Modals (CandidateComparisonModal, ResumePreviewDrawer)
├── pages/
│   ├── Dashboard.tsx            # KPI Cards + Recharts Bar, Area, Donut Visualizations
│   ├── Upload.tsx               # 4-Stage Animated NLP Stepper + Glass Dropzone
│   ├── Candidates.tsx           # Search, Multi-Facet Filters, Grid/Table Toggle, Selection
│   ├── CandidateProfile.tsx     # Recharts Competency Radar, Skill Bars, Connected Timeline
│   ├── Jobs.tsx                 # Job Requisitions + Interactive Create Job Modal
│   └── JobCandidates.tsx        # Visual Score Gauge, Score Breakdown, Match Analysis
└── App.tsx                      # SPA Routes + Framer Motion AnimatePresence Transitions
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Quantum Glass Design System & Tokens | Obsidian canvas, neural indigo/emerald tokens, `@theme`, glass elevations | M1 | Survey |
| 2 | Spring Physics & Component Primitives | Button, GlassCard, Badge, Modal, Input, Tabs, Skeleton with Framer Motion | M1 | Survey |
| 3 | Responsive Shell & Cockpit Navigation | Glass Sidebar with active layoutId, mobile drawer, Topbar with quick actions | M1 | Survey |
| 4 | Unified TypeScript Types & API Client | Types in `src/types/index.ts` and Axios services in `src/services/api.ts` | M1 | Survey |
| 5 | Client-Side Matching Calculation Engine | Resilient matching math (`matching.ts`) matching backend scoring formulas | M1 | Survey |
| 6 | Animated Page Transitions & Motion Shell | Smooth cross-fade and glide transitions on route changes | M1 | Survey |
| 7 | Dashboard KPI Metrics & Sparklines | 4 Glassmorphic KPI cards with animated counts and trend sparklines | M2 | Survey |
| 8 | Dashboard Dynamic Recharts Visualizations | Top Skills BarChart, Experience AreaChart, Candidate Pipeline Donut | M2 | Survey |
| 9 | Dashboard Activity & Quick Action Hub | Recent candidates spotlight, open jobs requisition summary, quick CTAs | M2 | Survey |
| 10 | 4-Stage Animated Resume Upload Pipeline | Real-time 4-step parsing stepper (Ingest, OCR, NLP Extract, Vectorize) | M2 | Survey |
| 11 | Frosted Dropzone & Pre/Post Upload Cards | Drag-and-drop zone, file inspection card, post-upload summary & CTA | M2 | Survey |
| 12 | Candidate Search & Multi-Facet Filter Bar | Full-text search, category pills, experience slider, sort selector | M3 | Survey |
| 13 | Candidates Grid vs Data Table View Mode | Toggle between interactive glass cards and dense data table | M3 | Survey |
| 14 | Candidate Competency Radar & Skill Bars | Recharts 5-axis Radar chart and interactive skill proficiency bars | M3 | Survey |
| 15 | Connected Experience & Education Timeline | Unbroken vertical timeline with pulsing node points and company cards | M3 | Survey |
| 16 | Candidate Profile Hero & External Links Fix | Header with copyable contacts, fixed Lucide brand SVG icons | M3 | Survey |
| 17 | Jobs Requisition Hub & Metrics Bar | Real API integration with `JobService`, job count and stats summary | M4 | Survey |
| 18 | Interactive Create Job Modal with Skill Tags | Form with validation and dynamic interactive skill tag input (Enter/X) | M4 | Survey |
| 19 | Job Candidate Match Visual Score Gauges | Circular radial score gauge with color tiers (Emerald, Indigo, Amber, Red) | M4 | Survey |
| 20 | Multi-Dimensional Score Breakdown | Skill %, Experience %, Education %, Keyword % comparison bars | M4 | Survey |
| 21 | Matching vs Missing Skill Highlights | Green checkmark badges for matched skills, alert pills for missing | M4 | Survey |
| 22 | Feature A: Candidate Comparison Matrix | Side-by-side comparison modal (2-4 candidates, Venn overlap, Radar overlay) | M5 | Survey |
| 23 | Feature B: Resume Live Preview Drawer | Slide-over document inspector (structured view, raw text search, highlights) | M5 | Survey |
| 24 | E2E Testing Suite (Tiers 1-4) | Comprehensive test harness covering all features, boundaries, combinations | E2E Track | Survey |
| 25 | Final Build & E2E Acceptance Verification | 100% E2E test pass + `npm run build` code 0 + Tier 5 Adversarial Hardening | M_FINAL | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Design System, UI Primitives & Shell Layout | Theme tokens, CSS vars, types, API client, matching utils, UI components, Layout shell | none | DONE |
| M2 | Dashboard & Upload Overhaul | Dashboard Recharts visualizations, KPI sparklines, 4-stage upload pipeline stepper | M1 | DONE |
| M3 | Candidates Directory & Profile Visualizations | Search/filters, grid/table views, Recharts Radar chart, connected timeline, profile | M1 | DONE |
| M4 | Jobs Requisitions & Match Screening | Jobs API integration, Create Job modal with tag inputs, visual score gauges, match breakdown | M1 | DONE |
| M5 | High-Impact New Features | Candidate Comparison Matrix modal, Resume Preview drawer, cross-page integrations | M1, M3, M4 | DONE |
| E2E | E2E Testing Track | Requirement-driven test suite (Tiers 1-4), test runner, `TEST_READY.md` publication | none | DONE |
| M_FINAL | Final Milestone | Pass 100% E2E tests, production build verification (`npm run build`), Tier 5 adversarial hardening | M1, M2, M3, M4, M5, E2E | DONE |

## Interface Contracts
### Types & API Contract (`src/types/index.ts` & `src/services/api.ts`)
- `Candidate`: `{ id, full_name, email, phone, location, linkedin_url, github_url, portfolio_url, summary, total_experience_months, skills: CandidateSkill[], experiences: Experience[], educations: Education[] }`
- `Job`: `{ id, title, company, description, required_skills, preferred_skills, minimum_experience_years, education_requirement, location }`
- `CandidateMatchResult`: `{ candidate: Candidate, match_score: number }`
- `DashboardStats`: `{ total_candidates: number, total_jobs: number, average_match_score: number }`
- `DetailedScoreBreakdown`: `{ overall_score, skill_score, experience_score, education_score, keyword_score, matching_skills, missing_skills, recommendation, strengths, weaknesses }`

### Matching Math Contract (`src/utils/matching.ts`)
- `calculateDetailedMatch(candidate: Candidate, job: Job): DetailedScoreBreakdown`
- `filterAndSortCandidates(candidates: Candidate[], criteria: CandidateFilterCriteria, jobContext?: Job): Candidate[]`

### Design System Contract (`src/index.css`)
- Colors: `canvas-bg (#0A0E1A)`, `surface-glass (rgba(15, 23, 42, 0.65))`, `surface-glass-elevated (rgba(30, 41, 59, 0.85))`, `brand-primary (#6366F1)`, `match-emerald (#10B981)`, `match-amber (#F59E0B)`, `match-rose (#F43F5E)`
- CSS classes: `.glass-card`, `.glass-card-interactive`, `.glass-card-elevated`, `.gradient-brand-text`, `.ambient-glow-mesh`

## Code Layout
- `frontend/src/types/index.ts` — Data models and contracts
- `frontend/src/services/api.ts` — Axios API endpoints
- `frontend/src/utils/matching.ts` — Client-side scoring and filtering engine
- `frontend/src/utils/icons.tsx` — Custom brand and helper icons
- `frontend/src/components/ui/` — Primitives (`Button.tsx`, `Card.tsx`, `Badge.tsx`, `Modal.tsx`, `Input.tsx`, `Tabs.tsx`, `Skeleton.tsx`)
- `frontend/src/components/layout/` — Layout (`Sidebar.tsx`, `Topbar.tsx`, `LayoutShell.tsx`, `MobileNav.tsx`, `AmbientGlow.tsx`)
- `frontend/src/components/candidates/` — (`CandidateComparisonModal.tsx`, `ResumePreviewDrawer.tsx`)
- `frontend/src/pages/` — (`Dashboard.tsx`, `Upload.tsx`, `Candidates.tsx`, `CandidateProfile.tsx`, `Jobs.tsx`, `JobCandidates.tsx`)
- `frontend/src/App.tsx` — Routing and motion wrapper
