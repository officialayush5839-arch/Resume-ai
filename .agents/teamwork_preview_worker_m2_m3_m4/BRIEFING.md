# BRIEFING — 2026-08-23T13:20:00Z

## Mission
Implement Milestones 2, 3, and 4 for the ResumeIQ Light/Dark mode theming refactor, ensuring full dual-theme support across Layout Shell, UI Primitives, Feature Views & Recharts, and Candidate Profile with the header toggle button.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\ARYAN - AYUSH\OneDrive\Desktop\resume parser\.agents\teamwork_preview_worker_m2_m3_m4
- Original parent: 5f1083da-41bf-4aef-bc2a-b7d87231543c
- Milestone: Milestones 2, 3, 4

## 🔒 Key Constraints
- Follow minimal-change principle.
- Maintain genuine logic without cheating or hardcoded test facades.
- All existing tests (289+) must pass.
- Build must pass (`npm run build` exits 0).
- Preserve dark styling while providing crisp, accessible light styling (WCAG AA).
- Put Light/Dark toggle in `CandidateProfile.tsx` header next to Refresh and Delete Profile buttons.

## Current Parent
- Conversation ID: 5f1083da-41bf-4aef-bc2a-b7d87231543c
- Updated: 2026-08-23T13:20:00Z

## Task Summary
- **What to build**:
  - Milestone 2: Layout Shell & Shared UI Primitives (`LayoutShell`, `Sidebar`, `Topbar`, `MobileNav`, `AmbientGlow`, `Badge`, `Button`, `Card`, `Input`, `Modal`, `Skeleton`, `Tabs`).
  - Milestone 3: Core Feature Pages, Modals & Recharts (`Dashboard`, `Candidates`, `Jobs`, `JobCandidates`, `Upload`, `CandidateComparisonModal`, `ResumePreviewDrawer`).
  - Milestone 4: Candidate Profile & Toggle Integration (`CandidateProfile.tsx` header toggle with Sun/Moon, RadarChart theming, full dual-theme refactor).
- **Success criteria**:
  - 100% tests pass.
  - `npm run build` exits with code 0.
  - Full dual-theme capability verified.
- **Interface contracts**: PROJECT.md § Interface Contracts
- **Code layout**: PROJECT.md § Code Layout

## Key Decisions Made
- Use Tailwind responsive classes with `dark:` prefix: `bg-slate-50 dark:bg-[#0A0E1A]`, `text-slate-900 dark:text-slate-100`, `border-slate-200 dark:border-white/10`, etc.
- In Recharts and SVG charts, use `useTheme()` and `getChartTheme()` from `src/utils/chartTheme.ts` to supply dynamic fill, stroke, and tooltip colors.
- In `CandidateProfile.tsx`, add the toggle button using `useTheme()`, `Sun`, and `Moon` icons from `lucide-react`.

## Change Tracker
- **Files modified**: None yet
- **Build status**: Ready to begin M2
- **Pending issues**: None

## Quality Status
- **Build/test result**: Passing (M1 state: 289 passed)
- **Lint status**: Clean
- **Tests added/modified**: Pending M2/M3/M4 implementation & verification tests

## Loaded Skills
- **Source**: `c:\Users\ARYAN - AYUSH\OneDrive\Desktop\resume parser\.agents\skills\ui-styling\SKILL.md`
- **Core methodology**: Light/Dark mode styling, Tailwind utility-first patterns, accessible contrast, Radix UI / Shadcn token patterns.
- **Source**: `c:\Users\ARYAN - AYUSH\OneDrive\Desktop\resume parser\.agents\skills\ui-ux-pro-max\SKILL.md`
- **Core methodology**: UI/UX design intelligence, color palettes, chart theming, responsive layout.

## Artifact Index
- `.agents/teamwork_preview_worker_m2_m3_m4/DISPATCH.md` — Assignment instructions
- `.agents/teamwork_preview_worker_m2_m3_m4/BRIEFING.md` — Agent situational awareness
- `.agents/teamwork_preview_worker_m2_m3_m4/progress.md` — Progress heartbeat
- `.agents/teamwork_preview_worker_m2_m3_m4/handoff.md` — Final handoff report
