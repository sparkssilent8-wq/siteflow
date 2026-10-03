# SITEFLOW

> **"Planning-to-Execution Intelligence for Infrastructure Projects"**

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH%202026-Problem%20Statement%2026122-cyan.svg)](https://www.sih.gov.in/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB.svg)](https://react.dev/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn%20(95.7%25%20Acc)-F7931E.svg)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🏗️ 1. Executive Summary & SIH 2026 Problem Statement

**Smart India Hackathon 2026 Problem Statement 26122:**
*"Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management: Real-Time Actual Progress Tracking (Planning-to-Execution Bridge)"*

### The Core Problem
Infrastructure projects have detailed schedules cascading from **L1 to L6** (where L5/L6 are actual executable site tasks). In existing systems:
- Project schedules exist separately in Primavera/MS Project at headquarters.
- Site engineers provide progress through fragmented WhatsApp texts, daily logs, and site photos.
- Actual progress is captured manually, leading to 7–14 day reporting lags.
- Delays, supply chain chokes, and schedule variance are detected too late.
- **Project managers lack a single source of execution intelligence.**

### The SITEFLOW Solution
SITEFLOW creates a direct, automated bridge:
$$\text{PLANNING} \longrightarrow \text{EXECUTION} \longrightarrow \text{VERIFICATION} \longrightarrow \text{ANALYTICS} \longrightarrow \text{PREDICTION}$$

> *"Primavera tells us what should happen. Site reports tell us what happened. SITEFLOW connects the two and tells us what it means."*

---

## ⚡ 2. Core 5-Stage Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SITEFLOW SYSTEM PIPELINE                         │
└─────────────────────────────────────────────────────────────────────────────┘

  [ 1. PLAN ]      Import Schedule (CSV/XLSX) ──▶ L1 to L6 WBS Hierarchy Extraction
                         │
                         ▼
  [ 2. EXECUTE ]   Multi-Modal Field Capture (Text / Daily Log / Photo / Quantity)
                         │
                         ▼
  [ 3. VERIFY ]    Intelligent Hybrid NLP Matcher (TF-IDF + Domain Entity Boost)
                         │
                         ├─▶ Match Confidence Score (e.g. 76%)
                         └─▶ Human-in-the-Loop Review Queue ──▶ Approve / Reject
                                 │
                                 ▼ (Approved)
  [ 4. ANALYZE ]   Immutable Progress History + Mathematical Variance Engine
                         │
                         ├─▶ Planned vs Actual S-Curve
                         └─▶ Earned Duration & Slippage Waterfall
                                 │
                                 ▼
  [ 5. PREDICT ]   Explainable ML Delay Risk & What-If Simulation Engine
                         │
                         ├─▶ Predicted Remaining Days (80% Confidence Interval)
                         ├─▶ Execution Anomaly Detection (Supply chain/Crew collapse)
                         ├─▶ Transparent Factor Contributions (SHAP-style)
                         └─▶ What-If Simulation (+20% Manpower ──▶ Compresses Delay)
```

---

## 🚀 3. Key Differentiators & Features

1. **L1 → L6 WBS Hierarchy Navigator**: Full support for complex infrastructure packages across Civil, Piping, Mechanical, Electrical, and HSE.
2. **Hybrid Intelligent Activity Matching Engine**: Combines TF-IDF n-gram cosine similarity with domain token regex (pipe sizes, equipment tags, action verbs) to match natural language updates with confidence scoring.
3. **Human-In-The-Loop Review Queue**: Side-by-side verification interface comparing submitted field notes and photos against suggested schedule tasks.
4. **Mathematical Variance & S-Curve Engine**: Computes exact progress variance ($Actual\% - Planned\%$), Earned Duration, and Schedule Slippage Days.
5. **Explainable ML Delay Risk (95.7% Accuracy)**: GradientBoosting model predicting delay probability and remaining duration with transparent factor contribution weights.
6. **"What-If" Simulation Sandbox**: Real-time sliders for Manpower, Equipment Uptime, and Material Expediting that calculate exact execution days saved.
7. **Daily Progress Report (DPR) Ingestion**: Ingests PDF/TXT site reports and automatically extracts line items.
8. **Interactive Guided SIH Demo Mode**: One-click judge walkthrough built right into the top navigation.

---

## 💻 4. Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, Pydantic v2, SQLite (zero-config local persistence).
- **ML / AI**: Scikit-learn (GradientBoostingClassifier, GradientBoostingRegressor, IsolationForest), Joblib, NumPy, Pandas.
- **Data Formats**: CSV, XLSX, JSON, PDF (PyPDF).
- **Zero Paid API Dependencies**: Fully self-contained local execution.

---

## 📂 5. Monorepo Directory Structure

```
siteflow/
├── frontend/                     # React + Vite Enterprise Dashboard
│   ├── src/
│   │   ├── api/                  # Typed REST API Client
│   │   ├── components/           # Badges, Navbar, Sidebar, GuidedDemoModal
│   │   ├── layouts/              # AppLayout (Industrial Dark Theme)
│   │   ├── pages/                # 11 Dedicated Pages
│   │   │   ├── LandingPage.jsx   # Public Problem-Solution Showcase
│   │   │   ├── Dashboard.jsx     # Executive KPIs & S-Curve
│   │   │   ├── Projects.jsx      # Project List & Creation
│   │   │   ├── Schedule.jsx      # WBS Hierarchy (L1-L6) & Schedule Import
│   │   │   ├── Activities.jsx    # L5/L6 Activity Register & Audit Drawer
│   │   │   ├── SiteUpdate.jsx    # Multi-Modal Field Capture
│   │   │   ├── ReviewQueue.jsx   # Human-in-the-Loop Verification
│   │   │   ├── Variance.jsx      # Schedule Variance & Slippage Leaderboard
│   │   │   ├── AIRisk.jsx        # ML Delay Risk & Factor Contributions
│   │   │   ├── Simulation.jsx    # What-If Scenario Sandbox
│   │   │   ├── Reports.jsx       # DPR / PDF Document Ingestion
│   │   │   └── Settings.jsx      # Health Diagnostics & Sample Datasets
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # FastAPI Backend Server
│   ├── api/                      # Routers for all 10 domain services
│   ├── database/                 # SQLAlchemy DB Engine (SQLite)
│   ├── models/                   # 9 Relational Models
│   ├── schemas/                  # Pydantic v2 Schemas
│   ├── services/                 # Matching, Variance, Schedule & DPR Services
│   ├── seed_data.py              # Realistic "East-West Pipeline" Dataset
│   ├── main.py                   # FastAPI Application Entry (Port 8000)
│   └── requirements.txt
│
├── ml/                           # ML Microservice & Models
│   ├── models/                   # Train script & inference service
│   ├── explainability/           # Factor contribution calculator
│   ├── anomaly/                  # Execution anomaly detector
│   ├── features/                 # Normalization pipeline
│   ├── saved_models/             # Serialized joblib models
│   └── main.py                   # ML Standalone Server (Port 8001)
│
├── sample_data/                  # Demo Schedule Files for Judges
│   ├── east_west_pipeline_schedule.xlsx
│   ├── east_west_pipeline_schedule.csv
│   └── sample_daily_site_report.txt
│
├── tests/                        # 13 Comprehensive Automated Tests
│   ├── test_backend_api.py
│   ├── test_matching_engine.py
│   ├── test_ml_service.py
│   └── test_e2e_flow.py
│
├── docker-compose.yml
└── README.md
```

---

## 🛠️ 6. Quick Start & Installation

### Prerequisites
- Node.js (v18+) & npm
- Python (3.10+)

### Step 1: Clone and Set Up Virtual Environment
```bash
cd siteflow
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

### Step 2: Seed Demo Database & Train ML Models
```bash
# Train ML Delay Models
python ml/models/train_model.py

# Seed Flagship Infrastructure Project Dataset
PYTHONPATH=. python backend/seed_data.py
```

### Step 3: Start the Backend Server (Port 8000)
```bash
PYTHONPATH=. python backend/main.py
# API running at: http://localhost:8000 (Swagger docs at: http://localhost:8000/docs)
```

### Step 4: Start the Frontend App (Port 5173)
```bash
cd frontend
npm install
npm run dev
# Dashboard running at: http://localhost:5173
```

---

## 🎯 7. SIH Judge Evaluation Demo Walkthrough

Click **"Launch SIH Demo Walkthrough"** in the top navigation bar or follow these 5 steps:

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| **1. Baseline Schedule** | Open **Schedule & WBS** or **Activities** | Inspect `PIP-L6-024` (*Erect Line 24"-XX Compressor Tie-in*). Notice it is at **45%** (Delayed vs Planned 65%). |
| **2. Field Capture** | Go to **Site Updates Capture** and click the *"Flagship SIH Piping Demo"* sample chip | Input: *"Erection of 24 inch line completed up to 60% with 14 welders on site"*. Real-time match preview scores **76%** match to `PIP-L6-024`. Click Submit. |
| **3. Verification** | Open **Review Queue** | Inspect side-by-side comparison with photo proof and proposed progress delta (+15%). Click **Approve**. |
| **4. Variance Update** | Check **Dashboard** or **Schedule Variance** | Actual progress instantly updates to **60%**, updating the S-Curve and variance metrics in real time. |
| **5. AI Delay Risk** | Open **AI Delay Risk** & **What-If Simulation** | Inspect GradientBoosting delay probability, factor contributions (Material/Manpower drag), and simulate +20% welders to save 4.5 days. |

---

## 🧪 8. Automated Test Suite

Run the full pytest suite (13 passing tests covering API endpoints, matching, ML prediction, and the end-to-end evaluation flow):
```bash
PYTHONPATH=. pytest tests/ -v
```

---

## 📜 9. License & Team
Built for **Smart India Hackathon 2026** — Problem Statement 26122.
Released under the MIT License.
