# Comprehensive Frontend Views & Feature Components Survey Analysis
**Milestone**: Survey (Explorer 3 Deep Dive)  
**Target Codebase**: `frontend/src/`  
**Focus Areas**: Dashboard & Recharts, Candidates & Comparison, Jobs & Screening, Candidate Profile & Toggle Integration, Modals, Forms, and Theming Matrix.

---

## Executive Summary

The ResumeIQ frontend is a modern, rich React 19 + Tailwind CSS + Recharts + Framer Motion single-page application. The entire UI is currently hardcoded with dark-mode utility classes (e.g., `bg-slate-900`, `bg-slate-950`, `bg-slate-800`, `bg-[#0A0E1A]`, `text-slate-100`, `text-white`, `border-white/10`, `border-white/5`). 

All major views (Dashboard, Candidates, Candidate Profile, Jobs, Job Candidates, Upload) and supporting dialogs/drawers require systematic refactoring to support dynamic dual-theme switching (`light` and `dark`). Furthermore, Requirement **R3** mandates adding a dedicated Light/Dark mode toggle button directly into the **Candidate Profile action bar** (alongside the Refresh and Delete Profile buttons).

This report outlines all hardcoded classes per view, specifies exact code adaptations for Recharts data visualizations, details the exact implementation for the Candidate Profile header toggle, and provides a component-by-component theming blueprint.

---

## 1. Component & Page Inventory

| Component / Page Path | Key Responsibilities | Primary Visual Elements | Recharts Used? |
|---|---|---|---|
| `src/pages/Dashboard.tsx` | Telemetry KPIs, Activity Spotlight, Recharts distribution | 4 KPI Cards, Sparklines, Recent Candidates list, Spotlight Jobs list | **Yes** (BarChart, AreaChart, PieChart, Custom Tooltips) |
| `src/pages/CandidateProfile.tsx` | Individual candidate deep-dive, AI summary, contact pills, experience & education timeline | Hero Banner Card, Action Header (**R3 Toggle target**), Evaluator Card, Skill Proficiency Grid, Timeline Nodes, Delete Modal | **Yes** (5-Axis RadarChart, Tooltip) |
| `src/pages/Candidates.tsx` | Talent directory, multi-facet filtering, selection dock | KPI Stat Cards, Filter Toolbar, Category Pills, Grid / Table views, Inline Comparison & Preview Modals, Delete Modal | No (Calls modals with charts) |
| `src/components/candidates/CandidateComparisonModal.tsx` | Multi-candidate side-by-side comparison matrix | Radial score gauges, Candidate Header Cards, Venn skill overlap, Dimension breakdown table | **Yes** (Multi-RadarChart Overlay) |
| `src/components/candidates/ResumePreviewDrawer.tsx` | Slide-over drawer with raw resume text, keyword match & insights | Drawer Panel, Mini Radial Gauges, Tab Switcher, Line-numbered raw text viewer, AI insights | No (SVG Radial Gauge) |
| `src/pages/Jobs.tsx` | Job requisition management & creation | KPI Stat Cards, Search & Location filters, Job Cards, Create Job Modal with dynamic skill tags, Delete Modal | No |
| `src/pages/JobCandidates.tsx` | Requisition-specific candidate scoring & ranking pipeline | Job Header Banner, Filter Toolbar, Ranked Candidate Cards, Animated Radial Gauges, Multi-factor score bars, Collapsible deep breakdown | No (SVG Radial Gauge) |
| `src/pages/Upload.tsx` | Resume ingestion & parser stepper | Frosted Dropzone, 4-Stage Animated NLP Stepper, Success Card, Feature Highlights | No |
| `src/components/ui/` (`Badge`, `Button`, `Card`, `Input`, `Modal`, `Skeleton`, `Tabs`) | Base design system primitives | Glass cards, buttons, modals, badges, inputs, skeletons | No |

---

## 2. Deep Dive: Dashboard View (`Dashboard.tsx`) & Recharts Adaptation

### 2.1 Hardcoded Dark Styling Observations
In `src/pages/Dashboard.tsx`:
1. **Headers & Text**:
   - `text-white` on line 298 (`Executive Dashboard`), line 388 (KPI values), line 616 (Donut center metric) → In light mode, renders illegible white text against light background. Needs `text-slate-900 dark:text-white`.
   - `text-slate-400` on lines 309, 371, 400, 619 → In light mode, needs `text-slate-600 dark:text-slate-400` or `text-slate-500 dark:text-slate-400`.
   - `text-slate-100` on lines 753, 850 (candidate & job titles) → Needs `text-slate-900 dark:text-slate-100`.
