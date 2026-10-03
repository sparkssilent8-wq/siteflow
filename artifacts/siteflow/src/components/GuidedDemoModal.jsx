import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Sparkles, 
  Target, 
  Send, 
  CheckSquare, 
  BrainCircuit,
  TrendingDown,
  ArrowRight
} from 'lucide-react';

const DEMO_STEPS = [
  {
    step: 1,
    title: "1. Inspect Scheduled Baseline vs Site Reality",
    description: "Inspect the East-West Gas Pipeline project. Look at activity PIP-L6-024 (Erect Line 24\"-XX). Its planned baseline progress was 65%, but actual site execution has lagged at 45% (Delayed status).",
    actionLabel: "View Activity PIP-L6-024",
    targetRoute: "/activities?search=PIP-L6-024",
    icon: Target
  },
  {
    step: 2,
    title: "2. Capture Fragmented Multi-Modal Site Update",
    description: "Site engineer submits daily field observation: 'Erection of 24 inch line completed up to 60% with 14 welders on site' along with jobsite photo evidence.",
    actionLabel: "Go to Site Updates Capture",
    targetRoute: "/site-updates",
    icon: Send
  },
  {
    step: 3,
    title: "3. Intelligent Hybrid Matching Engine",
    description: "SiteFlow's NLP & entity matching scans the WBS hierarchy, scores a 76% match to PIP-L6-024, and flags that human verification is required (confidence < 80%).",
    actionLabel: "Inspect Review Queue",
    targetRoute: "/review-queue",
    icon: CheckSquare
  },
  {
    step: 4,
    title: "4. Human-In-The-Loop Approval & Progress Update",
    description: "Project Manager reviews the side-by-side comparison, verifies photo evidence, and clicks 'Approve'. Actual progress instantly updates from 45% to 60% with an immutable audit trail.",
    actionLabel: "Verify on Variance Dashboard",
    targetRoute: "/variance",
    icon: TrendingDown
  },
  {
    step: 5,
    title: "5. Explainable AI Risk & What-If Simulation",
    description: "Run ML Delay Risk model. Inspect the transparent factor contributions (Material bottleneck, Manpower deficit) and test What-If simulation (+20% welders compresses delay by 4.5 days).",
    actionLabel: "Launch AI Risk & Simulation",
    targetRoute: "/ai-risk",
    icon: BrainCircuit
  }
];

export function GuidedDemoModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = DEMO_STEPS[activeStepIndex];
  const Icon = currentStep.icon;

  const handleStepAction = () => {
    navigate(currentStep.targetRoute);
    if (activeStepIndex < DEMO_STEPS.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0E1310] border border-siteflow-border/50 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#16382A] via-[#0E1310] to-[#0A0D0B] p-5 border-b border-siteflow-border/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-siteflow-amber/20 border border-siteflow-amber/40 flex items-center justify-center text-siteflow-amber">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-siteflow-cream font-mono">SIH 2026 Evaluation Tour</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-siteflow-amber/20 text-siteflow-amberBright border border-siteflow-amber/30 font-mono">
                  PS 26122
                </span>
              </div>
              <p className="text-xs text-siteflow-muted font-mono">Planning-to-Execution Digital Twin Walkthrough</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-siteflow-muted hover:text-siteflow-cream p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-5 gap-1 p-3 bg-[#0A0D0B] border-b border-siteflow-border/20">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => setActiveStepIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === activeStepIndex 
                  ? 'bg-siteflow-amber shadow-sm shadow-siteflow-amber/50' 
                  : idx < activeStepIndex 
                    ? 'bg-siteflow-mint' 
                    : 'bg-[#141B16]'
              }`}
              title={s.title}
            />
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-siteflow-amber/15 border border-siteflow-amber/30 flex items-center justify-center text-siteflow-amber flex-shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-siteflow-cream font-mono">{currentStep.title}</h4>
              <p className="text-sm text-siteflow-cream/90 leading-relaxed font-sans">{currentStep.description}</p>
            </div>
          </div>

          <div className="bg-[#0A0D0B] p-4 rounded-xl border border-siteflow-border/30 text-xs font-mono space-y-1.5 text-siteflow-muted">
            <div className="text-siteflow-amber font-semibold uppercase tracking-wider text-[11px]">Key Checkpoints:</div>
            <div>• Target Activity: <span className="text-siteflow-cream">PIP-L6-024 (Erect Line 24"-XX Compressor Tie-in)</span></div>
            <div>• Field Input: <span className="text-siteflow-cream">"Erection of 24 inch line completed up to 60%"</span></div>
            <div>• Match Confidence: <span className="text-siteflow-mint font-bold">76% (Requires Review = YES)</span></div>
            <div>• Output: <span className="text-siteflow-amberBright font-bold">Approved → Actual Progress 60% → AI Risk Recalculated</span></div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#0A0D0B] border-t border-siteflow-border/30 flex items-center justify-between font-mono">
          <div className="text-xs text-siteflow-muted">
            Step <strong className="text-siteflow-cream">{activeStepIndex + 1}</strong> of {DEMO_STEPS.length}
          </div>
          <div className="flex items-center gap-3">
            {activeStepIndex > 0 && (
              <button
                onClick={() => setActiveStepIndex(activeStepIndex - 1)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-siteflow-muted hover:text-siteflow-cream bg-[#0E1310] border border-siteflow-border/30"
              >
                Previous Step
              </button>
            )}
            <button
              onClick={handleStepAction}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-[#0A0D0B] bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright hover:from-siteflow-amberBright hover:to-siteflow-amber transition-all shadow-md shadow-siteflow-amber/20"
            >
              <span>{currentStep.actionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
