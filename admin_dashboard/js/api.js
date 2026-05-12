/* ===== API LAYER — BUS TRACKING SYSTEM ===== */

const API_BASE = 'https://bus-tracking-worker.thanachot-jo888.workers.dev';

// --- Token helpers ---
function getToken() { return localStorage.getItem('admin_token'); }
function setToken(t) { localStorage.setItem('admin_token', t); }
function clearToken() { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user'); }

// --- Core fetch wrapper ---
async function req(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (!res.ok) {
    const msg = data?.message || data?.error || data?.msg || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ===== API OBJECT =====
const api = {

  /* ---- Health ---- */
  health:        () => req('GET', '/health'),
  healthDb:      () => req('GET', '/health/db'),

  /* ---- Auth ---- */
  login:         (identifier, password) =>
    req('POST', '/auth/login', { identifier, password, expectedRole: 'admin' }),
  me:            () => req('GET', '/auth/me'),
  register:      (data) => req('POST', '/auth/register', data),

  /* ---- Admin: Summary ---- */
  summary:       () => req('GET', '/admin/summary'),
  adminWaiting:  (routeId = '') => req('GET', `/admin/waiting${routeId ? `?routeId=${routeId}` : ''}`),
  adminWaitingSum: (routeId = '') => req('GET', `/admin/waiting-summary${routeId ? `?routeId=${routeId}` : ''}`),

  /* ---- Admin: Users ---- */
  getUsers:      () => req('GET', '/admin/users'),
  getUser:       (id) => req('GET', `/admin/users/${id}`),
  createUser:    (d) => req('POST', '/admin/users', d),
  updateUser:    (id, d) => req('PUT', `/admin/users/${id}`, d),
  deleteUser:    (id) => req('DELETE', `/admin/users/${id}`),

  /* ---- Admin: Drivers ---- */
  getDrivers:    () => req('GET', '/admin/drivers'),
  getDriver:     (id) => req('GET', `/admin/drivers/${id}`),
  createDriver:  (d) => req('POST', '/admin/drivers', d),
  updateDriver:  (id, d) => req('PUT', `/admin/drivers/${id}`, d),
  deleteDriver:  (id) => req('DELETE', `/admin/drivers/${id}`),

  /* ---- Admin: Admins ---- */
  getAdmins:     () => req('GET', '/admin/admins'),
  getAdmin:      (id) => req('GET', `/admin/admins/${id}`),
  createAdmin:   (d) => req('POST', '/admin/admins', d),
  updateAdmin:   (id, d) => req('PUT', `/admin/admins/${id}`, d),
  deleteAdmin:   (id) => req('DELETE', `/admin/admins/${id}`),

  /* ---- Admin: Routes ---- */
  getRoutes:     () => req('GET', '/admin/routes'),
  getRoute:      (id) => req('GET', `/admin/routes/${id}`),
  getRouteBuses: (id) => req('GET', `/admin/routes/${id}/buses`),
  createRoute:   (d) => req('POST', '/admin/routes', d),
  updateRoute:   (id, d) => req('PUT', `/admin/routes/${id}`, d),
  deleteRoute:   (id) => req('DELETE', `/admin/routes/${id}`),

  /* ---- Admin: Buses ---- */
  getBuses:      () => req('GET', '/admin/buses'),
  getBus:        (id) => req('GET', `/admin/buses/${id}`),
  createBus:     (d) => req('POST', '/admin/buses', d),
  updateBus:     (id, d) => req('PUT', `/admin/buses/${id}`, d),
  deleteBus:     (id) => req('DELETE', `/admin/buses/${id}`),

  /* ---- Admin: Route-Admin Assignments ---- */
  getRouteAdmins:    () => req('GET', '/admin/route-admins'),
  getRouteAdmin:     (id) => req('GET', `/admin/route-admins/${id}`),
  createRouteAdmin:  (d) => req('POST', '/admin/route-admins', d),
  deleteRouteAdmin:  (id) => req('DELETE', `/admin/route-admins/${id}`),

};

// Extract list array from various API response shapes
function extractList(result) {
  if (Array.isArray(result)) return result;
  const keys = ['data','users','drivers','admins','routes','buses','assignments','waiting','items','list','results'];
  for (const k of keys) {
    if (result?.[k] && Array.isArray(result[k])) return result[k];
  }
  // Try any array value in the response
  const found = Object.values(result || {}).find(v => Array.isArray(v));
  return found || [];
}
