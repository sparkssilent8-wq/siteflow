import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  TrendingUp,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { StatusBadge, RiskBadge, DisciplineBadge, WbsBadge } from '../components/Badges';
import { api } from '../api/client';

function EvidenceImage({ src }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="h-36 rounded-lg border border-siteflow-border/20 bg-[#0A0D0B] mt-2 flex flex-col items-center justify-center gap-2 text-siteflow-muted">
        <ImageIcon className="w-6 h-6 opacity-60" />
        <span className="text-[11px] font-mono">Site evidence unavailable</span>
      </div>
    );
  }
  return (
    <div className="h-36 rounded-lg overflow-hidden border border-siteflow-border/20 bg-[#0A0D0B] mt-2">
      <img src={src} alt="Site evidence" loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-cover" />
    </div>
  );
}

function safePercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 0;
}

export function ReviewQueue() {
  const { currentProjectId, refreshGlobal } = useOutletContext();
  const navigate = useNavigate();

  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const loadQueue = async () => {
    if (!currentProjectId) {
      setLoading(false);
      setQueueData({ items: [], pending_count: 0 });
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPendingReviews(currentProjectId);
      setQueueData(data);
    } catch (err) {
      console.error("Failed to load review queue:", err);
      setError(err?.message || 'Unable to load the review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [currentProjectId]);

  const handleApprove = async (item) => {
    if (!item.matched_activity?.id) {
      setNotice({
        type: 'warning',
        text: 'This site update has no matched schedule activity. Please rematch or reject it.',
      });
      return;
    }
    try {
      setActionInProgress(item.site_update_id);
      setNotice(null);
      await api.approveReview({
        site_update_id: item.site_update_id,
        activity_id: item.matched_activity.id,
        decision: "APPROVED",
        adjusted_progress: item.proposed_progress,
        reviewer_name: "Project Manager",
        review_notes: "Verified against jobsite photo evidence and welding log."
      });

      await loadQueue();
      await refreshGlobal();
    } catch (err) {
      setNotice({ type: 'error', text: `Approval failed: ${err?.message || 'The schedule was not updated.'}` });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (item) => {
    const reason = prompt("Enter reason for rejection:", "Observation does not align with schedule activity.");
    if (reason === null) return;

    try {
      setActionInProgress(item.site_update_id);
      setNotice(null);
      await api.rejectReview({
        site_update_id: item.site_update_id,
        activity_id: item.matched_activity?.id,
        decision: "REJECTED",
        reviewer_name: "Project Manager",
        review_notes: reason
      });

      await loadQueue();
      await refreshGlobal();
    } catch (err) {
      setNotice({ type: 'error', text: `Rejection failed: ${err?.message || 'The update was not rejected.'}` });
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-8 pb-10 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-siteflow-amber font-semibold uppercase tracking-wider">
            Human-In-The-Loop Verification Command
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-siteflow-cream tracking-tight mt-1 font-display uppercase">
            Site Verification & Approval Queue
          </h1>
          <p className="text-xs text-siteflow-muted mt-1 font-sans">
            Verify automated matches before actual progress is written to the schedule baseline.
          </p>
        </div>

        <button
          onClick={loadQueue}
          className="flex items-center gap-2 bg-[#0E1310] hover:bg-[#141B16] border border-siteflow-border/30 text-siteflow-cream font-semibold px-4 py-2 rounded-lg text-xs font-mono transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-siteflow-amber" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {notice && (
        <div className={`rounded-lg border px-4 py-3 text-xs font-mono ${notice.type === 'error' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-siteflow-amber/30 bg-siteflow-amber/10 text-siteflow-amberBright'}`} role="alert">
          {notice.text}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200 space-y-3" role="alert">
          <p className="font-semibold">{error}</p>
          <button type="button" onClick={loadQueue} className="inline-flex items-center gap-2 rounded-lg border border-rose-400/40 px-3 py-2 text-xs font-mono font-bold hover:bg-rose-500/15">
            <RefreshCw className="w-3.5 h-3.5" /> Retry queue
          </button>
        </div>
      )}

      {/* Queue Items */}
      {loading ? (
        <div className="siteflow-card p-12 text-center text-sm text-siteflow-muted font-mono">Loading review queue…</div>
      ) : queueData?.items?.length > 0 ? (
        <div className="space-y-6">
          {queueData.items.map((item) => {
            const isProcessing = actionInProgress === item.site_update_id;
             const progressDelta = item.matched_activity
               ? (safePercent(item.proposed_progress) - safePercent(item.matched_activity.current_progress)).toFixed(1)
               : '0.0';

            return (
              <div 
                key={item.site_update_id}
                className="siteflow-card p-6 border-siteflow-amber/30 space-y-6 hover:border-siteflow-amber/60 transition-all shadow-xl"
              >
                
                {/* Top Badge Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-siteflow-border/20 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-siteflow-amber/20 text-siteflow-amberBright font-bold border border-siteflow-amber/30">
                      PENDING SUPERVISOR VERIFICATION
                    </span>
                    {item.source === 'TIME_AGENT_VOICE' && <span className="px-2 py-0.5 rounded-full bg-siteflow-mint/10 text-siteflow-mint font-bold border border-siteflow-mint/30">🎙 TIME AGENT</span>}
                    {item.event_type && <span className="px-2 py-0.5 rounded bg-[#0A0D0B] text-siteflow-cream border border-siteflow-border/30 font-bold">{item.event_type}</span>}
                    <span className="text-siteflow-muted">•</span>
                    <span className="text-siteflow-cream">Submitted {new Date(item.submitted_date).toLocaleTimeString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-siteflow-muted">Match Confidence:</span>
                    <span className="px-2 py-0.5 rounded bg-siteflow-mint/20 text-siteflow-mint font-bold border border-siteflow-mint/40">
                       {Math.round(Math.min(1, Math.max(0, Number(item.match_confidence) || 0)) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Side-by-Side Comparison: Submitted Update vs Matched Schedule Activity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
                  
                  {/* Left: Submitted Site Report */}
                  <div className="p-4 rounded-xl bg-[#0A0D0B] border border-siteflow-border/30 space-y-3">
                    <div className="text-xs font-bold text-siteflow-muted uppercase tracking-wider flex items-center justify-between">
                      <span>Submitted Site Report</span>
                      <span className="text-siteflow-amber text-[11px]">RAW FIELD INPUT</span>
                    </div>

                    <p className="text-sm font-semibold text-siteflow-cream leading-snug font-sans">
                      "{item.raw_text}"
                    </p>

                    <div className="space-y-1 text-xs text-siteflow-muted">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-siteflow-muted" />
                        <span>{item.location || 'Site Location'}</span>
                      </div>
                      <div>Contractor: <span className="text-siteflow-cream">{item.contractor}</span></div>
                    </div>

                    {item.source === 'TIME_AGENT_VOICE' && (
                      <div className="mt-3 p-3 rounded-lg bg-[#0E1511] border border-siteflow-mint/20 space-y-2">
                        <div className="text-[10px] uppercase tracking-wider text-siteflow-mint font-bold">Time Agent Audit</div>
                        <div className="text-[11px] text-siteflow-muted">Transcript: <span className="text-siteflow-cream">{item.voice_transcript || item.raw_text}</span></div>
                        <div className="text-[11px] text-siteflow-muted">Extracted activity: <span className="text-siteflow-cream">{item.extracted_activity || '—'}</span></div>
                        <div className="text-[11px] text-siteflow-muted">Event time: <span className="text-siteflow-cream">{item.actual_event_time ? new Date(item.actual_event_time).toLocaleString() : 'Capture timestamp'}</span></div>
                      </div>
                    )}

                     {item.photo_url && (
                       <EvidenceImage src={item.photo_url} />
                    )}
                  </div>

                  {/* Right: Suggested Schedule Activity */}
                   <div className={`p-4 rounded-xl border space-y-3 ${item.matched_activity ? 'bg-[#0C2119]/30 border-siteflow-mint/30' : 'bg-siteflow-amber/5 border-siteflow-amber/40'}`}>
                    <div className="text-xs font-bold text-siteflow-mint uppercase tracking-wider flex items-center justify-between">
                      <span>Suggested Schedule Activity</span>
                      <WbsBadge level={item.matched_activity?.wbs_level} />
                    </div>

                     {!item.matched_activity ? (
                       <div className="rounded-lg border border-siteflow-amber/30 bg-siteflow-amber/10 p-4 space-y-2">
                         <div className="flex items-center gap-2 text-siteflow-amberBright font-bold text-sm">
                           <AlertTriangle className="w-4 h-4" />
                           <span>No schedule activity matched</span>
                         </div>
                         <p className="text-xs text-siteflow-muted">Match status: unresolved. Suggested action: rematch the update or reject it. Approval is disabled until a valid activity exists.</p>
                       </div>
                     ) : (
                       <div>
                         <div className="font-bold text-siteflow-amberBright text-sm">
                           {item.matched_activity.activity_code}
                         </div>
                         <h4 className="font-extrabold text-base text-siteflow-cream mt-0.5 font-sans">
                           {item.matched_activity.activity_name}
                         </h4>
                         <div className="mt-2">
                           <DisciplineBadge discipline={item.matched_activity.discipline} />
                         </div>
                       </div>
                     )}

                    {/* Progress Delta Box */}
                    <div className="p-3 rounded-lg bg-[#0A0D0B] border border-siteflow-border/20 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-siteflow-muted">Current Actual Progress:</span>
                         <span className="text-siteflow-cream font-bold">{safePercent(item.matched_activity?.current_progress)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-siteflow-muted">Proposed New Progress:</span>
                         <span className="text-siteflow-amberBright font-bold text-sm">{safePercent(item.proposed_progress)}%</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1 border-t border-siteflow-border/20">
                        <span className="text-siteflow-muted">Progress Jump:</span>
                        <span className="text-siteflow-mint font-bold">+{progressDelta}%</span>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Actions Footer */}
                <div className="pt-2 flex items-center justify-end gap-4 font-mono">
                  <button
                    onClick={() => handleReject(item)}
                     disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 font-bold text-xs transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Update</span>
                  </button>

                  <button
                    onClick={() => handleApprove(item)}
                     disabled={isProcessing || !item.matched_activity?.id}
                     title={!item.matched_activity?.id ? 'A matched schedule activity is required before approval' : undefined}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright hover:from-siteflow-amberBright hover:to-siteflow-amber text-[#0A0D0B] font-extrabold text-xs shadow-lg shadow-siteflow-amber/20 transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>{isProcessing ? 'Updating Schedule...' : 'Approve & Update Schedule Progress'}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="siteflow-card p-12 text-center space-y-4 font-mono">
          <div className="w-12 h-12 rounded-full bg-siteflow-mint/20 text-siteflow-mint flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-siteflow-cream font-sans">Review Queue is Clear!</h3>
            <p className="text-xs text-siteflow-muted">All submitted site execution updates have been reviewed and verified.</p>
          </div>
          <button
            onClick={() => navigate('/site-updates')}
            className="px-4 py-2 rounded-lg bg-siteflow-amber hover:bg-siteflow-amberBright text-[#0A0D0B] font-bold text-xs transition-all"
          >
            Submit Another Site Update
          </button>
        </div>
      )}

    </div>
  );
}
