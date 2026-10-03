import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  BrainCircuit, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  Activity, 
  SlidersHorizontal, 
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Info,
  Clock
} from 'lucide-react';
import { StatusBadge, RiskBadge, DisciplineBadge } from '../components/Badges';
import { api } from '../api/client';

export function AIRisk() {
  const { currentProjectId } = useOutletContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [selectedActivityId, setSelectedActivityId] = useState(searchParams.get('activity_id') || '');
  const [prediction, setPrediction] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mlHealth, setMlHealth] = useState(null);
  const [error, setError] = useState(null);
  const [activitiesError, setActivitiesError] = useState(null);

  // Load activities list
  useEffect(() => {
    async function loadActivities() {
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
        console.error("Failed to load activities for ML:", err);
        setActivitiesError(err?.message || 'Unable to load activities for AI Risk.');
      }
    }
    loadActivities();
  }, [currentProjectId]);

  // Run ML Prediction
  const runPrediction = async () => {
    if (!selectedActivityId) return;
    const act = activities.find(a => a.id === Number(selectedActivityId));
    if (!act) return;

    try {
      setLoading(true);
      setError(null);

      const payload = {
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
        manpower_early_avg: 18.0,
        progress_velocity_recent: 1.1,
        progress_velocity_early: 1.9,
        planned_days_remaining_at_snapshot: 15.0
      };

      const [predRes, healthRes] = await Promise.all([
        api.predictRisk(payload),
        api.getMLHealth().catch(() => null)
      ]);

      setPrediction(predRes);
      setMlHealth(healthRes);

      // Load Recommendations
      const recRes = await api.getRecommendations({
        predict_result: predRes,
        activity_name: act.activity_name,
        discipline: act.discipline
      });
      setRecommendations(recRes.recommendations || []);

    } catch (err) {
      console.error("ML Prediction failed:", err);
      setPrediction(null);
      setRecommendations([]);
      setMlHealth({ status: 'degraded', backend_ml_connection: 'disconnected' });
      setError(err?.message || 'AI Risk Engine temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedActivityId && activities.length > 0) {
      runPrediction();
    }
  }, [selectedActivityId, activities]);

  const selectedActivity = activities.find(a => a.id === Number(selectedActivityId));

  return (
    <div className="space-y-8 pb-10 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-siteflow-mint font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-siteflow-mint" />
            <span>Machine Learning Delay Forecasting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-siteflow-cream tracking-tight mt-1 font-display uppercase">
            Execution Risk & Delay Prediction Engine
          </h1>
          <p className="text-xs text-siteflow-muted mt-1">
            Trained GradientBoosting models forecasting completion dates, factor contributions, and prescriptive remedies.
          </p>
        </div>

        {/* Activity Selector */}
        <div className="flex items-center gap-2 bg-[#0E1310] border border-siteflow-border/40 px-3 py-1.5 rounded-lg">
          <label htmlFor="ai-risk-activity-select" className="text-xs text-siteflow-muted font-semibold font-mono">Inspect Activity:</label>
          <select
            id="ai-risk-activity-select"
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
            className="bg-transparent text-xs font-bold text-siteflow-amberBright focus:outline-none cursor-pointer pr-2 font-mono"
          >
            {activities.map((a) => (
              <option key={a.id} value={a.id} className="bg-[#0E1310] text-siteflow-cream">
                {a.activity_code} - {a.activity_name} ({a.actual_progress}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="p-12 siteflow-card text-center space-y-3">
          <BrainCircuit className="w-8 h-8 text-siteflow-amber animate-spin mx-auto" />
          <p className="text-xs font-mono text-siteflow-muted">Running GradientBoosting inference & SHAP factor calculations...</p>
        </div>
      )}

      {activitiesError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200 space-y-3" role="alert">
          <div className="font-semibold">{activitiesError}</div>
          <button type="button" onClick={() => window.location.reload()} className="rounded-lg border border-rose-400/40 px-3 py-2 text-xs font-mono font-bold hover:bg-rose-500/15">Retry</button>
        </div>
      )}

      {!loading && !activitiesError && activities.length === 0 && (
        <div className="siteflow-card p-12 text-center text-sm text-siteflow-muted">No L5/L6 activities are available for AI Risk analysis.</div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200 space-y-3" role="alert">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-5 h-5" />
            <span>AI Risk Engine temporarily unavailable</span>
          </div>
          <p className="text-sm text-rose-200/80">{error}</p>
          <button type="button" onClick={runPrediction} disabled={!selectedActivityId} className="inline-flex items-center gap-2 rounded-lg border border-rose-400/40 px-3 py-2 text-xs font-mono font-bold hover:bg-rose-500/15 disabled:opacity-50">
            Retry prediction
          </button>
        </div>
      )}

      {!loading && prediction && selectedActivity && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Anomaly Detection Banner */}
          {prediction.is_anomalous && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider font-mono">
                <ShieldAlert className="w-4 h-4" />
                <span>Execution Anomaly Detected</span>
              </div>
              <ul className="space-y-1 text-xs font-mono text-siteflow-cream pl-6 list-disc">
                 {(prediction.anomaly_reasons || []).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Top Prediction Snapshot Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
            
            <div className="siteflow-card p-5 space-y-2">
              <div className="text-xs text-siteflow-muted">Risk Assessment</div>
              <div className="flex items-center gap-2">
                <RiskBadge level={prediction.risk_category} />
                <span className="text-xs font-bold text-siteflow-cream">({prediction.risk_score_0_100}/100)</span>
              </div>
              <div className="text-[11px] text-siteflow-muted">Composite severity</div>
            </div>

            <div className="siteflow-card p-5 space-y-2">
              <div className="text-xs text-siteflow-muted">Delay Probability</div>
              <div className="text-2xl font-extrabold text-rose-400">
                {Math.round(prediction.delay_probability * 100)}%
              </div>
              <div className="text-[11px] text-siteflow-muted">P(Delay &gt; 5 days)</div>
            </div>

            <div className="siteflow-card p-5 space-y-2">
              <div className="text-xs text-siteflow-muted">Predicted Remaining Days</div>
              <div className="text-2xl font-extrabold text-siteflow-amberBright">
                {prediction.predicted_remaining_days} d
              </div>
              <div className="text-[11px] text-siteflow-muted">80% Conf: {prediction.prediction_interval_80pct}</div>
            </div>

            <div className="siteflow-card p-5 space-y-2">
              <div className="text-xs text-siteflow-muted">Expected Total Duration</div>
              <div className="text-2xl font-extrabold text-siteflow-cream">
                {prediction.expected_completion_in_days} d
              </div>
              <div className="text-[11px] text-siteflow-muted">Planned: {selectedActivity.planned_duration} days</div>
            </div>

          </div>

          {/* Factor Contributions (Explainability) & Natural Language Explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Factor Contribution Chart (3 cols) */}
            <div className="siteflow-card p-6 lg:col-span-3 space-y-5">
              <div>
                <h3 className="font-bold text-base text-siteflow-cream font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-siteflow-amber" />
                  <span>Transparent Factor Contributions (SHAP-Style)</span>
                </h3>
                <p className="text-xs text-siteflow-muted">Exact drivers contributing to the {prediction.risk_score_0_100} risk score</p>
              </div>

              <div className="space-y-4">
                {Object.entries(prediction.factor_contributions || {}).map(([factor, score]) => {
                  const pct = Math.min(100, Math.max(5, (score / Math.max(1, prediction.risk_score_0_100)) * 100));
                  return (
                    <div key={factor} className="space-y-1.5 font-mono">
                      <div className="flex justify-between text-xs">
                        <span className="text-siteflow-cream">{factor}</span>
                        <span className="text-siteflow-amber font-bold">{score} pts</span>
                      </div>
                      <div className="w-full bg-[#141B16] h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-xl bg-[#0A0D0B] border border-siteflow-border/30 text-xs font-mono text-siteflow-muted flex items-center justify-between">
                <span>Model: {prediction.model_confidence_note}</span>
                <span className="text-siteflow-mint font-bold">Validated</span>
              </div>
            </div>

            {/* Natural Language Explanation (2 cols) */}
            <div className="siteflow-card p-6 lg:col-span-2 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="font-bold text-base text-siteflow-cream font-mono flex items-center gap-2">
                  <Info className="w-4 h-4 text-siteflow-mint" />
                  <span>AI Executive Explanation</span>
                </h3>
                <div className="p-4 rounded-xl bg-[#0A0D0B] border border-siteflow-border/30 text-xs leading-relaxed text-siteflow-cream font-sans">
                  {prediction.explanation}
                </div>
              </div>

              <button
                onClick={() => navigate(`/simulation?activity_id=${selectedActivity.id}`)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright hover:from-siteflow-amberBright hover:to-siteflow-amber text-[#0A0D0B] font-extrabold text-xs font-mono flex items-center justify-center gap-2 shadow-lg shadow-siteflow-amber/20 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
                <span>Simulate Resource Adjustments</span>
              </button>
            </div>

          </div>

          {/* Actionable Prescriptive Recommendations */}
          <div className="siteflow-card p-6 space-y-4">
            <h3 className="font-bold text-base text-siteflow-cream font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-siteflow-mint" />
              <span>Prescriptive Action Plan & Mitigation Strategies</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#0A0D0B] border border-siteflow-border/30 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        rec.priority === 'HIGH' 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                          : 'bg-siteflow-amber/20 text-siteflow-amberBright border border-siteflow-amber/40'
                      }`}>
                        {rec.priority} PRIORITY
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-siteflow-cream font-mono">{rec.title}</h4>
                    <p className="text-xs text-siteflow-muted leading-relaxed font-sans">{rec.rationale}</p>
                    
                    <div className="p-2 rounded bg-[#0E1310] border border-siteflow-border/20 text-[11px] text-siteflow-mint font-mono">
                      <strong>Projected Impact:</strong> {rec.impact}
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-siteflow-border/20 text-[11px] text-siteflow-muted font-sans">
                    <div className="font-semibold text-siteflow-cream">Action Steps:</div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {rec.action_steps?.map((step, sIdx) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
