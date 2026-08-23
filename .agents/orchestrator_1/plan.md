# Plan — ResumeIQ Light/Dark Mode Theming

## Goal
Flawlessly refactor ResumeIQ frontend to support responsive Light & Dark modes with React Context, Tailwind `dark:` variants, adaptive glassmorphism, Candidate Profile toggle button, and complete visual/technical verification.

## Phases
1. **Phase 0: Survey & Codebase Inventory**
   - Explorer 1: Project structure, dependencies, Tailwind config, current styling paradigms, index.css, theme tokens.
   - Explorer 2: App Shell & Global components (App.tsx, Sidebar, Topbar, Header, Navigation, Modals).
   - Explorer 3: Feature Views (Dashboard, Candidates, Jobs, Profile, Recharts integration, Candidate Profile action bar).

2. **Phase 1: Architecture & Foundation (M1 & M2)**
   - Implement `ThemeProvider`, `ThemeContext`, `useTheme` hook with `localStorage` persistence and `window.matchMedia('(prefers-color-scheme: dark)')` fallback.
   - Enable `darkMode: 'class'` in `tailwind.config.js`.
   - Refactor `index.css`: `.glass-card`, `.ambient-glow-mesh`, scrollbar styles, text selection, base body styling for both themes.

3. **Phase 2: Component Refactoring (M3 & M4)**
   - Refactor Sidebar, Topbar, Modals to use `dark:` variants.
   - Refactor Dashboard, Candidates list, Jobs view, and Candidate Profile view.
   - Ensure Recharts colors (strokes, grids, tooltips, legends) react cleanly to theme or use CSS variable / theme-aware props.
   - Add Light/Dark Mode Toggle button explicitly in the top right corner of Candidate Profile section next to Refresh and Delete Profile buttons with Sun/Moon icons.

4. **Phase 3: Verification & Auditing (M5)**
   - Worker runs `npm run build` to verify clean build (code 0).
   - Reviewers inspect contrast, CSS coverage (>90% dark class migration), and accessibility.
   - Challengers test edge cases (storage corruption, dynamic toggling, fast switches, chart responsiveness).
   - Forensic Auditor checks integrity and ensures zero fake/dummy code.
