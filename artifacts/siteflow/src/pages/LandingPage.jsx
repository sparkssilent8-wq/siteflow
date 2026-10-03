import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HardHat, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  TrendingDown, 
  BrainCircuit, 
  Layers, 
  Camera, 
  CheckSquare, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Activity as ActivityIcon,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Send,
  Boxes,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { ConstructionTwin3D } from '../components/ConstructionTwin3D';
import { FloatingTwinCards } from '../components/FloatingTwinCards';

const WORKFLOW_STEPS = [
  {
    id: 1,
    title: "1. Project Schedule Ingestion",
    shortName: "PROJECT SCHEDULE",
    desc: "Ingest multi-tier Primavera P6 or MS Project schedules cascading from L1 (Project Summary) down to L6 field packages.",
    dataInput: "CSV / XLSX / XER schedule files with baseline start, finish, duration, and dependencies.",
    output: "Structured WBS tree and baseline timeline milestones stored in the local intelligence engine."
  },
  {
    id: 2,
    title: "2. L5/L6 Activity Extraction",
    shortName: "L5/L6 ACTIVITIES",
    desc: "Automatically identifies and flags executable site activities (e.g. PIP-L6-024 'Erect Line 24\"-XX').",
    dataInput: "WBS hierarchy level tags and work package descriptions.",
    output: "Granular executable activity register ready for site linking."
  },
  {
    id: 3,
    title: "3. Multi-Modal Site Capture",
    shortName: "SITE UPDATE",
    desc: "Captures field observations, text updates, daily welder logs, quantity reports, and geo-tagged jobsite photos.",
    dataInput: "Natural language site remarks: 'Erection of 24 inch line completed up to 60% with 14 welders'.",
    output: "Standardized raw site update entity with photo attachment."
  },
  {
    id: 4,
    title: "4. Intelligent NLP Activity Matching",
    shortName: "ACTIVITY MATCHING",
    desc: "Hybrid TF-IDF n-gram vectorizer & domain regex matches freeform field text with the schedule activity catalog.",
    dataInput: "Raw field text, pipe dimensions (24 inch, DN600), equipment tags, and discipline keywords.",
    output: "Ranked list of candidate schedule activities with confidence score (e.g., 94% Match)."
  },
  {
    id: 5,
    title: "5. Confidence Scoring & Review Routing",
    shortName: "CONFIDENCE SCORE",
    desc: "Evaluates match confidence against safety thresholds. Matches < 80% or large progress jumps trigger human review.",
    dataInput: "Cosine similarity, domain entity overlap, and historical contractor performance.",
    output: "Routing status: PENDING_REVIEW (Human-in-the-loop verification required)."
  },
  {
    id: 6,
    title: "6. Human-In-The-Loop Verification",
    shortName: "HUMAN REVIEW",
    desc: "Site supervisors and project managers inspect side-by-side comparison of site photo proof vs suggested schedule item.",
    dataInput: "Field photo evidence, submitted progress %, and matched activity baseline.",
    output: "One-click APPROVE, REJECT, or REASSIGN decision with audit log."
  },
  {
    id: 7,
    title: "7. Non-Destructive Progress Update",
    shortName: "PROGRESS UPDATE",
    desc: "Approved update commits new actual progress percentage to the schedule while recording an immutable history record.",
    dataInput: "Verified progress percentage (45% → 60%) and reviewer timestamp.",
    output: "Updated activity state and permanent time-series progress log."
  },
  {
    id: 8,
    title: "8. Planned vs Actual Comparison",
    shortName: "PLANNED vs ACTUAL",
    desc: "Recalculates project-wide and discipline-specific S-Curve progression and earned schedule metrics.",
    dataInput: "Project current snapshot date vs planned start/finish baselines.",
    output: "Earned duration vs elapsed duration across Civil, Piping, Mechanical, Electrical, HSE."
  },
  {
    id: 9,
    title: "9. Schedule Variance Engine",
    shortName: "SCHEDULE VARIANCE",
    desc: "Computes exact schedule variance in days and progress deviation (Actual % - Planned %).",
    dataInput: "Earned value formulas and critical path dependency checks.",
    output: "Slippage metric (+4.2 days behind schedule) and status classification (DELAYED / AT RISK)."
  },
  {
    id: 10,
    title: "10. AI Delay Risk & Simulation",
    shortName: "AI RISK & RECOMMENDATIONS",
    desc: "GradientBoosting ML model forecasts completion dates, flags anomalies, and enables What-If resource simulation.",
    dataInput: "Velocity ratios, crew staffing levels, material availability, and contractor delay history.",
    output: "Delay probability (83%), predicted remaining days (14.7 d), and prescriptive action plan."
  }
];

