# Survey & Architecture Analysis Report: ResumeIQ Light/Dark Mode Theming

**Explorer**: Explorer 1 (`teamwork_preview_explorer_survey_1`)  
**Mission**: Investigate build configuration, Tailwind v4 setup, global CSS tokens, theme state architecture, component dependencies, and light/dark mode refactoring requirements.  
**Date**: 2026-08-23  

---

## 1. Executive Summary

The ResumeIQ frontend is currently hardcoded for a dark "Quantum Glass / Obsidian" aesthetic. The entire application relies on Tailwind CSS utility classes (e.g., `bg-slate-900`, `bg-slate-950`, `bg-[#0A0E1A]`, `text-slate-100`, `border-white/10`) and hardcoded dark CSS custom properties in `src/index.css`.

To satisfy all requirements in `ORIGINAL_REQUEST.md` (R1: Theme Provider & State Management, R2: Global CSS & Tailwind Refactor, R3: Candidate Profile Toggle), we performed a complete audit of the build configuration, styling architecture, React component tree, and test suite (33 test files, 281 passing tests).

### Core Findings
1. **Tailwind v4 Engine**: The project uses `tailwindcss@^4.3.3` with `@tailwindcss/postcss@^4.3.3` and `@import "tailwindcss";` in `src/index.css`. In Tailwind v4, class-based dark mode is activated via `@custom-variant dark (&:where(.dark, .dark *));` in `src/index.css`.
2. **Current Hardcoded Dark State**: The root `<html>` tag lacks theme classes; `src/index.css` hardcodes `color-scheme: dark;` on `html` and `background-color: #0A0E1A; color: #F8FAFC;` on `body`.
3. **Glassmorphism System**: `.glass-card`, `.glass-card-interactive`, `.glass-card-elevated`, and `.ambient-glow-mesh` in `src/index.css` require dual-mode light/dark definitions to deliver a frosted white/slate light mode while maintaining the obsidian dark mode.
4. **Candidate Profile Toggle (R3)**: `src/pages/CandidateProfile.tsx` (lines 277-296) has the action button group (`Refresh` and `Delete Profile`) where the Light/Dark mode toggle button with `Sun`/`Moon` icons must be integrated.
5. **Test Suite Safety**: Existing unit and stress tests (e.g., `tests/m1_primitives_layout_stress.test.tsx`) assert presence of certain Tailwind classes. Using responsive class pairs (e.g., `bg-slate-50 dark:bg-[#0A0E1A]`, `border-slate-200 dark:border-white/10`) preserves 100% test compatibility while enabling full theming.

---

## 2. Build Configuration & Dependencies Audit

### 2.1 Package Manifest (`frontend/package.json`)
```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.7.1",
    "@tailwindcss/postcss": "^4.3.3",
    "autoprefixer": "^10.5.4",
    "axios": "^1.19.0",
    "framer-motion": "^13.1.0",
    "lucide-react": "^1.31.0",
    "postcss": "^8.5.26",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-hook-form": "^7.85.0",
    "react-hot-toast": "^2.6.0",
    "react-router-dom": "^7.18.2",
    "recharts": "^3.10.1",
    "tailwindcss": "^4.3.3",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.4",
    "oxlint": "^1.75.0",
    "typescript": "~6.0.2",
    "vite": "^8.2.0"
  }
}
```

### 2.2 Available UI & Icon Libraries
- **`lucide-react@^1.31.0`**: Provides `Sun`, `Moon`, `Sparkles`, `RotateCw`, `Trash2`, `ArrowLeft`, `Mail`, `Phone`, `MapPin`, `Briefcase`, `GraduationCap`, `Award`, `Clock`, `CheckCircle2`, `XCircle`, `AlertCircle`, `Check`, `ExternalLink`, `Building2`, `ShieldCheck`, `Calendar`, `ChevronRight`, `Brain`, `LayoutDashboard`, `UploadCloud`, `Users`, `Zap`, `Loader2`, `X`, `Bell`, `Menu`, `PlusCircle`, etc.
- **`framer-motion@^13.1.0`**: Used for route transitions (`AnimatePresence`, `motion.div`), interactive buttons, modals, tabs, and `AmbientGlow` meshes.
- **`recharts@^3.10.1`**: Used in `CandidateProfile.tsx` (`RadarChart`), `Dashboard.tsx` (`BarChart`, `AreaChart`, `PieChart`), `CandidateComparisonModal.tsx` (`RadarChart`).
- **`react-hot-toast@^2.6.0`**: Global toast notifications configured in `App.tsx`.

