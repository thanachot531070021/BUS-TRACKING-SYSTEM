const storageKey = 'bus-tracking-api-base';
const tokenKey = 'bus-tracking-admin-token';
const $ = (id) => document.getElementById(id);

const apiBaseInput = $('apiBase');
const saveApiBtn = $('saveApiBtn');
const refreshBtn = $('refreshBtn');
const adminUsername = $('adminUsername');
const adminPassword = $('adminPassword');
const adminLoginBtn = $('adminLoginBtn');
const adminLogoutBtn = $('adminLogoutBtn');
const authStatus = $('authStatus');
const reloadRoutesBtn = $('reloadRoutesBtn');
const reloadWaitingBtn = $('reloadWaitingBtn');
const reloadBusesBtn = $('reloadBusesBtn');
const reloadUsersBtn = $('reloadUsersBtn');
const reloadDriversBtn = $('reloadDriversBtn');
const reloadAdminsBtn = $('reloadAdminsBtn');
const createRouteBtn = $('createRouteBtn');
const updateRouteBtn = $('updateRouteBtn');
const clearRouteBtn = $('clearRouteBtn');
const createBusBtn = $('createBusBtn');
const updateBusBtn = $('updateBusBtn');
const clearBusBtn = $('clearBusBtn');
const routeEditIdInput = $('routeEditIdInput');
const routeCodeInput = $('routeCodeInput');
const routeNameInput = $('routeNameInput');
const routeStartInput = $('routeStartInput');
const routeEndInput = $('routeEndInput');
const busEditIdInput = $('busEditIdInput');
const busPlateInput = $('busPlateInput');
const busRouteIdInput = $('busRouteIdInput');
const busDriverIdInput = $('busDriverIdInput');
const busStatusInput = $('busStatusInput');
const routeFormStatus = $('routeFormStatus');
const busFormStatus = $('busFormStatus');
const routesCount = $('routesCount');
const busesCount = $('busesCount');
const waitingCount = $('waitingCount');
const routesList = $('routesList');
const waitingList = $('waitingList');
const usersList = $('usersList');
const driversList = $('driversList');
const adminsList = $('adminsList');
const apiStatus = $('apiStatus');
const busTable = $('bus-table');
const summaryRoutes = $('summaryRoutes');
const summaryBuses = $('summaryBuses');
const summaryDrivers = $('summaryDrivers');
const summaryUsers = $('summaryUsers');
const summaryActiveBuses = $('summaryActiveBuses');

apiBaseInput.value = localStorage.getItem(storageKey) || 'http://127.0.0.1:8787';

function getApiBase() { return apiBaseInput.value.trim().replace(/\/$/, ''); }
function getToken() { return localStorage.getItem(tokenKey) || ''; }
function setToken(token) { token ? localStorage.setItem(tokenKey, token) : localStorage.removeItem(tokenKey); updateAuthStatus(); }
function updateAuthStatus(message) { authStatus.textContent = message || (getToken() ? 'Admin token saved' : 'Not logged in'); }
function setStatus(el, message, type = 'info') { el.textContent = message; el.dataset.type = type; }
function formatDate(value) { return value ? new Date(value).toLocaleString() : '-'; }

async function apiFetch(path, options = {}, requireAuth = false) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (requireAuth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const response = await fetch(`${getApiBase()}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data;
}

function fillRouteForm(route) {
  routeEditIdInput.value = route.id || '';
  routeCodeInput.value = route.route_code || '';
  routeNameInput.value = route.route_name || '';
  routeStartInput.value = route.start_location || '';
  routeEndInput.value = route.end_location || '';
  setStatus(routeFormStatus, `Loaded route ${route.id} for editing`, 'success');
}

function clearRouteForm() {
  routeEditIdInput.value = '';
  routeCodeInput.value = '';
  routeNameInput.value = '';
  routeStartInput.value = '';
  routeEndInput.value = '';
  setStatus(routeFormStatus, 'Ready', 'info');
}

function fillBusForm(bus) {
  busEditIdInput.value = bus.id || '';
  busPlateInput.value = bus.plate_number || '';
  busRouteIdInput.value = bus.route_id || '';
  busDriverIdInput.value = bus.driver_id || '';
  busStatusInput.value = bus.status || '';
  setStatus(busFormStatus, `Loaded bus ${bus.id} for editing`, 'success');
}

function clearBusForm() {
  busEditIdInput.value = '';
  busPlateInput.value = '';
  busRouteIdInput.value = '';
  busDriverIdInput.value = '';
  busStatusInput.value = '';
  setStatus(busFormStatus, 'Ready', 'info');
}

function renderRoutes(routes) {
  routesList.innerHTML = '';
  routes.forEach((route) => {
    const div = document.createElement('div');
    div.className = 'stack-item';
    div.innerHTML = `
      <div class="title">${route.route_code || '-'} - ${route.route_name}</div>
      <div class="meta">${route.start_location || '-'} → ${route.end_location || '-'}</div>
      <div class="meta">Status: ${route.status}</div>
      <div class="meta">Route ID: ${route.id}</div>
      <div class="action-row">
        <button class="secondary edit-route-btn" data-route='${JSON.stringify(route).replace(/'/g, '&apos;')}'>Edit</button>
        <button class="danger delete-route-btn" data-route-id="${route.id}">Delete</button>
      </div>
    `;
    routesList.appendChild(div);
  });
}

function renderWaiting(points) {
  waitingList.innerHTML = '';
  points.forEach((point) => {
    const div = document.createElement('div');
    div.className = 'stack-item';
    div.innerHTML = `
      <div class="title">${point.route_name || point.route_id}</div>
      <div class="meta">Waiting count: ${point.waiting_count ?? 1}</div>
      <div class="meta">Lat/Lng: ${point.lat}, ${point.lng}</div>
      <div class="meta">Created: ${formatDate(point.created_at)}</div>
    `;
    waitingList.appendChild(div);
  });
}

function renderBuses(buses) {
  busTable.innerHTML = '';
  buses.forEach((bus) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${bus.plate_number}</td>
      <td>${bus.route_id ?? bus.route_name ?? '-'}</td>
      <td>${bus.status}</td>
      <td>${bus.current_lat ?? '-'}, ${bus.current_lng ?? '-'}</td>
      <td>
        <button class="secondary edit-bus-btn" data-bus='${JSON.stringify(bus).replace(/'/g, '&apos;')}'>Edit</button>
        <button class="danger delete-bus-btn" data-bus-id="${bus.id}">Delete</button>
      </td>
    `;
    busTable.appendChild(tr);
  });
}

