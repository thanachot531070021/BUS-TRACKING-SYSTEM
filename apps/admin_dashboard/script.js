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
const routeAdminsList = $('routeAdminsList');
const reloadRoutesBtn = $('reloadRoutesBtn');
const reloadWaitingBtn = $('reloadWaitingBtn');
const reloadBusesBtn = $('reloadBusesBtn');
const reloadUsersBtn = $('reloadUsersBtn');
const reloadDriversBtn = $('reloadDriversBtn');
const reloadAdminsBtn = $('reloadAdminsBtn');
const reloadRouteAdminsBtn = $('reloadRouteAdminsBtn');
const createRouteBtn = $('createRouteBtn');
const updateRouteBtn = $('updateRouteBtn');
const clearRouteBtn = $('clearRouteBtn');
const createBusBtn = $('createBusBtn');
const updateBusBtn = $('updateBusBtn');
const clearBusBtn = $('clearBusBtn');
const createUserBtn = $('createUserBtn');
const updateUserBtn = $('updateUserBtn');
const clearUserBtn = $('clearUserBtn');
const createDriverBtn = $('createDriverBtn');
const updateDriverBtn = $('updateDriverBtn');
const clearDriverBtn = $('clearDriverBtn');
const createAdminBtn = $('createAdminBtn');
const updateAdminBtn = $('updateAdminBtn');
const clearAdminBtn = $('clearAdminBtn');
const createRouteAdminBtn = $('createRouteAdminBtn');
const deleteRouteAdminBtn = $('deleteRouteAdminBtn');
const clearRouteAdminBtn = $('clearRouteAdminBtn');

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
const userEditIdInput = $('userEditIdInput');
const userUsernameInput = $('userUsernameInput');
const userEmailInput = $('userEmailInput');
const userFullNameInput = $('userFullNameInput');
const userRoleInput = $('userRoleInput');
const userStatusInput = $('userStatusInput');
const driverEditIdInput = $('driverEditIdInput');
const driverUserIdInput = $('driverUserIdInput');
const driverEmployeeCodeInput = $('driverEmployeeCodeInput');
const driverLicenseInput = $('driverLicenseInput');
const driverAssignedBusInput = $('driverAssignedBusInput');
const driverAssignedRouteInput = $('driverAssignedRouteInput');
const driverStatusInput = $('driverStatusInput');
const adminEditIdInput = $('adminEditIdInput');
const adminUserIdInput = $('adminUserIdInput');
const adminTypeInput = $('adminTypeInput');
const adminStatusInput = $('adminStatusInput');
const routeAdminIdInput = $('routeAdminIdInput');
const routeAdminRouteIdInput = $('routeAdminRouteIdInput');
const routeAdminAdminIdInput = $('routeAdminAdminIdInput');

const routeFormStatus = $('routeFormStatus');
const busFormStatus = $('busFormStatus');
const userFormStatus = $('userFormStatus');
const driverFormStatus = $('driverFormStatus');
const adminFormStatus = $('adminFormStatus');
const routeAdminFormStatus = $('routeAdminFormStatus');

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

