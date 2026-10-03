import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { GuidedDemoModal } from '../components/GuidedDemoModal';
import { api } from '../api/client';

export function AppLayout() {
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);
  const [globalError, setGlobalError] = useState(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGlobalData = async () => {
    try {
      setIsRefreshing(true);
      setGlobalError(null);
      const [projectsResult, pendingResult] = await Promise.allSettled([
        api.getProjects(),
        currentProjectId ? api.getPendingReviews(currentProjectId) : Promise.resolve(null),
      ]);

      if (projectsResult.status === 'fulfilled') {
        const projList = Array.isArray(projectsResult.value) ? projectsResult.value : [];
        setProjects(projList);
        if (projList.length > 0 && !currentProjectId) {
          setCurrentProjectId(projList[0].id);
        }
      } else {
        throw projectsResult.reason;
      }

      if (pendingResult.status === 'fulfilled' && pendingResult.value) {
        if (typeof pendingResult.value.pending_count !== 'number') {
          throw new Error('Review queue count was not returned by the API.');
        }
        setPendingCount(Math.max(0, pendingResult.value.pending_count));
      }
      if (pendingResult.status === 'rejected') {
        setGlobalError(`Review queue count unavailable: ${pendingResult.reason?.message || 'API request failed'}`);
      }
    } catch (err) {
      console.error("Global layout fetch error:", err);
      setGlobalError(err?.message || 'Unable to load SiteFlow project data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, [currentProjectId]);

  return (
    <div className="flex min-h-screen bg-[#0A0D0B] text-siteflow-cream antialiased selection:bg-siteflow-amber/30 selection:text-siteflow-amberBright">
      {/* Fixed Sidebar */}
      <Sidebar pendingCount={pendingCount} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Topbar */}
        <Navbar 
          projects={projects}
          currentProjectId={currentProjectId}
          onSelectProject={(id) => setCurrentProjectId(id)}
          pendingCount={pendingCount}
          onLaunchDemo={() => setIsDemoModalOpen(true)}
          onRefreshData={fetchGlobalData}
          isRefreshing={isRefreshing}
        />

        {/* Page Outlet */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {globalError && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200 font-mono" role="alert">
              <span>{globalError}</span>
              <button type="button" onClick={fetchGlobalData} className="rounded-md border border-rose-400/40 px-3 py-1.5 font-bold hover:bg-rose-500/15">
                Retry
              </button>
            </div>
          )}
          <Outlet context={{ 
            currentProjectId, 
            setCurrentProjectId, 
            refreshGlobal: fetchGlobalData,
            pendingCount 
          }} />
        </main>
      </div>

      {/* Interactive SIH Guided Walkthrough Modal */}
      <GuidedDemoModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />
    </div>
  );
}
