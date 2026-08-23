## 2026-08-23T12:50:25Z

You are Worker 1 implementing Milestone 1: Theme Context, Provider, State Hook, Tailwind v4 Variant, and Global CSS Refactor.

Your working directory is:
c:\Users\ARYAN - AYUSH\OneDrive\Desktop\resume parser\.agents\teamwork_preview_worker_m1

The original user request is at:
c:\Users\ARYAN - AYUSH\OneDrive\Desktop\resume parser\.agents\ORIGINAL_REQUEST.md

The master project plan is at:
c:\Users\ARYAN - AYUSH\OneDrive\Desktop\resume parser\.agents\PROJECT.md

The frontend codebase is at:
c:\Users\ARYAN - AYUSH\OneDrive\Desktop\resume parser\frontend

Explorer survey reports to review before writing code:
- c:\Users\ARYAN - AYUSH\OneDrive\Desktop\resume parser\.agents\teamwork_preview_explorer_survey_1\handoff.md
- c:\Users\ARYAN - AYUSH\OneDrive\Desktop\resume parser\.agents\teamwork_preview_explorer_survey_1\analysis.md
- c:\Users\ARYAN - AYUSH\OneDrive\Desktop\resume parser\.agents\teamwork_preview_explorer_survey_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your specific tasks for Milestone 1:
1. Create `src/context/ThemeContext.tsx`:
   - Define `Theme = 'light' | 'dark'` and `ThemeContextType` with `theme`, `setTheme`, `toggleTheme`.
   - Implement `ThemeProvider`:
     - Default to `localStorage.getItem('resumeiq-theme')` if `'light'` or `'dark'`.
     - Otherwise default to `window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`.
     - Keep `document.documentElement.classList` in sync: add `'dark'` if theme is `'dark'`, remove `'dark'` if theme is `'light'`.
     - Set `document.documentElement.style.colorScheme = theme`.
     - Listen to `prefers-color-scheme` media query changes if no manual choice is saved in `localStorage`.
     - Provide a custom `useTheme()` hook with helpful error if used outside provider.
2. Refactor `src/index.css`:
   - Add `@custom-variant dark (&:where(.dark, .dark *));` at the top right after `@import "tailwindcss";` so Tailwind v4 `dark:` classes work with the `.dark` root class.
   - Refactor `html` and `body` rules to support both light (`#F8FAFC`, text `#0F172A`) and dark (`#0A0E1A`, text `#F8FAFC`).
   - Refactor `.glass-card`, `.glass-card-interactive`, `.glass-card-elevated` to have beautiful, frosted translucent styling in light mode (e.g. `background: rgba(255, 255, 255, 0.75); border: 1px solid rgba(226, 232, 240, 0.8); box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05); backdrop-filter: blur(12px);`) and retain their obsidian/slate styling in dark mode (`.dark .glass-card { background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(255, 255, 255, 0.08); }`).
   - Refactor `.ambient-glow-mesh` for light mode (clean soft indigo/emerald/slate radial gradients on light background) and dark mode.
   - Refactor custom scrollbars (`::-webkit-scrollbar-track`, `::-webkit-scrollbar-thumb`) to adapt for light vs dark.
3. Create `src/utils/chartTheme.ts`:
   - Export helper functions to return theme-specific colors for Recharts (`gridStroke`, `axisColor`, `tooltipBg`, `tooltipBorder`, `tooltipText`, `radarGrid`, etc.) based on `'light' | 'dark'`.
4. Update `src/App.tsx`:
   - Wrap the application tree with `<ThemeProvider>`.
   - Update `<Toaster>` to be theme-aware or styled appropriately for both modes.
5. Run build and tests in `frontend/`:
   - `npm run build`
   - `npm test`
   Ensure 0 build errors and passing tests.
6. Write a detailed handoff report to `c:\Users\ARYAN - AYUSH\OneDrive\Desktop\resume parser\.agents\teamwork_preview_worker_m1\handoff.md`.
7. Send a completion message to parent when done.