2. **List Items & Secondary Surfaces**:
   - Lines 636–638 (Donut legend cards): `bg-slate-800/90 border-white/25` / `bg-slate-800/40 border-white/5` → Needs `bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-white/25` and `bg-slate-100/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-white/5`.
   - Line 653: `bg-slate-700/50` (metric progress track) → Needs `bg-slate-200 dark:bg-slate-700/50`.
   - Lines 737, 844 (Recent candidate & job cards): `border border-white/5 bg-slate-800/40 hover:bg-slate-800/80` → Needs `border border-slate-200/80 dark:border-white/5 bg-slate-100/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80`.
   - Line 740: `bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-300` → In light mode, text needs `text-indigo-600 dark:text-indigo-300`.

### 2.2 Recharts Visualizations & Theming Strategy
`Dashboard.tsx` contains three Recharts components plus custom chart tooltips:

#### A. Custom Tooltip (`CustomChartTooltip` - lines 82–102)
```tsx
// Current (Hardcoded Dark)
function CustomChartTooltip({ active, payload, label, unit = '' }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card-elevated px-3 py-2 text-xs shadow-xl border border-white/10 backdrop-blur-xl">
        <p className="font-semibold text-slate-200 mb-1">{label || payload[0].name}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].fill || '#6366F1' }} />
          <span className="text-slate-400">{payload[0].name || 'Value'}:</span>
          <span className="font-bold text-white">{payload[0].value}{unit}</span>
        </div>
      </div>
    );
  }
  return null;
}
```
**Required Adaptations**:
- Container: `glass-card-elevated px-3 py-2 text-xs shadow-xl border border-slate-200 dark:border-white/10 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95`
- Label: `font-semibold text-slate-800 dark:text-slate-200 mb-1`
- Property Name: `text-slate-500 dark:text-slate-400`
- Value Text: `font-bold text-slate-900 dark:text-white`

