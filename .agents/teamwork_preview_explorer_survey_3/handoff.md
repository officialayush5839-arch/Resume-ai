# 5-Component Handoff Report — Explorer 3 (Survey Phase)

## 1. Observation
- **Codebase inspected**: `frontend/src/`
- **Candidate Profile Toggle Location (`CandidateProfile.tsx:277-296`)**:
  ```tsx
  <div className="flex items-center gap-3">
    <Button
      variant="secondary"
      size="sm"
      leftIcon={<RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
      onClick={fetchProfileData}
    >
      Refresh
    </Button>

    <Button
      variant="danger"
      size="sm"
      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
      onClick={() => setIsDeleteModalOpen(true)}
    >
      Delete Profile
    </Button>
  </div>
  ```
  The header controls bar contains the Refresh and Delete buttons exactly where Requirement R3 mandates adding the Light/Dark mode toggle with Sun/Moon icons.

- **Recharts Charts Instances**:
  - `src/pages/Dashboard.tsx`:
    - `BarChart` (lines 443–479): `CartesianGrid stroke="rgba(255,255,255,0.06)"`, `XAxis tick={{ fill: '#94A3B8' }}`, `YAxis tick={{ fill: '#CBD5E1' }}`.
    - `AreaChart` (lines 514–544): `CartesianGrid stroke="rgba(255,255,255,0.06)"`, `XAxis tick={{ fill: '#CBD5E1' }}`, `YAxis tick={{ fill: '#94A3B8' }}`.
    - `PieChart` (lines 584–612): `Cell stroke="rgba(15, 23, 42, 0.8)"`, Center label `text-white`.
    - `CustomChartTooltip` (lines 82–102): `border-white/10`, `text-slate-200`, `text-white`.
  - `src/pages/CandidateProfile.tsx`:
    - `RadarChart` (lines 485–524): `PolarGrid stroke="rgba(255, 255, 255, 0.12)"`, `PolarAngleAxis tick={{ fill: '#CBD5E1' }}`, `PolarRadiusAxis stroke="rgba(255, 255, 255, 0.08)"`, `Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#F8FAFC' }}`.
  - `src/components/candidates/CandidateComparisonModal.tsx`:
    - `RadarChart` (lines 605–652): Multi-candidate overlay with hardcoded dark polar grid and axes ticks.

- **Hardcoded Dark Theme Classes**:
  - `Dashboard.tsx`: 30+ instances of `text-white`, `text-slate-100`, `text-slate-400`, `bg-slate-800/40`, `border-white/5`, `border-white/10`.
  - `CandidateProfile.tsx`: 40+ instances including `bg-slate-900/80`, `bg-slate-900/50`, `bg-slate-800`, `text-slate-100`, `text-slate-300`, `border-white/5`, `border-white/10`.
  - `Candidates.tsx`: 50+ instances across search input, dropdowns, table headers, table rows, cards, and floating compare dock.
  - `Jobs.tsx`: 35+ instances across search, form inputs, dynamic skill tag boxes, and modal dialogs.
  - `JobCandidates.tsx`: 40+ instances across job banner, rank medals, scoring progress bars, and deep breakdown cards.
  - `Upload.tsx`: 25+ instances across dropzone, 4-stage stepper, and feature cards.
  - `src/components/ui/`: `Button`, `Card`, `Badge`, `Input`, `Modal`, `Skeleton`, `Tabs` all have hardcoded dark surface colors (`bg-slate-800`, `bg-slate-900`, `text-slate-100`, `border-white/10`).

## 2. Logic Chain
1. *Observation 1*: The application is currently written exclusively with dark-mode utility classes, lacking `dark:` variants across components.
2. *Observation 2*: Recharts uses inline SVG rendering which ignores CSS classes unless SVG presentation attributes (`stroke`, `fill`, `tick`) are passed dynamic color strings matching the active theme.
3. *Observation 3*: In light mode, hardcoded dark classes like `text-white` or light tick colors like `#CBD5E1` create contrast failures against light backgrounds (white text on white/slate-50 background).
4. *Observation 4*: Requirement R3 requires the theme toggle specifically in the Candidate Profile action bar next to the Refresh and Delete buttons.
5. *Logic Step*: By creating a typed `getChartTheme(theme)` utility, wrapping Recharts props dynamically with `useTheme()`, adding the toggle button to `CandidateProfile.tsx`'s action bar, and replacing hardcoded dark classes with `dark:` variants (e.g. `bg-white dark:bg-slate-900`, `text-slate-900 dark:text-white`, `border-slate-200 dark:border-white/10`), both light and dark modes will render flawlessly with zero contrast violations.

## 3. Caveats
- Backend API endpoints (`FastAPI`) and Python services were not investigated as theming is purely a frontend concern.
- The ThemeProvider context and global CSS (`index.css`) token architecture are surveyed in parallel by peer Explorers (Explorer 1 and Explorer 2), which provide the `useTheme()` hook and `@theme` CSS variable tokens.

## 4. Conclusion
The frontend views and components have been thoroughly cataloged. All chart instances, modals, lists, tables, cards, and forms have precise before/after styling mappings documented in `analysis.md`. The Candidate Profile action bar is ready for the Sun/Moon toggle integration. The team has all required specifications to implement the changes cleanly and pass all acceptance criteria.

## 5. Verification Method
1. **Source Inspection**: Inspect `analysis.md` in this directory for exact line numbers and component-by-component token tables.
2. **Build Verification**: Run `npm run build` in `frontend/` (`tsc -b && vite build`) to ensure all TypeScript types and imports compile cleanly.
3. **Interactive Verification**:
   - Navigate to `/candidates/:id` to confirm the Light/Dark mode toggle button appears in the top right next to Refresh and Delete buttons.
   - Click the toggle to switch themes and verify instant visual adaptation across Dashboard, Candidates, Jobs, Job Candidates, and Candidate Profile.
   - Verify Recharts charts in Dashboard, Candidate Profile, and Comparison Modal adapt their grid lines, axis text, pie strokes, and tooltips legibly in both themes.
