import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  BrainCircuit, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { StatusBadge, RiskBadge, DisciplineBadge, WbsBadge } from '../components/Badges';
import { api } from '../api/client';

export function Variance() {
  const { currentProjectId } = useOutletContext();
  const [varianceData, setVarianceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVariance() {
      if (!currentProjectId) return;
      try {
        setLoading(true);
        const res = await api.getProjectVariance(currentProjectId);
        setVarianceData(res);
      } catch (err) {
        console.error("Failed to load variance:", err);
      } finally {
        setLoading(false);
      }
    }
    loadVariance();
  }, [currentProjectId]);

  if (loading || !varianceData) {
    return <div className="animate-pulse h-96 bg-[#0E1310] rounded-2xl border border-siteflow-border/20"></div>;
  }

  return (
    <div className="space-y-8 pb-10 font-mono">
      
      {/* Header */}
      <div>
        <div className="text-xs font-mono text-siteflow-amber font-semibold uppercase tracking-wider">
          Earned Duration & Slippage Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-siteflow-cream tracking-tight mt-1 font-display uppercase">
          Schedule Variance & Earned Value Analytics
        </h1>
        <p className="text-xs text-siteflow-muted mt-1 font-sans">
          Real-time mathematical deviation between scheduled milestone baseline and verified site execution.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="siteflow-card p-4 space-y-1">
          <div className="text-xs text-siteflow-muted">Net Progress Variance</div>
          <div className={`text-2xl font-extrabold ${
            varianceData.overall_progress_variance >= 0 ? 'text-siteflow-mint' : 'text-rose-400'
          }`}>
            {varianceData.overall_progress_variance >= 0 ? `+${varianceData.overall_progress_variance}%` : `${varianceData.overall_progress_variance}%`}
          </div>
          <div className="text-[11px] text-siteflow-muted">Actual % - Planned %</div>
        </div>

        <div className="siteflow-card p-4 space-y-1">
          <div className="text-xs text-siteflow-muted">Total Slippage Days</div>
          <div className="text-2xl font-extrabold text-siteflow-amber">
            {varianceData.total_schedule_slippage_days} days
          </div>
          <div className="text-[11px] text-siteflow-muted">Cumulative drag</div>
        </div>

        <div className="siteflow-card p-4 space-y-1">
          <div className="text-xs text-siteflow-muted">Delayed Activities</div>
          <div className="text-2xl font-extrabold text-rose-400">
            {varianceData.delayed_activities_count}
          </div>
          <div className="text-[11px] text-rose-400/80">Variance &lt; -10%</div>
        </div>

        <div className="siteflow-card p-4 space-y-1">
          <div className="text-xs text-siteflow-muted">On-Track / Ahead</div>
          <div className="text-2xl font-extrabold text-siteflow-mint">
            {varianceData.on_track_activities_count}
          </div>
          <div className="text-[11px] text-siteflow-mint/80">Aligned with plan</div>
        </div>

      </div>

      {/* Discipline Variance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {varianceData.discipline_variances.map((d) => (
          <div key={d.discipline} className="p-3.5 rounded-xl bg-[#0E1310] border border-siteflow-border/30 space-y-2">
            <div className="flex items-center justify-between">
              <DisciplineBadge discipline={d.discipline} />
              <span className={`text-xs font-bold ${
                d.variance >= 0 ? 'text-siteflow-mint' : 'text-rose-400'
              }`}>
                {d.variance >= 0 ? `+${d.variance}%` : `${d.variance}%`}
              </span>
            </div>
            <div className="text-xs text-siteflow-muted flex justify-between">
              <span>Actual: {d.actual_progress_avg}%</span>
              <span>Plan: {d.planned_progress_avg}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Full Worst Variance Table */}
      <div className="siteflow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-siteflow-cream">Worst Variance Activity Leaderboard</h3>
            <p className="text-xs text-siteflow-muted">Activities with significant earned vs elapsed duration deficits</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0A0D0B] text-siteflow-muted uppercase text-[11px] border-b border-siteflow-border/30">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Activity Name</th>
                <th className="py-3 px-4">Discipline</th>
                <th className="py-3 px-4">WBS</th>
                <th className="py-3 px-4">Planned %</th>
                <th className="py-3 px-4">Actual %</th>
                <th className="py-3 px-4">Progress Gap</th>
                <th className="py-3 px-4">Earned Days</th>
                <th className="py-3 px-4">Elapsed Days</th>
                <th className="py-3 px-4">Slippage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">AI Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-siteflow-border/20 font-medium text-siteflow-cream">
              {varianceData.worst_variance_activities.map((act) => (
                <tr key={act.activity_id} className="hover:bg-[#141B16] transition-colors">
                  <td className="py-3 px-4 font-bold text-siteflow-amberBright">{act.activity_code}</td>
                  <td className="py-3 px-4 max-w-xs truncate text-siteflow-cream font-sans">{act.activity_name}</td>
                  <td className="py-3 px-4"><DisciplineBadge discipline={act.discipline} /></td>
                  <td className="py-3 px-4 text-siteflow-muted"><WbsBadge level={act.wbs_level} /></td>
                  <td className="py-3 px-4">{act.planned_progress}%</td>
                  <td className="py-3 px-4 font-bold text-siteflow-cream">{act.actual_progress}%</td>
                  <td className={`py-3 px-4 font-bold ${
                    act.progress_variance >= 0 ? 'text-siteflow-mint' : 'text-rose-400'
                  }`}>
                    {act.progress_variance >= 0 ? `+${act.progress_variance}%` : `${act.progress_variance}%`}
                  </td>
                  <td className="py-3 px-4 text-siteflow-muted">{act.earned_duration} d</td>
                  <td className="py-3 px-4 text-siteflow-muted">{act.elapsed_duration} d</td>
                  <td className="py-3 px-4 text-siteflow-amber font-bold">{act.schedule_variance_days} d</td>
                  <td className="py-3 px-4"><StatusBadge status={act.status} /></td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/ai-risk?activity_id=${act.activity_id}`}
                      className="px-2.5 py-1 rounded bg-[#0A0D0B] hover:bg-siteflow-mint/20 text-siteflow-mint text-xs font-semibold border border-siteflow-border/30 hover:border-siteflow-mint inline-flex items-center gap-1"
                    >
                      <BrainCircuit className="w-3 h-3" />
                      <span>Forecast</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