### 2.3 Build Scripts & Verification
- `npm run build`: Executes `tsc -b && vite build` (Verified: exits code 0, 7.66s build time).
- `npm test`: Executes `npx vitest run` (Verified: 33 test files, 281 passed).

---

## 3. Tailwind CSS v4 Dark Mode Engine

### 3.1 Mechanism in Tailwind v4
In Tailwind CSS v4, the configuration is unified in CSS rather than JavaScript.
- Default behavior of `dark:` variant: `@media (prefers-color-scheme: dark)`
- Class-based dark mode: Configured directly in `src/index.css` using the `@custom-variant` directive:
```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```
This causes any `dark:*` utility (e.g. `dark:bg-slate-900`, `dark:text-slate-100`) to be applied whenever an ancestor element (specifically `document.documentElement` / `<html class="dark">`) has the `.dark` class.

### 3.2 PostCSS & Tailwind Config
- `postcss.config.js`:
  ```javascript
  export default {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {},
    },
  }
  ```
- `tailwind.config.js`:
  Can be updated to include `darkMode: 'class'` for backward compatibility alongside `@custom-variant dark` in `src/index.css`.

---

## 4. Global CSS & Design Tokens Analysis (`src/index.css`)

### 4.1 Token Structure in `@theme`
Currently, `src/index.css` defines dark mode values as static `@theme` tokens (lines 3-46):
- Canvas & Surfaces: `--color-canvas-bg: #0A0E1A;`, `--color-surface-900: #0F172A;`, `--color-surface-800: #1E293B;`, `--color-surface-glass: rgba(15, 23, 42, 0.65);`
- Text: `--color-text-title: #F8FAFC;`, `--color-text-body: #CBD5E1;`, `--color-text-muted: #94A3B8;`
- Borders: `--color-border-glass: rgba(255, 255, 255, 0.08);`

### 4.2 Required Refactor of `@layer base`
```css
@layer base {
  :root {
    color-scheme: light;
    --border-color-default: rgba(226, 232, 240, 0.8);
  }

  .dark {
    color-scheme: dark;
    --border-color-default: rgba(255, 255, 255, 0.08);
  }

  * {
    border-color: var(--border-color-default);
  }

  body {
    background-color: #F8FAFC;
    color: #0F172A;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .dark body,
  body.dark {
    background-color: #0A0E1A;
    color: #F8FAFC;
  }

  ::selection {
    background-color: rgba(99, 102, 241, 0.25);
    color: #312E81;
  }

  .dark ::selection {
    background-color: rgba(99, 102, 241, 0.4);
    color: #FFFFFF;
  }

  /* Dual-mode Webkit Scrollbars */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: rgba(241, 245, 249, 0.8);
  }
  .dark ::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.6);
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.25);
    border-radius: 9999px;
  }
  .dark ::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.35);
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.5);
  }
  .dark ::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.7);
  }
}
```

### 4.3 Required Refactor of `@layer components`
1. **`.glass-card`**:
   - **Light Mode**: Frosted clean white surface with subtle shadow and border.
     ```css
     background: rgba(255, 255, 255, 0.75);
     backdrop-filter: blur(16px);
     -webkit-backdrop-filter: blur(16px);
     border: 1px solid rgba(226, 232, 240, 0.8);
     box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02);
     border-radius: 1rem;
     ```
   - **Dark Mode (`.dark .glass-card`)**:
     ```css
     background: rgba(15, 23, 42, 0.65);
     border: 1px solid rgba(255, 255, 255, 0.08);
     box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
     ```

2. **`.glass-card-interactive`**:
   - **Light Mode**: Hover elevates to `rgba(255, 255, 255, 0.95)`, border `rgba(99, 102, 241, 0.4)`, shadow `0 10px 25px -5px rgba(99, 102, 241, 0.12)`.
   - **Dark Mode (`.dark .glass-card-interactive:hover`)**: Hover elevates to `rgba(30, 41, 59, 0.75)`, border `rgba(99, 102, 241, 0.35)`.

