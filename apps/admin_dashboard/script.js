const storageKey = 'bus-tracking-api-base';
const tokenKey = 'bus-tracking-admin-token';
const apiBaseInput = document.getElementById('apiBase');
const saveApiBtn = document.getElementById('saveApiBtn');
const refreshBtn = document.getElementById('refreshBtn');
const adminUsername = document.getElementById('adminUsername');
const adminPassword = document.getElementById('adminPassword');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const authStatus = document.getElementById('authStatus');
const reloadRoutesBtn = document.getElementById('reloadRoutesBtn');
const reloadWaitingBtn = document.getElementById('reloadWaitingBtn');
const reloadBusesBtn = document.getElementById('reloadBusesBtn');
const createRouteBtn = document.getElementById('createRouteBtn');
const createBusBtn = document.getElementById('createBusBtn');
const routeCodeInput = document.getElementById('routeCodeInput');
const routeNameInput = document.getElementById('routeNameInput');
const routeStartInput = document.getElementById('routeStartInput');
const routeEndInput = document.getElementById('routeEndInput');
const busPlateInput = document.getElementById('busPlateInput');
const busRouteIdInput = document.getElementById('busRouteIdInput');
const busDriverIdInput = document.getElementById('busDriverIdInput');
const busStatusInput = document.getElementById('busStatusInput');
const routeFormStatus = document.getElementById('routeFormStatus');
const busFormStatus = document.getElementById('busFormStatus');
const routesCount = document.getElementById('routesCount');
const busesCount = document.getElementById('busesCount');
const waitingCount = document.getElementById('waitingCount');
const routesList = document.getElementById('routesList');
const waitingList = document.getElementById('waitingList');
const apiStatus = document.getElementById('apiStatus');
const busTable = document.getElementById('bus-table');
const summaryRoutes = document.getElementById('summaryRoutes');
const summaryBuses = document.getElementById('summaryBuses');
const summaryDrivers = document.getElementById('summaryDrivers');
const summaryUsers = document.getElementById('summaryUsers');
const summaryActiveBuses = document.getElementById('summaryActiveBuses');

const defaultApiBase = localStorage.getItem(storageKey) || 'http://127.0.0.1:8787';
apiBaseInput.value = defaultApiBase;

function getApiBase() { return apiBaseInput.value.trim().replace(/\/$/, ''); }
function getToken() { return localStorage.getItem(tokenKey) || ''; }
function setToken(token) { if (token) localStorage.setItem(tokenKey, token); else localStorage.removeItem(tokenKey); updateAuthStatus(); }
function updateAuthStatus() { authStatus.textContent = getToken() ? 'Admin token saved' : 'Not logged in'; }
function formatDate(value) { return value ? new Date(value).toLocaleString() : '-'; }

