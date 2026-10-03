import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/react';
import { 
  Building2, 
  Search, 
  Bell, 
  Sparkles, 
  PlayCircle, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  HardHat,
  LogOut
} from 'lucide-react';

export function Navbar({ 
  projects = [], 
  currentProjectId, 
  onSelectProject, 
  pendingCount = 0,
  onLaunchDemo,
  onRefreshData,
  isRefreshing
}) {
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [searchQuery, setSearchQuery] = useState('');

  const currentProject = projects.find(p => p.id === Number(currentProjectId)) || projects[0];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/activities?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-[#0E1310] border-b border-siteflow-border/30 px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      {/* Left: Project Selector & Live Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-[#0A0D0B] border border-siteflow-border/40 px-3 py-1.5 rounded-lg">
          <Building2 className="w-4 h-4 text-siteflow-amber" />
          <select 
            value={currentProjectId || (currentProject?.id || '')} 
            onChange={(e) => onSelectProject(Number(e.target.value))}
            aria-label="Select active project"
            className="bg-transparent text-xs font-mono font-bold text-siteflow-cream focus:outline-none cursor-pointer pr-2"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#0E1310] text-siteflow-cream">
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>

        {currentProject && (
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono bg-[#141B16] border border-siteflow-border/20 px-3 py-1.5 rounded-md text-siteflow-muted">
            <span className="w-2 h-2 rounded-full bg-siteflow-mint animate-pulse"></span>
            <span className="text-siteflow-cream font-bold">ALL SYSTEMS OPERATIONAL</span>
            <span className="text-siteflow-border">|</span>
            <span>Planned: <strong className="text-siteflow-cream">{currentProject.overall_planned_progress}%</strong></span>
            <span className="text-siteflow-border">|</span>
            <span>Actual: <strong className="text-siteflow-amberBright">{currentProject.overall_actual_progress}%</strong></span>
          </div>
        )}
      </div>

      {/* Middle: Global Search */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-72 lg:w-96">
        <Search className="w-4 h-4 text-siteflow-muted absolute left-3" />
        <input 
          type="text" 
          placeholder="Search L5/L6 task (e.g. PIP-L6-024, welders, valve pit)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg pl-9 pr-3 py-1.5 text-xs text-siteflow-cream placeholder-siteflow-muted focus:outline-none focus:border-siteflow-amber transition-colors font-mono"
        />
      </form>

      {/* Right: Quick SIH Demo Walkthrough CTA & Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onLaunchDemo}
          className="flex items-center gap-2 bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright hover:from-siteflow-amberBright hover:to-siteflow-amber text-[#0A0D0B] font-extrabold px-3.5 py-1.5 rounded-lg text-xs shadow-md shadow-siteflow-amber/20 transition-all transform active:scale-95"
        >
          <PlayCircle className="w-4 h-4 stroke-[2.5]" />
          <span>SIH Judge Demo Walkthrough</span>
        </button>

        <button 
          onClick={onRefreshData}
          title="Refresh Project Data"
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-[#0A0D0B] border border-siteflow-border/30 text-siteflow-muted hover:text-siteflow-cream transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-siteflow-amber' : ''}`} />
        </button>

        {pendingCount > 0 && (
          <button 
            onClick={() => navigate('/review-queue')}
            className="flex items-center gap-1.5 bg-siteflow-amber/15 border border-siteflow-amber/40 text-siteflow-amberBright px-3 py-1.5 rounded-lg text-xs font-mono font-bold hover:bg-siteflow-amber/25 transition-all animate-pulse"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-siteflow-amber" />
            <span>{pendingCount} Pending Review</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => signOut({ redirectUrl: '/' })}
          title="Sign out"
          className="flex items-center gap-2 rounded-lg border border-siteflow-border/40 bg-[#0A0D0B] px-2 py-1.5 text-left hover:border-siteflow-amber/60 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#16382A] to-siteflow-amber border border-siteflow-border/40 flex items-center justify-center font-bold text-xs text-siteflow-cream font-mono">
            {(user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'U').toUpperCase()}
          </div>
          <div className="hidden xl:block min-w-0">
            <div className="max-w-28 truncate text-[11px] font-bold text-siteflow-cream">
              {user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'Signed in'}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-siteflow-muted">
              <LogOut className="w-3 h-3" />
              <span>Sign out</span>
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}
