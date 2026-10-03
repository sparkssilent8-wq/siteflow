import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Filter,
  Globe2,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import { api } from '../api/client';

const CATEGORY_ORDER = [
  'Airport',
  'Bridge',
  'Rail',
  'RRTS',
  'Highway',
  'Coastal Road',
  'Tunnel',
  'Port',
  'Hospital',
  'Healthcare',
  'University',
  'Education',
  'Museum',
  'Semiconductor',
  'Renewable Energy',
  'Heritage',
  'Railway Stations',
  'Roads / Bridges / Tunnels',
];

const statusTone = (status = '') => {
  const normalized = status.toLowerCase();
  if (normalized.includes('operational') || normalized.includes('completed')) return 'border-siteflow-mint/40 bg-siteflow-mint/10 text-siteflow-mint';
  if (normalized.includes('construction')) return 'border-siteflow-amber/40 bg-siteflow-amber/10 text-siteflow-amberBright';
  return 'border-sky-400/30 bg-sky-400/10 text-sky-200';
};

function ProjectCard({ project, onOpen }) {
  return (
    <article className="siteflow-card overflow-hidden flex flex-col min-h-[270px]">
      <div className="p-5 flex-1 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-siteflow-amber">{project.category}</div>
            <h3 className="mt-2 text-lg font-extrabold text-siteflow-cream leading-tight">{project.name}</h3>
          </div>
          <Globe2 className="w-5 h-5 shrink-0 text-siteflow-muted" />
        </div>
        <div className="flex items-center gap-2 text-xs text-siteflow-muted font-mono">
          <MapPin className="w-3.5 h-3.5 text-siteflow-amber" />
          <span>{project.location || 'Location not available'}</span>
        </div>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-mono font-bold uppercase ${statusTone(project.status)}`}>
          {project.status || 'Status not available'}
        </span>
        <p className="text-sm text-siteflow-muted leading-relaxed line-clamp-3">{project.description || 'Data not available from verified source.'}</p>
      </div>
      <div className="border-t border-siteflow-border/20 p-4 flex items-center justify-between gap-3">
        <button type="button" onClick={() => onOpen(project.id)} className="inline-flex items-center gap-2 rounded-lg bg-siteflow-amber px-3 py-2 text-xs font-bold text-[#0A0D0B] hover:bg-siteflow-amberBright">
          View Details <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
        <a href={project.official_source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-mono text-siteflow-muted hover:text-siteflow-cream">
          Official Source <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </article>
  );
}

function DetailDrawer({ project, onClose }) {
  if (!project) return null;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.location || project.name)}`;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-siteflow-amber/30 bg-[#0E1310] p-6 shadow-2xl" role="dialog" aria-modal="true" aria-label={`${project.name} details`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-siteflow-amber">{project.category}</div>
            <h2 className="mt-2 text-2xl font-extrabold text-siteflow-cream leading-tight">{project.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close project details" className="rounded-lg border border-siteflow-border/30 p-2 text-siteflow-muted hover:text-siteflow-cream">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-6 space-y-5">
          <div className={`rounded-lg border px-3 py-2 text-xs font-mono font-bold uppercase ${statusTone(project.status)}`}>{project.status}</div>
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-siteflow-cream"><MapPin className="w-4 h-4 text-siteflow-amber" /> Location</div>
            <p className="text-sm text-siteflow-muted">{project.location || 'Data not available from verified source.'}</p>
            <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-mono text-siteflow-amberBright hover:text-siteflow-cream">
              Open map location <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-siteflow-cream">Verified description</h3>
            <p className="text-sm text-siteflow-muted leading-relaxed">{project.description || 'Data not available from verified source.'}</p>
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-siteflow-cream">Key facts</h3>
            {project.key_facts?.length ? (
              <ul className="space-y-2 text-sm text-siteflow-muted">
                {project.key_facts.map((fact) => <li key={fact} className="flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 text-siteflow-mint mt-0.5" />{fact}</li>)}
              </ul>
            ) : <p className="text-sm text-siteflow-muted">Data not available from verified source.</p>}
          </section>
          <section className="rounded-lg border border-siteflow-border/20 bg-[#0A0D0B] p-4 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-siteflow-muted">Source verification</div>
            <p className="text-xs text-siteflow-muted">{project.source_note || 'Data not available from verified source.'}</p>
            <p className="text-xs text-siteflow-muted">Last verified: {project.last_verified_at ? new Date(project.last_verified_at).toLocaleDateString() : 'Not available'}</p>
            <a href={project.official_source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-mono text-siteflow-amberBright hover:text-siteflow-cream">
              Visit official source <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </section>
        </div>
      </aside>
    </div>
  );
}

export function IndiaProjects() {
  const [filters, setFilters] = useState({ q: '', category: 'All', location: 'All', status: 'All', sort: 'name' });
  const [data, setData] = useState({ items: [], total: 0, filters: { categories: [], locations: [], statuses: [] } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await api.getIndiaProjects(filters));
    } catch (err) {
      setError(err?.message || 'Unable to load India projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(loadProjects, filters.q ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [filters.q, filters.category, filters.location, filters.status, filters.sort]);

  const categoryOptions = useMemo(() => {
    const fromApi = data.filters?.categories || [];
    return [...new Set([...CATEGORY_ORDER, ...fromApi])].filter(Boolean);
  }, [data.filters]);

  const openDetails = async (id) => {
    try {
      setDetailLoading(true);
      setSelected(await api.getIndiaProject(id));
    } catch (err) {
      setError(err?.message || 'Unable to load project details.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <header className="relative overflow-hidden rounded-2xl border border-siteflow-amber/30 bg-gradient-to-br from-[#15241A] via-[#0E1310] to-[#0A0D0B] p-6 sm:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-siteflow-amber/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-siteflow-amber">Infrastructure intelligence / research layer</div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-siteflow-cream">INDIA INFRASTRUCTURE INTELLIGENCE</h1>
          <p className="mt-2 text-lg font-mono text-siteflow-amberBright">2026 PROJECT LANDSCAPE</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-siteflow-muted">Real infrastructure, transportation, healthcare, education, heritage, semiconductor and renewable-energy projects across India. This research library is separate from the live SiteFlow schedule.</p>
        </div>
        <div className="relative mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['30', 'Tracked projects'],
            [data.filters?.categories?.length || '—', 'Categories'],
            ['Multiple', 'States'],
            ['Official', 'Sources linked'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl border border-siteflow-border/20 bg-[#0A0D0B]/60 p-3">
              <div className="text-xl font-extrabold text-siteflow-cream">{value}</div>
              <div className="mt-1 text-[10px] font-mono uppercase tracking-wider text-siteflow-muted">{label}</div>
            </div>
          ))}
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-siteflow-muted" />
            <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Search project, location, or verified description…" className="w-full rounded-lg border border-siteflow-border/30 bg-[#0A0D0B] py-2.5 pl-10 pr-3 text-sm text-siteflow-cream placeholder:text-siteflow-muted focus:border-siteflow-amber focus:outline-none" />
          </label>
          <div className="flex items-center gap-2 text-xs font-mono text-siteflow-muted"><Filter className="w-4 h-4 text-siteflow-amber" /> Filters</div>
          <select value={filters.location} onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))} aria-label="Filter by location" className="rounded-lg border border-siteflow-border/30 bg-[#0A0D0B] px-3 py-2.5 text-xs text-siteflow-cream">
            <option value="All">All locations</option>
            {(data.filters?.locations || []).map((location) => <option key={location} value={location}>{location}</option>)}
          </select>
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} aria-label="Filter by status" className="rounded-lg border border-siteflow-border/30 bg-[#0A0D0B] px-3 py-2.5 text-xs text-siteflow-cream">
            <option value="All">All statuses</option>
            {(data.filters?.statuses || []).map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))} aria-label="Sort projects" className="rounded-lg border border-siteflow-border/30 bg-[#0A0D0B] px-3 py-2.5 text-xs text-siteflow-cream">
            <option value="name">Sort: name</option>
            <option value="location">Sort: location</option>
            <option value="category">Sort: category</option>
            <option value="status">Sort: status</option>
            <option value="verified">Sort: verified</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setFilters((current) => ({ ...current, category: 'All' }))} className={`rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold ${filters.category === 'All' ? 'border-siteflow-amber bg-siteflow-amber/15 text-siteflow-amberBright' : 'border-siteflow-border/30 text-siteflow-muted hover:text-siteflow-cream'}`}>All</button>
          {categoryOptions.map((category) => (
            <button type="button" key={category} onClick={() => setFilters((current) => ({ ...current, category }))} className={`rounded-full border px-3 py-1.5 text-[11px] font-mono font-bold ${filters.category === category ? 'border-siteflow-amber bg-siteflow-amber/15 text-siteflow-amberBright' : 'border-siteflow-border/30 text-siteflow-muted hover:text-siteflow-cream'}`}>{category}</button>
          ))}
        </div>
      </section>

      {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert">{error} <button type="button" onClick={loadProjects} className="ml-3 underline font-mono">Retry</button></div>}
      {detailLoading && <div className="rounded-lg border border-siteflow-amber/30 bg-siteflow-amber/10 px-4 py-3 text-xs font-mono text-siteflow-amberBright">Loading verified project details…</div>}
      {loading ? (
        <div className="siteflow-card p-16 text-center text-sm text-siteflow-muted font-mono">Loading India project library…</div>
      ) : data.items?.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((project) => <ProjectCard key={project.id} project={project} onOpen={openDetails} />)}
        </div>
      ) : (
        <div className="siteflow-card p-16 text-center space-y-3">
          <Globe2 className="mx-auto h-8 w-8 text-siteflow-muted" />
          <h2 className="text-lg font-bold text-siteflow-cream">No verified projects match these filters</h2>
          <p className="text-sm text-siteflow-muted">Clear the search or filters to return to the full research library.</p>
        </div>
      )}

      {selected && <DetailDrawer project={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}