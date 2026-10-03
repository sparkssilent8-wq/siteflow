# SITEFLOW Architecture & Visual Audit

**System Name**: SITEFLOW — Planning-to-Execution Intelligence for Infrastructure Projects  
**Smart India Hackathon 2026**: Problem Statement 26122  

---

## 1. Executive Assessment of Current System

### A. What is Already Working & Verified
- **FastAPI Backend (Port 8000)**: Fully functional with 10 dedicated routers (`projects`, `activities`, `schedule`, `progress`, `matching`, `site_updates`, `review`, `variance`, `analytics`, `reports`, `ml_proxy`).
- **SQLite Database & SQLAlchemy ORM**: Schema with 9 relational models (`Project`, `Activity`, `ProgressUpdate`, `SiteUpdate`, `MatchResult`, `ReviewDecision`, `Report`, `RiskPrediction`, `Recommendation`).
- **Trained Machine Learning Models (`ml/saved_models/`)**:
  - `delay_classifier.joblib`: GradientBoostingClassifier (95.7% delay accuracy).
  - `duration_regressor.joblib`: GradientBoostingRegressor (3.10 days MAE).
  - `scaler.joblib`: StandardScaler feature transformer.
- **Hybrid Matching Engine**: TF-IDF n-gram vectorizer combined with domain token and pipe size regex extraction.
- **Automated Test Suite**: 13/13 passing Pytest tests covering APIs, matching, variance, and the end-to-end evaluation flow (`PIP-L6-024` 45% -> 60% review approval).
- **Flagship Dataset**: "East-West Gas Pipeline Expansion" with L1–L6 activities across Civil, Piping, Mechanical, Electrical, HSE.

### B. Identified Gaps & Areas to Upgrade
1. **3D Infrastructure Intelligence & Visual DNA**:
   - The landing page needs a real Three.js 3D pipeline network with interactive nodes, flowing data particles, and mouse parallax.
   - Floating cards in 3D perspective (`PIP-L6-024`, `AI Risk 83%`, `Schedule Variance +4.2 Days`, `Match Confidence 73%`) need smooth hover tilts and depth.
2. **Visual Continuity Across App**:
   - The internal application (Dashboard, Activities, Review Queue, AI Risk, Simulation) needs to inherit the exact same futuristic command center aesthetic: glass surfaces, cyan rim lights, floating panels, animated KPI meters, and Framer Motion transitions.
3. **Interactive 14-Section Landing Page**:
   - Needs full 14-section showcase (Problem transformation animation, 5-stage bridge, interactive workflow stepper, 3D digital twin preview, What-if interactive widget, Why SITEFLOW comparison).
4. **Enhanced Reusable UI Component System**:
   - Create `GlassCard`, `Floating3DCard`, `MetricCard`, `RiskGauge`, `FactorContributionBar`, `SimulationSlider`, and animated badges.

---

## 2. Component Migration & Preservation Strategy

| Component / Layer | Action | Strategy |
| :--- | :--- | :--- |
| **Backend APIs & Database** | **Preserve 100%** | Keep all FastAPI endpoints, SQLAlchemy models, and SQLite data intact. |
| **ML Engine & Models** | **Preserve 100%** | Keep trained GradientBoosting models and feature extraction pipelines. |
| **Landing Page** | **Upgrade & Elevate** | Implement Three.js 3D pipeline canvas, 4 floating perspective cards, and complete 14-section narrative. |
| **Dashboard & Shell** | **Upgrade & Elevate** | Add animated KPI cards, glass panels, ambient lighting, and S-Curve visualizations. |
| **Activities & Detail Modal** | **Upgrade & Elevate** | Add dense glassmorphic table, animated timeline drawer, and quick AI Risk triggers. |
| **Site Update & Review Queue** | **Upgrade & Elevate** | Enhance side-by-side verification cards, real-time match confidence meter, and photo proof viewer. |
| **AI Risk & Simulation** | **Upgrade & Elevate** | Circular risk gauges, SHAP factor contribution bars, and real-time What-If sliders. |

---

## 3. Implementation Action Plan

1. **3D & Animation Infrastructure**: Build `PipelineNetwork3D.jsx` using Three.js with pipeline geometry, glowing nodes, data particles, and mouse parallax.
2. **Reusable Design System**: Implement `GlassCard`, `Floating3DCard`, `MetricCard`, and CSS design tokens in `index.css`.
3. **Cinematic Landing Page**: 14-section layout with interactive workflow stepper and 3D hero.
4. **Futuristic App Layout**: Navbar with live system status, collapsible sidebar with glowing indicators, and guided demo modal.
5. **Upgraded Application Pages**: All 11 pages styled with the unified futuristic command center visual identity.
6. **Verification**: Run `npm run build`, execute full test suite, and verify live servers on ports 8000 & 5173.
