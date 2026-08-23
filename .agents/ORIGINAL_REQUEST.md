# Original User Request

## 2026-08-23T12:45:47Z

Implement a complete Light/Dark mode theming system for the ResumeIQ frontend. The application is currently hardcoded entirely in dark mode (using utility classes like `bg-slate-900`, `text-slate-100`, `border-white/10`, and dark ambient mesh gradients). Refactor the codebase to support both light and dark modes flawlessly, and add a toggle for the user.

Working directory: c:\Users\ARYAN - AYUSH\OneDrive\Desktop\resume parser\frontend
Integrity mode: development

## Requirements

### R1. Theme Provider & State Management
Implement a React Context (e.g., `ThemeProvider`) to manage the current theme state (`'light'` or `'dark'`), defaulting to the user's system preference or persisting via `localStorage`.

### R2. Global CSS & Tailwind Refactor
Refactor `index.css` and all `.tsx` components (Dashboard, Profile, Candidates, Jobs, Sidebar, Topbar, etc.). Replace hardcoded dark utility classes with responsive Tailwind classes using the `dark:` variant (e.g., `bg-slate-50 dark:bg-slate-900`, `text-slate-900 dark:text-slate-100`, `border-slate-200 dark:border-white/10`). 
- For light mode, the palette should be clean, bright, and professional (soft slates/grays, emerald/indigo accents).
- Ensure the glassmorphism effects (`.glass-card`) look premium in light mode (e.g., frosted white/gray with subtle shadows) just as they do in dark mode.
- Update the `ambient-glow-mesh` in `index.css` to have a light mode equivalent.

### R3. Profile Section Toggle
Add the Light/Dark mode toggle button explicitly in the top right corner of the **Candidate Profile** section (next to the Refresh and Delete Profile buttons). The toggle should use an icon (Sun for Light, Moon for Dark) and immediately switch the app's global theme when clicked.

## Acceptance Criteria

### Functionality
- [ ] Clicking the toggle in the Candidate Profile instantly switches the entire application between Light and Dark mode.
- [ ] Theme preference is saved to `localStorage` and persists across page reloads.

### Visual Quality
- [ ] In Light Mode, backgrounds are light (e.g. slate-50 or white), text is dark (slate-900), and borders are subtle gray.
- [ ] In Dark Mode, the UI retains its exact current Obsidian/Slate & Emerald aesthetic.
- [ ] Glassmorphism (`.glass-card`), Recharts, and ambient glows adapt correctly to both themes.
- [ ] No unreadable text (e.g., white text on white background) exists in light mode.

### Technical
- [ ] The app builds without errors (`npm run build` exits with code 0).
- [ ] Replaced at least 90% of the hardcoded `bg-slate-900` / `border-white/10` style classes with dynamic `dark:` variants across the major pages.
