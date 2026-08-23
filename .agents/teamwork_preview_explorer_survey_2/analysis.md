# Comprehensive Analysis: Shell, Layout & UI Theming Refactor (Survey Phase - Explorer 2)

## 1. Executive Summary

The ResumeIQ frontend is currently built exclusively with dark-themed utility classes (`bg-[#0A0E1A]`, `bg-slate-950`, `bg-slate-900`, `text-slate-100`, `text-slate-400`, `border-white/10`, `bg-black/80`). In addition, the application utilizes Tailwind CSS v4 (`tailwindcss ^4.3.3`) where dark mode defaults to media queries unless configured with custom class-based variants.

This report surveys the structural shell and navigation components:
- Root & Foundation: `src/App.tsx`, `src/index.css`, Tailwind v4 configuration
- Layout Components: `src/components/layout/LayoutShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`, `MobileNav.tsx`, `AmbientGlow.tsx`
- Shared UI Primitives: `src/components/ui/Badge.tsx`, `Button.tsx`, `Card.tsx`, `Input.tsx`, `Modal.tsx`, `Skeleton.tsx`, `Tabs.tsx`
- Candidate Modal / Drawer Shells: `src/components/candidates/CandidateComparisonModal.tsx`, `ResumePreviewDrawer.tsx`
- Utilities & SVGs: `src/utils/icons.tsx`, Recharts multi-axis radar chart, SVG circular score gauges

---

## 2. Core Architecture & CSS Foundation

### 2.1 Tailwind CSS v4 Configuration & Class Selector
The project uses Tailwind CSS v4 (`@tailwindcss/postcss: ^4.3.3`, `tailwindcss: ^4.3.3`) with `@import "tailwindcss";` in `src/index.css`.
In Tailwind CSS v4, manual class-based dark mode (e.g. toggling `.dark` on `<html>` or `<body>`) requires declaring the variant in `index.css`:
```css
@variant dark (&:where(.dark, .dark *));
```
or
```css
@custom-variant dark (&:where(.dark, .dark *));
```
Without this directive in `src/index.css`, `dark:` utility classes will respond only to the operating system's `prefers-color-scheme: dark` rather than the active class on `document.documentElement`.

### 2.2 Global CSS Tokens (`src/index.css`)
Currently, `src/index.css` defines dark mode CSS variables in `@theme` and hardcodes dark colors directly onto `html`, `body`, and base elements.
To ensure seamless theming across both CSS classes and Tailwind utilities:

```css
@import "tailwindcss";

@variant dark (&:where(.dark, .dark *));

/* Light Mode Defaults (:root) */
:root {
  --color-canvas-bg: #F8FAFC;
  --color-surface-card: #FFFFFF;
  --color-surface-glass: rgba(255, 255, 255, 0.85);
  --color-surface-glass-elevated: rgba(255, 255, 255, 0.95);
  --color-surface-glass-subtle: rgba(241, 245, 249, 0.60);
  
  --color-brand-primary: #4F46E5;
  --color-brand-primary-hover: #4338CA;
  --color-brand-accent: #6366F1;
  --color-brand-violet: #7C3AED;
  --color-brand-pink: #DB2777;

  --color-match-emerald: #059669;
  --color-match-emerald-glow: #10B981;
  --color-match-amber: #D97706;
  --color-match-rose: #E11D48;
  --color-match-cyan: #0891B2;

  --color-text-title: #0F172A;
  --color-text-body: #334155;
  --color-text-muted: #64748B;
  --color-text-dim: #94A3B8;

  --color-border-glass: rgba(0, 0, 0, 0.08);
  --color-border-glass-hover: rgba(99, 102, 241, 0.35);
  --color-border-glass-elevated: rgba(0, 0, 0, 0.12);

  --shadow-glass-elevated: 0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.06);
}

/* Dark Mode Overrides (.dark) */
.dark {
  --color-canvas-bg: #0A0E1A;
  --color-surface-card: #0F172A;
  --color-surface-glass: rgba(15, 23, 42, 0.65);
  --color-surface-glass-elevated: rgba(30, 41, 59, 0.88);
  --color-surface-glass-subtle: rgba(15, 23, 42, 0.40);

  --color-brand-primary: #6366F1;
  --color-brand-primary-hover: #4F46E5;
  --color-brand-accent: #818CF8;
  --color-brand-violet: #8B5CF6;
  --color-brand-pink: #EC4899;

  --color-match-emerald: #10B981;
  --color-match-emerald-glow: #34D399;
  --color-match-amber: #F59E0B;
  --color-match-rose: #F43F5E;
  --color-match-cyan: #06B6D4;

  --color-text-title: #F8FAFC;
  --color-text-body: #CBD5E1;
  --color-text-muted: #94A3B8;
  --color-text-dim: #64748B;

  --color-border-glass: rgba(255, 255, 255, 0.08);
  --color-border-glass-hover: rgba(99, 102, 241, 0.35);
  --color-border-glass-elevated: rgba(255, 255, 255, 0.16);

  --shadow-glass-elevated: 0 20px 40px -15px rgba(0, 0, 0, 0.75), 0 0 1px 1px rgba(255, 255, 255, 0.1);
}
```

