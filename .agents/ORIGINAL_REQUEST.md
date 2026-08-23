# Original User Request

## 2026-08-23T11:09:59Z

Redesign the entire frontend of ResumeIQ — an AI Resume Parser and Candidate Screening System — to achieve a production-ready, competition-grade HR SaaS UI/UX. The current frontend is functional but visually basic. Transform every page into a bold, creative, visually distinctive interface with rich interactions, animated data visualizations, glassmorphism elements, and polished micro-interactions. The result should look like it belongs on Product Hunt, not in a student project.

Working directory: c:\Users\ARYAN - AYUSH\OneDrive\Desktop\resume parser\frontend
Integrity mode: development

## Existing Stack & Codebase Context

- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS 4 + custom CSS (index.css defines theme colors via `@theme`)
- **Animation**: Framer Motion (already installed)
- **Charts**: Recharts (installed but unused)
- **Icons**: Lucide React
- **HTTP client**: Axios
- **Toast notifications**: react-hot-toast
- **Current color palette**: soft-green `#A7C4AA`, dark-green `#2E4C33`, light-green `#D9E6D7`

The backend is a FastAPI server at `http://localhost:8000/api` with these endpoints already working:
- `GET /api/health` — health check
- `GET /api/candidates` — returns all candidates with nested `skills`, `experiences`, `educations`
- `GET /api/candidates/{id}` — single candidate with full profile
- `DELETE /api/candidates/{id}` — delete candidate
- `POST /api/resumes/upload` — upload PDF/DOCX, returns `{candidate_id}`
- `GET /api/jobs` — list jobs
- `POST /api/jobs` — create job (body: `{title, company, description, required_skills, preferred_skills, minimum_experience_years, education_requirement, location}`)
- `GET /api/jobs/{id}` — single job
- `DELETE /api/jobs/{id}` — delete job
- `GET /api/jobs/{job_id}/candidates` — ranked candidates for a job with match scores
- `GET /api/dashboard/stats` — returns `{total_candidates, total_jobs, average_match_score}`

### Current pages (all need redesign):
1. **Dashboard** (`/`) — stats cards + how-it-works + capabilities list
2. **Upload** (`/upload`) — drag-and-drop with circular progress animation
3. **Candidates** (`/candidates`) — card grid of parsed candidates (fetches from API)
4. **Candidate Profile** (`/candidates/:id`) — full profile with skills, experience, education (fetches from API)
5. **Jobs** (`/jobs`) — job listing cards
6. **Job Candidates** (`/jobs/:jobId/candidates`) — ranked candidate matches for a job

### Current component structure:
- `components/layout/Sidebar.tsx` — dark-green navigation sidebar
- `components/layout/Topbar.tsx` — welcome header bar
- `components/ui/Button.tsx` — reusable button with 3 variants
- `components/ui/Card.tsx` — basic rounded card
- `services/api.ts` — Axios API client

## Requirements

### R1. Complete Visual Redesign of All Pages
Redesign all 6 pages and all layout/UI components to achieve a bold, distinctive visual identity. The design team has creative freedom to propose a new color palette, typography system, and visual language — it does not need to stay soft-green. The design should incorporate glassmorphism effects (frosted glass cards, backdrop blur), sophisticated spacing and typography hierarchy, and feel like a premium SaaS product. Every page must be fully responsive (mobile, tablet, desktop).

### R2. Animated Data Visualizations & Interactive Elements
Add meaningful data visualizations throughout the app. The Dashboard should have real charts (using Recharts or any suitable library). The Candidate Profile should have skill visualizations (radar/spider charts, proficiency bars, or similar). Job matching should show visual score breakdowns (gauges, comparison bars). Upload should have an engaging, animated upload experience.

### R3. Micro-Interactions & Motion Design
Add polished micro-interactions: button hover/active states with animation, page transition animations, staggered list/card entrance animations, skeleton/shimmer loading states while data fetches, toast notifications with custom styling, smooth scroll behaviors, and drag-and-drop upload enhancement with visual feedback.

### R4. 1-2 High-Impact New Features
Add up to 2 new features that significantly elevate the product, such as: a resume preview/viewer panel, a candidate comparison view, a settings/preferences page, a search/filter bar for candidates and jobs, bulk file upload with a file queue, or any other feature the team determines would make the biggest impact. These must integrate with the existing backend API endpoints.

