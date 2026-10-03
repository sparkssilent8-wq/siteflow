import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  ListTodo, 
  CalendarClock, 
  Camera, 
  CheckSquare, 
  TrendingDown, 
  BrainCircuit, 
  SlidersHorizontal, 
  FileText, 
  Settings, 
  HardHat,
  Globe2
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: Layers },
  { path: '/schedule', label: 'Schedule & WBS', icon: CalendarClock },
  { path: '/activities', label: 'Activity Register', icon: ListTodo, badge: 'L5/L6' },
  { path: '/site-updates', label: 'Site Updates Capture', icon: Camera },
  { path: '/review-queue', label: 'Review Queue', icon: CheckSquare, isReview: true },
  { path: '/variance', label: 'Schedule Variance', icon: TrendingDown },
  { path: '/ai-risk', label: 'AI Delay Risk', icon: BrainCircuit, badge: 'ML' },
  { path: '/simulation', label: 'What-If Simulation', icon: SlidersHorizontal },
  { path: '/reports', label: 'DPR & Documents', icon: FileText },
  { path: '/settings', label: 'System Settings', icon: Settings },
  { path: '/india-projects', label: 'India Projects 2026', icon: Globe2, badge: 'RESEARCH' },
];

export function Sidebar({ pendingCount = 0 }) {
  return (
    <aside className="w-64 bg-[#0E1310] border-r border-siteflow-border/30 flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-siteflow-border/30 gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-siteflow-amber to-siteflow-amberBright flex items-center justify-center shadow-lg shadow-siteflow-amber/20">
          <HardHat className="w-5 h-5 text-[#0A0D0B] stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg tracking-wider text-siteflow-cream font-mono">SITEFLOW</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-siteflow-amber/20 text-siteflow-amberBright border border-siteflow-amber/30">v2.0</span>
          </div>
          <p className="text-[10px] text-siteflow-muted font-mono tracking-tight">Construction Digital Twin</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold font-mono text-siteflow-muted uppercase tracking-widest">Execution Command</div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all group
                ${isActive 
                  ? 'bg-siteflow-amber/15 text-siteflow-amberBright border border-siteflow-amber/40 shadow-sm' 
                  : 'text-siteflow-muted hover:text-siteflow-cream hover:bg-[#141B16]'}
              `}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-siteflow-muted group-hover:text-siteflow-amber transition-colors" />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.isReview && pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-siteflow-amber text-[#0A0D0B] animate-pulse">
                    {pendingCount}
                  </span>
                )}
                {item.badge && !item.isReview && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0A0D0B] text-siteflow-muted border border-siteflow-border/30">
                    {item.badge}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* SIH Tagline Footer */}
      <div className="p-3 border-t border-siteflow-border/30 bg-[#0A0D0B]/60">
        <div className="p-2.5 rounded-lg bg-[#0E1310] border border-siteflow-border/30">
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-siteflow-amber">
            <span className="w-2 h-2 rounded-full bg-siteflow-amber animate-ping"></span>
            SIH 2026 PS 26122
          </div>
          <p className="text-[11px] text-siteflow-muted mt-1 leading-snug">
            Real-Time Schedule Linking & L5/L6 Progress Tracking
          </p>
        </div>
      </div>
    </aside>
  );
}