function renderSummary(summary) {
  summaryRoutes.textContent = summary.total_routes ?? '-';
  summaryBuses.textContent = summary.total_buses ?? '-';
  summaryDrivers.textContent = summary.total_drivers ?? '-';
  summaryUsers.textContent = summary.total_users ?? '-';
  summaryActiveBuses.textContent = summary.active_buses ?? '-';
}

function renderSimpleList(target, items, formatter) {
  target.innerHTML = '';
  items.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'stack-item';
    div.innerHTML = formatter(item);
    target.appendChild(div);
  });
}

async function loginAdmin() {
  try {
    updateAuthStatus('Logging in...');
    const result = await apiFetch('/auth/admin/login', { method: 'POST', body: JSON.stringify({ username: adminUsername.value.trim(), password: adminPassword.value }) });
    const token = result?.data?.token || result?.data?.access_token;
    if (!token) throw new Error('No token returned from admin login');
    setToken(token);
    updateAuthStatus(`Logged in as ${result?.data?.user?.username || adminUsername.value.trim()}`);
    await loadDashboard();
  } catch (error) {
    updateAuthStatus(`Login failed: ${error.message}`);
  }
}

async function createRoute() {
  try {
    setStatus(routeFormStatus, 'Creating route...', 'loading');
    await apiFetch('/admin/routes', { method: 'POST', body: JSON.stringify({ routeCode: routeCodeInput.value.trim(), routeName: routeNameInput.value.trim(), startLocation: routeStartInput.value.trim(), endLocation: routeEndInput.value.trim() }) }, true);
    clearRouteForm();
    setStatus(routeFormStatus, 'Route created', 'success');
    await loadDashboard();
  } catch (error) {
    setStatus(routeFormStatus, `Create route failed: ${error.message}`, 'error');
  }
}

async function updateRoute() {
  try {
    if (!routeEditIdInput.value.trim()) throw new Error('Route ID is required for update');
    setStatus(routeFormStatus, 'Updating route...', 'loading');
    await apiFetch(`/admin/routes/${routeEditIdInput.value.trim()}`, { method: 'PUT', body: JSON.stringify({ routeCode: routeCodeInput.value.trim(), routeName: routeNameInput.value.trim(), startLocation: routeStartInput.value.trim(), endLocation: routeEndInput.value.trim() }) }, true);
    setStatus(routeFormStatus, 'Route updated', 'success');
    await loadDashboard();
  } catch (error) {
    setStatus(routeFormStatus, `Update route failed: ${error.message}`, 'error');
  }
}

async function createBus() {
  try {
    setStatus(busFormStatus, 'Creating bus...', 'loading');
    await apiFetch('/admin/buses', { method: 'POST', body: JSON.stringify({ plateNumber: busPlateInput.value.trim(), routeId: busRouteIdInput.value.trim() || undefined, driverId: busDriverIdInput.value.trim() || undefined, status: busStatusInput.value.trim() || undefined }) }, true);
    clearBusForm();
    setStatus(busFormStatus, 'Bus created', 'success');
    await loadDashboard();
  } catch (error) {
    setStatus(busFormStatus, `Create bus failed: ${error.message}`, 'error');
  }
}