### 2.3 Refactoring `.glass-card` & Glass Classes in `src/index.css`
| Class Name | Light Mode Styling | Dark Mode Styling |
|---|---|---|
| `.glass-card` | `bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]` | `bg-slate-900/65 backdrop-blur-xl border border-white/8 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]` |
| `.glass-card-interactive` | Hover: `bg-white/95 border-indigo-400/40 shadow-indigo-500/10` | Hover: `bg-slate-800/75 border-indigo-500/35 shadow-indigo-500/20` |
| `.glass-card-elevated` | `bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-2xl shadow-slate-900/10` | `bg-slate-800/90 backdrop-blur-2xl border border-white/14 shadow-2xl shadow-black/75` |
| `.ambient-glow-mesh` | Light pastel indigo/emerald radial gradients at low opacity (`0.06` - `0.08`) | Deep saturated indigo/emerald glows (`0.09` - `0.14`) |

---

## 3. App Entry & Toaster Provider (`src/App.tsx`)

### Current State
`src/App.tsx` configures `react-hot-toast`'s `<Toaster>` with hardcoded dark styles:
- `background: 'rgba(30, 41, 59, 0.90)'`
- `color: '#F8FAFC'`
- `border: '1px solid rgba(255, 255, 255, 0.12)'`
- `secondary: '#0A0E1A'` (icon theme secondary)

### Refactoring Strategy
Provide dynamic class-based or CSS custom property-driven toast styling.
1. Use `className` with `.glass-card-elevated` on `toastOptions` or dynamic style using CSS variables:
   - `background: 'var(--color-surface-glass-elevated, rgba(30, 41, 59, 0.90))'`
   - `color: 'var(--color-text-title, #F8FAFC)'`
   - `border: '1px solid var(--color-border-glass, rgba(255, 255, 255, 0.12))'`
2. Success/Error icons:
   - Success icon: primary `#10B981`, secondary `var(--color-canvas-bg, #0A0E1A)`
   - Error icon: primary `#F43F5E`, secondary `var(--color-canvas-bg, #0A0E1A)`

---

## 4. Layout & Structural Shell Components

### 4.1 `src/components/layout/LayoutShell.tsx`
| Line # | Current Code | Refactored Tailwind Utility | Description / Rationale |
|---|---|---|---|
| 15 | `className="flex h-screen bg-[#0A0E1A] text-slate-100 font-sans overflow-hidden relative selection:bg-indigo-500/30 selection:text-white"` | `className="flex h-screen bg-slate-50 dark:bg-[#0A0E1A] text-slate-900 dark:text-slate-100 font-sans overflow-hidden relative selection:bg-indigo-500/20 selection:text-indigo-950 dark:selection:bg-indigo-500/30 dark:selection:text-white"` | Light mode body background must be clean soft slate (`bg-slate-50`) with dark typography (`text-slate-900`). |

### 4.2 `src/components/layout/AmbientGlow.tsx`
| Line # | Current Code | Refactored Tailwind Utility | Description / Rationale |
|---|---|---|---|
| 15 | `bg-gradient-to-br from-indigo-600/25 to-purple-600/15 rounded-full blur-3xl` | `bg-gradient-to-br from-indigo-400/15 to-purple-400/10 dark:from-indigo-600/25 dark:to-purple-600/15 rounded-full blur-3xl` | Soft pastel ambient blur in light mode; preserves neon depth in dark mode. |
| 27 | `bg-gradient-to-tl from-emerald-500/20 to-teal-500/10 rounded-full blur-3xl` | `bg-gradient-to-tl from-emerald-400/15 to-teal-400/10 dark:from-emerald-500/20 dark:to-teal-500/10 rounded-full blur-3xl` | Emerald accent glow softened for light theme. |
| 37 | `bg-gradient-to-r from-purple-600/15 via-indigo-600/10 to-pink-600/10 rounded-full blur-[120px]` | `bg-gradient-to-r from-purple-400/10 via-indigo-400/8 to-pink-400/8 dark:from-purple-600/15 dark:via-indigo-600/10 dark:to-pink-600/10 rounded-full blur-[120px]` | Central diffuse ambient light. |
| 42-45 | `opacity-[0.018]` with `radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)` | `opacity-[0.03] dark:opacity-[0.018]` with `radial-gradient(currentColor 1px, transparent 1px)` and `text-slate-900 dark:text-white` | Texture dots adapt to light (slate) and dark (white). |

