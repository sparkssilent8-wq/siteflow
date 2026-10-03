import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  FileSpreadsheet, 
  Calendar, 
  SunMedium, 
  HardHat,
  Send,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';

export function Reports() {
  const { currentProjectId } = useOutletContext();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [extractedData, setExtractedData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    if (!currentProjectId) return;
    try {
      setLoading(true);
      const res = await api.getReports(currentProjectId);
      setReports(res);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [currentProjectId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', currentProjectId);

    try {
      setUploading(true);
      const res = await api.uploadReport(formData);
      setExtractedData(res);
      await loadReports();
    } catch (err) {
      alert(`Report upload error: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto font-mono">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs text-siteflow-amber font-semibold uppercase tracking-wider">
            Document & Report Extraction
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-siteflow-cream tracking-tight mt-1 font-display uppercase">
            Daily Progress Report (DPR) Ingestion
          </h1>
          <p className="text-xs text-siteflow-muted mt-1 font-sans">
            Upload PDF/TXT site reports to automatically extract line items and route them to schedule matching.
          </p>
        </div>

        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload}
            accept=".pdf, .txt, .docx" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright hover:from-siteflow-amberBright hover:to-siteflow-amber text-[#0A0D0B] font-extrabold px-4 py-2.5 rounded-lg text-xs shadow-md shadow-siteflow-amber/20 transition-all disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            <span>{uploading ? 'Extracting Report...' : 'Upload DPR Document'}</span>
          </button>
        </div>
      </div>

      {/* Extracted Data Preview Panel */}
      {extractedData && (
        <div className="siteflow-card p-6 border-siteflow-amber/40 space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-siteflow-border/30 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-siteflow-amber" />
              <h3 className="font-bold text-base text-siteflow-cream font-sans">
                Extracted Report: {extractedData.filename}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-siteflow-mint/20 text-siteflow-mint border border-siteflow-mint/30">
              PROCESSED
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs text-siteflow-cream">
            <div className="p-3 rounded-lg bg-[#0A0D0B] border border-siteflow-border/30">
              <span className="text-siteflow-muted">Date:</span> <strong>{extractedData.parsed_metadata.date || '02-Sep-2026'}</strong>
            </div>
            <div className="p-3 rounded-lg bg-[#0A0D0B] border border-siteflow-border/30">
              <span className="text-siteflow-muted">Contractor:</span> <strong>{extractedData.parsed_metadata.contractor || 'EPC Team'}</strong>
            </div>
            <div className="p-3 rounded-lg bg-[#0A0D0B] border border-siteflow-border/30">
              <span className="text-siteflow-muted">Weather:</span> <strong>{extractedData.parsed_metadata.weather || 'Clear'}</strong>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-xs text-siteflow-muted uppercase">Extracted Work Progress Items:</h4>
            <div className="space-y-2">
              {extractedData.extracted_items?.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#0A0D0B] border border-siteflow-border/20 flex items-center justify-between text-xs">
                  <span className="text-siteflow-cream font-sans">{item.raw_text}</span>
                  {item.extracted_progress && (
                    <span className="font-bold text-siteflow-amberBright px-2 py-0.5 rounded bg-siteflow-amber/15">
                      {item.extracted_progress}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/review-queue')}
            className="w-full py-2.5 rounded-xl bg-siteflow-amber hover:bg-siteflow-amberBright text-[#0A0D0B] font-bold text-xs flex items-center justify-center gap-2"
          >
            <span>Match Extracted Items to Schedule in Review Queue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reports History List */}
      <div className="siteflow-card p-6 space-y-4">
        <h3 className="font-bold text-base text-siteflow-cream font-sans">Uploaded DPR Archives</h3>
        {reports.length > 0 ? (
          <div className="divide-y divide-siteflow-border/20">
            {reports.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-siteflow-amber" />
                  <div>
                    <div className="font-bold text-siteflow-cream">{r.filename}</div>
                    <div className="text-[11px] text-siteflow-muted">
                      {new Date(r.created_at).toLocaleDateString()} • {r.file_type}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#0A0D0B] text-siteflow-muted border border-siteflow-border/30">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-siteflow-muted">
            No DPR reports uploaded yet. Upload a sample daily report to test automated parsing.
          </div>
        )}
      </div>

    </div>
  );
}