#### B. BarChart: Top Skills in Talent Pool (lines 443–479)
- `CartesianGrid`: `stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
- `XAxis`:
  - `tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}`
  - `axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}`
- `YAxis`:
  - `tick={{ fill: isDark ? '#CBD5E1' : '#334155', fontSize: 12, fontWeight: 500 }}`
  - `axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}`
- `Bar`: Gradient `url(#skillBarGrad)` remains vibrant in both modes.

#### C. AreaChart: Experience vs Match Score (lines 514–544)
- `CartesianGrid`: `stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
- `XAxis`: `tick={{ fill: isDark ? '#CBD5E1' : '#475569', fontSize: 12 }}`
- `YAxis`: `tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}`
- `Area`: Fill gradient `url(#expAreaGrad)` and stroke `#10B981` adapt well with emerald glow.

#### D. PieChart: Match Tier Funnel Donut (lines 584–612)
- `Cell`: `stroke={isDark ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF'}`
- Center text:
  - Number: `text-slate-900 dark:text-white`
  - Label: `text-slate-500 dark:text-slate-400`

---

## 3. Deep Dive: Candidate Profile View (`CandidateProfile.tsx`) & R3 Toggle

### 3.1 Requirement R3 Specification & Header Action Bar
Requirement R3 states:
> *"Add the Light/Dark mode toggle button explicitly in the top right corner of the **Candidate Profile** section (next to the Refresh and Delete Profile buttons). The toggle should use an icon (Sun for Light, Moon for Dark) and immediately switch the app's global theme when clicked."*

#### Current Action Bar in `CandidateProfile.tsx` (lines 267–296):
```tsx
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/candidates')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-indigo-300 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Candidates Directory</span>
        </button>

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
      </div>
```

#### Proposed Toggle Integration for `CandidateProfile.tsx`:
1. **Hook Import**:
   ```tsx
   import { useTheme } from '../context/ThemeContext'; // or similar theme provider
   import { Sun, Moon } from 'lucide-react';
   ```
2. **Component Integration**:
   ```tsx
   export default function CandidateProfile() {
     const { theme, toggleTheme } = useTheme();
     // ...
     return (
       // ...
       <div className="flex items-center gap-3">
         {/* Light/Dark Mode Toggle Button (Requirement R3) */}
         <Button
           variant="secondary"
           size="sm"
           leftIcon={
             theme === 'dark' ? (
               <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
             ) : (
               <Moon className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
             )
           }
           onClick={toggleTheme}
           aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
           title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
           className="border-slate-200 dark:border-white/10"
         >
           {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
         </Button>

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
     );
   }
   ```

### 3.2 Candidate Profile Recharts RadarChart Adaptation (lines 485–524)
- `PolarGrid`: `stroke={isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'}`
- `PolarAngleAxis`:
  - `stroke={isDark ? '#94A3B8' : '#64748B'}`
  - `tick={{ fill: isDark ? '#CBD5E1' : '#334155', fontSize: 11, fontWeight: 500 }}`
- `PolarRadiusAxis`:
  - `stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`
  - `tick={{ fill: isDark ? '#64748B' : '#94A3B8', fontSize: 9 }}`
- `Tooltip contentStyle`:
  - `backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'`
  - `borderColor: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)'`
  - `color: isDark ? '#F8FAFC' : '#0F172A'`

### 3.3 Candidate Profile Hardcoded Classes to Refactor
- Hero Banner avatar status dot container: `bg-slate-900` (line 311) → `bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10`
- Candidate name: `text-slate-100` (line 319) → `text-slate-900 dark:text-slate-100`
- Location/Exp/Skills pills: `bg-slate-900/80 border-white/5` (lines 333, 337, 340) → `bg-slate-100/90 dark:bg-slate-900/80 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300`
- Stats card (right of hero): `bg-slate-900/80 border-white/10` (line 348) → `bg-slate-100/80 dark:bg-slate-900/80 border-slate-200 dark:border-white/10`
- Summary box: `bg-slate-900/50 border-white/5` (line 367) → `bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-white/5`
- Copy buttons: `bg-slate-900/90 border-white/10 text-slate-200` (lines 389, 406) → `bg-white dark:bg-slate-900/90 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200`
- GitHub link button: `bg-slate-800 border-white/15 text-slate-200` (line 440) → `bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200`
- Requisition `<select>` dropdown: `bg-slate-900/90 border-white/10 text-slate-100` (lines 579, 585) → `bg-white dark:bg-slate-900/90 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100`
- Score box in Evaluator: `bg-slate-900/80 border-white/10` (line 599) → `bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10`
- Evaluator sub-score cards: `bg-slate-900/50` (lines 633, 647, 661, 675) → `bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5`
- Evaluator progress track: `bg-slate-800` (lines 638, 652, 666, 680) → `bg-slate-200 dark:bg-slate-800`
- Skills filter input: `bg-slate-900/80 border-white/10 text-slate-200` (line 763) → `bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200`
- Category tab inactive: `bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-white/5` (line 785) → `bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/5`
- Skills cards: `bg-slate-900/40 border-white/5` (line 814) → `bg-slate-50 dark:bg-slate-900/40 border-slate-200/80 dark:border-white/5`
- Timeline cards: `bg-slate-900/50 border-white/5` (lines 878, 935) → `bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-white/5`

---

## 4. Deep Dive: Candidates Directory (`Candidates.tsx`) & Sub-Components

### 4.1 Candidates Page Elements & Filter Toolbar
In `src/pages/Candidates.tsx`:
1. **Search Input & Toolbar** (lines 444–488):
   - Input: `bg-slate-900/80 border-white/10 text-slate-100` → `bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100`
   - View mode toggle container: `bg-slate-900/90 border-white/10` → `bg-slate-100 dark:bg-slate-900/90 border-slate-200 dark:border-white/10`
   - Inactive view button: `text-slate-400 hover:text-slate-200` → `text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200`
2. **Category Domain Pills** (lines 507–510):
   - Inactive: `bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200` → `bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200`
3. **Dropdowns & Sliders** (lines 536, 548, 564, 593):
   - Range input track: `bg-slate-800` → `bg-slate-200 dark:bg-slate-800`
   - Select elements: `bg-slate-900/80 border-white/10 text-slate-200` → `bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200`
   - Select option elements: `bg-slate-900 text-slate-200` → `bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200`
4. **Candidate Cards (Grid View)** (lines 808–995):
   - Selected ring: `ring-indigo-500 bg-slate-900/90` → `ring-indigo-500 bg-indigo-50/50 dark:bg-slate-900/90`
   - Checkbox unselected: `bg-slate-800/80 border-white/20` → `bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-white/20`
   - Candidate name: `text-slate-100 group-hover:text-indigo-300` → `text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300`
   - Contact pills: `bg-slate-900/60 border-white/5 text-slate-300` → `bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300`
5. **Dense Data Table View** (lines 1002–1146):
   - Table header row: `border-b border-white/10 bg-slate-900/60 text-slate-400` → `border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400`
   - Table body rows: `divide-y divide-white/5` → `divide-y divide-slate-200 dark:divide-white/5`
   - Row hover: `hover:bg-slate-800/50` → `hover:bg-slate-50 dark:hover:bg-slate-800/50`
   - Selected row: `bg-indigo-950/20` → `bg-indigo-50/60 dark:bg-indigo-950/20`
6. **Floating Selection Dock** (lines 1157–1195):
   - Container: `bg-slate-900/90 border-indigo-500/40 backdrop-blur-2xl` → `bg-white/95 dark:bg-slate-900/90 border-indigo-300 dark:border-indigo-500/40 shadow-2xl shadow-indigo-500/10 dark:shadow-black/80`
   - Text: `text-slate-100` → `text-slate-900 dark:text-slate-100`

### 4.2 Candidate Comparison Matrix Modal (`CandidateComparisonModal.tsx`)
1. **Modal Shell & Header** (lines 324–381):
   - Modal background: `glass-card-elevated border-white/15 shadow-black/90` → `glass-card-elevated border-slate-200 dark:border-white/15 bg-white/98 dark:bg-slate-900/98 shadow-2xl`
   - Header bar: `bg-slate-900/70 border-b border-white/10` → `bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-white/10`
   - Sub-header: `bg-slate-900/90 border-b border-white/5` → `bg-slate-100/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/5`
   - Dropdown selectors: `bg-slate-950/80 border-white/10 text-slate-100` → `bg-white dark:bg-slate-950/80 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100`
2. **Radial Score Gauge** (lines 98–150):
   - Track circle: `stroke="rgba(255, 255, 255, 0.08)"` → `stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`
   - Center score: `text-slate-100` → `text-slate-900 dark:text-slate-100`
3. **Multi-Candidate Recharts Radar Overlay** (lines 605–652):
   - `PolarGrid`: `stroke={isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'}`
   - `PolarAngleAxis`: `stroke={isDark ? '#94A3B8' : '#64748B'}`, `tick={{ fill: isDark ? '#CBD5E1' : '#334155' }}`
   - `PolarRadiusAxis`: `stroke={isDark ? '#475569' : '#CBD5E1'}`, `tick={{ fill: isDark ? '#64748B' : '#94A3B8' }}`
   - `Tooltip`: `contentStyle={{ backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)', color: isDark ? '#F8FAFC' : '#0F172A', borderColor: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)' }}`
4. **Dimension Breakdown Table** (lines 767–953):
   - Table header: `bg-slate-950/60 border-white/10 text-slate-400` → `bg-slate-100 dark:bg-slate-950/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400`
   - Evaluation Factor column: `bg-slate-900/30 font-semibold text-slate-200` → `bg-slate-50 dark:bg-slate-900/30 font-semibold text-slate-800 dark:text-slate-200`
   - Progress bar tracks: `bg-slate-800` → `bg-slate-200 dark:bg-slate-800`
   - Modal footer: `bg-slate-950/70 border-white/10` → `bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-white/10`

### 4.3 Resume Preview Drawer (`ResumePreviewDrawer.tsx`)
1. **Drawer Panel** (lines 370–516):
   - Panel container: `bg-slate-950/95 border-l border-white/15` → `bg-white dark:bg-slate-950/95 border-l border-slate-200 dark:border-white/15`
   - Drawer header: `bg-slate-900/80 border-b border-white/10` → `bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10`
   - Inactive tab button: `bg-slate-900/80 text-slate-400 hover:bg-slate-800` → `bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800`
2. **Raw Text Viewer** (lines 699–749):
   - Viewer container: `bg-slate-950/90 border border-white/10` → `bg-slate-900 dark:bg-slate-950/90 border border-slate-300 dark:border-white/10` (or clean editor styling)
   - Line numbers: `text-slate-600` → `text-slate-500 dark:text-slate-600`
   - Line text: `text-slate-200` → `text-slate-100 dark:text-slate-200`
   - Search match highlight: `bg-amber-400/30 text-amber-900 dark:text-amber-200 border-amber-400/40`
3. **Drawer Footer** (lines 1001–1023):
   - `bg-slate-950/80 border-t border-white/10` → `bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-white/10`

---

## 5. Deep Dive: Jobs & Requisition Screening (`Jobs.tsx` & `JobCandidates.tsx`)

### 5.1 Jobs Management View (`Jobs.tsx`)
1. **Search & Filter Bar** (lines 425–523):
   - Input: `bg-slate-900/80 border-white/10 text-slate-100` → `bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100`
   - Selects: `bg-slate-900/80 border-white/10 text-slate-200` → `bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-200`
2. **Job Cards** (lines 610–743):
   - Company initial box: `bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border-indigo-500/30 text-indigo-400` → In light mode: `text-indigo-600 dark:text-indigo-400`
   - Title: `text-slate-100 group-hover:text-indigo-300` → `text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300`
   - Description text: `text-slate-400` → `text-slate-600 dark:text-slate-400`
3. **Create Job Modal Form** (lines 790–997):
   - Skill inputs: `bg-slate-900/80 border-white/10 text-slate-100` → `bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100`
   - Rendered skill chip containers: `bg-slate-900/50 border-white/5` → `bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5`

### 5.2 Requisition Candidate Screening Pipeline (`JobCandidates.tsx`)
1. **Job Overview Banner** (lines 320–448):
   - Requisition summary metric boxes: `bg-slate-900/60 border-white/5` → `bg-slate-100/80 dark:bg-slate-900/60 border-slate-200 dark:border-white/5 text-slate-900 dark:text-slate-100`
   - Description: `text-slate-300` → `text-slate-700 dark:text-slate-300`
2. **Radial Score Gauge** (lines 50–91):
   - Background track: `stroke="rgba(255, 255, 255, 0.08)"` → `stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`
   - Score text: `text-slate-100` → `text-slate-900 dark:text-slate-100`
3. **Ranked Candidate Cards** (lines 564–875):
   - Gold trophy card (#1 rank): `bg-slate-900/90 border-amber-500/40` → `bg-amber-50/30 dark:bg-slate-900/90 border-amber-400 dark:border-amber-500/40`
   - Rank numbers: `bg-slate-800/90 border-white/10 text-slate-400` → `bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-400`
   - Multi-factor scoring boxes: `bg-slate-900/60 border-white/5` → `bg-slate-100/70 dark:bg-slate-900/60 border-slate-200 dark:border-white/5`
   - Score bar background: `bg-slate-800` → `bg-slate-200 dark:bg-slate-800`
   - Matched skills box: `bg-emerald-500/5 border-emerald-500/20` (looks great in both)
   - Missing skills box: `bg-rose-500/5 border-rose-500/20` (looks great in both)
   - Deep breakdown strengths / weaknesses boxes: `bg-slate-900/80 border-white/5` → `bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300`

---

## 6. Global UI Primitives & Design System Tokens

### 6.1 UI Component Adaptation Matrix

| UI Component | File Path | Current Hardcoded Dark Classes | Proposed Light / Dark Classes |
|---|---|---|---|
| `Card` | `src/components/ui/Card.tsx` | `.glass-card` (dark rgba), `CardTitle` (`text-slate-100`), `CardDescription` (`text-slate-400`) | `.glass-card` (`bg-white/70 dark:bg-[rgba(15,23,42,0.65)] border-slate-200/80 dark:border-white/10 shadow-slate-200/50 dark:shadow-black/40`), `CardTitle` (`text-slate-900 dark:text-slate-100`), `CardDescription` (`text-slate-600 dark:text-slate-400`) |
| `Button` | `src/components/ui/Button.tsx` | `secondary`: `bg-slate-800/80 text-slate-100 border-white/10`, `ghost`: `text-slate-300 hover:text-white hover:bg-white/5`, `ring-offset-[#0A0E1A]` | `secondary`: `bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/90 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-white/10`, `ghost`: `text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5`, `ring-offset-white dark:ring-offset-[#0A0E1A]` |
| `Badge` | `src/components/ui/Badge.tsx` | `slate`: `bg-slate-800/60 border-white/10 text-slate-300`, `indigo/cyan/emerald/purple`: dark text | `slate`: `bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300`, colors enhanced for light contrast (`text-indigo-700 dark:text-indigo-300`, `text-emerald-700 dark:text-emerald-300`, etc.) |
| `Input` / `Textarea` | `src/components/ui/Input.tsx` | `bg-slate-900/70 border-white/10 text-slate-100 placeholder-slate-500`, labels `text-slate-300` | `bg-white dark:bg-slate-900/70 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500`, labels `text-slate-700 dark:text-slate-300` |
| `Modal` | `src/components/ui/Modal.tsx` | `.glass-card-elevated`, title `text-slate-100`, footer `bg-slate-900/40 border-white/10` | `.glass-card-elevated` (`bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-white/15`), title `text-slate-900 dark:text-slate-100`, footer `bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-white/10` |
| `Skeleton` | `src/components/ui/Skeleton.tsx` | `bg-slate-800/60 border-white/5` | `bg-slate-200/80 dark:bg-slate-800/60 border-slate-300/40 dark:border-white/5` with light shimmer |
| `Tabs` | `src/components/ui/Tabs.tsx` | `bg-slate-900/80 border-white/10 text-slate-400` | `bg-slate-100/90 dark:bg-slate-900/80 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400` |

---

## 7. Recharts Full Theming Blueprint

Recharts charts are rendered as inline SVG elements. They do not automatically inherit Tailwind's `dark:` classes unless explicit colors are passed to props or CSS custom properties (`var(...)`) are evaluated.

### Recommended Implementation Approach
Create a lightweight `useChartTheme()` hook or consume `useTheme()` from `ThemeContext` to return a typed theme configuration object:

```tsx
// src/utils/chartTheme.ts
export interface ChartThemeTokens {
  gridStroke: string;
  axisStroke: string;
  axisTickText: string;
  categoryTickText: string;
  pieStroke: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  tooltipTitle: string;
  radarGrid: string;
  radarAngleTick: string;
  radarRadiusTick: string;
}

export function getChartTheme(theme: 'light' | 'dark'): ChartThemeTokens {
  const isDark = theme === 'dark';
  return {
    gridStroke: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
    axisStroke: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.12)',
    axisTickText: isDark ? '#94A3B8' : '#64748B',
    categoryTickText: isDark ? '#CBD5E1' : '#334155',
    pieStroke: isDark ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
    tooltipBg: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    tooltipBorder: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)',
    tooltipText: isDark ? '#CBD5E1' : '#475569',
    tooltipTitle: isDark ? '#F8FAFC' : '#0F172A',
    radarGrid: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    radarAngleTick: isDark ? '#CBD5E1' : '#334155',
    radarRadiusTick: isDark ? '#64748B' : '#94A3B8',
  };
}
```

This single helper solves all Recharts theming challenges across:
1. `Dashboard.tsx` (`BarChart`, `AreaChart`, `PieChart`)
2. `CandidateProfile.tsx` (`RadarChart`)
3. `CandidateComparisonModal.tsx` (`RadarChart`)
4. Circular SVG Gauges (`CandidateComparisonModal`, `ResumePreviewDrawer`, `JobCandidates`)

---

## 8. Summary of Findings & Next Step Recommendations

1. **Candidate Profile Toggle (Requirement R3)**:
   - Location is crystal clear: `CandidateProfile.tsx` lines 277–296 inside `<div className="flex items-center gap-3">`.
   - Requires consuming `useTheme()` and rendering `<Button variant="secondary" size="sm" leftIcon={theme === 'dark' ? <Sun ... /> : <Moon ... />} onClick={toggleTheme}>`.

2. **Recharts Theming**:
   - Every chart instance in `Dashboard`, `CandidateProfile`, and `CandidateComparisonModal` needs dynamic `getChartTheme(theme)` bindings for `CartesianGrid`, `XAxis`, `YAxis`, `PolarGrid`, `PolarAngleAxis`, and `Tooltip`.

3. **Global Class Replacement**:
   - All `bg-slate-900`, `bg-slate-800`, `bg-slate-950`, `border-white/*`, `text-slate-100`, and `text-white` classes must be systematically replaced with dynamic `dark:` variants paired with clean light equivalents (`bg-white dark:bg-slate-900`, `text-slate-900 dark:text-white`, `border-slate-200 dark:border-white/10`).

4. **Visual Testing & Build Integrity**:
   - `npm run build` (`tsc -b && vite build`) must pass without errors.
   - All interactive dialogs, modals, and drawers must be verified in both Light and Dark modes to prevent contrast degradation or white-on-white text issues.

---
*Report compiled by Explorer 3 — Survey Phase.*