### 4.3 `src/components/layout/Sidebar.tsx`
| Line # | Current Code | Refactored Tailwind Utility | Description / Rationale |
|---|---|---|---|
| 49 | `w-64 h-screen bg-slate-950/80 backdrop-blur-2xl border-r border-white/10 text-slate-100` | `w-64 h-screen bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100` | Sidebar container: clean frosted white border in light mode, obsidian glass in dark. |
| 53 | `border-b border-white/5` | `border-b border-slate-200/60 dark:border-white/5` | Header divider line. |
| 56 | `bg-slate-950/90` | `bg-white dark:bg-slate-950/90` | Brand icon inner container. |
| 57 | `Sparkles ... text-indigo-400` | `Sparkles ... text-indigo-600 dark:text-indigo-400` | Brand icon sparkler contrast. |
| 63 | `bg-indigo-500/20 text-indigo-300 border-indigo-500/30` | `bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30` | AI tag badge. |
| 67 | `text-slate-400` | `text-slate-500 dark:text-slate-400` | Subtitle text. |
| 74 | `text-slate-400` | `text-slate-500 dark:text-slate-400` | "Main Menu" section label. |
| 91-93 | `active ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'` | `active ? 'text-indigo-600 dark:text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5'` | Navigation item text and hover contrast. |
| 102 | `bg-gradient-to-r from-indigo-600/30 to-purple-600/15 border border-indigo-500/40 ...` | `bg-gradient-to-r from-indigo-500/15 to-purple-500/10 dark:from-indigo-600/30 dark:to-purple-600/15 border border-indigo-500/30 dark:border-indigo-500/40 shadow-inner shadow-indigo-500/10` | Active pill indicator background. |
| 109-110 | `active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'` | `active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-300'` | Nav item icon. |
| 117 | `bg-emerald-500/20 text-emerald-300 border-emerald-500/30` | `bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30` | "AI Parse" pill badge. |
| 132 | `glass-card p-3.5 bg-slate-900/60 border border-white/5` | `glass-card p-3.5 bg-slate-100/70 border border-slate-200/60 dark:bg-slate-900/60 dark:border-white/5` | Bottom AI engine status card. |
| 134 | `text-slate-300` | `text-slate-700 dark:text-slate-300` | Status title. |
| 138 | `text-emerald-400 ... bg-emerald-500/10 ... border-emerald-500/20` | `text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20` | 99.9% uptime badge. |
| 142 | `text-slate-400` | `text-slate-500 dark:text-slate-400` | Telemetry explanation text. |
| 147 | `text-slate-400 border-t border-white/5` | `text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-white/5` | Version footer separator and text. |

### 4.4 `src/components/layout/Topbar.tsx`
| Line # | Current Code | Refactored Tailwind Utility | Description / Rationale |
|---|---|---|---|
| 51 | `bg-slate-950/60 backdrop-blur-xl border-b border-white/10` | `bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10` | Topbar header glass background. |
| 57 | `text-slate-400 hover:text-white hover:bg-white/5` | `text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5` | Mobile hamburger button. |
| 64 | `text-slate-400` | `text-slate-500 dark:text-slate-400` | Breadcrumbs container text color. |
| 67 | `text-slate-600` | `text-slate-400 dark:text-slate-600` | Chevron delimiter. |
| 71 | `hover:text-indigo-400 ... text-slate-400` | `text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400` | Breadcrumb link text. |
| 76 | `text-slate-100 font-semibold` | `text-slate-900 dark:text-slate-100 font-semibold` | Active page breadcrumb segment. |
| 89 | `text-indigo-400` | `text-indigo-600 dark:text-indigo-400` | Upload Resume CTA icon. |
| 110 | `text-slate-400 hover:text-white hover:bg-white/5` | `text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5` | Notification bell icon button. |
| 117 | `bg-white/10` | `bg-slate-200 dark:bg-white/10` | Vertical header divider. |
| 122 | `bg-slate-900` | `bg-white dark:bg-slate-900` | Avatar container background. |
| 123 | `text-indigo-400` | `text-indigo-600 dark:text-indigo-400` | Avatar sparkles icon. |
| 127 | `text-slate-200` | `text-slate-800 dark:text-slate-200` | "Recruiter Cockpit" heading. |
| 129 | `text-emerald-400` | `text-emerald-600 dark:text-emerald-400` | ShieldCheck verified icon. |
| 131 | `text-slate-400` | `text-slate-500 dark:text-slate-400` | "Enterprise Edition" subtitle. |