async function updateBus() {
  try {
    if (!busEditIdInput.value.trim()) throw new Error('Bus ID is required for update');
    setStatus(busFormStatus, 'Updating bus...', 'loading');
    await apiFetch(`/admin/buses/${busEditIdInput.value.trim()}`, { method: 'PUT', body: JSON.stringify({ plateNumber: busPlateInput.value.trim(), routeId: busRouteIdInput.value.trim() || undefined, driverId: busDriverIdInput.value.trim() || undefined, status: busStatusInput.value.trim() || undefined }) }, true);
    setStatus(busFormStatus, 'Bus updated', 'success');
    await loadDashboard();
  } catch (error) {
    setStatus(busFormStatus, `Update bus failed: ${error.message}`, 'error');
  }
}

async function deleteRoute(routeId) {
  if (!confirm(`Delete route ${routeId}?`)) return;
  try { await apiFetch(`/admin/routes/${routeId}`, { method: 'DELETE' }, true); await loadDashboard(); }
  catch (error) { apiStatus.textContent = `Delete route failed\n${error.message}`; }
}

async function deleteBus(busId) {
  if (!confirm(`Delete bus ${busId}?`)) return;
  try { await apiFetch(`/admin/buses/${busId}`, { method: 'DELETE' }, true); await loadDashboard(); }
  catch (error) { apiStatus.textContent = `Delete bus failed\n${error.message}`; }
}

async function loadDashboard() {
  apiStatus.textContent = 'Loading...';
  try {
    const [health, summary, routes, buses, waiting, users, drivers, admins] = await Promise.all([
      apiFetch('/health'),
      apiFetch('/admin/summary', {}, true).catch(() => ({ data: {} })),
      apiFetch('/admin/routes', {}, true).catch(() => apiFetch('/routes')),
      apiFetch('/admin/buses', {}, true).catch(() => apiFetch('/buses/live')),
      apiFetch('/admin/waiting', {}, true).catch(() => apiFetch('/waiting')),
      apiFetch('/admin/users', {}, true).catch(() => ({ data: [] })),
      apiFetch('/admin/drivers', {}, true).catch(() => ({ data: [] })),
      apiFetch('/admin/admins', {}, true).catch(() => ({ data: [] })),
    ]);

    apiStatus.textContent = JSON.stringify(health, null, 2);
    routesCount.textContent = routes.data?.length ?? 0;
    busesCount.textContent = buses.data?.length ?? 0;
    waitingCount.textContent = waiting.data?.length ?? 0;
    renderSummary(summary.data || {});
    renderRoutes(routes.data || []);
    renderBuses(buses.data || []);
    renderWaiting(waiting.data || []);
    renderSimpleList(usersList, users.data || [], (u) => `<div class="title">${u.full_name || u.username || u.email || u.id}</div><div class="meta">Role: ${u.role} | Status: ${u.status}</div>`);
    renderSimpleList(driversList, drivers.data || [], (d) => `<div class="title">Driver ${d.id}</div><div class="meta">User: ${d.user_id} | Route: ${d.assigned_route_id || '-'}</div>`);
    renderSimpleList(adminsList, admins.data || [], (a) => `<div class="title">Admin ${a.id}</div><div class="meta">Type: ${a.admin_type} | User: ${a.user_id}</div>`);
  } catch (error) {
    apiStatus.textContent = `Failed to load API\n${error.message}`;
  }
}

saveApiBtn.addEventListener('click', () => { localStorage.setItem(storageKey, getApiBase()); loadDashboard(); });
refreshBtn.addEventListener('click', loadDashboard);
adminLoginBtn.addEventListener('click', loginAdmin);
adminLogoutBtn.addEventListener('click', () => { setToken(''); updateAuthStatus('Logged out'); });
reloadRoutesBtn.addEventListener('click', loadDashboard);
reloadWaitingBtn.addEventListener('click', loadDashboard);
reloadBusesBtn.addEventListener('click', loadDashboard);
reloadUsersBtn.addEventListener('click', loadDashboard);
reloadDriversBtn.addEventListener('click', loadDashboard);
reloadAdminsBtn.addEventListener('click', loadDashboard);
createRouteBtn.addEventListener('click', createRoute);
updateRouteBtn.addEventListener('click', updateRoute);
clearRouteBtn.addEventListener('click', clearRouteForm);
createBusBtn.addEventListener('click', createBus);
updateBusBtn.addEventListener('click', updateBus);
clearBusBtn.addEventListener('click', clearBusForm);

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.classList.contains('delete-route-btn')) deleteRoute(target.dataset.routeId);
  if (target.classList.contains('delete-bus-btn')) deleteBus(target.dataset.busId);
  if (target.classList.contains('edit-route-btn')) fillRouteForm(JSON.parse(target.dataset.route.replace(/&apos;/g, "'")));
  if (target.classList.contains('edit-bus-btn')) fillBusForm(JSON.parse(target.dataset.bus.replace(/&apos;/g, "'")));
});

updateAuthStatus();
loadDashboard();