function fillRouteForm(route) { routeEditIdInput.value = route.id || ''; routeCodeInput.value = route.route_code || ''; routeNameInput.value = route.route_name || ''; routeStartInput.value = route.start_location || ''; routeEndInput.value = route.end_location || ''; setStatus(routeFormStatus, `Loaded route ${route.id} for editing`, 'success'); }
function clearRouteForm() { routeEditIdInput.value=''; routeCodeInput.value=''; routeNameInput.value=''; routeStartInput.value=''; routeEndInput.value=''; setStatus(routeFormStatus, 'Ready', 'info'); }
function fillBusForm(bus) { busEditIdInput.value = bus.id || ''; busPlateInput.value = bus.plate_number || ''; busRouteIdInput.value = bus.route_id || ''; busDriverIdInput.value = bus.driver_id || ''; busStatusInput.value = bus.status || ''; setStatus(busFormStatus, `Loaded bus ${bus.id} for editing`, 'success'); }
function clearBusForm() { busEditIdInput.value=''; busPlateInput.value=''; busRouteIdInput.value=''; busDriverIdInput.value=''; busStatusInput.value=''; setStatus(busFormStatus, 'Ready', 'info'); }
function fillUserForm(user) { userEditIdInput.value=user.id||''; userUsernameInput.value=user.username||''; userEmailInput.value=user.email||''; userFullNameInput.value=user.full_name||''; userRoleInput.value=user.role||''; userStatusInput.value=user.status||''; setStatus(userFormStatus, `Loaded user ${user.id}`, 'success'); }
function clearUserForm() { userEditIdInput.value=''; userUsernameInput.value=''; userEmailInput.value=''; userFullNameInput.value=''; userRoleInput.value=''; userStatusInput.value=''; setStatus(userFormStatus, 'Ready', 'info'); }
function fillDriverForm(driver) { driverEditIdInput.value=driver.id||''; driverUserIdInput.value=driver.user_id||''; driverEmployeeCodeInput.value=driver.employee_code||''; driverLicenseInput.value=driver.license_no||''; driverAssignedBusInput.value=driver.assigned_bus_id||''; driverAssignedRouteInput.value=driver.assigned_route_id||''; driverStatusInput.value=driver.status||''; setStatus(driverFormStatus, `Loaded driver ${driver.id}`, 'success'); }
function clearDriverForm() { driverEditIdInput.value=''; driverUserIdInput.value=''; driverEmployeeCodeInput.value=''; driverLicenseInput.value=''; driverAssignedBusInput.value=''; driverAssignedRouteInput.value=''; driverStatusInput.value=''; setStatus(driverFormStatus, 'Ready', 'info'); }
function fillAdminForm(admin) { adminEditIdInput.value=admin.id||''; adminUserIdInput.value=admin.user_id||''; adminTypeInput.value=admin.admin_type||''; adminStatusInput.value=admin.status||''; setStatus(adminFormStatus, `Loaded admin ${admin.id}`, 'success'); }
function clearAdminForm() { adminEditIdInput.value=''; adminUserIdInput.value=''; adminTypeInput.value=''; adminStatusInput.value=''; setStatus(adminFormStatus, 'Ready', 'info'); }
function fillRouteAdminForm(item) { routeAdminIdInput.value=item.id||''; routeAdminRouteIdInput.value=item.route_id||''; routeAdminAdminIdInput.value=item.admin_id||''; setStatus(routeAdminFormStatus, `Loaded assignment ${item.id}`, 'success'); }
function clearRouteAdminForm() { routeAdminIdInput.value=''; routeAdminRouteIdInput.value=''; routeAdminAdminIdInput.value=''; setStatus(routeAdminFormStatus, 'Ready', 'info'); }

function renderRoutes(routes) {
  routesList.innerHTML = '';
  routes.forEach((route) => {
    const div = document.createElement('div'); div.className='stack-item';
    div.innerHTML = `<div class="title">${route.route_code || '-'} - ${route.route_name}</div><div class="meta">${route.start_location || '-'} → ${route.end_location || '-'}</div><div class="meta">Status: ${route.status}</div><div class="meta">Route ID: ${route.id}</div><div class="action-row"><button class="secondary edit-route-btn" data-route='${JSON.stringify(route).replace(/'/g,'&apos;')}'>Edit</button><button class="danger delete-route-btn" data-route-id="${route.id}">Delete</button></div>`;
    routesList.appendChild(div);
  });
}
function renderWaiting(points) { waitingList.innerHTML=''; points.forEach((point)=>{ const div=document.createElement('div'); div.className='stack-item'; div.innerHTML=`<div class="title">${point.route_name || point.route_id}</div><div class="meta">Waiting count: ${point.waiting_count ?? 1}</div><div class="meta">Lat/Lng: ${point.lat}, ${point.lng}</div><div class="meta">Created: ${formatDate(point.created_at)}</div>`; waitingList.appendChild(div); }); }
function renderBuses(buses) { busTable.innerHTML=''; buses.forEach((bus)=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${bus.plate_number}</td><td>${bus.route_id ?? bus.route_name ?? '-'}</td><td>${bus.status}</td><td>${bus.current_lat ?? '-'}, ${bus.current_lng ?? '-'}</td><td><button class="secondary edit-bus-btn" data-bus='${JSON.stringify(bus).replace(/'/g,'&apos;')}'>Edit</button><button class="danger delete-bus-btn" data-bus-id="${bus.id}">Delete</button></td>`; busTable.appendChild(tr); }); }
function renderSummary(summary) { summaryRoutes.textContent=summary.total_routes ?? '-'; summaryBuses.textContent=summary.total_buses ?? '-'; summaryDrivers.textContent=summary.total_drivers ?? '-'; summaryUsers.textContent=summary.total_users ?? '-'; summaryActiveBuses.textContent=summary.active_buses ?? '-'; }

