import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Building2, 
  MapPin, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { api } from '../api/client';

export function Projects() {
  const { currentProjectId, setCurrentProjectId, refreshGlobal } = useOutletContext();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    location: '',
    client: '',
    contractor: ''
  });

  const loadProjects = async () => {
    try {
      setLoading(true);
      const list = await api.getProjects();
      setProjects(list);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;
    try {
      const created = await api.createProject(formData);
      setShowModal(false);
      setFormData({ name: '', code: '', description: '', location: '', client: '', contractor: '' });
      await loadProjects();
      await refreshGlobal();
      setCurrentProjectId(created.id);
    } catch (err) {
      alert(`Error creating project: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete || isDeleting) return;

    const deletedProjectId = projectToDelete.id;
    setIsDeleting(true);
    try {
      await api.deleteProject(deletedProjectId);
      const remainingProjects = projects.filter((project) => project.id !== deletedProjectId);
      setProjects(remainingProjects);

      if (currentProjectId === deletedProjectId) {
        setCurrentProjectId(remainingProjects[0]?.id ?? null);
      }

      setProjectToDelete(null);
      showToast('Project deleted successfully');
      await refreshGlobal();
    } catch (err) {
      showToast(err.message || 'Project deletion failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10 font-mono">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs text-siteflow-amber font-semibold uppercase tracking-wider">
            Infrastructure Portfolios
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-siteflow-cream tracking-tight mt-1 font-display uppercase">
            Active Projects & Portfolios
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright hover:from-siteflow-amberBright hover:to-siteflow-amber text-[#0A0D0B] font-extrabold px-4 py-2.5 rounded-lg text-xs shadow-md shadow-siteflow-amber/20 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Infrastructure Project</span>
        </button>
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => {
          const isActive = proj.id === currentProjectId;
          return (
            <div 
              key={proj.id}
              className={`siteflow-card p-6 flex flex-col justify-between transition-all ${
                isActive ? 'border-siteflow-amber shadow-lg shadow-siteflow-amber/10' : 'hover:border-siteflow-border'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-siteflow-amber/15 text-siteflow-amberBright border border-siteflow-amber/30">
                      {proj.code}
                    </span>
                    <h3 className="font-extrabold text-lg text-siteflow-cream mt-2 leading-tight font-sans">
                      {proj.name}
                    </h3>
                  </div>
                  {isActive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-siteflow-mint/20 text-siteflow-mint border border-siteflow-mint/40">
                      ACTIVE
                    </span>
                  )}
                </div>

                <p className="text-xs text-siteflow-muted leading-relaxed line-clamp-2 font-sans">
                  {proj.description || 'Large-scale infrastructure engineering and construction package.'}
                </p>

                <div className="space-y-1.5 text-xs text-siteflow-muted">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-siteflow-muted" />
                    <span className="truncate">{proj.location || 'Corridor Sector 4'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-siteflow-muted" />
                    <span className="truncate">Client: {proj.client || 'National Gas Corp'}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-siteflow-border/20">
                  <div className="flex justify-between text-xs">
                    <span className="text-siteflow-muted">Actual: <strong className="text-siteflow-amberBright">{proj.overall_actual_progress}%</strong></span>
                    <span className="text-siteflow-muted">Planned: <strong className="text-siteflow-cream">{proj.overall_planned_progress}%</strong></span>
                  </div>
                  <div className="w-full bg-[#141B16] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-siteflow-amber to-siteflow-amberBright h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, proj.overall_actual_progress)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between gap-3">
                <div className="text-[11px] text-siteflow-muted">
                  {proj.activity_count} activities • {proj.pending_reviews_count} pending
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(proj)}
                    aria-label={`Delete ${proj.name}`}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-300/80 hover:text-red-200 hover:bg-red-950/40 border border-red-400/20 hover:border-red-400/40 transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentProjectId(proj.id);
                      navigate('/dashboard');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive 
                        ? 'bg-siteflow-amber text-[#0A0D0B] hover:bg-siteflow-amberBright' 
                        : 'bg-[#0A0D0B] text-siteflow-cream hover:bg-[#141B16] border border-siteflow-border/30'
                    }`}
                  >
                    <span>Select</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0E1310] border border-siteflow-border/50 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-siteflow-cream font-sans">Create New Infrastructure Project</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-siteflow-muted font-semibold">Project Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Western Dedicated Freight Corridor Section 2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg p-2.5 text-siteflow-cream focus:outline-none focus:border-siteflow-amber font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-siteflow-muted font-semibold">Project Code *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. WDFC-SEC-02"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg p-2.5 text-siteflow-cream focus:outline-none focus:border-siteflow-amber"
                />
              </div>

              <div className="space-y-1">
                <label className="text-siteflow-muted font-semibold">Location / Corridor</label>
                <input 
                  type="text"
                  placeholder="e.g. Dadri - Rewari Section"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg p-2.5 text-siteflow-cream focus:outline-none focus:border-siteflow-amber"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-siteflow-muted font-semibold">Client / Authority</label>
                  <input 
                    type="text"
                    placeholder="e.g. DFCCIL / Ministry of Railways"
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="w-full bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg p-2.5 text-siteflow-cream focus:outline-none focus:border-siteflow-amber"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-siteflow-muted font-semibold">EPC Contractor</label>
                  <input 
                    type="text"
                    placeholder="e.g. L&T Infrastructure JV"
                    value={formData.contractor}
                    onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
                    className="w-full bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg p-2.5 text-siteflow-cream focus:outline-none focus:border-siteflow-amber"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-siteflow-muted font-semibold">Description</label>
                <textarea 
                  rows={3}
                  placeholder="Scope summary..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#0A0D0B] border border-siteflow-border/30 rounded-lg p-2.5 text-siteflow-cream focus:outline-none focus:border-siteflow-amber font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#0A0D0B] hover:bg-[#141B16] text-siteflow-muted font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-siteflow-amber hover:bg-siteflow-amberBright text-[#0A0D0B] font-extrabold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            className="bg-[#0E1310] border border-red-400/30 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-300">
                <Trash2 className="w-4 h-4" />
                <h3 id="delete-project-title" className="text-lg font-bold font-sans">
                  Delete Project?
                </h3>
              </div>
              <p className="text-sm text-siteflow-muted leading-relaxed font-sans">
                This will permanently delete the project and all associated activities, site updates, schedule data, reviews, variance records and risk records.
              </p>
            </div>

            <div className="rounded-lg border border-red-400/15 bg-red-950/20 px-3 py-2 text-xs text-red-200/80 font-mono">
              {projectToDelete.name}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-[#0A0D0B] hover:bg-[#141B16] text-siteflow-muted font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-extrabold transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`fixed right-6 top-6 z-[70] max-w-sm rounded-lg border px-4 py-3 text-sm font-semibold shadow-2xl font-sans ${
            toast.type === 'error'
              ? 'border-red-400/40 bg-red-950/95 text-red-100'
              : 'border-siteflow-mint/40 bg-[#0E2119]/95 text-siteflow-mint'
          }`}
        >
          {toast.message}
        </div>
      )}

    </div>
  );
}