### 4.5 `src/components/layout/MobileNav.tsx`
| Line # | Current Code | Refactored Tailwind Utility | Description / Rationale |
|---|---|---|---|
| 44 | `bg-black/80 backdrop-blur-md` | `bg-slate-900/60 dark:bg-black/80 backdrop-blur-md` | Mobile backdrop overlay. |
| 53 | `bg-slate-950/95 border-r border-white/10` | `bg-white/95 dark:bg-slate-950/95 border-r border-slate-200/80 dark:border-white/10` | Slide-over drawer container. |
| 57 | `border-b border-white/10` | `border-b border-slate-200/80 dark:border-white/10` | Header divider. |
| 60 | `bg-slate-950` | `bg-white dark:bg-slate-950` | Brand icon container. |
| 61 | `text-indigo-400` | `text-indigo-600 dark:text-indigo-400` | Sparkles icon. |
| 66 | `text-slate-400` | `text-slate-500 dark:text-slate-400` | Subtitle. |
| 72 | `text-slate-400 hover:text-white hover:bg-white/10` | `text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10` | Close button. |
| 81 | `text-slate-500` | `text-slate-500 dark:text-slate-400` | Section label. |
| 97-98 | Active: `bg-gradient-to-r from-indigo-600/30 to-purple-600/15 text-white border border-indigo-500/40 shadow-inner` / Inactive: `text-slate-400 hover:text-slate-200 hover:bg-white/5` | Active: `bg-gradient-to-r from-indigo-500/15 to-purple-500/10 dark:from-indigo-600/30 dark:to-purple-600/15 text-indigo-600 dark:text-white border border-indigo-500/30 dark:border-indigo-500/40` / Inactive: `text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5` | Mobile navigation link active/hover states. |
| 102 | `isActive ? 'text-indigo-400' : 'text-slate-400'` | `isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'` | Nav item icon color. |
| 106 | `bg-emerald-500/20 text-emerald-300 border border-emerald-500/30` | `bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30` | Badge pill. |
| 118 | `glass-card p-3.5 bg-slate-900/60 border border-white/5` | `glass-card p-3.5 bg-slate-100/70 border border-slate-200/60 dark:bg-slate-900/60 dark:border-white/5` | Telemetry status box. |
| 119 | `text-slate-300` | `text-slate-700 dark:text-slate-300` | Status text. |
| 123 | `text-slate-400` | `text-slate-500 dark:text-slate-400` | Description text. |

---

## 5. Core Shared UI Components (`src/components/ui/`)

### 5.1 `src/components/ui/Badge.tsx`
`Badge.tsx` defines semantic color palettes across 7 variants. In light mode, light pastel text like `text-indigo-300` on `bg-indigo-500/10` fails WCAG AA contrast (1.8:1). The table below specifies the responsive dual-mode variants:

