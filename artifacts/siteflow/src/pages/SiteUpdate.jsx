import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Camera, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Image as ImageIcon,
  CheckSquare,
  HelpCircle
} from 'lucide-react';
import { StatusBadge, DisciplineBadge, WbsBadge } from '../components/Badges';
import { api } from '../api/client';
import TimeAgent from '../components/TimeAgent';

const SAMPLE_PROMPTS = [
  {
    title: "Flagship SIH Piping Demo",
    text: "Erection of 24 inch line completed up to 60% with 14 welders on site",
    progress: 60,
    location: "Sector 4 Compressor Header",
    imgUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Civil Valve Pit Concrete Pour",
    text: "Concrete pour for Valve Pit #4 curing blanket applied. Cylinder test passed 32 MPa.",
    progress: 85,
    location: "Km 18 Valve Station",
    imgUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Electrical 33kV Trenching",
    text: "High voltage 33kV cable laying completed and sand bedding finished up to 80%.",
    progress: 80,
    location: "Substation Corridor T-102",
    imgUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
  }
];

export function SiteUpdate() {
  const { currentProjectId, refreshGlobal } = useOutletContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [rawText, setRawText] = useState('');
  const [progressPct, setProgressPct] = useState(60);
  const [remarks, setRemarks] = useState('');
  const [location, setLocation] = useState('Sector 4 Corridor');
  const [contractor, setContractor] = useState('Larsen & Petro Engineering JV');
  const [showTimeAgent, setShowTimeAgent] = useState(searchParams.get('timeAgent') === '1');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80');
  
  // Real-time matching state
  const [matchResult, setMatchResult] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  useEffect(() => {
    if (!currentProjectId || !rawText || rawText.length < 8) {
      setMatchResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsMatching(true);
        const res = await api.matchText({
          project_id: currentProjectId,
          raw_text: rawText,
          top_k: 3
        });
        setMatchResult(res);
      } catch (err) {
        console.error("Instant matching failed:", err);
      } finally {
        setIsMatching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [rawText, currentProjectId]);

  const handleApplySample = (sample) => {
    setRawText(sample.text);
    setProgressPct(sample.progress);
    setLocation(sample.location);
    if (sample.imgUrl) setPhotoUrl(sample.imgUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rawText.trim() || !currentProjectId) return;

    try {
      setSubmitting(true);
      setSubmitSuccess(null);

      const res = await api.submitSiteUpdate({
        project_id: currentProjectId,
        raw_text: rawText,
        progress_pct: Number(progressPct),
        remarks: remarks || 'Submitted via SiteFlow Capture Engine',
        location: location,
        contractor: contractor,
        photo_url: photoUrl
      });

      setSubmitSuccess(res);
      await refreshGlobal();
    } catch (err) {
      alert(`Failed to submit update: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="text-xs font-mono text-siteflow-amber font-semibold uppercase tracking-wider">
          Multi-Modal Site Capture
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-siteflow-cream tracking-tight mt-1 font-display uppercase">
          Site Update & Intelligent Activity Linker
        </h1>
        <p className="text-xs text-siteflow-muted mt-1 font-sans">
          Submit freeform text, field observations, or photo logs. The NLP engine matches them against the schedule hierarchy.
        </p>
      </div>

      {/* Quick Sample Prompt Chips */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-siteflow-muted flex items-center gap-1.5 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-siteflow-amber" />
          <span>SIH Judge Evaluation Scenarios (Click to Load):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplySample(s)}
              className="px-3 py-1.5 rounded-lg bg-[#0E1310] hover:bg-[#141B16] border border-siteflow-border/30 hover:border-siteflow-amber text-xs font-mono text-siteflow-cream hover:text-siteflow-amberBright transition-all flex items-center gap-1.5"
            >
              <span>{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Input Form & Real-Time Match Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Form (3 cols) */}
        <div className="lg:col-span-3 siteflow-card p-6 space-y-5 font-mono">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            <div className="space-y-1.5">
              <label className="text-siteflow-cream font-semibold flex items-center justify-between font-sans">
                <span>Field Progress Description / Observation *</span>
                <span className="text-siteflow-muted font-normal text-[11px] font-mono">Natural language</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Erection of 24 inch line completed up to 60% with 14 welders on site."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full bg-[#0A0D0B] border border-siteflow-border/30 rounded-xl p-3 text-sm text-siteflow-cream placeholder-siteflow-muted focus:outline-none focus:border-siteflow-amber font-sans"
              />
              <button type="button" onClick={() => setShowTimeAgent(true)} className="w-full mt-2 py-2.5 rounded-xl border border-siteflow-amber/40 bg-siteflow-amber/5 hover:bg-siteflow-amber/10 text-siteflow-amberBright font-bold text-xs flex items-center justify-center gap-2 transition-all">🎙 Capture with Time Agent</button>
            </div>

            {/* Progress % Slider */}
            <div className="space-y-1.5 p-3 rounded-xl bg-[#0A0D0B] border border-siteflow-border/20">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-siteflow-muted">Reported Progress %</span>
                <span className="text-siteflow-amberBright text-sm font-bold">{progressPct}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={progressPct}
                onChange={(e) => setProgressPct(Number(e.target.value))}
                className="w-full accent-siteflow-amber cursor-pointer"
              />
            </div>

            {/* Location & Contractor */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-siteflow-muted font-semibold">Location / Station</label>
                <input 
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg p-2.5 text-siteflow-cream focus:outline-none focus:border-siteflow-amber"
                />
              </div>
              <div className="space-y-1">
                <label className="text-siteflow-muted font-semibold">Contractor / Crew</label>
                <input 
                  type="text"
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value)}
                  className="w-full bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg p-2.5 text-siteflow-cream focus:outline-none focus:border-siteflow-amber"
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <label className="text-siteflow-muted font-semibold">Field Remarks / QA/QC Observations</label>
              <input 
                type="text"
                placeholder="Golden weld fit-up and radiographic testing complete."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg p-2.5 text-siteflow-cream focus:outline-none focus:border-siteflow-amber"
              />
            </div>

            {/* Photo Attachment Preview */}
            <div className="space-y-1.5">
              <label className="text-siteflow-muted font-semibold flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-siteflow-muted" />
                <span>Photo Evidence URL (Optional)</span>
              </label>
              <input 
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg p-2 text-siteflow-cream focus:outline-none focus:border-siteflow-amber text-[11px]"
              />
              {photoUrl && (
                <div className="mt-2 h-32 rounded-xl overflow-hidden border border-siteflow-border/30 bg-[#0A0D0B]">
                  <img src={photoUrl} alt="Site evidence" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !rawText.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright hover:from-siteflow-amberBright hover:to-siteflow-amber text-[#0A0D0B] font-extrabold text-sm shadow-lg shadow-siteflow-amber/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting & Matching...' : 'Submit Update to Review Queue'}</span>
            </button>

          </form>
        </div>

        {/* Right Live Match Preview (2 cols) */}
        <div className="lg:col-span-2 space-y-4 font-mono">
          <div className="siteflow-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-siteflow-cream flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-siteflow-amber" />
                <span>Instant NLP Match Preview</span>
              </h3>
              {isMatching && <span className="text-[10px] text-siteflow-mint animate-pulse">Matching...</span>}
            </div>

            {matchResult?.top_match ? (
              <div className="space-y-4">
                
                {/* Confidence Meter */}
                <div className="p-3.5 rounded-xl bg-[#0A0D0B] border border-siteflow-border/30 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-siteflow-muted">Match Confidence</span>
                    <span className="text-siteflow-mint font-bold text-sm">
                      {Math.round(matchResult.top_match.confidence_score * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#141B16] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        matchResult.top_match.confidence_score >= 0.8 ? 'bg-siteflow-mint' : 'bg-siteflow-amber'
                      }`}
                      style={{ width: `${matchResult.top_match.confidence_score * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-siteflow-muted">Review Required:</span>
                    <span className={`font-bold ${
                      matchResult.requires_review ? 'text-siteflow-amber' : 'text-siteflow-mint'
                    }`}>
                      {matchResult.requires_review ? 'YES (Human Verification)' : 'AUTO-APPROVABLE'}
                    </span>
                  </div>
                </div>

                {/* Top Matched Activity Card */}
                <div className="p-3.5 rounded-xl bg-[#0C2119]/40 border border-siteflow-mint/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-siteflow-amberBright text-xs">
                      {matchResult.top_match.activity_code}
                    </span>
                    <WbsBadge level={matchResult.top_match.wbs_level} />
                  </div>
                  <h4 className="font-bold text-xs text-siteflow-cream leading-tight font-sans">
                    {matchResult.top_match.activity_name}
                  </h4>
                  <div className="flex items-center gap-2 pt-1">
                    <DisciplineBadge discipline={matchResult.top_match.discipline} />
                    <span className="text-[11px] text-siteflow-muted">
                      Current: {matchResult.top_match.current_progress}%
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-3 rounded-lg bg-[#0A0D0B] border border-siteflow-border/20 text-xs text-siteflow-muted leading-relaxed text-[11px]">
                  {matchResult.explanation}
                </div>

              </div>
            ) : (
              <div className="p-6 text-center space-y-2 text-xs text-siteflow-muted">
                <HelpCircle className="w-8 h-8 text-siteflow-border mx-auto" />
                <p>Type a site description on the left to see live schedule activity matching.</p>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {submitSuccess && (
            <div className="p-4 rounded-xl bg-[#16382A]/50 border border-siteflow-mint/40 text-xs space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-siteflow-mint font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Site Update Successfully Routed to Review Queue!</span>
              </div>
              <p className="text-siteflow-cream text-[11px] font-sans">
                Matched with <strong>{Math.round(submitSuccess.match_confidence * 100)}%</strong> confidence. Waiting for Project Manager verification.
              </p>
              <button
                onClick={() => navigate('/review-queue')}
                className="w-full py-2 rounded-lg bg-siteflow-amber hover:bg-siteflow-amberBright text-[#0A0D0B] font-extrabold text-xs flex items-center justify-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Open Review Queue Now</span>
              </button>
            </div>
          )}

        </div>

      </div>

      {showTimeAgent && (
        <TimeAgent
          projectId={currentProjectId}
          onClose={() => setShowTimeAgent(false)}
          onSubmitted={async () => { await refreshGlobal(); }}
        />
      )}
    </div>
  );
}
