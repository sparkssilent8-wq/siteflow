import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  BrainCircuit, 
  Activity, 
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Layers,
  Send,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Area, 
  AreaChart 
} from 'recharts';
import { StatusBadge, RiskBadge, DisciplineBadge } from '../components/Badges';
import { api } from '../api/client';

export function Dashboard() {
  const { currentProjectId } = useOutletContext();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [varianceData, setVarianceData] = useState(null);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentProjectId) return;
      try {
        setLoading(true);
        const [ana, varRes, updates] = await Promise.all([
          api.getProjectAnalytics(currentProjectId),
          api.getProjectVariance(currentProjectId),
          api.getSiteUpdates(currentProjectId)
        ]);
        setAnalytics(ana);
        setVarianceData(varRes);
        setRecentUpdates(updates.slice(0, 5));
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [currentProjectId]);

  if (loading || !analytics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-[#141B16] rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-[#0E1310] rounded-xl border border-siteflow-border/20"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-[#0E1310] rounded-xl border border-siteflow-border/20"></div>
          <div className="h-80 bg-[#0E1310] rounded-xl border border-siteflow-border/20"></div>
        </div>
      </div>
    );
  }

  const pVariance = (analytics.overall_actual_progress - analytics.overall_planned_progress).toFixed(1);
  const isAhead = Number(pVariance) >= 0;

  return (
    <div className="space-y-8 pb-10">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-siteflow-amber font-semibold uppercase tracking-wider">
            <span>Digital Twin Intelligence Center</span>
            <span>•</span>
            <span className="text-siteflow-cream">{analytics.project_name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-siteflow-cream tracking-tight mt-1 font-display uppercase">
            Executive Control Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <Link
            to="/site-updates"
            className="flex items-center gap-2 bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright hover:from-siteflow-amberBright hover:to-siteflow-amber text-[#0A0D0B] font-extrabold px-4 py-2 rounded-lg text-xs shadow-md shadow-siteflow-amber/20 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Site Update</span>
          </Link>
          <Link
            to="/site-updates?timeAgent=1"
            className="flex items-center gap-2 bg-[#0E1310] hover:bg-[#141B16] border border-siteflow-amber/40 text-siteflow-amberBright font-bold px-4 py-2 rounded-lg text-xs transition-all"
          >
            <span>🎙</span><span>Time Agent</span>
          </Link>
          <Link
            to="/variance"
            className="flex items-center gap-2 bg-[#0E1310] hover:bg-[#141B16] border border-siteflow-border/30 text-siteflow-cream font-semibold px-4 py-2 rounded-lg text-xs transition-all"
          >
            <span>Variance Details</span>
            <ChevronRight className="w-3.5 h-3.5 text-siteflow-amber" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Overall Progress */}
        <div className="siteflow-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-siteflow-muted">
            <span>Overall Progress</span>
            <Activity className="w-4 h-4 text-siteflow-amber" />
          </div>
          <div className="text-2xl font-extrabold text-siteflow-cream font-mono">
            {analytics.overall_actual_progress}%
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="text-siteflow-muted">Plan: {analytics.overall_planned_progress}%</span>
            <span className={isAhead ? 'text-siteflow-mint' : 'text-rose-400 font-bold'}>
              ({isAhead ? `+${pVariance}` : pVariance}%)
            </span>
          </div>
        </div>

        {/* Total Activities */}
        <div className="siteflow-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-siteflow-muted">
            <span>Total Tasks</span>
            <Layers className="w-4 h-4 text-siteflow-mint" />
          </div>
          <div className="text-2xl font-extrabold text-siteflow-cream font-mono">
            {analytics.total_activities}
          </div>
          <div className="text-[11px] text-siteflow-muted font-mono">
            L5/L6 Activities
          </div>
        </div>

        {/* Completed */}
        <div className="siteflow-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-siteflow-muted">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-siteflow-mint" />
          </div>
          <div className="text-2xl font-extrabold text-siteflow-mint font-mono">
            {analytics.completed_activities}
          </div>
          <div className="text-[11px] text-siteflow-mint/80 font-mono">
            100% Sign-off
          </div>
        </div>

        {/* In Progress */}
        <div className="siteflow-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-siteflow-muted">
            <span>In Progress</span>
            <Clock className="w-4 h-4 text-siteflow-amberBright" />
          </div>
          <div className="text-2xl font-extrabold text-siteflow-amberBright font-mono">
            {analytics.in_progress_activities}
          </div>
          <div className="text-[11px] text-siteflow-amber font-mono">
            Active on site
          </div>
        </div>

        {/* Delayed */}
        <div className="siteflow-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-siteflow-muted">
            <span>Delayed</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono">
            {analytics.delayed_activities}
          </div>
          <div className="text-[11px] text-rose-400/80 font-mono">
            Variance &lt; -10%
          </div>
        </div>

        {/* High Risk */}
        <div className="siteflow-card p-4 space-y-2 bg-rose-950/20 border-rose-900/40">
          <div className="flex items-center justify-between text-xs font-mono text-rose-300">
            <span>Critical / High Risk</span>
            <BrainCircuit className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-300 font-mono">
            {analytics.high_risk_activities}
          </div>
          <div className="text-[11px] text-rose-400 font-mono">
            ML Delay Alert
          </div>
        </div>

      </div>

      {/* Main Charts Row: S-Curve & Discipline Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Planned vs Actual S-Curve Chart (2 cols) */}
        <div className="siteflow-card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-siteflow-cream font-mono">Planned vs Actual S-Curve Progression</h3>
              <p className="text-xs text-siteflow-muted">Sigmoid Baseline Curve vs Verified Site Progress</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-siteflow-muted"></span>
                <span className="text-siteflow-muted">Planned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded bg-siteflow-amber"></span>
                <span className="text-siteflow-amberBright font-bold">Actual</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.s_curve_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D98A32" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#D98A32" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#162019" />
                <XAxis dataKey="date" stroke="#9B9B91" fontSize={11} />
                <YAxis stroke="#9B9B91" fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0E1310', borderColor: 'rgba(217,138,50,0.3)', borderRadius: '0.5rem', fontSize: '12px' }}
                  labelStyle={{ color: '#F1EDE4', fontWeight: 'bold', fontFamily: 'monospace' }}
                />
                <Line type="monotone" dataKey="planned_pct" name="Planned %" stroke="#9B9B91" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                <Area type="monotone" dataKey="actual_pct" name="Actual %" stroke="#F2A84B" strokeWidth={3} fillOpacity={1} fill="url(#actualGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Discipline Performance Breakdown */}
        <div className="siteflow-card p-6 space-y-4">
          <div>
            <h3 className="font-bold text-base text-siteflow-cream font-mono">Discipline Performance</h3>
            <p className="text-xs text-siteflow-muted">Actual vs Planned Progress by Trade</p>
          </div>

          <div className="space-y-3">
            {analytics.disciplines.map((d) => {
              const varColor = d.variance >= 0 ? 'text-siteflow-mint' : 'text-rose-400';
              return (
                <div key={d.discipline} className="space-y-1.5 p-2.5 rounded-lg bg-[#0A0D0B] border border-siteflow-border/20">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <DisciplineBadge discipline={d.discipline} />
                      <span className="text-[11px] text-siteflow-muted font-mono">({d.total_activities} tasks)</span>
                    </div>
                    <div className="font-mono text-xs">
                      <span className="text-siteflow-cream font-bold">{d.actual_progress_avg}%</span>
                      <span className={`ml-1.5 text-[11px] font-bold ${varColor}`}>
                        {d.variance >= 0 ? `+${d.variance}%` : `${d.variance}%`}
                      </span>
                    </div>
                  </div>

                  {/* Dual progress bar */}
                  <div className="w-full bg-[#141B16] h-2 rounded-full overflow-hidden relative">
                    <div 
                      className="bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, d.actual_progress_avg)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Worst Schedule Variance Leaderboard */}
      <div className="siteflow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-siteflow-cream font-mono">Schedule Variance & Critical Activities</h3>
            <p className="text-xs text-siteflow-muted">Activities with the largest negative variance gap requiring immediate intervention</p>
          </div>
          <Link 
            to="/activities?status=DELAYED"
            className="text-xs text-siteflow-amber hover:text-siteflow-amberBright font-mono font-semibold flex items-center gap-1"
          >
            <span>View All Delayed Tasks</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0A0D0B] text-siteflow-muted uppercase text-[11px] border-b border-siteflow-border/30">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Activity Name</th>
                <th className="py-3 px-4">Discipline</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Planned</th>
                <th className="py-3 px-4">Actual</th>
                <th className="py-3 px-4">Variance</th>
                <th className="py-3 px-4">Slippage</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-siteflow-border/20 font-medium text-siteflow-cream">
              {varianceData?.worst_variance_activities?.slice(0, 5).map((act) => (
                <tr key={act.activity_id} className="hover:bg-[#141B16] transition-colors">
                  <td className="py-3 px-4 font-bold text-siteflow-amberBright">{act.activity_code}</td>
                  <td className="py-3 px-4 max-w-xs truncate text-siteflow-cream font-sans">{act.activity_name}</td>
                  <td className="py-3 px-4"><DisciplineBadge discipline={act.discipline} /></td>
                  <td className="py-3 px-4 text-siteflow-muted">{act.wbs_level}</td>
                  <td className="py-3 px-4">{act.planned_progress}%</td>
                  <td className="py-3 px-4 font-bold text-siteflow-cream">{act.actual_progress}%</td>
                  <td className="py-3 px-4 font-bold text-rose-400">
                    {act.progress_variance}%
                  </td>
                  <td className="py-3 px-4 text-siteflow-amber font-bold">
                    {act.schedule_variance_days} d
                  </td>
                  <td className="py-3 px-4"><RiskBadge level={act.risk_level} /></td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/activities?search=${act.activity_code}`}
                      className="px-2.5 py-1 rounded bg-[#0A0D0B] hover:bg-siteflow-amber/20 text-siteflow-amberBright text-xs font-semibold border border-siteflow-border/30 hover:border-siteflow-amber transition-all inline-block"
                    >
                      Inspect
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