| Variant | Light Mode Classes | Dark Mode Classes (Original) |
|---|---|---|
| `indigo` | `bg-indigo-50 border-indigo-200 text-indigo-700 hover:border-indigo-300` (dot: `bg-indigo-500`) | `dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:border-indigo-400/50` (dot: `dark:bg-indigo-400`) |
| `emerald` | `bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-300` (dot: `bg-emerald-500`) | `dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:border-emerald-400/50` (dot: `dark:bg-emerald-400`) |
| `amber` | `bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-300` (dot: `bg-amber-500`) | `dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300 dark:hover:border-amber-400/50` (dot: `dark:bg-amber-400`) |
| `rose` | `bg-rose-50 border-rose-200 text-rose-700 hover:border-rose-300` (dot: `bg-rose-500`) | `dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300 dark:hover:border-rose-400/50` (dot: `dark:bg-rose-400`) |
| `cyan` | `bg-cyan-50 border-cyan-200 text-cyan-700 hover:border-cyan-300` (dot: `bg-cyan-500`) | `dark:bg-cyan-500/10 dark:border-cyan-500/30 dark:text-cyan-300 dark:hover:border-cyan-400/50` (dot: `dark:bg-cyan-400`) |
| `purple` | `bg-purple-50 border-purple-200 text-purple-700 hover:border-purple-300` (dot: `bg-purple-500`) | `dark:bg-purple-500/10 dark:border-purple-500/30 dark:text-purple-300 dark:hover:border-purple-400/50` (dot: `dark:bg-purple-400`) |
| `slate` | `bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300` (dot: `bg-slate-500`) | `dark:bg-slate-800/60 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/20` (dot: `dark:bg-slate-400`) |
| Remove button (line 101) | `hover:bg-slate-200/60` | `dark:hover:bg-white/15` |

### 5.2 `src/components/ui/Button.tsx`
| Line # / Variant | Current Code | Refactored Tailwind Utility | Description / Rationale |
|---|---|---|---|
| Line 35 (Base) | `focus:ring-offset-[#0A0E1A]` | `focus:ring-offset-white dark:focus:ring-offset-[#0A0E1A]` | Focus ring offset adapts to light canvas. |
| `primary` (38-39) | `bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30` | Same (gradient buttons retain vibrant look in both themes with high contrast white text). |
| `secondary` (40-41) | `bg-slate-800/80 hover:bg-slate-700/90 text-slate-100 border border-white/10 backdrop-blur-md hover:border-white/20` | `bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 hover:border-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700/90 dark:text-slate-100 dark:border-white/10 dark:hover:border-white/20` | Secondary buttons in light mode should be clean gray/slate surfaces with dark text. |
| `outline` (42-43) | `border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-400 backdrop-blur-sm` | `border border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-500 dark:border-indigo-500/40 dark:text-indigo-300 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-400 backdrop-blur-sm` | Outline button text is dark indigo in light mode. |
| `ghost` (44-45) | `text-slate-300 hover:bg-white/5 hover:text-white` | `text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white` | Ghost button hover state. |
| `danger` (46-47) | `bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 hover:border-rose-500/50 shadow-lg shadow-rose-500/10` | `bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 dark:hover:bg-rose-500/30 dark:hover:border-rose-500/50 shadow-lg shadow-rose-500/10` | High-contrast danger styling. |
| `emerald` (48-49) | `bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30` | Same (works across both themes). |

### 5.3 `src/components/ui/Card.tsx`
| Line # | Current Code | Refactored Tailwind Utility | Description / Rationale |
|---|---|---|---|
| 54 (`CardTitle`) | `text-lg font-semibold text-slate-100` | `text-lg font-semibold text-slate-900 dark:text-slate-100` | Card title text color. |
| 58 (`CardDescription`) | `text-xs text-slate-400 mt-0.5` | `text-xs text-slate-500 dark:text-slate-400 mt-0.5` | Card description text color. |
| 66 (`CardFooter`) | `mt-4 pt-4 border-t border-white/5 flex items-center justify-between` | `mt-4 pt-4 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between` | Card footer divider. |

### 5.4 `src/components/ui/Input.tsx`
| Line # | Current Code | Refactored Tailwind Utility | Description / Rationale |
|---|---|---|---|
| 18, 70 | `text-xs font-semibold uppercase tracking-wider text-slate-300` | `text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300` | Label typography. |
| 24, 43 | `text-slate-400` | `text-slate-400 dark:text-slate-400` | Icon color. |
| 32, 79 | `bg-slate-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500` | `bg-white dark:bg-slate-900/70 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500` | Input box surface, border, text, and placeholder. |
| 34, 81 | `focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30` | `focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/30` | Focus ring states. |
| 48, 87 | `text-xs text-rose-400 font-medium` | `text-xs text-rose-600 dark:text-rose-400 font-medium` | Error text. |
| 49, 88 | `text-xs text-slate-400` | `text-xs text-slate-500 dark:text-slate-400` | Helper text. |