async function apiFetch(path, options = {}, requireAuth = false) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (requireAuth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const response = await fetch(`${getApiBase()}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data;
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
        <button class="secondary delete-route-btn" data-route-id="${route.id}">Delete</button>
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
        <button class="secondary delete-bus-btn" data-bus-id="${bus.id}">Delete</button>
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

async function loginAdmin() {
  try {
    const result = await apiFetch('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username: adminUsername.value.trim(), password: adminPassword.value }),
    });
    const token = result?.data?.token || result?.data?.access_token;
    if (!token) throw new Error('No token returned from admin login');
    setToken(token);
    authStatus.textContent = `Logged in as ${result?.data?.user?.username || adminUsername.value.trim()}`;
    await loadDashboard();
  } catch (error) {
    authStatus.textContent = `Login failed: ${error.message}`;
  }
}

async function createRoute() {
  try {
    routeFormStatus.textContent = 'Creating route...';
    await apiFetch('/admin/routes', {
      method: 'POST',
      body: JSON.stringify({
        routeCode: routeCodeInput.value.trim(),
        routeName: routeNameInput.value.trim(),
        startLocation: routeStartInput.value.trim(),
        endLocation: routeEndInput.value.trim(),
      }),
    }, true);
    routeFormStatus.textContent = 'Route created';
    routeCodeInput.value = '';
    routeNameInput.value = '';
    routeStartInput.value = '';
    routeEndInput.value = '';
    await loadDashboard();
  } catch (error) {
    routeFormStatus.textContent = `Create route failed: ${error.message}`;
  }
}

async function createBus() {
  try {
    busFormStatus.textContent = 'Creating bus...';
    await apiFetch('/admin/buses', {
      method: 'POST',
      body: JSON.stringify({
        plateNumber: busPlateInput.value.trim(),
        routeId: busRouteIdInput.value.trim() || undefined,
        driverId: busDriverIdInput.value.trim() || undefined,
        status: busStatusInput.value.trim() || undefined,
      }),
    }, true);
    busFormStatus.textContent = 'Bus created';
    busPlateInput.value = '';
    busRouteIdInput.value = '';
    busDriverIdInput.value = '';
    busStatusInput.value = '';
    await loadDashboard();
  } catch (error) {
    busFormStatus.textContent = `Create bus failed: ${error.message}`;
  }
}

async function deleteRoute(routeId) {
  if (!confirm(`Delete route ${routeId}?`)) return;
  try {
    await apiFetch(`/admin/routes/${routeId}`, { method: 'DELETE' }, true);
    await loadDashboard();
  } catch (error) {
    apiStatus.textContent = `Delete route failed\n${error.message}`;
  }
}

async function deleteBus(busId) {
  if (!confirm(`Delete bus ${busId}?`)) return;
  try {
    await apiFetch(`/admin/buses/${busId}`, { method: 'DELETE' }, true);
    await loadDashboard();
  } catch (error) {
    apiStatus.textContent = `Delete bus failed\n${error.message}`;
  }
}

async function loadDashboard() {
  apiStatus.textContent = 'Loading...';
  try {
    const [health, summary, routes, buses, waiting] = await Promise.all([
      apiFetch('/health'),
      apiFetch('/admin/summary', {}, true).catch(() => ({ data: {} })),
      apiFetch('/admin/routes', {}, true).catch(() => apiFetch('/routes')),
      apiFetch('/admin/buses', {}, true).catch(() => apiFetch('/buses/live')),
      apiFetch('/admin/waiting', {}, true).catch(() => apiFetch('/waiting')),
    ]);

    apiStatus.textContent = JSON.stringify(health, null, 2);
    routesCount.textContent = routes.data?.length ?? 0;
    busesCount.textContent = buses.data?.length ?? 0;
    waitingCount.textContent = waiting.data?.length ?? 0;
    renderSummary(summary.data || {});
    renderRoutes(routes.data || []);
    renderBuses(buses.data || []);
    renderWaiting(waiting.data || []);
  } catch (error) {
    apiStatus.textContent = `Failed to load API\n${error.message}`;
  }
}

saveApiBtn.addEventListener('click', () => { localStorage.setItem(storageKey, getApiBase()); loadDashboard(); });
refreshBtn.addEventListener('click', loadDashboard);
adminLoginBtn.addEventListener('click', loginAdmin);
adminLogoutBtn.addEventListener('click', () => setToken(''));
reloadRoutesBtn.addEventListener('click', loadDashboard);
reloadWaitingBtn.addEventListener('click', loadDashboard);
reloadBusesBtn.addEventListener('click', loadDashboard);
createRouteBtn.addEventListener('click', createRoute);
createBusBtn.addEventListener('click', createBus);

document.addEventListener('click', (event) => {
  const target = event.target;
  if (target.classList.contains('delete-route-btn')) deleteRoute(target.dataset.routeId);
  if (target.classList.contains('delete-bus-btn')) deleteBus(target.dataset.busId);
});

updateAuthStatus();
loadDashboard();
