import React from 'react';

export function StatusBadge({ status }) {
  const s = String(status || 'NOT_STARTED').toUpperCase();
  
  if (s === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#16382A]/60 text-siteflow-mint border border-siteflow-mint/30">
        <span className="w-1.5 h-1.5 rounded-full bg-siteflow-mint"></span>
        COMPLETED
      </span>
    );
  }
  if (s === 'IN_PROGRESS' || s === 'ON_TRACK') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#D98A32]/15 text-siteflow-amberBright border border-siteflow-amber/40">
        <span className="w-1.5 h-1.5 rounded-full bg-siteflow-amber animate-pulse"></span>
        IN PROGRESS
      </span>
    );
  }
  if (s === 'AT_RISK') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#D98A32]/20 text-siteflow-amber border border-siteflow-amber/50">
        <span className="w-1.5 h-1.5 rounded-full bg-siteflow-amber"></span>
        AT RISK
      </span>
    );
  }
  if (s === 'DELAYED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-rose-950/50 text-rose-300 border border-rose-600/40">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        DELAYED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#141B16] text-siteflow-muted border border-siteflow-borderSubtle">
      <span className="w-1.5 h-1.5 rounded-full bg-siteflow-muted"></span>
      NOT STARTED
    </span>
  );
}

export function RiskBadge({ level }) {
  const l = String(level || 'LOW').toUpperCase();

  if (l === 'CRITICAL') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-rose-950/80 text-rose-200 border border-rose-600/60 shadow-sm">
        <span className="w-2 h-2 rounded-sm bg-rose-500 animate-ping"></span>
        CRITICAL
      </span>
    );
  }
  if (l === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-rose-900/35 text-rose-300 border border-rose-500/40">
        HIGH
      </span>
    );
  }
  if (l === 'MEDIUM') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-[#D98A32]/20 text-siteflow-amberBright border border-siteflow-amber/40">
        MEDIUM
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-[#16382A]/40 text-siteflow-mint border border-siteflow-mint/30">
      LOW
    </span>
  );
}

export function DisciplineBadge({ discipline }) {
  const d = String(discipline || 'General').toLowerCase();
  
  if (d.includes('piping')) {
    return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#D98A32]/15 text-siteflow-amberBright border border-siteflow-amber/30">PIPING</span>;
  }
  if (d.includes('civil')) {
    return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#16382A]/50 text-siteflow-mint border border-siteflow-mint/30">CIVIL</span>;
  }
  if (d.includes('elec')) {
    return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-950/40 text-purple-300 border border-purple-500/30">ELECTRICAL</span>;
  }
  if (d.includes('mech')) {
    return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-950/40 text-sky-300 border border-sky-500/30">MECHANICAL</span>;
  }
  if (d.includes('hse')) {
    return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#0C2119] text-emerald-300 border border-emerald-500/30">HSE</span>;
  }
  return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#141B16] text-siteflow-muted border border-siteflow-borderSubtle">GENERAL</span>;
}

export function WbsBadge({ level }) {
  const isExecutable = level === 'L5' || level === 'L6';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
      isExecutable 
        ? 'bg-[#D98A32]/20 text-siteflow-amberBright border border-siteflow-amber/40' 
        : 'bg-[#141B16] text-siteflow-muted border border-siteflow-borderSubtle'
    }`}>
      {level || 'L5'}
    </span>
  );
}
