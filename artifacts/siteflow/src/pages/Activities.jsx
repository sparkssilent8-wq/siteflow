import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ListTodo, 
  Search, 
  Filter, 
  Eye, 
  BrainCircuit, 
  SlidersHorizontal, 
  History, 
  X, 
  CheckCircle2, 
  Camera, 
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';
import { StatusBadge, RiskBadge, DisciplineBadge, WbsBadge } from '../components/Badges';
import { api } from '../api/client';

export function Activities() {
  const { currentProjectId } = useOutletContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityDetail, setActivityDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [disciplineFilter, setDisciplineFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [wbsFilter, setWbsFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [l5L6Only, setL5L6Only] = useState(false);

  const loadActivities = async () => {
    if (!currentProjectId) return;
    try {
      setLoading(true);
      const acts = await api.getActivities(currentProjectId, {
        discipline: disciplineFilter,
        status: statusFilter,
        risk_level: riskFilter,
        wbs_level: wbsFilter,
        search: searchQuery,
        l5_l6_only: l5L6Only
      });
      setActivities(acts);
    } catch (err) {
      console.error("Failed to load activities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [currentProjectId, disciplineFilter, statusFilter, riskFilter, wbsFilter, searchQuery, l5L6Only]);

  const openActivityDetail = async (act) => {
    setSelectedActivity(act);
    try {
      setLoadingDetail(true);
      const detail = await api.getActivityDetail(act.id);
      setActivityDetail(detail);
    } catch (err) {
      console.error("Failed to load activity detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-siteflow-amber font-semibold uppercase tracking-wider">
            Execution Activity Register
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-siteflow-cream tracking-tight mt-1 font-display uppercase">
            Site Activities & Real Progress Tracking
          </h1>
        </div>
        <button onClick={() => navigate('/site-updates?timeAgent=1')} className="px-3 py-2 rounded-lg border border-siteflow-amber/40 bg-[#0E1310] text-siteflow-amberBright text-xs font-bold hover:border-siteflow-amber transition-all">🎙 Capture Update with Time Agent</button>
      </div>

      {/* Filter Toolbar */}
      <div className="siteflow-card p-4 space-y-3 font-mono">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-siteflow-muted absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Search code or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg pl-9 pr-3 py-2 text-xs text-siteflow-cream focus:outline-none focus:border-siteflow-amber"
            />
          </div>

          {/* Discipline */}
          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
            aria-label="Filter by Discipline"
            className="bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg px-3 py-2 text-xs text-siteflow-cream focus:outline-none"
          >
            <option value="ALL">All Disciplines</option>
            <option value="Piping">Piping</option>
            <option value="Civil">Civil</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Electrical">Electrical</option>
            <option value="HSE">HSE</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by Status"
            className="bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg px-3 py-2 text-xs text-siteflow-cream focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DELAYED">Delayed</option>
            <option value="AT_RISK">At Risk</option>
            <option value="COMPLETED">Completed</option>
            <option value="NOT_STARTED">Not Started</option>
          </select>

          {/* Risk */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            aria-label="Filter by Risk Level"
            className="bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg px-3 py-2 text-xs text-siteflow-cream focus:outline-none"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* L5/L6 site tasks toggle */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer bg-[#0A0D0B] border border-siteflow-border/30 px-3 py-2 rounded-lg w-full">
              <input 
                type="checkbox"
                checked={l5L6Only}
                onChange={(e) => setL5L6Only(e.target.checked)}
                className="rounded bg-[#141B16] border-siteflow-border/40 text-siteflow-amber"
              />
              <span className="text-xs text-siteflow-amber font-mono font-semibold">L5/L6 Only</span>
            </label>
          </div>

        </div>
      </div>

      {/* Activity Table */}
      <div className="siteflow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0A0D0B] text-siteflow-muted uppercase text-[11px] border-b border-siteflow-border/30">
              <tr>
                <th className="py-3.5 px-4">Activity Code</th>
                <th className="py-3.5 px-4">Activity Name</th>
                <th className="py-3.5 px-4">Discipline</th>
                <th className="py-3.5 px-4">Level</th>
                <th className="py-3.5 px-4">Planned %</th>
                <th className="py-3.5 px-4">Actual %</th>
                <th className="py-3.5 px-4">Variance</th>
                <th className="py-3.5 px-4">Slippage</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Risk</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-siteflow-border/20 font-medium text-siteflow-cream">
              {activities.map((act) => (
                <tr key={act.id} className="hover:bg-[#141B16] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-siteflow-amberBright">{act.activity_code}</td>
                  <td className="py-3.5 px-4 max-w-sm truncate text-siteflow-cream font-sans font-medium">
                    {act.activity_name}
                  </td>
                  <td className="py-3.5 px-4"><DisciplineBadge discipline={act.discipline} /></td>
                  <td className="py-3.5 px-4"><WbsBadge level={act.wbs_level} /></td>
                  <td className="py-3.5 px-4">{act.planned_progress}%</td>
                  <td className="py-3.5 px-4 font-bold text-siteflow-cream">{act.actual_progress}%</td>
                  <td className={`py-3.5 px-4 font-bold ${
                    act.progress_variance >= 0 ? 'text-siteflow-mint' : 'text-rose-400'
                  }`}>
                    {act.progress_variance >= 0 ? `+${act.progress_variance}%` : `${act.progress_variance}%`}
                  </td>
                  <td className="py-3.5 px-4 text-siteflow-amber">{act.schedule_variance_days} d</td>
                  <td className="py-3.5 px-4"><StatusBadge status={act.status} /></td>
                  <td className="py-3.5 px-4"><RiskBadge level={act.risk_level} /></td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openActivityDetail(act)}
                        className="px-2.5 py-1 rounded bg-[#0A0D0B] hover:bg-siteflow-amber/20 text-siteflow-amberBright font-semibold border border-siteflow-border/30 hover:border-siteflow-amber transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                      <button
                        onClick={() => navigate(`/ai-risk?activity_id=${act.id}`)}
                        title="Run AI Risk Snapshot"
                        className="p-1 rounded bg-[#0A0D0B] hover:bg-siteflow-mint/20 text-siteflow-mint border border-siteflow-border/30 hover:border-siteflow-mint transition-all"
                      >
                        <BrainCircuit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Detail Modal Drawer */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0E1310] border border-siteflow-border/50 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#16382A] via-[#0E1310] to-[#0A0D0B] border-b border-siteflow-border/30 flex items-center justify-between font-mono">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-siteflow-amberBright text-sm">{selectedActivity.activity_code}</span>
                  <DisciplineBadge discipline={selectedActivity.discipline} />
                  <WbsBadge level={selectedActivity.wbs_level} />
                </div>
                <h3 className="font-extrabold text-lg text-siteflow-cream mt-1 font-sans">{selectedActivity.activity_name}</h3>
              </div>
              <button 
                onClick={() => setSelectedActivity(null)}
                className="text-siteflow-muted hover:text-siteflow-cream p-1.5 rounded-lg hover:bg-[#141B16]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 font-mono">
              
              {/* Progress Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#0A0D0B] border border-siteflow-border/30">
                  <div className="text-[11px] text-siteflow-muted">Actual Progress</div>
                  <div className="text-xl font-bold text-siteflow-amberBright">{selectedActivity.actual_progress}%</div>
                </div>
                <div className="p-3 rounded-xl bg-[#0A0D0B] border border-siteflow-border/30">
                  <div className="text-[11px] text-siteflow-muted">Planned Progress</div>
                  <div className="text-xl font-bold text-siteflow-cream">{selectedActivity.planned_progress}%</div>
                </div>
                <div className="p-3 rounded-xl bg-[#0A0D0B] border border-siteflow-border/30">
                  <div className="text-[11px] text-siteflow-muted">Schedule Variance</div>
                  <div className="text-xl font-bold text-rose-400">{selectedActivity.progress_variance}%</div>
                </div>
                <div className="p-3 rounded-xl bg-[#0A0D0B] border border-siteflow-border/30">
                  <div className="text-[11px] text-siteflow-muted">Slippage Duration</div>
                  <div className="text-xl font-bold text-siteflow-amber">{selectedActivity.schedule_variance_days} days</div>
                </div>
              </div>

              {/* Progress History Audit Log */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-siteflow-cream flex items-center gap-2">
                    <History className="w-4 h-4 text-siteflow-amber" />
                    <span>Progress History & Audit Trail (Non-destructive)</span>
                  </h4>
                  <span className="text-[11px] text-siteflow-muted">
                    {activityDetail?.progress_history?.length || 0} updates logged
                  </span>
                </div>

                <div className="space-y-2">
                  {activityDetail?.progress_history?.length > 0 ? (
                    activityDetail.progress_history.map((ph) => (
                      <div key={ph.id} className="p-3 rounded-xl bg-[#0A0D0B] border border-siteflow-border/20 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-siteflow-amberBright font-bold">{ph.progress_percentage}%</span>
                            <span className="text-siteflow-muted">(from {ph.previous_percentage}%)</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#141B16] text-siteflow-cream border border-siteflow-border/20">
                              {ph.source}
                            </span>
                          </div>
                          <p className="text-siteflow-cream/90 font-sans text-xs">{ph.remarks || 'Site execution update.'}</p>
                        </div>
                        <div className="text-right text-[11px] text-siteflow-muted">
                          <div>{new Date(ph.created_at).toLocaleDateString()}</div>
                          <div className="text-siteflow-cream">{ph.reviewer_name || 'Inspector'}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-[#0A0D0B] border border-dashed border-siteflow-border/30 text-center text-xs text-siteflow-muted">
                      No progress history entries recorded yet.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#0A0D0B] border-t border-siteflow-border/30 flex items-center justify-between font-mono">
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 rounded-lg bg-[#0E1310] hover:bg-[#141B16] text-siteflow-muted hover:text-siteflow-cream text-xs font-semibold border border-siteflow-border/30"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const id = selectedActivity.id;
                    setSelectedActivity(null);
                    navigate(`/simulation?activity_id=${id}`);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-siteflow-mint/20 hover:bg-siteflow-mint/30 text-siteflow-mint border border-siteflow-mint/40 text-xs font-bold flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Simulate What-If</span>
                </button>
                <button
                  onClick={() => {
                    const id = selectedActivity.id;
                    setSelectedActivity(null);
                    navigate(`/ai-risk?activity_id=${id}`);
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright hover:from-siteflow-amberBright hover:to-siteflow-amber text-[#0A0D0B] text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-siteflow-amber/20"
                >
                  <BrainCircuit className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Run AI Risk Engine</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
