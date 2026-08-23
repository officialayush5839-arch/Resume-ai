# E2E Test Infra: ResumeIQ Frontend Redesign

## Test Philosophy
- Requirement-driven, opaque-box testing based on `ORIGINAL_REQUEST.md`.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial + Real-World Workload Scenarios.

## Feature Inventory
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|----------------------|:------:|:------:|:------:|
| 1 | Quantum Glass Design System & Theme | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | Component Primitives & Micro-Interactions | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 3 | Responsive Layout Shell & Navigation | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | Dashboard KPI Cards & Recharts | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 5 | 4-Stage Animated Resume Upload | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 6 | Candidates Directory & Search/Filter | ORIGINAL_REQUEST §R1, §R4 | 5 | 5 | ✓ |
| 7 | Candidate Profile & Competency Radar | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 8 | Jobs Requisition & Create Job Modal | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 9 | Job Candidate Match & Score Breakdown | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 10 | Candidate Comparison Matrix (Feature A) | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 11 | Resume Live Preview Drawer (Feature B) | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Vitest / Node test runner or verification script executing in `frontend` directory.
- Verification checks: TypeScript compiler (`tsc -b`), production build (`vite build`), component integration, scoring engine math verification, route coverage, responsive viewport rendering.
- Directory layout: `frontend/src/__tests__/` or `frontend/tests/`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Candidate Upload-to-Profile Journey | F3, F5, F7, F11 | High |
| 2 | Job Creation & Automated Candidate Ranking | F8, F9, F4 | High |
| 3 | Multi-Candidate Screening & Matrix Comparison | F6, F9, F10 | High |
| 4 | Filtered Talent Search by Experience & Skills | F6, F7, F11 | Medium |
| 5 | Executive Dashboard Analytics & Navigation | F3, F4, F1, F2 | Medium |

## Coverage Thresholds
- Tier 1 (Feature Coverage): ≥55 test cases (≥5 per feature)
- Tier 2 (Boundary & Corner Cases): ≥55 test cases
- Tier 3 (Cross-Feature Combinations): ≥15 interaction tests
- Tier 4 (Real-World Workloads): ≥5 end-to-end user journeys
