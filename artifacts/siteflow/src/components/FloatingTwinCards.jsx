import React from 'react';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  FileText,
  Layers3,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

function PipelineCard({ icon: Icon, label, title, detail, target, tone = 'amber', onHoverCard, className = '' }) {
  const toneClasses = tone === 'mint'
    ? 'border-siteflow-mint/35 hover:border-siteflow-mint text-siteflow-mint'
    : tone === 'cyan'
      ? 'border-cyan-300/30 hover:border-cyan-300 text-cyan-200'
      : 'border-siteflow-amber/35 hover:border-siteflow-amber text-siteflow-amber';

  return (
    <button
      type="button"
      onMouseEnter={() => onHoverCard(target)}
      onMouseLeave={() => onHoverCard(null)}
      onFocus={() => onHoverCard(target)}
      onBlur={() => onHoverCard(null)}
      className={`pointer-events-auto absolute z-20 w-44 rounded-xl border bg-[#0E1310]/90 p-3 text-left shadow-2xl backdrop-blur-xl transition-all hover:-translate-y-1 sm:w-52 ${toneClasses} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wide">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <ArrowRight className="h-3 w-3 opacity-60" />
      </div>
      <div className="mt-2 text-xs font-bold text-siteflow-cream">{title}</div>
      <div className="mt-1 text-[10px] leading-relaxed text-siteflow-muted">{detail}</div>
    </button>
  );
}

export function FloatingTwinCards({ onHoverCard = () => {} }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <PipelineCard
        icon={FileText}
        label="Capture"
        title="Field inputs"
        detail="Reports · spreadsheets · diaries · scans"
        target="field-inputs"
        tone="amber"
        onHoverCard={onHoverCard}
        className="left-2 top-4 sm:left-3 sm:top-5"
      />
      <PipelineCard
        icon={BrainCircuit}
        label="Understand"
        title="SiteFlow AI"
        detail="Extraction, fuzzy matching, validation"
        target="ai"
        tone="cyan"
        onHoverCard={onHoverCard}
        className="right-2 top-16 sm:right-3 sm:top-5"
      />
      <PipelineCard
        icon={Network}
        label="Match"
        title="Smart linking"
        detail="Spool erected → L6 Erect Line 24 · 92%"
        target="smart-link"
        tone="mint"
        onHoverCard={onHoverCard}
        className="left-2 top-1/2 -translate-y-1/2 sm:left-3"
      />
      <PipelineCard
        icon={Layers3}
        label="Update"
        title="L1 → L6 schedule"
        detail="Physical workfronts stay connected to plan"
        target="schedule"
        tone="amber"
        onHoverCard={onHoverCard}
        className="right-2 top-1/2 -translate-y-1/2 sm:right-3"
      />
      <PipelineCard
        icon={Activity}
        label="Predict"
        title="Risk analytics"
        detail="Progress · anomaly · delay risk · forecast"
        target="risk"
        tone="amber"
        onHoverCard={onHoverCard}
        className="bottom-24 right-2 sm:bottom-20 sm:right-3"
      />
      <PipelineCard
        icon={ShieldCheck}
        label="Learn"
        title="Project knowledge"
        detail="Execution history reusable on future projects"
        target="knowledge"
        tone="mint"
        onHoverCard={onHoverCard}
        className="bottom-24 left-2 sm:bottom-20 sm:left-3"
      />

      <div className="absolute bottom-4 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-siteflow-border/40 bg-[#0E1310]/90 px-3 py-1.5 text-[9px] font-mono text-siteflow-muted backdrop-blur-md md:flex">
        <Sparkles className="h-3 w-3 text-siteflow-amber" />
        PLAN
        <ArrowRight className="h-3 w-3 text-siteflow-border" />
        CAPTURE
        <ArrowRight className="h-3 w-3 text-siteflow-border" />
        UNDERSTAND
        <ArrowRight className="h-3 w-3 text-siteflow-border" />
        MATCH
        <ArrowRight className="h-3 w-3 text-siteflow-border" />
        VERIFY
        <ArrowRight className="h-3 w-3 text-siteflow-border" />
        LEARN
      </div>
    </div>
  );
}