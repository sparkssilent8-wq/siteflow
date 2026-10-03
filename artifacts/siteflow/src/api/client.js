const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const res = await fetch(url, config);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = typeof body.detail === 'object' ? body.detail.message || JSON.stringify(body.detail) : body.detail;
    throw new Error(detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  getActivities: (projectId, params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== false) q.append(key, value);
    });
    const qs = q.toString() ? `?${q}` : '';
    return request(`/activities/project/${projectId}${qs}`);
  },
  getActivityDetail: (id) => request(`/activities/${id}`),
  updateActivity: (id, data) => request(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  uploadSchedule: (projectId, formData) => request(`/schedule/upload/${projectId}`, { method: 'POST', body: formData }),
  getWbsHierarchy: (projectId) => request(`/schedule/wbs/${projectId}`),
  logProgress: (data) => request('/progress', { method: 'POST', body: JSON.stringify(data) }),
  getProgressHistory: (activityId) => request(`/progress/activity/${activityId}`),
  matchText: (data) => request('/matching', { method: 'POST', body: JSON.stringify(data) }),
  processTimeAgent: (data) => request('/time-agent/process', { method: 'POST', body: JSON.stringify(data) }),

  submitSiteUpdate: (data) => request('/site-updates', { method: 'POST', body: JSON.stringify(data) }),
  getSiteUpdates: (projectId, status) => request(`/site-updates/project/${projectId}${status ? `?status=${encodeURIComponent(status)}` : ''}`),

  getPendingReviews: (projectId) => request(`/review/project/${projectId}`),
  approveReview: (data) => request('/review/approve', { method: 'POST', body: JSON.stringify(data) }),
  rejectReview: (data) => request('/review/reject', { method: 'POST', body: JSON.stringify(data) }),

  getProjectVariance: (projectId) => request(`/variance/project/${projectId}`),
  getProjectAnalytics: (projectId) => request(`/analytics/project/${projectId}`),
  uploadReport: (formData) => request('/reports/upload', { method: 'POST', body: formData }),
  getReports: (projectId) => request(`/reports/project/${projectId}`),

  predictRisk: (data) => request('/ml/predict', { method: 'POST', body: JSON.stringify(data) }),
  simulateScenario: (data) => request('/ml/simulate', { method: 'POST', body: JSON.stringify(data) }),
  detectAnomaly: (data) => request('/ml/anomaly', { method: 'POST', body: JSON.stringify(data) }),
  getRecommendations: (data) => request('/ml/recommend', { method: 'POST', body: JSON.stringify(data) }),
  getPredictionHistory: (activityId) => request(`/ml/predictions/activity/${activityId}`),
  getMLHealth: () => request('/ml/health'),

  getIndiaProjects: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'All') q.append(key, value);
    });
    const qs = q.toString() ? `?${q}` : '';
    return request(`/india-projects${qs}`);
  },
  getIndiaProject: (id) => request(`/india-projects/${id}`),

  getHealth: () => request('/healthz'),
};