### 5.5 `src/components/ui/Modal.tsx`
| Line # | Current Code | Refactored Tailwind Utility | Description / Rationale |
|---|---|---|---|
| 78 | `bg-black/80 backdrop-blur-md` | `bg-slate-900/60 dark:bg-black/80 backdrop-blur-md` | Modal backdrop overlay. |
| 87 | `glass-card-elevated max-h-[90vh] flex flex-col my-auto border border-white/15 shadow-2xl shadow-black/80` | `glass-card-elevated max-h-[90vh] flex flex-col my-auto border border-slate-200/80 dark:border-white/15 shadow-2xl shadow-slate-900/20 dark:shadow-black/80` | Modal container border & shadow. |
| 92 | `border-b border-white/10` | `border-b border-slate-200/80 dark:border-white/10` | Header separator. |
| 94 | `text-xl font-semibold text-slate-100 tracking-tight` | `text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight` | Modal title text. |
| 95 | `text-sm text-slate-400` | `text-sm text-slate-500 dark:text-slate-400` | Modal subtitle text. |
| 101 | `text-slate-400 hover:text-slate-100 rounded-xl hover:bg-white/10` | `text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10` | Close button. |
| 115 | `border-t border-white/10 ... bg-slate-900/40 rounded-b-2xl` | `border-t border-slate-200/80 dark:border-white/10 ... bg-slate-50/80 dark:bg-slate-900/40 rounded-b-2xl` | Modal footer background & border. |

### 5.6 `src/components/ui/Skeleton.tsx`
| Line # | Current Code | Refactored Tailwind Utility | Description / Rationale |
|---|---|---|---|
| 21 | `bg-slate-800/60 border border-white/5 animate-shimmer relative overflow-hidden` | `bg-slate-200/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-white/5 animate-shimmer relative overflow-hidden` | Skeleton placeholder block background and border. |

### 5.7 `src/components/ui/Tabs.tsx`
| Line # | Current Code | Refactored Tailwind Utility | Description / Rationale |
|---|---|---|---|
| 35 | `bg-slate-900/80 border border-white/10 rounded-2xl backdrop-blur-xl` | `bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-2xl backdrop-blur-xl` | Tablist bar container. |
| 48 | `isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'` | `isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'` | Tab button text. |
| 55 | `bg-gradient-to-r from-indigo-500/80 to-purple-600/80 rounded-xl shadow-md border border-indigo-400/40` | Same (or `bg-indigo-600 dark:bg-gradient-to-r dark:from-indigo-500/80 dark:to-purple-600/80`) | Active tab animated pill indicator. |
| 64 | `isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'` | `isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'` | Tab counter pill. |

---

## 6. Candidate Modals & Drawers (`src/components/candidates/`)

### 6.1 `CandidateComparisonModal.tsx`
This component contains rich comparison matrices, interactive radar charts, and SVG gauges.