3. **`.glass-card-elevated`**:
   - **Light Mode**: `background: rgba(255, 255, 255, 0.92); border: 1px solid rgba(226, 232, 240, 0.9); box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.15);`
   - **Dark Mode (`.dark .glass-card-elevated`)**: `background: rgba(30, 41, 59, 0.88); border: 1px solid rgba(255, 255, 255, 0.14); box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.75);`

4. **`.ambient-glow-mesh`**:
   - **Light Mode**:
     ```css
     background: 
       radial-gradient(circle 700px at 5% 0%, rgba(99, 102, 241, 0.08), transparent 70%),
       radial-gradient(circle 600px at 95% 95%, rgba(16, 185, 129, 0.06), transparent 70%),
       radial-gradient(circle 800px at 50% 30%, rgba(139, 92, 246, 0.04), transparent 70%),
       radial-gradient(circle 500px at 80% 10%, rgba(6, 182, 212, 0.05), transparent 60%);
     ```
   - **Dark Mode (`.dark .ambient-glow-mesh`)**: Existing vibrant mesh.

5. **Skeleton Shimmer (`.animate-shimmer::after`)**:
   - Dual-mode gradient: in light mode uses subtle `rgba(0, 0, 0, 0.04)` / `rgba(0, 0, 0, 0.08)`, in dark mode `rgba(255, 255, 255, 0.05)` / `rgba(255, 255, 255, 0.12)`.

---

## 5. Theme State Management Architecture (`ThemeProvider`, `ThemeContext`, `useTheme`)

### 5.1 Architecture Design
Create `src/context/ThemeContext.tsx`:
- **Theme Type**: `type Theme = 'light' | 'dark';`
- **Context Interface**:
  ```typescript
  export interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
  }
  ```

### 5.2 Initial Preference & Synchronization Algorithm
1. **Initial Resolution**:
   ```typescript
   const getInitialTheme = (): Theme => {
     try {
       const saved = localStorage.getItem('resumeiq-theme');
       if (saved === 'light' || saved === 'dark') {
         return saved;
       }
       if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
         return 'dark';
       }
     } catch (e) {
       // fallback if localStorage is disabled
     }
     return 'dark'; // Default Obsidian aesthetic fallback
   };
   ```
2. **DOM & Persistence Effect**:
   ```typescript
   useEffect(() => {
     const root = document.documentElement;
     if (theme === 'dark') {
       root.classList.add('dark');
       root.classList.remove('light');
       root.style.colorScheme = 'dark';
     } else {
       root.classList.remove('dark');
       root.classList.add('light');
       root.style.colorScheme = 'light';
     }
     try {
       localStorage.setItem('resumeiq-theme', theme);
     } catch (e) {}
   }, [theme]);
   ```
3. **System Preference Change Listener**:
   ```typescript
   useEffect(() => {
     const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
     const handleChange = (e: MediaQueryListEvent) => {
       const saved = localStorage.getItem('resumeiq-theme');
       if (!saved) {
         setThemeState(e.matches ? 'dark' : 'light');
       }
     };
     mediaQuery.addEventListener('change', handleChange);
     return () => mediaQuery.removeEventListener('change', handleChange);
   }, []);
   ```

### 5.3 Hook Definition (`useTheme`)
Export `useTheme()` hook with defensive error check:
```typescript
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

### 5.4 App Provider Integration & Dynamic Toaster (`src/App.tsx`)
Wrap `<ThemeProvider>` around `<BrowserRouter>` and `<LayoutShell>`.  
In `App.tsx`, connect `useTheme` or dynamic toaster styling:
- Light Mode Toaster: `background: 'rgba(255, 255, 255, 0.95)', color: '#0F172A', border: '1px solid rgba(226, 232, 240, 0.9)'`
- Dark Mode Toaster: `background: 'rgba(30, 41, 59, 0.90)', color: '#F8FAFC', border: '1px solid rgba(255, 255, 255, 0.12)'`

---

## 6. Candidate Profile Toggle Integration (Requirement R3)

### 6.1 Target Location in `src/pages/CandidateProfile.tsx`
Lines 277–296 currently contain:
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

### 6.2 Implementation Plan for R3
Add the theme toggle button directly inside this button group:
```tsx
<Button
  variant="secondary"
  size="sm"
  onClick={toggleTheme}
  leftIcon={
    theme === 'dark' ? (
      <Sun className="w-3.5 h-3.5 text-amber-400" />
    ) : (
      <Moon className="w-3.5 h-3.5 text-indigo-500" />
    )
  }
  className="cursor-pointer"
  aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