function renderManagedList(target, items, type, formatter) {
  target.innerHTML = '';
  items.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'stack-item';
    div.innerHTML = `${formatter(item)}<div class="action-row">${type !== 'route-admin' ? `<button class="secondary edit-${type}-btn" data-item='${JSON.stringify(item).replace(/'/g,'&apos;')}'>Edit</button>` : `<button class="secondary edit-route-admin-btn" data-item='${JSON.stringify(item).replace(/'/g,'&apos;')}'>Load</button>`}<button class="danger delete-${type}-btn" data-id="${item.id}">Delete</button></div>`;
    target.appendChild(div);
  });
}

async function loginAdmin() {
  try { updateAuthStatus('Logging in...'); const result = await apiFetch('/auth/admin/login', { method: 'POST', body: JSON.stringify({ username: adminUsername.value.trim(), password: adminPassword.value }) }); const token = result?.data?.token || result?.data?.access_token; if (!token) throw new Error('No token returned from admin login'); setToken(token); updateAuthStatus(`Logged in as ${result?.data?.user?.username || adminUsername.value.trim()}`); await loadDashboard(); } catch (error) { updateAuthStatus(`Login failed: ${error.message}`); }
}

async function createRoute(){ try{ setStatus(routeFormStatus,'Creating route...','loading'); await apiFetch('/admin/routes',{method:'POST',body:JSON.stringify({routeCode:routeCodeInput.value.trim(),routeName:routeNameInput.value.trim(),startLocation:routeStartInput.value.trim(),endLocation:routeEndInput.value.trim()})},true); clearRouteForm(); setStatus(routeFormStatus,'Route created','success'); await loadDashboard(); } catch(error){ setStatus(routeFormStatus,`Create route failed: ${error.message}`,'error'); } }
async function updateRoute(){ try{ if(!routeEditIdInput.value.trim()) throw new Error('Route ID is required for update'); setStatus(routeFormStatus,'Updating route...','loading'); await apiFetch(`/admin/routes/${routeEditIdInput.value.trim()}`,{method:'PUT',body:JSON.stringify({routeCode:routeCodeInput.value.trim(),routeName:routeNameInput.value.trim(),startLocation:routeStartInput.value.trim(),endLocation:routeEndInput.value.trim()})},true); setStatus(routeFormStatus,'Route updated','success'); await loadDashboard(); } catch(error){ setStatus(routeFormStatus,`Update route failed: ${error.message}`,'error'); } }
async function createBus(){ try{ setStatus(busFormStatus,'Creating bus...','loading'); await apiFetch('/admin/buses',{method:'POST',body:JSON.stringify({plateNumber:busPlateInput.value.trim(),routeId:busRouteIdInput.value.trim()||undefined,driverId:busDriverIdInput.value.trim()||undefined,status:busStatusInput.value.trim()||undefined})},true); clearBusForm(); setStatus(busFormStatus,'Bus created','success'); await loadDashboard(); } catch(error){ setStatus(busFormStatus,`Create bus failed: ${error.message}`,'error'); } }
async function updateBus(){ try{ if(!busEditIdInput.value.trim()) throw new Error('Bus ID is required for update'); setStatus(busFormStatus,'Updating bus...','loading'); await apiFetch(`/admin/buses/${busEditIdInput.value.trim()}`,{method:'PUT',body:JSON.stringify({plateNumber:busPlateInput.value.trim(),routeId:busRouteIdInput.value.trim()||undefined,driverId:busDriverIdInput.value.trim()||undefined,status:busStatusInput.value.trim()||undefined})},true); setStatus(busFormStatus,'Bus updated','success'); await loadDashboard(); } catch(error){ setStatus(busFormStatus,`Update bus failed: ${error.message}`,'error'); } }
async function createUser(){ try{ setStatus(userFormStatus,'Creating user...','loading'); await apiFetch('/admin/users',{method:'POST',body:JSON.stringify({username:userUsernameInput.value.trim()||undefined,email:userEmailInput.value.trim()||undefined,fullName:userFullNameInput.value.trim()||undefined,role:userRoleInput.value.trim(),status:userStatusInput.value.trim()||'active',authProvider:'email'})},true); clearUserForm(); setStatus(userFormStatus,'User created','success'); await loadDashboard(); } catch(error){ setStatus(userFormStatus,`Create user failed: ${error.message}`,'error'); } }
async function updateUser(){ try{ if(!userEditIdInput.value.trim()) throw new Error('User ID is required for update'); setStatus(userFormStatus,'Updating user...','loading'); await apiFetch(`/admin/users/${userEditIdInput.value.trim()}`,{method:'PUT',body:JSON.stringify({username:userUsernameInput.value.trim()||undefined,email:userEmailInput.value.trim()||undefined,fullName:userFullNameInput.value.trim()||undefined,role:userRoleInput.value.trim()||undefined,status:userStatusInput.value.trim()||undefined})},true); setStatus(userFormStatus,'User updated','success'); await loadDashboard(); } catch(error){ setStatus(userFormStatus,`Update user failed: ${error.message}`,'error'); } }
async function createDriver(){ try{ setStatus(driverFormStatus,'Creating driver...','loading'); await apiFetch('/admin/drivers',{method:'POST',body:JSON.stringify({userId:driverUserIdInput.value.trim(),employeeCode:driverEmployeeCodeInput.value.trim()||undefined,licenseNo:driverLicenseInput.value.trim()||undefined,assignedBusId:driverAssignedBusInput.value.trim()||undefined,assignedRouteId:driverAssignedRouteInput.value.trim()||undefined,status:driverStatusInput.value.trim()||'active'})},true); clearDriverForm(); setStatus(driverFormStatus,'Driver created','success'); await loadDashboard(); } catch(error){ setStatus(driverFormStatus,`Create driver failed: ${error.message}`,'error'); } }
async function updateDriver(){ try{ if(!driverEditIdInput.value.trim()) throw new Error('Driver ID is required for update'); setStatus(driverFormStatus,'Updating driver...','loading'); await apiFetch(`/admin/drivers/${driverEditIdInput.value.trim()}`,{method:'PUT',body:JSON.stringify({userId:driverUserIdInput.value.trim()||undefined,employeeCode:driverEmployeeCodeInput.value.trim()||undefined,licenseNo:driverLicenseInput.value.trim()||undefined,assignedBusId:driverAssignedBusInput.value.trim()||undefined,assignedRouteId:driverAssignedRouteInput.value.trim()||undefined,status:driverStatusInput.value.trim()||undefined})},true); setStatus(driverFormStatus,'Driver updated','success'); await loadDashboard(); } catch(error){ setStatus(driverFormStatus,`Update driver failed: ${error.message}`,'error'); } }
async function createAdminUser(){ try{ setStatus(adminFormStatus,'Creating admin...','loading'); await apiFetch('/admin/admins',{method:'POST',body:JSON.stringify({userId:adminUserIdInput.value.trim(),adminType:adminTypeInput.value.trim(),status:adminStatusInput.value.trim()||'active'})},true); clearAdminForm(); setStatus(adminFormStatus,'Admin created','success'); await loadDashboard(); } catch(error){ setStatus(adminFormStatus,`Create admin failed: ${error.message}`,'error'); } }
async function updateAdminUser(){ try{ if(!adminEditIdInput.value.trim()) throw new Error('Admin ID is required for update'); setStatus(adminFormStatus,'Updating admin...','loading'); await apiFetch(`/admin/admins/${adminEditIdInput.value.trim()}`,{method:'PUT',body:JSON.stringify({userId:adminUserIdInput.value.trim()||undefined,adminType:adminTypeInput.value.trim()||undefined,status:adminStatusInput.value.trim()||undefined})},true); setStatus(adminFormStatus,'Admin updated','success'); await loadDashboard(); } catch(error){ setStatus(adminFormStatus,`Update admin failed: ${error.message}`,'error'); } }
async function createRouteAdmin(){ try{ setStatus(routeAdminFormStatus,'Assigning route admin...','loading'); await apiFetch('/admin/route-admins',{method:'POST',body:JSON.stringify({routeId:routeAdminRouteIdInput.value.trim(),adminId:routeAdminAdminIdInput.value.trim()})},true); clearRouteAdminForm(); setStatus(routeAdminFormStatus,'Assignment created','success'); await loadDashboard(); } catch(error){ setStatus(routeAdminFormStatus,`Create assignment failed: ${error.message}`,'error'); } }
async function deleteByPath(path, messageTarget, successText){ try{ await apiFetch(path,{method:'DELETE'},true); setStatus(messageTarget,successText,'success'); await loadDashboard(); } catch(error){ setStatus(messageTarget,`${successText} failed: ${error.message}`,'error'); } }
async function deleteRoute(routeId){ if(confirm(`Delete route ${routeId}?`)) await deleteByPath(`/admin/routes/${routeId}`, routeFormStatus, 'Route deleted'); }
async function deleteBus(busId){ if(confirm(`Delete bus ${busId}?`)) await deleteByPath(`/admin/buses/${busId}`, busFormStatus, 'Bus deleted'); }
async function deleteUser(userId){ if(confirm(`Delete user ${userId}?`)) await deleteByPath(`/admin/users/${userId}`, userFormStatus, 'User deleted'); }
async function deleteDriver(driverId){ if(confirm(`Delete driver ${driverId}?`)) await deleteByPath(`/admin/drivers/${driverId}`, driverFormStatus, 'Driver deleted'); }
async function deleteAdmin(adminId){ if(confirm(`Delete admin ${adminId}?`)) await deleteByPath(`/admin/admins/${adminId}`, adminFormStatus, 'Admin deleted'); }
async function deleteRouteAdminAssignment(id){ if(confirm(`Delete assignment ${id}?`)) await deleteByPath(`/admin/route-admins/${id}`, routeAdminFormStatus, 'Assignment deleted'); }

