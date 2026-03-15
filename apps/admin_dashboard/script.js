const storageKey = 'bus-tracking-api-base';
const apiBaseInput = document.getElementById('apiBase');
const saveApiBtn = document.getElementById('saveApiBtn');
const refreshBtn = document.getElementById('refreshBtn');
const routesCount = document.getElementById('routesCount');
const busesCount = document.getElementById('busesCount');
const waitingCount = document.getElementById('waitingCount');
const routesList = document.getElementById('routesList');
const waitingList = document.getElementById('waitingList');
const apiStatus = document.getElementById('apiStatus');
const busTable = document.getElementById('bus-table');

const defaultApiBase = localStorage.getItem(storageKey) || 'http://127.0.0.1:8787';
apiBaseInput.value = defaultApiBase;

function getApiBase() {
  return apiBaseInput.value.trim().replace(/\/$/, '');
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

async function getJson(path) {
  const response = await fetch(`${getApiBase()}${path}`);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

function renderRoutes(routes) {
  routesList.innerHTML = '';
  routes.forEach((route) => {
    const div = document.createElement('div');
    div.className = 'stack-item';
    div.innerHTML = `
      <div class="title">${route.route_code} - ${route.route_name}</div>
      <div class="meta">${route.start_location} → ${route.end_location}</div>
      <div class="meta">Status: ${route.status}</div>
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
      <div class="title">${point.route_name}</div>
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
      <td>${bus.route_name}</td>
      <td>${bus.status}</td>
      <td>${bus.current_speed ?? 0} km/h</td>
      <td>${bus.current_lat}, ${bus.current_lng}</td>
      <td>${formatDate(bus.last_seen_at)}</td>
    `;
    busTable.appendChild(tr);
  });
}

async function loadDashboard() {
  apiStatus.textContent = 'Loading...';
  try {
    const [health, routes, buses, waiting] = await Promise.all([
      getJson('/health'),
      getJson('/routes'),
      getJson('/buses/live'),
      getJson('/waiting'),
    ]);

    apiStatus.textContent = JSON.stringify(health, null, 2);
    routesCount.textContent = routes.data.length;
    busesCount.textContent = buses.data.length;
    waitingCount.textContent = waiting.data.length;
    renderRoutes(routes.data);
    renderBuses(buses.data);
    renderWaiting(waiting.data);
  } catch (error) {
    apiStatus.textContent = `Failed to load API\n${error.message}`;
  }
}

saveApiBtn.addEventListener('click', () => {
  localStorage.setItem(storageKey, getApiBase());
  loadDashboard();
});

refreshBtn.addEventListener('click', loadDashboard);

loadDashboard();
