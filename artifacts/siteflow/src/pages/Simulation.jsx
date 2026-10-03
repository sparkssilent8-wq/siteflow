import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { 
  SlidersHorizontal, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  Users, 
  Wrench, 
  Boxes,
  CheckCircle2
} from 'lucide-react';
import { StatusBadge, RiskBadge } from '../components/Badges';
import { api } from '../api/client';

export function Simulation() {
  const { currentProjectId } = useOutletContext();
  const [searchParams] = useSearchParams();

  const [activities, setActivities] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState(searchParams.get('activity_id') || '');
  
  // Sliders
  const [manpowerDelta, setManpowerDelta] = useState(20);
  const [equipDelta, setEquipDelta] = useState(10);
  const [materialDelta, setMaterialDelta] = useState(15);

  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activitiesError, setActivitiesError] = useState(null);

  useEffect(() => {
    async function loadActs() {
      if (!currentProjectId) return;
      try {
        setActivitiesError(null);
        const acts = await api.getActivities(currentProjectId, { l5_l6_only: true });
        setActivities(acts);
        if (!selectedActivityId && acts.length > 0) {
          const pipDemo = acts.find(a => a.activity_code.includes('PIP-L6-024')) || acts[0];
          setSelectedActivityId(pipDemo.id);
        }
      } catch (err) {
        console.error("Failed to load activities for simulation:", err);
        setActivitiesError(err?.message || 'Unable to load activities for simulation.');
      }
    }
    loadActs();
  }, [currentProjectId]);

  const runSimulation = async () => {
    if (!selectedActivityId) return;
    const act = activities.find(a => a.id === Number(selectedActivityId));
    if (!act) return;

    try {
      setLoading(true);
      setError(null);

      const baseInput = {
        task_id: String(act.id),
        task_type: act.discipline || "Piping",
        contractor_id: act.contractor_id || "Larsen & Petro Engineering JV",
        contractor_past_projects: 15,
        contractor_historical_delay_rate: 0.22,
        planned_duration_days: Number(act.planned_duration || 40),
        planned_manpower: 18.0,
        planned_equipment_score: 90.0,
        planned_material_score: 90.0,
        days_elapsed: 25.0,
        current_progress_pct: Number(act.actual_progress || 45.0),
        planned_progress_pct_at_this_point: Number(act.planned_progress || 65.0),
        manpower_recent_avg: 14.0,
        equipment_availability_recent_avg: 75.0,
        material_availability_recent_avg: 65.0,
        progress_velocity_recent: 1.1,
        progress_velocity_early: 1.9,
        planned_days_remaining_at_snapshot: 15.0
      };

      const res = await api.simulateScenario({
        base_input: baseInput,
        manpower_delta_pct: Number(manpowerDelta),
        equipment_availability_delta_pct: Number(equipDelta),
        material_availability_delta_pct: Number(materialDelta)
      });

      setSimulationResult(res);
    } catch (err) {
      console.error("Simulation error:", err);
      setSimulationResult(null);
      setError(err?.message || 'AI Risk Engine temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedActivityId && activities.length > 0) {
      runSimulation();
    }
  }, [selectedActivityId, activities, manpowerDelta, equipDelta, materialDelta]);

  const selectedActivity = activities.find(a => a.id === Number(selectedActivityId));

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto font-mono">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-siteflow-mint font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-siteflow-mint" />
            <span>Decision Intelligence Sandbox</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-siteflow-cream tracking-tight mt-1 font-display uppercase">
            "What-If" Schedule Recovery Simulation
          </h1>
          <p className="text-xs text-siteflow-muted mt-1 font-sans">
            Modify crew staffing, equipment availability, or material expediting to quantify days saved and risk compression.
          </p>
        </div>

        {/* Activity Selector */}
        <div className="flex items-center gap-2 bg-[#0E1310] border border-siteflow-border/40 px-3 py-1.5 rounded-lg">
          <label htmlFor="simulation-activity-select" className="text-xs text-siteflow-muted font-semibold">Activity:</label>
          <select
            id="simulation-activity-select"
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
            className="bg-transparent text-xs font-bold text-siteflow-amberBright focus:outline-none cursor-pointer pr-2 font-mono"
          >
            {activities.map((a) => (
              <option key={a.id} value={a.id} className="bg-[#0E1310] text-siteflow-cream">
                {a.activity_code} ({a.actual_progress}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sliders Control Panel */}
      <div className="siteflow-card p-6 space-y-6">
        <h3 className="font-bold text-base text-siteflow-cream flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-siteflow-amber" />
          <span>Interactive Resource Levers</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Manpower Slider */}
          <div className="p-4 rounded-xl bg-[#0A0D0B] border border-siteflow-border/30 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-siteflow-cream flex items-center gap-1.5">
                <Users className="w-4 h-4 text-siteflow-amber" />
                <span>Manpower Scaling</span>
              </span>
              <span className="text-siteflow-amberBright font-bold text-sm">
                {manpowerDelta > 0 ? `+${manpowerDelta}%` : `${manpowerDelta}%`}
              </span>
            </div>
            <input 
              type="range"
              min="-40"
              max="60"
              step="5"
              value={manpowerDelta}
              onChange={(e) => setManpowerDelta(Number(e.target.value))}
              className="w-full accent-siteflow-amber cursor-pointer"
            />
            <p className="text-[11px] text-siteflow-muted font-sans">Deploy additional certified welders / fitters</p>
          </div>

          {/* Equipment Availability Slider */}
          <div className="p-4 rounded-xl bg-[#0A0D0B] border border-siteflow-border/30 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-siteflow-cream flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-siteflow-mint" />
                <span>Equipment Uptime</span>
              </span>
              <span className="text-siteflow-mint font-bold text-sm">
                {equipDelta > 0 ? `+${equipDelta}%` : `${equipDelta}%`}
              </span>
            </div>
            <input 
              type="range"
              min="-30"
              max="30"
              step="5"
              value={equipDelta}
              onChange={(e) => setEquipDelta(Number(e.target.value))}
              className="w-full accent-siteflow-mint cursor-pointer"
            />
            <p className="text-[11px] text-siteflow-muted font-sans">Preventive maintenance & crane availability</p>
          </div>

          {/* Material Delivery Slider */}
          <div className="p-4 rounded-xl bg-[#0A0D0B] border border-siteflow-border/30 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-siteflow-cream flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-siteflow-cream" />
                <span>Material Staging</span>
              </span>
              <span className="text-siteflow-cream font-bold text-sm">
                {materialDelta > 0 ? `+${materialDelta}%` : `${materialDelta}%`}
              </span>
            </div>
            <input 
              type="range"
              min="-30"
              max="30"
              step="5"
              value={materialDelta}
              onChange={(e) => setMaterialDelta(Number(e.target.value))}
              className="w-full accent-siteflow-cream cursor-pointer"
            />
            <p className="text-[11px] text-siteflow-muted font-sans">Expedite valve & spool vendor deliveries</p>
          </div>

        </div>
      </div>

      {activitiesError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200 space-y-3" role="alert">
          <div className="font-semibold">{activitiesError}</div>
          <button type="button" onClick={() => window.location.reload()} className="rounded-lg border border-rose-400/40 px-3 py-2 text-xs font-mono font-bold hover:bg-rose-500/15">Retry</button>
        </div>
      )}

      {!loading && !activitiesError && activities.length === 0 && (
        <div className="siteflow-card p-12 text-center text-sm text-siteflow-muted">No L5/L6 activities are available for simulation.</div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200 space-y-3" role="alert">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-5 h-5 text-rose-300" />
            <span>AI Risk Engine temporarily unavailable</span>
          </div>
          <p className="text-sm text-rose-200/80">{error}</p>
          <button type="button" onClick={runSimulation} disabled={!selectedActivityId} className="inline-flex items-center gap-2 rounded-lg border border-rose-400/40 px-3 py-2 text-xs font-mono font-bold hover:bg-rose-500/15 disabled:opacity-50">
            Retry simulation
          </button>
        </div>
      )}

      {/* Simulation Results Grid */}
      {simulationResult && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Days Saved Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#16382A] via-[#0E1310] to-[#0C2119] border border-siteflow-mint/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="text-xs font-bold text-siteflow-mint uppercase tracking-wider">
                Simulated Schedule Recovery
              </div>
              <h3 className="text-lg font-bold text-siteflow-cream font-sans">
                {simulationResult.simulation_summary}
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-[#0A0D0B] border border-siteflow-mint/30 text-center flex-shrink-0">
              <div className="text-3xl font-extrabold text-siteflow-mint">
                ~{simulationResult.delay_days_saved} Days
              </div>
              <div className="text-[11px] text-siteflow-muted uppercase">Recovered Duration</div>
            </div>
          </div>

          {/* Before vs After Side-by-Side Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Baseline Current State */}
            <div className="p-6 rounded-2xl bg-[#0A0D0B] border border-siteflow-border/30 space-y-4">
              <div className="text-xs font-bold text-siteflow-muted uppercase tracking-wider">
                Baseline (Current Trajectory)
              </div>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-3 rounded-lg bg-[#0E1310] border border-siteflow-border/20">
                  <span className="text-siteflow-muted">Risk Score:</span>
                  <span className="text-rose-400 font-bold">{simulationResult.baseline_risk_score}/100</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-[#0E1310] border border-siteflow-border/20">
                  <span className="text-siteflow-muted">Delay Probability:</span>
                  <span className="text-rose-400 font-bold">{Math.round(simulationResult.baseline_delay_probability * 100)}%</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-[#0E1310] border border-siteflow-border/20">
                  <span className="text-siteflow-muted">Predicted Remaining:</span>
                  <span className="text-siteflow-cream font-bold">{simulationResult.baseline_predicted_remaining_days} days</span>
                </div>
              </div>
            </div>

            {/* Simulated Optimized State */}
            <div className="p-6 rounded-2xl bg-[#0E1310] border border-siteflow-mint/40 space-y-4 shadow-xl">
              <div className="text-xs font-bold text-siteflow-mint uppercase tracking-wider">
                Simulated Intervention Result
              </div>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-3 rounded-lg bg-[#0A0D0B] border border-siteflow-mint/20">
                  <span className="text-siteflow-muted">New Risk Score:</span>
                  <span className="text-siteflow-mint font-bold">{simulationResult.simulated_risk_score}/100</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-[#0A0D0B] border border-siteflow-mint/20">
                  <span className="text-siteflow-muted">New Delay Probability:</span>
                  <span className="text-siteflow-mint font-bold">{Math.round(simulationResult.simulated_delay_probability * 100)}%</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-[#0A0D0B] border border-siteflow-mint/20">
                  <span className="text-siteflow-muted">Compressed Remaining:</span>
                  <span className="text-siteflow-amberBright font-bold text-sm">{simulationResult.simulated_predicted_remaining_days} days</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
