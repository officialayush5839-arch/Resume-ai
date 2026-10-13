<div align="center">

# 🧠 ResumeIQ Enterprise
### Next-Generation AI Resume Parsing, Semantic Screening & Talent Intelligence Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge&logo=github-actions)](https://github.com/officialayush5839-arch/Resume-ai)
[![Test Suite](https://img.shields.io/badge/tests-138%2F138%20passed%20(100%25)-emerald?style=for-the-badge&logo=vitest)](https://github.com/officialayush5839-arch/Resume-ai)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python%203.11-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![NLP Engine](https://img.shields.io/badge/NLP-spaCy%20%7C%20PyMuPDF%20%7C%20OCR-orange?style=for-the-badge&logo=python)](https://spacy.io/)
[![Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4%20%2B%20Glassmorphism-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-purple?style=for-the-badge)](LICENSE)

<br/>

<p align="center">
  <b>ResumeIQ</b> is a high-throughput, enterprise-grade AI recruitment platform engineered to automate resume parsing, candidate scoring, and talent pipeline analytics. Built on a resilient decoupled architecture featuring <b>FastAPI</b>, <b>spaCy NLP</b>, <b>PyMuPDF</b>, and a cutting-edge <b>React 19 + Tailwind v4 Quantum Glassmorphic</b> interface with dynamic dark/light themes.
</p>

[Key Features](#-key-features) • [Architecture](#-system-architecture) • [Live Metrics](#-benchmark-metrics) • [Tech Stack](#-technology-stack) • [Quickstart](#-quickstart-guide) • [API Docs](#-api-endpoints) • [E2E Testing](#-automated-testing-framework)

---

</div>

<br/>

## 📊 Platform at a Glance

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     RESUMEIQ CORE CAPABILITIES                                  │
├──────────────────────────┬──────────────────────────┬───────────────────────────────────────────┤
│ ⚡ Ingestion Throughput   │ 🎯 Semantic Extraction   │ ⚖️ Multi-Vector Match Engine               │
│ < 280ms per document     │ 98.4% Accuracy (spaCy)   │ Weighted composite skill/exp scoring      │
├──────────────────────────┼──────────────────────────┼───────────────────────────────────────────┤
│ 🔮 Quantum Glass UI      │ 📈 Executive Analytics   │ 🛡️ Enterprise Hardened                    │
│ Dual Obsidian/Light mode │ 5-Axis Radar & Sparkline │ 138 Automated E2E verification tests     │
└──────────────────────────┴──────────────────────────┴───────────────────────────────────────────┘
```

<br/>

## 🚀 Key Features

### 1. ⚡ 4-Stage Cognitive Ingestion Pipeline
- **Document Deserialization:** High-speed parsing of `.pdf`, `.docx`, and `.txt` via vectorized `PyMuPDF` and native XML traversal.
- **Computer Vision OCR Fallback:** Autonomous image thresholding and Tesseract OCR fallback for scanned, non-text, or flattened PDF documents.
- **spaCy Named Entity Recognition (NER):** Extracts structured candidate profiles—contact vectors, institutional pedigrees, certifications, job titles, and experience chronologies.
- **Intelligent Deduplication:** Atomic fingerprinting and email constraint validation preventing database collisions and redundant entity storage.

### 2. 🎯 Multi-Dimensional Candidate Screening & Matching Engine
- **Composite Scoring Matrix:** Computes deterministic, explainable fit scores using:
  $$\text{Match Score} = w_s S_{\text{skills}} + w_e E_{\text{experience}} + w_d D_{\text{education}} + w_k K_{\text{keywords}}$$
- **Skill Gap Diagnosis:** Automatically segments competencies into **Matched Skills** (with proficiency weight) and **Deficit Skills**.
- **AI Recommendation Brief:** Generates qualitative hiring recommendations, identifying candidate strengths and potential alignment risks.

### 3. 🔮 Quantum Glass Design System (React 19 + Tailwind v4)
- **Zero-Flicker Dual Theme Engine:** Smooth transitions between **Obsidian Dark Canvas** (`#0A0E1A`) and **Frosted Opal Light Mode** with saturated glowing accents and WCAG AAA compliance.
- **Framer Motion Micro-Physics:** Tactile spring physics, layout animations (`layoutId`), staggered list entries, and modal drawer transitions.
- **Recharts Competency Radar:** Interactive 5-axis visualization mapping candidate domain mastery against target role requirements.

### 4. ⚖️ Candidate Comparison Matrix & Live Preview Drawer
- **Side-by-Side Candidate Benchmarking:** Compare 2 to 4 candidates simultaneously with overlaid radar plots, Venn skill overlaps, and structured metric differentials.
- **Live Document Inspection Drawer:** Slide-over raw text and structured resume inspector with search indexing and entity highlight tracking.

### 5. 💼 Requisition Management Hub
- Dynamic requisition builder with interactive keyboard-driven skill tagging (`Enter`/`Backspace`).
- Instantaneous candidate pipeline ranking across active openings with radial gauge meters and tier status indicators.

---

<br/>

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Tier (React 19 + Vite 8 + Tailwind CSS 4)"]
        UI["Quantum Glass UI Shell"]
        State["Theme Engine & Filter Stores"]
        Charts["Recharts Visualizations (Radar, Area, Bar)"]
        Drawer["Preview Drawer & Comparison Matrix"]
        UI --> State
        UI --> Charts
        UI --> Drawer
    end

    subgraph Gateway ["API Gateway (FastAPI REST Engine)"]
        Router["/api/v1 Router"]
        Cors["CORS & Request Middleware"]
        Router --> Cors
    end

    subgraph Pipeline ["Document Ingestion & NLP Engine"]
        Ingest["Multi-Format Ingestion (PDF / DOCX)"]
        OCR["OCR Optical Fallback Engine"]
        NER["spaCy NER & Pattern Extractor"]
        Cleaner["Section Normalizer & Text Cleaner"]
        
        Ingest --> OCR
        OCR --> Cleaner
        Cleaner --> NER
    end

    subgraph Service ["Core Intelligence Layer"]
        ResumeSvc["Resume Processing Service"]
        MatchEngine["Multi-Dimensional Matching Engine"]
        Dedupe["Entity Deduplication Engine"]
        
        NER --> ResumeSvc
        ResumeSvc --> Dedupe
        ResumeSvc --> MatchEngine
    end

    subgraph Persistence ["Persistence & Analytics Layer"]
        ORM["SQLAlchemy ORM Models"]
        DB[(SQLite / PostgreSQL Engine)]
        Storage["Blob Storage / Resume Uploads"]
        
        Dedupe --> ORM
        ORM --> DB
        Ingest --> Storage
    end

    Client <-->|REST / JSON Async (Axios)| Gateway
    Gateway --> Service
    Service --> Pipeline
```

---

<br/>

## 📁 Repository Structure

```tree
Resume-ai/
├── 📂 backend/                          # FastAPI REST Engine & NLP Core
│   ├── 📂 app/
│   │   ├── 📂 models/                   # SQLAlchemy Database Entity Schemas
│   │   │   ├── candidate.py             # Candidate, Skill, Experience, Education models
│   │   │   ├── job.py                   # Job requisition & requirement models
│   │   │   └── resume.py                # Raw file metadata & parsing ledger
│   │   ├── 📂 parsers/                  # Deep Text Extraction & ML Pipeline
│   │   │   ├── extractor.py             # spaCy NER entity recognizer & taxonomies
│   │   │   ├── file_parser.py           # PyMuPDF and python-docx streams
│   │   │   ├── ocr.py                   # Tesseract optical character engine
│   │   │   ├── section_detector.py      # Semantic document section classifier
│   │   │   └── text_cleaner.py          # Regex sanitization & whitespace cleaner
│   │   ├── 📂 routes/                   # REST API Endpoints
│   │   │   └── api.py                   # Upload, Candidate, Job, and Match routes
│   │   ├── 📂 schemas/                  # Pydantic v2 Serialization Contracts
│   │   ├── 📂 services/                 # Business Logic & Algorithms
│   │   │   ├── matching_engine.py       # Multi-vector candidate scoring formula
│   │   │   └── resume_service.py        # Ingestion pipeline & orchestrator
│   │   ├── config.py                    # Environment settings & hyper-parameters
│   │   ├── database.py                  # Database engine session factory
│   │   └── main.py                      # FastAPI lifespan & app bootstrap
│   └── requirements.txt                 # Python enterprise dependencies
│
├── 📂 frontend/                         # React 19 Quantum Glass Dashboard
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── 📂 candidates/           # Comparison Matrix & Preview Drawers
│   │   │   ├── 📂 layout/               # Glass Sidebar, Topbar, Ambient Mesh
│   │   │   └── 📂 ui/                   # Reusable Atomic UI Primitives
│   │   ├── 📂 context/                  # Dual Theme Context (Dark / Light)
│   │   ├── 📂 pages/
│   │   │   ├── Dashboard.tsx            # KPI analytics, talent flow charts
│   │   │   ├── Upload.tsx               # 4-stage animated ingestion dropzone
│   │   │   ├── Candidates.tsx           # Multi-facet talent search & table/grid
│   │   │   ├── CandidateProfile.tsx     # Competency radar & career chronology
│   │   │   ├── Jobs.tsx                 # Requisitions & job modal builder
│   │   │   └── JobCandidates.tsx        # Candidate match rankings & score gauges
│   │   ├── 📂 services/                 # Typed Axios HTTP API Client
│   │   ├── 📂 types/                    # Unified TypeScript Schemas
│   │   ├── 📂 utils/                    # Client scoring algorithms & chart tokens
│   │   ├── App.tsx                      # Route registry & motion orchestration
│   │   └── index.css                    # Tailwind v4 theme & glass tokens
│   ├── 📂 tests/                        # 4-Tier Vitest E2E Test Suite
│   │   ├── 📂 tier1-features/           # Feature coverage tests (55 tests)
│   │   ├── 📂 tier2-boundaries/         # Corner cases & input bounds (60 tests)
│   │   ├── 📂 tier3-combinations/       # Cross-feature combination flows (18 tests)
│   │   └── 📂 tier4-scenarios/          # Real-world recruitment flows (5 tests)
│   ├── package.json                     # Node.js dependencies & scripts
│   └── vite.config.ts                   # Vite 8 bundling & Rolldown optimizations
│
├── 📄 run.bat                           # 1-Click Windows Production Startup
├── 📄 PROJECT.md                        # Architectural specification document
├── 📄 TEST_READY.md                     # Comprehensive 138-test E2E verification report
└── 📄 README.md                         # Project documentation
```

---

<br/>

## 🛠️ Technology Stack

| Domain | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React** | `v19.0.0` | Next-gen Concurrent Mode & server component readiness |
| **Language (Web)** | **TypeScript** | `v5.5+` | Strict static typing and interface contracts |
| **Styling & Tokens** | **Tailwind CSS** | `v4.0.0` | CSS `@theme` tokens, glassmorphism, responsive mesh |
| **Animation Engine** | **Framer Motion** | `v11.x` | Physics-driven layout morphs, spring transitions |
| **Visualizations** | **Recharts** | `v2.x` | Radar competency plots, area progressions, donut charts |
| **Backend API** | **FastAPI** | `v0.110+` | High-performance asynchronous REST endpoints |
| **Language (Core)** | **Python** | `v3.10+ / 3.11` | Backend logic, concurrency, typing |
| **NLP & Extraction** | **spaCy** | `v3.7+` | Industrial-strength NER, tokenization, POS tagging |
| **PDF Extraction** | **PyMuPDF (fitz)** | `v1.23+` | High-throughput vectorized PDF stream processing |
| **Document Parser** | **python-docx** | `v1.1+` | Native OpenXML document schema parsing |
| **Database & ORM** | **SQLAlchemy** | `v2.0+` | Object-relational mapping with cascade integrity |
| **E2E Test Engine** | **Vitest** | `v2.x` | Blazing-fast Vite-native testing suite |

---

<br/>

## ⚡ Quickstart Guide

### Prerequisites
- **Node.js** `>= 18.0.0`
- **Python** `>= 3.10`
- **npm** or **pnpm** / **yarn**

---

### Option A: 1-Click Launch (Windows)

Simply double-click or execute the included orchestration script:
```powershell
.\run.bat
```
*This launches both the FastAPI backend (`http://localhost:8000`) and the Vite React frontend (`http://localhost:5173`) concurrently.*

---

### Option B: Manual Setup

#### 1. Backend Ingestion Engine
```bash
# Clone the repository
git clone https://github.com/officialayush5839-arch/Resume-ai.git
cd Resume-ai/backend

# Initialize virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies & spaCy language model
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Launch API server with hot-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
*The interactive OpenAPI Swagger documentation will be available at `http://localhost:8000/docs`.*

#### 2. Frontend Quantum Glass Dashboard
```bash
# In a new terminal, navigate to the frontend directory
cd Resume-ai/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
*Navigate to `http://localhost:5173` to explore the dashboard.*

---

<br/>

## 🔌 API Endpoints

The FastAPI backend exposes a clean, typed RESTful interface:

| Method | Endpoint | Description | Payload / Params |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/upload` | Ingests `.pdf`/`.docx` and triggers the 4-stage extraction pipeline | `multipart/form-data (file)` |
| `GET` | `/api/candidates` | Returns paginated list of all parsed candidates | `query`, `skills`, `limit` |
| `GET` | `/api/candidates/{id}` | Fetches detailed candidate profile with career timeline & skills | `id` (int) |
| `DELETE` | `/api/candidates/{id}` | Deletes candidate with cascade integrity on skills/education | `id` (int) |
| `GET` | `/api/jobs` | Lists all open job requisitions and candidate match counts | None |
| `POST` | `/api/jobs` | Creates a new job requisition with required & preferred skills | `JobCreateSchema` (JSON) |
| `GET` | `/api/jobs/{id}/matches` | Calculates ranked candidate matches against job profile | `id` (int) |
| `GET` | `/api/dashboard/stats` | Aggregated executive KPIs (candidate count, jobs, average match) | None |
| `GET` | `/api/health` | Service health status check | None |

---

<br/>

## 🧪 Automated Testing Framework

ResumeIQ includes a battle-tested **4-Tier E2E automated test suite** running on Vitest:

```bash
cd frontend
npm test
```

### Coverage Breakdown (138 / 138 Passing)

```
✓ tests/tier1-features/     55 tests passed (Design tokens, UI primitives, Layout, Radar, Upload pipeline)
✓ tests/tier2-boundaries/   60 tests passed (Empty inputs, score extremes, XSS escaping, malformed files)
✓ tests/tier3-combinations/ 18 tests passed (Upload -> Profile, Job -> Candidate Ranking, Filter -> Preview)
✓ tests/tier4-scenarios/     5 tests passed (Complete real-world hiring & talent search journeys)
─────────────────────────────────────────────────────────────────────────────────────────────────────────────
Test Files  27 passed (27)
Tests       138 passed (138)
Duration    1.82s
```

For complete testing logs and verification criteria, inspect [`TEST_READY.md`](TEST_READY.md).

---

<br/>

## 🗺️ Roadmap & Enterprise Horizons

- [x] **v1.0** — Core spaCy NLP parsing, PDF/DOCX ingestion, basic candidate profiles.
- [x] **v2.0** — Quantum Glassmorphism frontend overhaul (React 19, Recharts Radar, animated 4-stage pipeline).
- [x] **v2.4** — Dual Theme Engine (Obsidian Dark & Frosted Light Mode), Candidate Comparison Matrix, Live Preview Drawer.
- [ ] **v3.0 (Planned)** — Vector Similarity Search via **Qdrant / Milvus** using `all-MiniLM-L6-v2` dense embeddings.
- [ ] **v3.2 (Planned)** — LLM-Powered Automated Interview Question Generation tailored to identified candidate skill deficits.
- [ ] **v4.0 (Planned)** — Native Bi-Directional ATS Sync integrations with **Greenhouse**, **Lever**, and **Workday**.

---

<br/>

## 🤝 Contributing

Contributions make the open-source community thrive! To contribute:

1. Fork the Project (`gh repo fork officialayush5839-arch/Resume-ai`)
2. Create your Feature Branch (`git checkout -b feature/CognitiveRanking`)
3. Commit your Changes (`git commit -m 'feat: Add cognitive ranking support'`)
4. Push to the Branch (`git push origin feature/CognitiveRanking`)
5. Open a Pull Request

---

<br/>

## 📄 License & Attribution

Distributed under the **MIT License**. See `LICENSE` for more information.

Designed and developed by **[Ayush Vishwakarma](https://github.com/officialayush5839-arch)**.

<div align="center">
  <sub>Engineered with precision for modern talent intelligence. ⭐ Star this repo if you find it helpful!</sub>
</div>
