import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Mic, MicOff, RefreshCw, Sparkles, X, AlertTriangle, Clock3 } from 'lucide-react';
import { api } from '../api/client';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { parseTimeAgentTranscript } from '../utils/timeAgentParser';
import { WbsBadge, DisciplineBadge } from './Badges';

const HIGH_CONFIDENCE = 0.85;

export function TimeAgent({ projectId, onClose, onSubmitted, initialTranscript = '' }) {
  const [language, setLanguage] = useState('en-IN');
  const speech = useSpeechRecognition({ language });
  const [manualTranscript, setManualTranscript] = useState(initialTranscript);
  const [phase, setPhase] = useState('IDLE');
  const [processing, setProcessing] = useState(false);
  const [extraction, setExtraction] = useState(null);
  const [match, setMatch] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState(null);

  const transcript = useMemo(() => `${speech.transcript} ${speech.interimTranscript}`.trim(), [speech.transcript, speech.interimTranscript]);
  const activeTranscript = manualTranscript || transcript;

  useEffect(() => {
    if (transcript) setManualTranscript(transcript);
  }, [transcript]);

  useEffect(() => {
    if (!speech.isListening && manualTranscript.trim()) setPhase('TRANSCRIBING');
  }, [speech.isListening, manualTranscript]);

  const begin = () => {
    setError(null);
    setSubmitted(null);
    setExtraction(null);
    setMatch(null);
    setManualTranscript('');
    speech.resetTranscript();
    setPhase('REQUESTING_MIC');
    const ok = speech.startListening();
    if (!ok && !speech.isSupported) {
      setPhase('IDLE');
      setError('Voice input is not supported in this browser. You can paste/type the field update below.');
    } else if (ok) {
      setPhase('LISTENING');
    }
  };

  const stop = () => {
    speech.stopListening();
    setPhase('TRANSCRIBING');
  };

  const understand = async () => {
    const text = activeTranscript.trim();
    if (!text || !projectId) return;
    setProcessing(true);
    setError(null);
    try {
      setPhase('UNDERSTANDING');
      const parsed = parseTimeAgentTranscript(text);
      const backendResult = await api.processTimeAgent({ project_id: projectId, transcript: text });
      const merged = { ...parsed, ...backendResult.extracted, confidence: backendResult.extraction_confidence ?? parsed.confidence };
      setExtraction(merged);
      setPhase('MATCHING');
      const matchRes = await api.matchText({ project_id: projectId, raw_text: text, top_k: 3, discipline_hint: merged.discipline || undefined });
      setMatch(matchRes);
      setPhase('READY_FOR_CONFIRMATION');
    } catch (err) {
      setError(err.message || 'Time Agent could not understand this update.');
      setPhase('IDLE');
    } finally {
      setProcessing(false);
    }
  };

  const confirm = async () => {
    if (!extraction || !match?.top_match || !projectId) return;
    setProcessing(true);
    setError(null);
    try {
      const result = await api.submitSiteUpdate({
        project_id: projectId,
        raw_text: activeTranscript,
        progress_pct: extraction.event_type === 'ACTUAL_END' ? 100 : extraction.progress_pct,
        status: extraction.event_type === 'ACTUAL_END' ? 'COMPLETED' : extraction.event_type === 'ACTUAL_START' ? 'IN_PROGRESS' : undefined,
        remarks: `Captured by Time Agent (${extraction.event_type})`,
        location: extraction.location,
        source: 'TIME_AGENT_VOICE',
        event_type: extraction.event_type,
        voice_transcript: activeTranscript,
        extracted_activity: extraction.activity_description,
        extracted_discipline: extraction.discipline,
        actual_event_time: extraction.actual_event_time,
        extraction_confidence: extraction.confidence,
      });

      const highConfidence = (match.top_match.confidence_score || 0) >= HIGH_CONFIDENCE && !match.top_match.requires_review;
      let finalResult = result;
      if (highConfidence && result?.id) {
        finalResult = await api.approveReview({
          site_update_id: result.id,
          activity_id: match.top_match.activity_id,
          adjusted_progress: extraction.event_type === 'ACTUAL_END' ? 100 : extraction.progress_pct ?? undefined,
          reviewer_name: 'Time Agent User Confirmation',
          review_notes: `Confirmed through Time Agent at ${extraction.actual_event_time || 'captured time'}.`,
        });
      }
      setSubmitted({ ...result, autoApproved: highConfidence, approval: finalResult });
      setPhase('SUBMITTED');
      if (onSubmitted) onSubmitted(result);
    } catch (err) {
      setError(err.message || 'Could not submit the voice update.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    speech.resetTranscript();
    setManualTranscript('');
    setExtraction(null);
    setMatch(null);
    setSubmitted(null);
    setError(null);
    setPhase('IDLE');
  };

  const confidence = match?.top_match?.confidence_score || 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="SiteFlow Time Agent">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-siteflow-border/40 bg-[#0B100D] shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between px-5 py-4 border-b border-siteflow-border/25">
          <div>
            <div className="flex items-center gap-2 text-siteflow-amber font-mono text-[11px] uppercase tracking-widest font-bold"><Clock3 className="w-4 h-4" /> Time Agent</div>
            <h2 className="text-lg font-bold text-siteflow-cream mt-1">Voice-to-Verified Site Update</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#141B16] text-siteflow-muted" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          {phase !== 'READY_FOR_CONFIRMATION' && phase !== 'SUBMITTED' && (
            <div className="rounded-2xl border border-siteflow-border/30 bg-[#0E1511] p-5 text-center">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center border ${speech.isListening ? 'border-siteflow-amber bg-siteflow-amber/10 animate-pulse' : 'border-siteflow-border/50 bg-[#0A0D0B]'}`}>
                {speech.isListening ? <Mic className="w-8 h-8 text-siteflow-amber" /> : <MicOff className="w-8 h-8 text-siteflow-muted" />}
              </div>
              <div className="mt-3 text-sm font-bold text-siteflow-cream">{phase === 'LISTENING' ? 'Listening… speak naturally' : phase === 'UNDERSTANDING' ? 'Understanding field update…' : phase === 'MATCHING' ? 'Linking to L5/L6 schedule…' : 'Capture a field update'}</div>
              <div className="mt-1 text-[11px] text-siteflow-muted">Example: “Line 24 spool erection started at compressor station at 10:30 AM.”</div>
              <div className="mt-4 flex justify-center gap-2">
                {!speech.isListening ? <button onClick={begin} disabled={processing} className="px-5 py-2.5 rounded-xl bg-siteflow-amber text-[#0A0D0B] font-extrabold text-xs flex items-center gap-2 disabled:opacity-50"><Mic className="w-4 h-4" /> Start Listening</button> : <button onClick={stop} className="px-5 py-2.5 rounded-xl border border-siteflow-amber/50 text-siteflow-amber font-bold text-xs flex items-center gap-2"><MicOff className="w-4 h-4" /> Stop & Understand</button>}
                <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={speech.isListening} className="bg-[#0A0D0B] border border-siteflow-border/30 rounded-xl px-3 text-xs text-siteflow-cream">
                  <option value="en-IN">English (India)</option><option value="hi-IN">Hindi</option><option value="en-US">English (US)</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider font-mono text-siteflow-muted font-bold">Live / editable transcript</label>
            <textarea value={activeTranscript} onChange={(e) => setManualTranscript(e.target.value)} rows={3} placeholder="Speak or type a field update…" className="w-full rounded-xl bg-[#070A08] border border-siteflow-border/30 p-3 text-sm text-siteflow-cream placeholder-siteflow-muted focus:outline-none focus:border-siteflow-amber" />
            {speech.error && <div className="text-[11px] text-rose-300">Microphone: {speech.error}</div>}
            {!speech.isSupported && <div className="text-[11px] text-siteflow-muted">This browser does not expose SpeechRecognition. Text fallback is available.</div>}
            {activeTranscript && phase !== 'READY_FOR_CONFIRMATION' && phase !== 'SUBMITTED' && <button onClick={understand} disabled={processing} className="w-full py-2.5 rounded-xl border border-siteflow-border/40 hover:border-siteflow-amber text-siteflow-cream font-bold text-xs flex items-center justify-center gap-2"><Sparkles className="w-4 h-4 text-siteflow-amber" /> {processing ? 'Processing…' : 'Understand & Match Update'}</button>}
          </div>

          {extraction && (
            <div className="rounded-2xl border border-siteflow-border/30 bg-[#0E1511] p-4 space-y-3">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-siteflow-cream">UNDERSTANDING</span><span className="text-[11px] font-mono text-siteflow-mint">{Math.round((extraction.confidence || 0) * 100)}% extraction confidence</span></div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="Event" value={extraction.event_type} accent />
                <Field label="Discipline" value={extraction.discipline || 'Not detected'} />
                <Field label="Activity" value={extraction.activity_description || 'Not detected'} wide />
                <Field label="Location" value={extraction.location || 'Not detected'} />
                <Field label="Actual time" value={extraction.actual_time || extraction.actual_event_time || 'Capture time'} />
                {extraction.progress_pct !== null && extraction.progress_pct !== undefined && <Field label="Progress" value={`${extraction.progress_pct}%`} />}
              </div>
            </div>
          )}

          {match?.top_match && (
            <div className="rounded-2xl border border-siteflow-mint/30 bg-[#0D1913] p-4 space-y-3">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-siteflow-cream">SCHEDULE LINK</span><span className="text-sm font-bold text-siteflow-mint">{Math.round(confidence * 100)}%</span></div>
              <div className="h-2 rounded-full bg-[#0A0D0B] overflow-hidden"><div className="h-full bg-siteflow-mint rounded-full" style={{ width: `${confidence * 100}%` }} /></div>
              <div className="flex items-start justify-between gap-3"><div><div className="text-[11px] font-mono text-siteflow-amberBright">{match.top_match.activity_code}</div><div className="text-sm font-bold text-siteflow-cream mt-1">{match.top_match.activity_name}</div><div className="flex items-center gap-2 mt-2"><DisciplineBadge discipline={match.top_match.discipline} /><WbsBadge level={match.top_match.wbs_level} /></div></div><div className="text-right text-[10px] text-siteflow-muted">{confidence >= HIGH_CONFIDENCE && !match.top_match.requires_review ? 'HIGH CONFIDENCE' : 'HUMAN REVIEW'}</div></div>
              {confidence < HIGH_CONFIDENCE || match.top_match.requires_review ? <div className="flex gap-2 items-center text-[11px] text-siteflow-amber"><AlertTriangle className="w-4 h-4" /> This update will remain in the Review Queue.</div> : null}
            </div>
          )}

          {phase === 'READY_FOR_CONFIRMATION' && match?.top_match && <div className="flex gap-2"><button onClick={confirm} disabled={processing} className="flex-1 py-3 rounded-xl bg-siteflow-amber text-[#0A0D0B] font-extrabold text-xs flex items-center justify-center gap-2 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" /> {processing ? 'Verifying…' : 'Confirm Update'}</button><button onClick={reset} className="px-4 rounded-xl border border-siteflow-border/40 text-siteflow-cream text-xs font-bold">Edit</button></div>}

          {phase === 'SUBMITTED' && submitted && <div className="rounded-2xl border border-siteflow-mint/40 bg-[#123020]/40 p-4"><div className="flex items-center gap-2 text-siteflow-mint font-bold text-sm"><CheckCircle2 className="w-5 h-5" /> Update verified and routed</div><p className="text-[11px] text-siteflow-cream mt-2">{submitted.autoApproved ? 'High-confidence confirmation updated the activity.' : 'The update was sent to the Review Queue for human verification.'}</p><div className="flex gap-2 mt-4"><button onClick={reset} className="px-4 py-2 rounded-lg border border-siteflow-border/40 text-xs font-bold text-siteflow-cream flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Capture another</button><button onClick={onClose} className="flex-1 py-2 rounded-lg bg-siteflow-amber text-[#0A0D0B] font-extrabold text-xs">Close</button></div></div>}

          {error && <div className="p-3 rounded-xl border border-rose-400/30 bg-rose-500/10 text-[11px] text-rose-200">{error}</div>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, wide, accent }) {
  return <div className={`${wide ? 'col-span-2' : ''} rounded-xl bg-[#0A0D0B] border border-siteflow-border/20 p-3`}><div className="text-[10px] text-siteflow-muted uppercase tracking-wider">{label}</div><div className={`mt-1 font-semibold ${accent ? 'text-siteflow-amberBright' : 'text-siteflow-cream'}`}>{value}</div></div>;
}

export default TimeAgent;
