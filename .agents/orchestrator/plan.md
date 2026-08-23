# Project Orchestration Plan: ResumeIQ Frontend Redesign

## Objective
Orchestrate the comprehensive, competition-grade redesign of the ResumeIQ frontend (React 19 + TypeScript + Vite + Tailwind CSS 4 + Framer Motion + Recharts) according to the specifications in `ORIGINAL_REQUEST.md`.

## Execution Phases

### Phase 0: Survey & Scoping (Top-Level Survey)
- Dispatch 3 parallel Explorers:
  1. `explorer_design_system`: Survey current design system, Tailwind setup, theme variables, glassmorphism patterns, typography, and proposed color palette / UI tokens.
  2. `explorer_components_pages`: Survey all 6 pages (Dashboard, Upload, Candidates, Candidate Profile, Jobs, Job Candidates) + shared components + layout, identifying required transformations, data flow, and chart integration points.
  3. `spec_miner_api_features`: Survey API integration contracts in `services/api.ts`, backend endpoints, candidate/job data schemas, and specifications for 1-2 high-impact new features (e.g. Candidate Comparison, Search/Filter, Resume Preview).
- Aggregate findings and compile `PROJECT.md` with full Architecture, Feature Inventory, Milestones, and Interface Contracts.

### Phase 1: Milestone Decomposition & Track Spawning
- **Implementation Track**:
  - Milestone 1: Design System, Theme Foundations, Glassmorphism, Layout (Sidebar, Topbar, Shell, Navigation, Notifications) & Global Micro-Interactions.
  - Milestone 2: Dashboard & Upload Overhaul (Interactive Charts, Animated Drag-and-Drop Experience, Micro-Interactions).
  - Milestone 3: Candidates & Candidate Profile (Card Grid, Search/Filter, Skill Radar/Spider Charts, Experience/Education Visualizations, Profile Actions).
  - Milestone 4: Jobs & Job Matching (Job Cards, Creation Modal, Visual Score Gauges/Breakdown, Candidate Match Ranking).
  - Milestone 5: High-Impact New Features (Candidate Comparison View, Resume Preview / Viewer Modal, Advanced Filtering).
- **E2E Testing Track**:
  - Spawn E2E Test Writer / Orchestrator to build comprehensive 4-tier test suite (Feature Coverage, Boundaries, Combinations, Real-world Scenarios) publishing `TEST_INFRA.md` and `TEST_READY.md`.
- **Final Milestone**:
  - Phase 1: Pass 100% of E2E Test Suite (`npm run build` code 0, all tier tests passing).
  - Phase 2: Adversarial Coverage Hardening (Tier 5 Challenger loop).

### Phase 2: Execution & Quality Gating
- For each milestone: Explorer recommendations -> Worker implementation -> Reviewers (2) -> Challengers (2) -> Forensic Auditor -> Gate Verdict.
- Strict gating: Zero tolerance for integrity violations, 100% build and review approval.