| Area / Line # | Current Hardcoded Dark Code | Refactored Tailwind / Dynamic Style |
|---|---|---|
| `RadialScoreGauge` (124, 143, 145) | `stroke="rgba(255, 255, 255, 0.08)"`<br>`text-slate-100`<br>`text-slate-400` | Background track stroke: dynamic via CSS custom property or class (e.g. `rgba(0, 0, 0, 0.08)` in light, `rgba(255, 255, 255, 0.08)` in dark)<br>`text-slate-900 dark:text-slate-100`<br>`text-slate-500 dark:text-slate-400` |
| Modal Shell (315, 324) | `bg-black/85 backdrop-blur-xl`<br>`glass-card-elevated border-white/15 shadow-black/90` | `bg-slate-900/60 dark:bg-black/85 backdrop-blur-xl`<br>`glass-card-elevated border-slate-200/80 dark:border-white/15 shadow-slate-900/20 dark:shadow-black/90` |
| Header & Sub-Header (328, 335, 342, 384, 388, 395, 412) | `bg-slate-900/70 border-white/10`<br>`text-slate-100`, `text-slate-400`<br>`bg-slate-900/90 border-white/5`<br>`bg-slate-950/80 border-white/10 text-slate-100` (select)<br>`text-indigo-300` | `bg-white/80 dark:bg-slate-900/70 border-slate-200/80 dark:border-white/10`<br>`text-slate-900 dark:text-slate-100`, `text-slate-500 dark:text-slate-400`<br>`bg-slate-50 dark:bg-slate-900/90 border-slate-200/80 dark:border-white/5`<br>`bg-white dark:bg-slate-950/80 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100`<br>`text-indigo-600 dark:text-indigo-300` |
| Candidate Header Cards (473, 491, 494, 544-558) | `border-white/10`<br>`text-slate-100 group-hover:text-indigo-300`<br>`text-slate-400`<br>`border-b border-white/5`<br>`text-slate-200` | `border-slate-200/80 dark:border-white/10`<br>`text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300`<br>`text-slate-500 dark:text-slate-400`<br>`border-b border-slate-200/60 dark:border-white/5`<br>`text-slate-800 dark:text-slate-200` |
| Recharts Radar Chart (591, 594, 607, 610, 616, 635) | `border-white/10`<br>`PolarGrid stroke="rgba(255, 255, 255, 0.12)"`<br>`PolarAngleAxis stroke="#94A3B8" tick={{ fill: '#CBD5E1' }}`<br>`Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', color: '#F8FAFC' }}` | `border-slate-200/80 dark:border-white/10`<br>`PolarGrid`: stroke dynamically passed from theme context or CSS variable (`var(--color-border-glass)`)<br>`PolarAngleAxis tick`: fill `#475569` in light, `#CBD5E1` in dark<br>`Tooltip`: background `#FFFFFF` / text `#0F172A` in light mode, obsidian in dark |
| Venn Overlap Section (665, 670, 706, 711, 717, 739) | `border-emerald-500/25 bg-emerald-500/5`<br>`text-emerald-300`<br>`border-white/10`<br>`text-slate-200`, `text-indigo-300`, `text-rose-300` | `border-emerald-200 dark:border-emerald-500/25 bg-emerald-50/50 dark:bg-emerald-500/5`<br>`text-emerald-800 dark:text-emerald-300`<br>`border-slate-200/80 dark:border-white/10`<br>`text-slate-800 dark:text-slate-200`, `text-indigo-700 dark:text-indigo-300`, `text-rose-700 dark:text-rose-300` |
| Matrix Table (767, 768, 779, 795, 797-948) | `border-white/10`<br>`bg-slate-900/80`<br>`thead: bg-slate-950/60 text-slate-400`<br>`tbody: divide-white/5 text-slate-300`<br>`tr: hover:bg-white/5`<br>`td: text-slate-200 bg-slate-900/30`<br>`progress track: bg-slate-800` | `border-slate-200/80 dark:border-white/10`<br>`bg-slate-50 dark:bg-slate-900/80`<br>`thead: bg-slate-100/80 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400`<br>`tbody: divide-slate-200/80 dark:divide-white/5 text-slate-700 dark:text-slate-300`<br>`tr: hover:bg-slate-50 dark:hover:bg-white/5`<br>`td: text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900/30`<br>`progress track: bg-slate-200 dark:bg-slate-800` |
| Footer (959, 960) | `border-t border-white/10 bg-slate-950/70`<br>`text-slate-400` | `border-t border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-950/70`<br>`text-slate-500 dark:text-slate-400` |