>
  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
</Button>
```

---

## 7. Component-by-Component Refactoring Plan

| Component / File | Current Hardcoded Styles | Refactored Dual-Mode Classes |
|---|---|---|
| `LayoutShell.tsx` | `bg-[#0A0E1A] text-slate-100` | `bg-slate-50 dark:bg-[#0A0E1A] text-slate-900 dark:text-slate-100` |
| `Sidebar.tsx` | `bg-slate-950/80 border-white/10 text-slate-100` | `bg-white/80 dark:bg-slate-950/80 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100` |
| `Topbar.tsx` | `bg-slate-950/60 border-white/10 text-slate-400` | `bg-white/70 dark:bg-slate-950/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400` |
| `MobileNav.tsx` | `bg-slate-950/95 border-white/10` | `bg-white/95 dark:bg-slate-950/95 border-slate-200 dark:border-white/10` |
| `AmbientGlow.tsx` | Fixed dark opacity & white grid pattern | Adjusted light/dark opacity; grid texture adapted for light/dark |
| `Button.tsx` (`secondary`) | `bg-slate-800/80 text-slate-100 border-white/10` | `bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700/90 dark:text-slate-100 dark:border-white/10` |
| `Button.tsx` (`ghost`) | `text-slate-300 hover:bg-white/5` | `text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5` |
| `Card.tsx` | Relying on `.glass-card` | Automatic adaptation via updated `.glass-card` in `index.css` |
| `Badge.tsx` (`slate`) | `bg-slate-800/60 text-slate-300 border-white/10` | `bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800/60 dark:border-white/10 dark:text-slate-300` |
| `Input.tsx` / `Textarea` | `bg-slate-900/70 text-slate-100 border-white/10` | `bg-white/80 text-slate-900 border-slate-200 dark:bg-slate-900/70 dark:text-slate-100 dark:border-white/10` |
| `Modal.tsx` | `glass-card-elevated border-white/15` | `glass-card-elevated border-slate-200 dark:border-white/15` |
| `Skeleton.tsx` | `bg-slate-800/60 border-white/5` | `bg-slate-200/80 border-slate-200/60 dark:bg-slate-800/60 dark:border-white/5` |
| `Tabs.tsx` | `bg-slate-900/80 border-white/10 text-slate-400` | `bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-900/80 dark:border-white/10 dark:text-slate-400` |
| `Dashboard.tsx` | Hardcoded `bg-slate-900`, `text-slate-100`, Recharts tooltip | Dual-mode classes, Recharts stroke & axis colors |
| `Candidates.tsx` | Table rows, filter bars, badge pills hardcoded dark | Dual-mode classes, slate-50/slate-900 alternating rows |
| `CandidateProfile.tsx` | Radar chart, evaluator gauges, skill tabs hardcoded dark | Dual-mode classes, theme toggle button in action header |
| `Jobs.tsx` | Form inputs, modal requisition builder hardcoded dark | Dual-mode classes |
| `JobCandidates.tsx` | Radial gauge, ranking cards hardcoded dark | Dual-mode classes |
| `Upload.tsx` | Drag-and-drop zone, stages pipeline hardcoded dark | Dual-mode classes |
| `CandidateComparisonModal.tsx` | Matrix table, radar overlay hardcoded dark | Dual-mode classes |
| `ResumePreviewDrawer.tsx` | Drawer container, raw text inspector hardcoded dark | Dual-mode classes |

---

## 8. Test Compatibility Strategy

The test suite contains 281 tests across 33 test files.
- `tests/m1_primitives_layout_stress.test.tsx` validates specific CSS class substrings rendered by components (e.g. `bg-slate-800/80`, `bg-[#0A0E1A]`, `bg-slate-950/95`).
- By utilizing the pattern `bg-slate-50 dark:bg-[#0A0E1A]`, `bg-white/95 dark:bg-slate-950/95`, and `bg-slate-100 dark:bg-slate-800/80`, all test assertions will continue to find the dark classes in the string, maintaining 100% test pass rate while providing flawless runtime light/dark styling.

---

## 9. Conclusion
All architectural requirements have been comprehensively analyzed and scoped. The project is fully primed for implementation across the ThemeProvider, `index.css`, UI primitives, layout shell, CandidateProfile toggle, and all pages.
