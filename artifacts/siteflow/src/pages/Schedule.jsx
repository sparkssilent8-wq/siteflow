import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  CalendarClock, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  ChevronRight, 
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { StatusBadge, RiskBadge, DisciplineBadge, WbsBadge } from '../components/Badges';
import { api } from '../api/client';

export function Schedule() {
  const { currentProjectId, refreshGlobal } = useOutletContext();
  const fileInputRef = useRef(null);

  const [wbsData, setWbsData] = useState(null);
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [l5L6Only, setL5L6Only] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadWbs = async () => {
    if (!currentProjectId) return;
    try {
      setLoading(true);
      const res = await api.getWbsHierarchy(currentProjectId);
      setWbsData(res);
    } catch (err) {
      console.error("Failed to load WBS hierarchy:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWbs();
  }, [currentProjectId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setUploadStatus(null);
      const res = await api.uploadSchedule(currentProjectId, formData);
      setUploadStatus({
        success: true,
        message: `Successfully imported ${res.total_activities_imported} activities (${res.l5_l6_activities_count} L5/L6 site tasks).`
      });
      await loadWbs();
      await refreshGlobal();
    } catch (err) {
      setUploadStatus({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredNodes = wbsData?.nodes?.filter((node) => {
    if (l5L6Only && !['L5', 'L6'].includes(node.wbs_level)) return false;
    if (levelFilter !== 'ALL' && node.wbs_level !== levelFilter) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-8 pb-10 font-mono">
      
      {/* Header & Schedule Import */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-siteflow-amber font-semibold uppercase tracking-wider">
            Primavera & MS Project Linking Layer
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-siteflow-cream tracking-tight mt-1 font-display uppercase">
            Project Schedule & WBS Hierarchy (L1 → L6)
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            accept=".csv, .xlsx, .xls" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright hover:from-siteflow-amberBright hover:to-siteflow-amber text-[#0A0D0B] font-extrabold px-4 py-2.5 rounded-lg text-xs shadow-md shadow-siteflow-amber/20 transition-all disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            <span>{uploading ? 'Importing Schedule...' : 'Import CSV / XLSX Schedule'}</span>
          </button>
        </div>
      </div>

      {/* Upload Banner status */}
      {uploadStatus && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          uploadStatus.success 
            ? 'bg-[#16382A]/50 text-siteflow-mint border-siteflow-mint/40' 
            : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
        }`}>
          <span>{uploadStatus.message}</span>
          <button onClick={() => setUploadStatus(null)} className="font-bold underline ml-4">Dismiss</button>
        </div>
      )}

      {/* WBS Level Counts Strip */}
      {wbsData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(wbsData.level_counts || {}).map(([lvl, count]) => {
            const isTarget = lvl === 'L5' || lvl === 'L6';
            return (
              <button
                key={lvl}
                onClick={() => {
                  setLevelFilter(levelFilter === lvl ? 'ALL' : lvl);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  levelFilter === lvl 
                    ? 'bg-siteflow-amber/20 border-siteflow-amber text-siteflow-amberBright' 
                    : isTarget 
                      ? 'bg-[#0E1310] border-siteflow-amber/30 text-siteflow-cream hover:border-siteflow-amber' 
                      : 'bg-[#0E1310] border-siteflow-border/30 text-siteflow-muted hover:border-siteflow-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{lvl}</span>
                  {isTarget && (
                    <span className="text-[9px] font-bold px-1 rounded bg-siteflow-amber/20 text-siteflow-amber">SITE TASK</span>
                  )}
                </div>
                <div className="text-xl font-extrabold text-siteflow-cream mt-1">{count}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters Strip */}
      <div className="siteflow-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs">
          <Filter className="w-4 h-4 text-siteflow-muted" />
          <span className="text-siteflow-muted font-semibold">Filter WBS:</span>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            aria-label="Filter by WBS Level"
            className="bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg px-3 py-1.5 text-xs text-siteflow-cream focus:outline-none"
          >
            <option value="ALL">All Levels (L1 - L6)</option>
            <option value="L1">L1 - Project Summary</option>
            <option value="L2">L2 - Major Discipline Package</option>
            <option value="L3">L3 - Sub-package</option>
            <option value="L4">L4 - Work System</option>
            <option value="L5">L5 - Executable Task</option>
            <option value="L6">L6 - Field Activity Detail</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer ml-4">
            <input 
              type="checkbox"
              checked={l5L6Only}
              onChange={(e) => setL5L6Only(e.target.checked)}
              className="rounded bg-[#141B16] border-siteflow-border/40 text-siteflow-amber"
            />
            <span className="text-xs text-siteflow-amber font-bold">Only L5/L6 Site Tasks</span>
          </label>
        </div>

        <div className="text-xs text-siteflow-muted">
          Showing <strong className="text-siteflow-cream">{filteredNodes.length}</strong> schedule items
        </div>
      </div>

      {/* WBS Hierarchy Table */}
      <div className="siteflow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0A0D0B] text-siteflow-muted uppercase text-[11px] border-b border-siteflow-border/30">
              <tr>
                <th className="py-3.5 px-4">WBS Code</th>
                <th className="py-3.5 px-4">Level</th>
                <th className="py-3.5 px-4">Activity Code & Name</th>
                <th className="py-3.5 px-4">Discipline</th>
                <th className="py-3.5 px-4">Planned Dates</th>
                <th className="py-3.5 px-4">Planned %</th>
                <th className="py-3.5 px-4">Actual %</th>
                <th className="py-3.5 px-4">Variance</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-siteflow-border/20 font-medium text-siteflow-cream">
              {filteredNodes.map((node) => {
                const isExecutable = node.wbs_level === 'L5' || node.wbs_level === 'L6';
                const indent = (node.wbs_code?.split('.').length || 1) * 8;

                return (
                  <tr 
                    key={node.id} 
                    className={`hover:bg-[#141B16] transition-colors ${
                      isExecutable ? 'bg-[#0C2119]/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-siteflow-muted">{node.wbs_code || '-'}</td>
                    <td className="py-3 px-4"><WbsBadge level={node.wbs_level} /></td>
                    <td className="py-3 px-4">
                      <div style={{ paddingLeft: `${indent}px` }} className="flex items-center gap-2">
                        <span className="font-bold text-siteflow-amberBright">{node.activity_code}</span>
                        <span className="text-siteflow-cream font-sans">{node.activity_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4"><DisciplineBadge discipline={node.discipline} /></td>
                    <td className="py-3 px-4 text-[11px] text-siteflow-muted">
                      {node.planned_start ? new Date(node.planned_start).toLocaleDateString() : '-'} → {node.planned_finish ? new Date(node.planned_finish).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4">{node.planned_progress}%</td>
                    <td className="py-3 px-4 font-bold text-siteflow-cream">{node.actual_progress}%</td>
                    <td className={`py-3 px-4 font-bold ${
                      node.progress_variance >= 0 ? 'text-siteflow-mint' : 'text-rose-400'
                    }`}>
                      {node.progress_variance >= 0 ? `+${node.progress_variance}%` : `${node.progress_variance}%`}
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={node.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
