# Project: ResumeIQ Light/Dark Mode Theming Refactor

## Architecture
- **Theme State Management**: React Context (`ThemeContext.tsx`, `ThemeProvider`, `useTheme`) managing `'light' | 'dark'` mode, persisted in `localStorage` (`resumeiq-theme`), defaulting to `window.matchMedia('(prefers-color-scheme: dark)')`.
- **CSS Engine**: Tailwind CSS v4 with custom variant `@custom-variant dark (&:where(.dark, .dark *));` in `src/index.css`.
- **Global Theme Tokens**: CSS variables and dual-mode `.glass-card`, `.glass-card-interactive`, `.glass-card-elevated`, and `.ambient-glow-mesh` in `src/index.css`.
- **UI & Layout Shell**: Dual-mode Tailwind classes (`dark:`) across `LayoutShell`, `Sidebar`, `Topbar`, `MobileNav`, `AmbientGlow`, and all `src/components/ui/` primitives (`Badge`, `Button`, `Card`, `Input`, `Modal`, `Skeleton`, `Tabs`).
- **Feature Views & Charts**: Dual-mode styling across `Dashboard`, `Candidates`, `CandidateProfile`, `Jobs`, `JobCandidates`, `Upload`, `CandidateComparisonModal`, and `ResumePreviewDrawer`. Theme-aware SVG/Recharts styling.
- **Profile Toggle Integration (R3)**: Explicit Sun/Moon toggle button placed in the top right corner of the `CandidateProfile` header action bar adjacent to the Refresh and Delete Profile buttons.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Theme Context & Provider | React Context, localStorage persistence, system preference detection, `useTheme()` hook, DOM root `.dark` class synchronization | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Tailwind v4 Dark Variant | Declare `@custom-variant dark (&:where(.dark, .dark *));` in `src/index.css` | M1 | Explorer 1, 2 Survey |
| 3 | Global CSS Dual Theming | Refactor `src/index.css` base variables, scrollbars, selection, `.glass-card`, `.ambient-glow-mesh` for light/dark duality | M1 | ORIGINAL_REQUEST §R2 |
| 4 | Layout Shell & Navigation | Refactor `LayoutShell`, `Sidebar`, `Topbar`, `MobileNav`, `AmbientGlow`, and `Toaster` with responsive `dark:` variants | M2 | Explorer 2 Survey |
| 5 | Shared UI Primitives | Refactor `Badge`, `Button`, `Card`, `Input`, `Modal`, `Skeleton`, `Tabs` with light/dark contrast | M2 | Explorer 2 Survey |
| 6 | Dashboard & Recharts | Refactor `Dashboard.tsx` cards, tables, and dynamically theme Recharts (BarChart, AreaChart, PieChart, Tooltip) | M3 | ORIGINAL_REQUEST §R2 |
| 7 | Candidates & Jobs Views | Refactor `Candidates.tsx`, `Jobs.tsx`, `JobCandidates.tsx`, `Upload.tsx`, `CandidateComparisonModal`, `ResumePreviewDrawer` | M3 | ORIGINAL_REQUEST §R2 |
| 8 | Candidate Profile Toggle | Add Sun/Moon theme toggle button in `CandidateProfile.tsx` header action bar next to Refresh and Delete Profile buttons | M4 | ORIGINAL_REQUEST §R3 |
| 9 | Candidate Profile Theming | Refactor `CandidateProfile.tsx` (RadarChart, tabs, cards, skills chips, work history) for light/dark duality | M4 | ORIGINAL_REQUEST §R2 |
| 10| Full Verification & Audit | `npm run build` exit code 0, `npm test` 100% pass, Reviewer approval, Challenger stress tests, Forensic Auditor integrity check | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Theme Context & Global CSS | `ThemeContext.tsx`, `src/index.css`, `@custom-variant dark`, glassmorphism & mesh duality, `App.tsx` Provider wrapping | none | IN_PROGRESS |
| 2 | M2: Layout Shell & UI Primitives | `LayoutShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`, `MobileNav.tsx`, `AmbientGlow.tsx`, `src/components/ui/` primitives | M1 | PLANNED |
| 3 | M3: Core Feature Pages & Charts | `Dashboard.tsx` + Recharts, `Candidates.tsx`, `Jobs.tsx`, `JobCandidates.tsx`, `Upload.tsx`, `CandidateComparisonModal.tsx`, `ResumePreviewDrawer.tsx` | M1, M2 | PLANNED |
| 4 | M4: Candidate Profile & Toggle Integration | `CandidateProfile.tsx` header toggle button (Sun/Moon next to Refresh & Delete), profile tabs, RadarChart & score breakdowns | M1, M2 | PLANNED |
| 5 | M5: Verification, Testing & Forensic Audit | `npm run build`, `npm test`, Reviewers, Challengers, Forensic Auditor gate verification | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### ThemeContext ↔ All Components
- Hook: `useTheme(): { theme: 'light' | 'dark'; setTheme: (theme: 'light' | 'dark') => void; toggleTheme: () => void; }`
- DOM Contract: Root `<html>` element has class `dark` if and only if `theme === 'dark'`.
- Storage Contract: `localStorage.getItem('resumeiq-theme')` holds `'light'` or `'dark'`.
- Recharts Contract: Chart helper `getChartTheme(theme: 'light' | 'dark')` returns contrast-compliant stroke, grid, axis tick, and tooltip colors.

## Code Layout
- `frontend/src/context/ThemeContext.tsx`: Theme Provider, Context, and hook.
- `frontend/src/index.css`: Tailwind imports, `@custom-variant dark`, glassmorphism and ambient mesh styles.
- `frontend/src/App.tsx`: Root wrapper with `ThemeProvider` and dynamic `Toaster`.
- `frontend/src/components/layout/`: `LayoutShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`, `MobileNav.tsx`, `AmbientGlow.tsx`.
- `frontend/src/components/ui/`: `Badge.tsx`, `Button.tsx`, `Card.tsx`, `Input.tsx`, `Modal.tsx`, `Skeleton.tsx`, `Tabs.tsx`.
- `frontend/src/components/candidates/`: `CandidateComparisonModal.tsx`, `ResumePreviewDrawer.tsx`.
- `frontend/src/pages/`: `Dashboard.tsx`, `Candidates.tsx`, `Jobs.tsx`, `JobCandidates.tsx`, `Upload.tsx`, `CandidateProfile.tsx`.
- `frontend/src/utils/chartTheme.ts`: Helper utility for Recharts dark/light stroke and fill colors.