### 6.2 `ResumePreviewDrawer.tsx`
| Area / Line # | Current Hardcoded Dark Code | Refactored Tailwind / Dynamic Style |
|---|---|---|
| `MiniRadialGauge` (68, 86) | `stroke="rgba(255, 255, 255, 0.1)"`<br>`text-slate-100` | Track stroke: `rgba(0, 0, 0, 0.08)` in light, `rgba(255, 255, 255, 0.1)` in dark<br>`text-slate-900 dark:text-slate-100` |
| Drawer Shell (361, 370) | `bg-black/80 backdrop-blur-md`<br>`bg-slate-950/95 border-l border-white/15 shadow-black/90` | `bg-slate-900/60 dark:bg-black/80 backdrop-blur-md`<br>`bg-white/95 dark:bg-slate-950/95 border-l border-slate-200/80 dark:border-white/15 shadow-slate-900/20 dark:shadow-black/90` |
| Drawer Header (374, 383, 386, 405, 420, 436) | `bg-slate-900/80 border-b border-white/10`<br>`text-slate-100`<br>`text-slate-400`<br>`hover:bg-white/10`<br>`bg-slate-900/90 border-white/10 text-slate-300 hover:text-indigo-300` | `bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-white/10`<br>`text-slate-900 dark:text-slate-100`<br>`text-slate-500 dark:text-slate-400`<br>`hover:bg-slate-100 dark:hover:bg-white/10`<br>`bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300` |
| Tab Buttons (470, 483, 496, 509) | `bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800` | `bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800` |
| Tab 1 (527-642) | Stat cards: `glass-card border-white/5 text-slate-100`<br>Summary: `text-slate-200`<br>Experience: `border-white/5 text-slate-100 text-slate-300` | Stat cards: `glass-card border-slate-200/60 dark:border-white/5 text-slate-900 dark:text-slate-100`<br>Summary: `text-slate-700 dark:text-slate-200`<br>Experience: `border-slate-200/60 dark:border-white/5 text-slate-900 dark:text-slate-100 text-slate-600 dark:text-slate-300` |
| Tab 2 Raw Text (656, 665, 681, 699, 700, 728, 732, 737, 1044) | Search bar: `bg-slate-900 border-white/10 text-slate-100`<br>Match badge: `bg-indigo-500/20 text-indigo-300`<br>Doc viewer: `border-white/10 bg-slate-950/90`<br>Doc header: `bg-slate-900/90 text-slate-400`<br>Highlighted row: `bg-indigo-950/40 border-indigo-500/30`<br>Line numbers: `text-slate-600`<br>Line text: `text-slate-200`<br>Mark tag: `bg-amber-400/30 text-amber-200` | Search bar: `bg-white dark:bg-slate-900 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100`<br>Match badge: `bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30`<br>Doc viewer: `border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/90`<br>Doc header: `bg-slate-100/80 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400`<br>Highlighted row: `bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-500/30`<br>Line numbers: `text-slate-400 dark:text-slate-600`<br>Line text: `text-slate-800 dark:text-slate-200`<br>Mark tag: `bg-amber-100 dark:bg-amber-400/30 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-400/40` |
| Tab 3 Keywords (767, 781, 797-827, 835, 869) | Select: `bg-slate-900 border-white/10`<br>Progress bars track: `bg-slate-800`<br>Matched card: `border-emerald-500/20 bg-emerald-500/5`<br>Missing card: `border-rose-500/20 bg-rose-500/5` | Select: `bg-white dark:bg-slate-900 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100`<br>Progress bars track: `bg-slate-200 dark:bg-slate-800`<br>Matched card: `border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-800 dark:text-emerald-300`<br>Missing card: `border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 text-rose-800 dark:text-rose-300` |
| Tab 4 Insights (906, 927, 959, 978, 987) | Fit banner: `text-slate-300`<br>Strengths: `border-emerald-500/20 bg-emerald-500/5`<br>Growth: `border-amber-500/20 bg-amber-500/5`<br>Questions: `border-indigo-500/20 bg-slate-900/80 border-white/5 text-slate-200` | Fit banner: `text-slate-700 dark:text-slate-300`<br>Strengths: `border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 text-slate-800 dark:text-slate-200`<br>Growth: `border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 text-slate-800 dark:text-slate-200`<br>Questions: `border-indigo-200 dark:border-indigo-500/20 bg-slate-100/80 dark:bg-slate-900/80 border-slate-200/60 dark:border-white/5 text-slate-800 dark:text-slate-200` |
| Drawer Footer (1001, 1002) | `border-t border-white/10 bg-slate-950/80`<br>`text-slate-400` | `border-t border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-950/80`<br>`text-slate-500 dark:text-slate-400` |

---

## 7. Implementation Roadmap & Guidelines for Implementers

1. **Step 1: Tailwind CSS v4 Class Variant Setup**
   - In `src/index.css`, append `@variant dark (&:where(.dark, .dark *));` directly below `@import "tailwindcss";`.
   - Update `:root` and `.dark` CSS custom properties so `.glass-card` and standard tokens switch automatically.

2. **Step 2: ThemeProvider Context Integration**
   - Ensure a global React `ThemeProvider` is mounted at root in `main.tsx` or `App.tsx` reading/writing `localStorage.getItem('resumeiq-theme') || 'dark'` (or system preference) and toggling the `dark` class on `document.documentElement`.

3. **Step 3: LayoutShell & Structural Shell Refactor**
   - Apply the class mappings from Section 4 to `LayoutShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`, `MobileNav.tsx`, and `AmbientGlow.tsx`.

4. **Step 4: Shared UI Primitives Refactor**
   - Apply the class mappings from Section 5 to `Badge.tsx`, `Button.tsx`, `Card.tsx`, `Input.tsx`, `Modal.tsx`, `Skeleton.tsx`, and `Tabs.tsx`.

5. **Step 5: Complex Candidate Modals Refactor**
   - Apply class and dynamic stroke mappings to `CandidateComparisonModal.tsx` and `ResumePreviewDrawer.tsx`.
   - Verify Recharts Radar Chart renders cleanly in both themes without unreadable axis text.