## Acceptance Criteria

### Visual Quality
- [ ] Every page has been redesigned — no page retains its old "basic prototype" appearance
- [ ] A consistent design system is evident (colors, spacing, typography, component patterns)
- [ ] Glassmorphism or equivalent depth effects are used in at least 3 distinct places
- [ ] The app is responsive: usable on viewports from 375px to 1920px width
- [ ] The app does not look like a tutorial project — it has a distinctive, professional visual identity

### Data Visualizations
- [ ] Dashboard contains at least 2 real chart types rendered from API data (not placeholder text)
- [ ] Candidate Profile has at least 1 skill/competency visualization (radar, bars, tags cloud, or similar)
- [ ] Job matching page shows match scores with visual indicators (not just plain numbers)

### Interactions & Motion
- [ ] Page transitions are animated (not just instant route swaps)
- [ ] Cards/list items use staggered entrance animations
- [ ] Loading states use skeleton/shimmer placeholders (not blank screens or plain spinners)
- [ ] At least 5 distinct micro-interactions exist across the app (button effects, hover states, toggles, etc.)

### New Feature(s)
- [ ] At least 1 new feature is implemented that doesn't exist in the current app
- [ ] The new feature is functional and connected to the backend API (not just a UI shell)

### Technical
- [ ] The app builds without errors (`npm run build` exits with code 0)
- [ ] The app renders correctly in a browser at `http://localhost:5173` when run with `npm run dev`
- [ ] No existing API integrations are broken (upload, candidates list, candidate profile, jobs, matching still work)

## 2026-08-23T11:21:37Z

The user specifically requested to apply the `ui-ux-pro-max` skill guidelines to this redesign. Please ensure the team strictly follows these professional UI/UX standards in your implementation:

1. **Icons**: Use **Phosphor** (`@phosphor-icons/react`) or **Heroicons** (`@heroicons/react`). **NEVER use emojis** for structural icons. Maintain consistent stroke widths, filled/outline discipline, and sizing tokens.
2. **Spacing & Rhythm**: Stick to a strict 4px/8px spacing rhythm for padding, gaps, and sections. Define clear vertical rhythm tiers.
3. **Interactions**: Provide clear hover/pressed feedback (using opacity/transform/elevation). Use Framer Motion for page transitions and staggered entrance animations. Ensure interactions don't cause layout shift/jitter.
4. **Accessibility**: Ensure minimum touch/click targets of 44px. Use `aria-hidden="true"` for decorative icons. Ensure semantic HTML, proper contrast (4.5:1 for text), and clear focus states.
5. **Color & Theme**: Use token-driven theming. If implementing dark mode, ensure states are distinguishable in both modes and text contrast is preserved. Use glassmorphism tastefully as requested in the prompt.
6. **Layout**: Ensure responsive design that adapts gutters/insets for larger screens and maintains readable text line lengths.

Please incorporate these principles into the design tokens, components, and page layouts you are building.

## 2026-08-23T11:43:42Z

CRITICAL USER FEEDBACK:

1. **Aesthetics ("Vibe Code" Issue):** The user strongly dislikes the current aesthetic, calling it "vibe code" because it uses a generic flat black background with glowing components. **Pivot the design immediately.** Move away from the generic neon/hacker dark theme. Create a sophisticated, professional HR SaaS look. Reduce the harsh glows. Use a more nuanced color palette (e.g., premium light mode, or a very sophisticated deep slate/emerald theme). It must look like a serious enterprise tool, not a generic "vibe" template.
2. **API Connection / Functionality:** The frontend is currently showing "Failed to load candidates. Make sure the backend is running." Ensure that `api.ts` is perfectly mapped to `http://localhost:8000/api` and that all error states degrade gracefully.
3. **Upload System:** The user specifically wants to ensure the Resume/PDF upload section is completely functional. Verify the `FormData` posting logic, the file acceptance types, and the success routing (navigating to the candidate profile after upload).
4. **Overall Component Polish:** Ensure every single component on the dashboard and throughout the UI is fully functional and interactive, not just a static mockup.

Please implement these corrections across the entire application immediately.