async function loadDashboard() {
  apiStatus.textContent = 'Loading...';
  try {
    const [health, summary, routes, buses, waiting, users, drivers, admins, routeAdmins] = await Promise.all([
      apiFetch('/health'),
      apiFetch('/admin/summary', {}, true).catch(() => ({ data: {} })),
      apiFetch('/admin/routes', {}, true).catch(() => apiFetch('/routes')),
      apiFetch('/admin/buses', {}, true).catch(() => apiFetch('/buses/live')),
      apiFetch('/admin/waiting', {}, true).catch(() => apiFetch('/waiting')),
      apiFetch('/admin/users', {}, true).catch(() => ({ data: [] })),
      apiFetch('/admin/drivers', {}, true).catch(() => ({ data: [] })),
      apiFetch('/admin/admins', {}, true).catch(() => ({ data: [] })),
      apiFetch('/admin/route-admins', {}, true).catch(() => ({ data: [] })),
    ]);

    apiStatus.textContent = JSON.stringify(health, null, 2);
    routesCount.textContent = routes.data?.length ?? 0;
    busesCount.textContent = buses.data?.length ?? 0;
    waitingCount.textContent = waiting.data?.length ?? 0;
    renderSummary(summary.data || {});
    renderRoutes(routes.data || []);
    renderBuses(buses.data || []);
    renderWaiting(waiting.data || []);
    renderManagedList(usersList, users.data || [], 'user', (u) => `<div class="title">${u.full_name || u.username || u.email || u.id}</div><div class="meta">Role: ${u.role} | Status: ${u.status}</div><div class="meta">ID: ${u.id}</div>`);
    renderManagedList(driversList, drivers.data || [], 'driver', (d) => `<div class="title">Driver ${d.employee_code || d.id}</div><div class="meta">User: ${d.user_id}</div><div class="meta">Route: ${d.assigned_route_id || '-'} | Bus: ${d.assigned_bus_id || '-'}</div>`);
    renderManagedList(adminsList, admins.data || [], 'admin', (a) => `<div class="title">Admin ${a.id}</div><div class="meta">Type: ${a.admin_type}</div><div class="meta">User: ${a.user_id}</div>`);
    renderManagedList(routeAdminsList, routeAdmins.data || [], 'route-admin', (r) => `<div class="title">Assignment ${r.id}</div><div class="meta">Route: ${r.route_id}</div><div class="meta">Admin: ${r.admin_id}</div>`);
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
reloadRouteAdminsBtn.addEventListener('click', loadDashboard);
createRouteBtn.addEventListener('click', createRoute);
updateRouteBtn.addEventListener('click', updateRoute);
clearRouteBtn.addEventListener('click', clearRouteForm);
createBusBtn.addEventListener('click', createBus);
updateBusBtn.addEventListener('click', updateBus);
clearBusBtn.addEventListener('click', clearBusForm);
createUserBtn.addEventListener('click', createUser);
updateUserBtn.addEventListener('click', updateUser);
clearUserBtn.addEventListener('click', clearUserForm);
createDriverBtn.addEventListener('click', createDriver);
updateDriverBtn.addEventListener('click', updateDriver);
clearDriverBtn.addEventListener('click', clearDriverForm);
createAdminBtn.addEventListener('click', createAdminUser);
updateAdminBtn.addEventListener('click', updateAdminUser);
clearAdminBtn.addEventListener('click', clearAdminForm);
createRouteAdminBtn.addEventListener('click', createRouteAdmin);
deleteRouteAdminBtn.addEventListener('click', () => routeAdminIdInput.value.trim() && deleteRouteAdminAssignment(routeAdminIdInput.value.trim()));
clearRouteAdminBtn.addEventListener('click', clearRouteAdminForm);

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.classList.contains('delete-route-btn')) deleteRoute(target.dataset.routeId);
  if (target.classList.contains('delete-bus-btn')) deleteBus(target.dataset.busId);
  if (target.classList.contains('delete-user-btn')) deleteUser(target.dataset.id);
  if (target.classList.contains('delete-driver-btn')) deleteDriver(target.dataset.id);
  if (target.classList.contains('delete-admin-btn')) deleteAdmin(target.dataset.id);
  if (target.classList.contains('delete-route-admin-btn')) deleteRouteAdminAssignment(target.dataset.id);
  if (target.classList.contains('edit-route-btn')) fillRouteForm(JSON.parse(target.dataset.route.replace(/&apos;/g, "'")));
  if (target.classList.contains('edit-bus-btn')) fillBusForm(JSON.parse(target.dataset.bus.replace(/&apos;/g, "'")));
  if (target.classList.contains('edit-user-btn')) fillUserForm(JSON.parse(target.dataset.item.replace(/&apos;/g, "'")));
  if (target.classList.contains('edit-driver-btn')) fillDriverForm(JSON.parse(target.dataset.item.replace(/&apos;/g, "'")));
  if (target.classList.contains('edit-admin-btn')) fillAdminForm(JSON.parse(target.dataset.item.replace(/&apos;/g, "'")));
  if (target.classList.contains('edit-route-admin-btn')) fillRouteAdminForm(JSON.parse(target.dataset.item.replace(/&apos;/g, "'")));
});

updateAuthStatus();
loadDashboard();