export function LandingPage() {
  const navigate = useNavigate();
  const [highlightedTarget, setHighlightedTarget] = useState(null);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(WORKFLOW_STEPS[3]);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0D0B] text-siteflow-cream font-sans selection:bg-siteflow-amber/30 selection:text-siteflow-amberBright relative">
      
      {/* 1. Header / Navbar */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#0E1310]/90 backdrop-blur-xl border-b border-siteflow-border/40 py-3 shadow-2xl' 
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-siteflow-amber to-siteflow-amberBright flex items-center justify-center shadow-lg shadow-siteflow-amber/20">
              <HardHat className="w-5 h-5 text-[#0A0D0B] stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-wider text-siteflow-cream font-mono">SITEFLOW</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-siteflow-amber/15 text-siteflow-amberBright border border-siteflow-amber/30">
                  PS 26122
                </span>
              </div>
              <p className="text-[10px] text-siteflow-muted font-mono hidden sm:block">Planning-to-Execution Bridge</p>
            </div>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-mono text-siteflow-muted uppercase tracking-wider font-semibold">
            <a href="#workflow" className="hover:text-siteflow-amber transition-colors">Core Workflow</a>
            <a href="#digital-twin" className="hover:text-siteflow-amber transition-colors">3D Digital Twin</a>
            <a href="#intelligence" className="hover:text-siteflow-amber transition-colors">AI Risk Engine</a>
            <a href="#why-siteflow" className="hover:text-siteflow-amber transition-colors">Why SiteFlow</a>
          </div>

          {/* Launch CTA */}
          <div className="flex items-center gap-3">
            <Link
              to="/sign-in"
              className="hidden sm:inline-flex items-center gap-2 border border-siteflow-border/50 hover:border-siteflow-amber text-siteflow-cream font-semibold px-4 py-2.5 rounded-xl text-xs transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="hidden sm:inline-flex items-center gap-2 text-siteflow-amberBright hover:text-siteflow-cream font-bold px-2 py-2.5 rounded-xl text-xs transition-colors"
            >
              Create Account
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright hover:from-siteflow-amberBright hover:to-siteflow-amber text-[#0A0D0B] font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-xl shadow-siteflow-amber/25 transition-all transform active:scale-95"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>

        </div>
      </nav>

      {/* 2. Hero Section with 3D Construction Digital Twin */}
      <section className="relative pt-28 pb-20 px-6 overflow-hidden min-h-screen flex items-center">
        
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-siteflow-amber/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-siteflow-greenDeep/50 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Hero Editorial Text (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            
            {/* Tag / Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141B16] border border-siteflow-border/40 text-siteflow-amber text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-siteflow-amber animate-pulse"></span>
              <span>SMART INDIA HACKATHON 2026 • PS 26122</span>
            </div>

            {/* Main Editorial Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-siteflow-cream leading-[1.08] font-display uppercase">
              FROM SITE REALITY <br />
              <span className="text-siteflow-amberBright bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright bg-clip-text text-transparent">
                TO SCHEDULE REALITY.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base text-siteflow-muted font-normal leading-relaxed max-w-xl">
              SiteFlow transforms fragmented construction-site information into structured, schedule-linked project intelligence — connecting L5/L6 activities, verifying field updates, and forecasting emerging delay risks.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright hover:from-siteflow-amberBright hover:to-siteflow-amber text-[#0A0D0B] font-extrabold px-7 py-3.5 rounded-xl text-sm shadow-xl shadow-siteflow-amber/25 transition-all transform active:scale-95"
              >
                <span>EXPLORE PROJECT FLOW</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
              
              <a
                href="#workflow"
                className="flex items-center gap-2 bg-[#0E1310] hover:bg-[#141B16] border border-siteflow-border/40 text-siteflow-cream font-semibold px-5 py-3.5 rounded-xl text-sm transition-all"
              >
                <span>SEE AI DEMO</span>
                <ChevronRight className="w-4 h-4 text-siteflow-muted" />
              </a>
            </div>

            {/* Differentiator Quote Banner */}
            <div className="pt-4">
              <div className="p-3.5 rounded-xl bg-[#0E1310]/80 border border-siteflow-border/30 text-xs font-mono text-siteflow-muted leading-relaxed">
                <span className="text-siteflow-amber">"</span>
                <strong className="text-siteflow-cream">Primavera</strong> tells us what <em className="text-siteflow-cream">should</em> happen. 
                <strong className="text-siteflow-amber ml-1.5">Site reports</strong> tell us what <em className="text-siteflow-amber">happened</em>. 
                <strong className="text-siteflow-mint ml-1.5">SITEFLOW</strong> connects the two and tells us <em className="text-siteflow-mint font-bold">what it means</em>.
                <span className="text-siteflow-amber">"</span>
              </div>
            </div>

          </div>

          {/* Right Hero 3D Digital Twin & 10 Floating Cards (7 Cols) */}
          <div className="lg:col-span-7 relative min-h-[580px] lg:min-h-[660px] flex items-center justify-center">
            
            {/* 3D Three.js Canvas */}
            <div className="w-full h-full rounded-2xl overflow-hidden border border-siteflow-border/30 bg-[#0C120E]/50 relative shadow-2xl">
              <ConstructionTwin3D 
                highlightedTarget={highlightedTarget}
                onNodeHover={(target) => setHighlightedTarget(target)}
              />

              {/* Floating Intelligence Cards overlaying 3D Scene */}
              <FloatingTwinCards onHoverCard={(target) => setHighlightedTarget(target)} />
            </div>

          </div>

        </div>

        {/* Live Intelligence Layer Status Strip (Bottom of Hero) */}
        <div className="absolute bottom-3 inset-x-0 max-w-5xl mx-auto px-6 hidden sm:block">
          <div className="p-2.5 rounded-xl bg-[#0E1310]/90 border border-siteflow-border/40 backdrop-blur-md flex items-center justify-between text-[11px] font-mono shadow-2xl">
            <div className="flex items-center gap-2 text-siteflow-amber font-bold">
              <span className="w-2 h-2 rounded-full bg-siteflow-amber animate-ping"></span>
              <span>LIVE PROJECT INTELLIGENCE:</span>
            </div>
            <div className="flex items-center gap-3 text-siteflow-muted">
              <span className="text-siteflow-cream font-semibold">FIELD INPUT</span>
              <span>→</span>
              <span className="text-siteflow-mint font-semibold">AI MATCH</span>
              <span>→</span>
              <span className="text-siteflow-amberBright font-semibold">SCHEDULE LINK</span>
              <span>→</span>
              <span className="text-siteflow-cream font-semibold">PROGRESS</span>
              <span>→</span>
              <span className="text-rose-400 font-semibold">RISK</span>
            </div>
            <span className="text-[10px] text-siteflow-muted">SECTOR 4 PIPELINE</span>
          </div>
        </div>

      </section>

      {/* 3. Problem Section: The Fragmented Infrastructure Reality */}
      <section className="py-24 px-6 bg-[#0E1310] border-t border-siteflow-border/30 technical-grid relative">
        <div className="max-w-7xl mx-auto space-y-14">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase text-siteflow-amber font-bold tracking-widest">
              The Critical Industry Challenge
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-siteflow-cream font-display uppercase">
              The Planning-to-Execution Gap
            </h2>
            <p className="text-siteflow-muted max-w-2xl mx-auto text-sm sm:text-base">
              Why mega infrastructure projects experience budget overruns and unexpected delays.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Status Quo */}
            <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-5">
              <div className="flex items-center gap-2.5 text-rose-300 font-bold text-sm uppercase tracking-wider font-mono">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <span>Current Fragmented Site Workflow</span>
              </div>
              <div className="space-y-3 text-xs font-mono text-siteflow-cream">
                {[
                  { step: "Project Schedule", issue: "Isolated in Primavera at Headquarters" },
                  { step: "Daily Progress Reports", issue: "WhatsApp & Paper Logs Disconnected" },
                  { step: "Manual Spreadsheets", issue: "7–14 Days Reporting Delay" },
                  { step: "Variance Detection", issue: "Discovered Too Late to Mitigate" },
                ].map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#0A0D0B] border border-rose-900/30 flex items-center justify-between">
                    <span>{item.step}</span>
                    <span className="text-rose-400 font-bold">{item.issue}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SITEFLOW Solution */}
            <div className="p-8 rounded-2xl bg-[#0C2119]/50 border border-siteflow-mint/40 space-y-5 shadow-2xl">
              <div className="flex items-center gap-2.5 text-siteflow-mint font-bold text-sm uppercase tracking-wider font-mono">
                <CheckCircle2 className="w-5 h-5 text-siteflow-mint" />
                <span>The SITEFLOW Intelligent Layer</span>
              </div>
              <div className="space-y-3 text-xs font-mono text-siteflow-cream">
                {[
                  { step: "Direct Schedule Ingestion", benefit: "L5/L6 Activity Isolation" },
                  { step: "Hybrid NLP Matcher", benefit: "Instant 94% Match Confidence" },
                  { step: "Supervisor Review Queue", benefit: "Verified Immutable Audit Trail" },
                  { step: "Explainable ML Delay Risk", benefit: "Proactive Delay Compression" },
                ].map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#0A0D0B] border border-siteflow-mint/30 flex items-center justify-between">
                    <span>{item.step}</span>
                    <span className="text-siteflow-mint font-bold">{item.benefit}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. The 5-Stage Core Bridge */}
      <section className="py-24 px-6 bg-[#0A0D0B] border-t border-siteflow-border/20">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase text-siteflow-amber tracking-widest font-bold">
              Core Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-siteflow-cream font-display uppercase">
              The 5-Stage Execution Bridge
            </h2>
            <p className="text-siteflow-muted max-w-2xl mx-auto text-sm sm:text-base">
              Every site observation flows seamlessly from schedule baseline to ML-powered prescriptive decision support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { num: '01', title: 'PLAN', desc: 'Import Primavera/MS Project schedule and isolate executable L5/L6 activities.', color: 'from-[#D98A32] to-[#F2A84B]' },
              { num: '02', title: 'EXECUTE', desc: 'Capture multi-modal field text, DPR reports, welder logs and site photos.', color: 'from-[#0C2119] to-[#16382A]' },
              { num: '03', title: 'VERIFY', desc: 'Hybrid TF-IDF matching engine links updates to schedule with supervisor approval.', color: 'from-[#16382A] to-[#8BE0C0]' },
              { num: '04', title: 'ANALYZE', desc: 'Real-time mathematical variance, earned duration, and S-curve comparison.', color: 'from-[#D98A32] to-[#F2A84B]' },
              { num: '05', title: 'PREDICT', desc: 'scikit-learn ML models forecast delay probability, anomalies, and what-if actions.', color: 'from-[#8BE0C0] to-[#16382A]' },
            ].map((stage) => (
              <div key={stage.num} className="p-6 rounded-2xl siteflow-card hover:border-siteflow-amber/60 transition-all space-y-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${stage.color} flex items-center justify-center text-xs font-extrabold text-[#0A0D0B] font-mono`}>
                  {stage.num}
                </div>
                <h3 className="font-extrabold text-base text-siteflow-cream">{stage.title}</h3>
                <p className="text-xs text-siteflow-muted leading-relaxed">{stage.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. Interactive Core Workflow Stepper */}
      <section id="workflow" className="py-24 px-6 bg-[#0E1310] border-t border-siteflow-border/30">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase text-siteflow-mint tracking-widest font-bold">
              Interactive Execution Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-siteflow-cream font-display uppercase">
              Explore The 10-Step Workflow
            </h2>
            <p className="text-siteflow-muted max-w-xl mx-auto text-xs sm:text-sm">
              Click any stage below to inspect the exact data inputs, algorithms, and outputs generated.
            </p>
          </div>

          {/* Stepper Buttons Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
            {WORKFLOW_STEPS.map((s) => {
              const isActive = activeWorkflowStep.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveWorkflowStep(s)}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs font-mono ${
                    isActive 
                      ? 'bg-siteflow-amber/20 border-siteflow-amber text-siteflow-amberBright shadow-lg shadow-siteflow-amber/20' 
                      : 'bg-[#0A0D0B] border-siteflow-border/30 text-siteflow-muted hover:border-siteflow-border'
                  }`}
                >
                  <div className="font-bold text-[10px] truncate">{s.id}. {s.shortName}</div>
                </button>
              );
            })}
          </div>

          {/* Active Step Detail Card */}
          <div className="p-8 rounded-2xl siteflow-card border-siteflow-amber/40 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-siteflow-border/40 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-siteflow-amber uppercase">STAGE {activeWorkflowStep.id} OF 10</span>
                <h3 className="text-2xl font-extrabold text-siteflow-cream mt-1 font-display">
                  {activeWorkflowStep.title}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-siteflow-mint/20 text-siteflow-mint border border-siteflow-mint/30">
                ACTIVE PIPELINE STAGE
              </span>
            </div>

            <p className="text-sm text-siteflow-cream leading-relaxed font-sans">
              {activeWorkflowStep.desc}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#0A0D0B] border border-siteflow-border/30 space-y-1">
                <div className="text-siteflow-muted uppercase text-[10px]">Data Inputs:</div>
                <div className="text-siteflow-cream font-semibold">{activeWorkflowStep.dataInput}</div>
              </div>
              <div className="p-4 rounded-xl bg-[#0A0D0B] border border-siteflow-mint/30 space-y-1">
                <div className="text-siteflow-mint uppercase text-[10px]">System Output:</div>
                <div className="text-siteflow-cream font-semibold">{activeWorkflowStep.output}</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. Why SITEFLOW Comparison Matrix */}
      <section id="why-siteflow" className="py-24 px-6 bg-[#0A0D0B] border-t border-siteflow-border/20">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase text-siteflow-amber tracking-widest font-bold">
              Market Differentiators
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-siteflow-cream font-display uppercase">
              Why SITEFLOW vs Existing Tools
            </h2>
          </div>

          <div className="siteflow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0E1310] text-siteflow-muted uppercase text-[11px] border-b border-siteflow-border/40">
                  <tr>
                    <th className="py-4 px-5">Capability</th>
                    <th className="py-4 px-5">Primavera P6 / MS Project</th>
                    <th className="py-4 px-5">Procore / Autodesk</th>
                    <th className="py-4 px-5 text-siteflow-amber font-bold">SITEFLOW (SIH 26122)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-siteflow-border/20 font-medium text-siteflow-cream">
                  {[
                    { cap: "L1 → L6 Schedule Cascading", p6: "Yes (Planning Only)", pro: "Partial", sf: "Full (L5/L6 Site Tasks)" },
                    { cap: "Automated NLP Field Matching", p6: "No (Manual Entry)", pro: "No", sf: "Yes (TF-IDF + Domain Entity)" },
                    { cap: "Human-in-the-Loop Review Queue", p6: "No", pro: "Document Sign-off", sf: "Side-by-Side Photo & Delta" },
                    { cap: "Real-Time Planned vs Actual S-Curve", p6: "Weekly/Monthly Lag", pro: "Manual Rollup", sf: "Real-Time Instantaneous" },
                    { cap: "Explainable ML Delay Risk", p6: "No", pro: "No", sf: "Yes (95.7% Acc + SHAP Factors)" },
                    { cap: "What-If Recovery Simulation", p6: "Complex Re-baselining", pro: "No", sf: "Interactive Sliders (Days Saved)" },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#141B16] transition-colors">
                      <td className="py-3.5 px-5 font-bold text-siteflow-cream">{row.cap}</td>
                      <td className="py-3.5 px-5 text-siteflow-muted">{row.p6}</td>
                      <td className="py-3.5 px-5 text-siteflow-muted">{row.pro}</td>
                      <td className="py-3.5 px-5 text-siteflow-amberBright font-bold bg-siteflow-amber/5">{row.sf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* 7. Final Command Center Launch CTA */}
      <section className="py-28 px-6 bg-gradient-to-b from-[#0A0D0B] via-[#0E1310] to-[#0A0D0B] text-center border-t border-siteflow-border/30">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-siteflow-amber/15 text-siteflow-amber text-xs font-mono font-bold">
            READY FOR JUDGE EVALUATION
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-siteflow-cream font-display uppercase">
            Launch The SiteFlow Command Center.
          </h2>
          <p className="text-siteflow-muted text-sm sm:text-base max-w-xl mx-auto">
            Experience the complete end-to-end evaluation flow on the East-West Gas Pipeline Expansion project right now.
          </p>
          <div className="pt-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright hover:from-siteflow-amberBright hover:to-siteflow-amber text-[#0A0D0B] font-extrabold px-9 py-4 rounded-xl text-base shadow-2xl shadow-siteflow-amber/30 transition-all transform active:scale-95"
            >
              <span>Launch SiteFlow Live Platform</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Enterprise Footer */}
      <footer className="py-8 px-6 border-t border-siteflow-border/30 bg-[#070A08] text-center text-xs text-siteflow-muted font-mono">
        <div>SITEFLOW • Smart India Hackathon 2026 Problem Statement 26122</div>
        <div className="mt-1 text-siteflow-muted/70">Planning-to-Execution Intelligence for Mega Infrastructure Projects</div>
      </footer>

    </div>
  );
}
