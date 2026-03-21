'use strict';

/* =====================================================
   BUS TRACKING ADMIN — MAIN APP SCRIPT
   ===================================================== */

const DEFAULT_API = 'https://bus-tracking-worker.thanachot-jo888.workers.dev';
const TOKEN_KEY   = 'bus-tracking-admin-token';
const USER_KEY    = 'bus-tracking-admin-user';
const API_KEY     = 'bus-tracking-api-base';

// ===== AUTH =====
const getToken  = () => localStorage.getItem(TOKEN_KEY) || '';
const clearAuth = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); };
const getApiBase = () => (localStorage.getItem(API_KEY) || DEFAULT_API).replace(/\/$/, '');

// ===== API FETCH =====
async function apiFetch(path, opts = {}, auth = true) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await fetch(`${getApiBase()}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
}

function extractList(r) {
  if (Array.isArray(r)) return r;
  const keys = ['data','users','drivers','admins','routes','buses',
                 'assignments','waiting','items','list','results'];
  for (const k of keys) if (Array.isArray(r?.[k])) return r[k];
  return Object.values(r || {}).find(v => Array.isArray(v)) || [];
}

// ===== STATE =====
const state = { section: 'dashboard', user: null, cache: {} };

/* =====================================================
   SECTION CONFIGS
   ===================================================== */
const SECTIONS = {

  dashboard: {
    title: 'Dashboard', icon: '📊',
    subtitle: 'ภาพรวมระบบ Bus Tracking',
  },

  users: {
    title: 'ผู้ใช้งาน', icon: '👥',
    subtitle: 'จัดการข้อมูลผู้ใช้งานทั้งหมด',
    listPath:   '/admin/users',
    createPath: '/admin/users',
    updatePath: id => `/admin/users/${id}`,
    deletePath: id => `/admin/users/${id}`,
    idField: 'id',
    columns: [
      { key: 'id',        label: 'ID',           r: chip },
      { key: 'username',  label: 'Username',      bold: true },
      { key: 'full_name', label: 'ชื่อ-นามสกุล' },
      { key: 'email',     label: 'Email' },
      { key: 'role',      label: 'บทบาท',         r: roleBadge },
      { key: 'status',    label: 'สถานะ',          r: statusBadge },
    ],
    formFields: [
      { n: 'username',  rk: 'username',  label: 'Username',      type: 'text',     req: true  },
      { n: 'email',     rk: 'email',     label: 'Email',          type: 'email',    req: true  },
      { n: 'fullName',  rk: 'full_name', label: 'ชื่อ-นามสกุล',  type: 'text',     req: false },
      { n: 'password',  rk: null,        label: 'รหัสผ่าน',       type: 'password', req: false, createOnly: true },
      { n: 'role',      rk: 'role',      label: 'บทบาท',           type: 'select',   req: true,
        options: [
          { v: 'passenger', l: '🧑 ผู้โดยสาร' },
          { v: 'driver',    l: '🚌 คนขับรถ'   },
          { v: 'admin',     l: '👤 Admin'     },
        ]
      },
      { n: 'status', rk: 'status', label: 'สถานะ', type: 'select', req: false,
        options: [
          { v: 'active',    l: '✅ ใช้งาน'   },
          { v: 'inactive',  l: '⛔ ไม่ใช้งาน' },
          { v: 'suspended', l: '🚫 ระงับ'     },
        ]
      },
    ],
    extraCreate: { authProvider: 'email' },
  },

  drivers: {
    title: 'คนขับรถ', icon: '🚌',
    subtitle: 'จัดการข้อมูลคนขับรถโดยสาร',
    listPath:   '/admin/drivers',
    createPath: '/admin/drivers',
    updatePath: id => `/admin/drivers/${id}`,
    deletePath: id => `/admin/drivers/${id}`,
    idField: 'id',
    columns: [
      { key: 'id',              label: 'ID',            r: chip },
      { key: 'employee_code',   label: 'รหัสพนักงาน',   bold: true },
      { key: 'license_no',      label: 'ใบขับขี่'        },
      { key: 'user_id',         label: 'User ID',        r: chip },
      { key: 'assigned_route_id', label: 'Route ID',     r: v => v ? chip(v) : '-' },
      { key: 'status',          label: 'สถานะ',          r: statusBadge },
    ],
    formFields: [
      { n: 'userId',         rk: 'user_id',           label: 'User ID',              type: 'text', req: true  },
      { n: 'employeeCode',   rk: 'employee_code',     label: 'รหัสพนักงาน',           type: 'text', req: false },
      { n: 'licenseNo',      rk: 'license_no',        label: 'หมายเลขใบขับขี่',       type: 'text', req: false },
      { n: 'assignedBusId',  rk: 'assigned_bus_id',   label: 'Bus ID ที่มอบหมาย',      type: 'text', req: false },
      { n: 'assignedRouteId',rk: 'assigned_route_id', label: 'Route ID ที่มอบหมาย',   type: 'text', req: false },
      { n: 'status',         rk: 'status',            label: 'สถานะ', type: 'select', req: false,
        options: [
          { v: 'active',   l: '✅ ใช้งาน'    },
          { v: 'inactive', l: '⛔ ไม่ใช้งาน'  },
        ]
      },
    ],
  },

  admins: {
    title: 'ผู้ดูแลระบบ', icon: '👤',
    subtitle: 'จัดการบัญชีผู้ดูแลระบบ',
    listPath:   '/admin/admins',
    createPath: '/admin/admins',
    updatePath: id => `/admin/admins/${id}`,
    deletePath: id => `/admin/admins/${id}`,
    idField: 'id',
    columns: [
      { key: 'id',         label: 'ID',            r: chip },
      { key: 'user_id',    label: 'User ID',        r: chip },
      { key: 'admin_type', label: 'ประเภท',          r: adminTypeBadge },
      { key: 'status',     label: 'สถานะ',           r: statusBadge },
    ],
    formFields: [
      { n: 'userId',    rk: 'user_id',    label: 'User ID',      type: 'text',   req: true,
        hint: 'กรอก ID ของ user ที่ต้องการยกระดับเป็น admin'
      },
      { n: 'adminType', rk: 'admin_type', label: 'ประเภท Admin',  type: 'select', req: true,
        options: [
          { v: 'super_admin', l: '⭐ Super Admin' },
          { v: 'route_admin', l: '🛣️ Route Admin' },
        ]
      },
      { n: 'status', rk: 'status', label: 'สถานะ', type: 'select', req: false,
        options: [
          { v: 'active',   l: '✅ ใช้งาน'   },
          { v: 'inactive', l: '⛔ ไม่ใช้งาน' },
        ]
      },
    ],
  },

  routes: {
    title: 'เส้นทางรถ', icon: '🛣️',
    subtitle: 'จัดการเส้นทางการให้บริการ',
    listPath:   '/admin/routes',
    createPath: '/admin/routes',
    updatePath: id => `/admin/routes/${id}`,
    deletePath: id => `/admin/routes/${id}`,
    idField: 'id',
    columns: [
      { key: 'id',             label: 'ID',           r: chip },
      { key: 'route_code',     label: 'รหัสเส้นทาง',  bold: true },
      { key: 'route_name',     label: 'ชื่อเส้นทาง'  },
      { key: 'start_location', label: 'จุดเริ่มต้น'   },
      { key: 'end_location',   label: 'จุดสิ้นสุด'    },
      { key: 'status',         label: 'สถานะ',         r: statusBadge },
    ],
    formFields: [
      { n: 'routeCode',     rk: 'route_code',     label: 'รหัสเส้นทาง',  type: 'text', req: true  },
      { n: 'routeName',     rk: 'route_name',     label: 'ชื่อเส้นทาง',   type: 'text', req: true  },
      { n: 'startLocation', rk: 'start_location', label: 'จุดเริ่มต้น',   type: 'text', req: false },
      { n: 'endLocation',   rk: 'end_location',   label: 'จุดสิ้นสุด',    type: 'text', req: false },
    ],
  },

  buses: {
    title: 'รถโดยสาร', icon: '🚍',
    subtitle: 'จัดการข้อมูลรถโดยสารทั้งหมด',
    listPath:   '/admin/buses',
    createPath: '/admin/buses',
    updatePath: id => `/admin/buses/${id}`,
    deletePath: id => `/admin/buses/${id}`,
    idField: 'id',
    columns: [
      { key: 'id',           label: 'ID',           r: chip },
      { key: 'plate_number', label: 'ทะเบียนรถ',    bold: true },
      { key: 'route_id',     label: 'Route ID',      r: v => v ? chip(v) : '-' },
      { key: 'driver_id',    label: 'Driver ID',     r: v => v ? chip(v) : '-' },
      { key: 'status',       label: 'สถานะ',          r: statusBadge },
    ],
    formFields: [
      { n: 'plateNumber', rk: 'plate_number', label: 'ทะเบียนรถ', type: 'text', req: true },
      { n: 'routeId',     rk: 'route_id',     label: 'Route ID',   type: 'text', req: false },
      { n: 'driverId',    rk: 'driver_id',    label: 'Driver ID',  type: 'text', req: false },
      { n: 'status', rk: 'status', label: 'สถานะ', type: 'select', req: false,
        options: [
          { v: 'off',         l: '⚫ ไม่ได้ใช้งาน' },
          { v: 'on',          l: '🟢 ให้บริการ'     },
          { v: 'maintenance', l: '🔧 ซ่อมบำรุง'     },
        ]
      },
    ],
  },

  routeAdmins: {
    title: 'มอบหมายเส้นทาง', icon: '🔗',
    subtitle: 'กำหนด Admin ประจำเส้นทาง',
    listPath:   '/admin/route-admins',
    createPath: '/admin/route-admins',
    deletePath: id => `/admin/route-admins/${id}`,
    idField: 'id',
    noEdit: true,
    columns: [
      { key: 'id',       label: 'ID',       r: chip },
      { key: 'route_id', label: 'Route ID', r: chip },
      { key: 'admin_id', label: 'Admin ID', r: chip },
    ],
    formFields: [
      { n: 'routeId', rk: 'route_id', label: 'Route ID', type: 'text', req: true },
      { n: 'adminId', rk: 'admin_id', label: 'Admin ID', type: 'text', req: true },
    ],
  },

  waiting: {
    title: 'รายการรอรับ', icon: '⏳',
    subtitle: 'ติดตามรายการผู้โดยสารที่รอรับ',
    listPath: '/admin/waiting',
    idField: 'id',
    readOnly: true,
    columns: [
      { key: 'id',         label: 'ID',       r: chip },
      { key: 'user_id',    label: 'User ID',   r: v => v ? chip(v) : '-' },
      { key: 'route_id',   label: 'Route ID',  r: v => v ? chip(v) : '-' },
      { key: 'status',     label: 'สถานะ',     r: statusBadge },
      { key: 'lat',        label: 'Lat' },
      { key: 'lng',        label: 'Lng' },
      { key: 'created_at', label: 'เวลา',      r: fmtDate },
    ],
  },

  analytics: {
    title: 'Analytics', icon: '📈',
    subtitle: 'สถิติการใช้งานระบบแยกตามช่องทาง',
  },

  settings: {
    title: 'การตั้งค่า API', icon: '⚙️',
    subtitle: 'กำหนด API Base URL สำหรับ backend',
  },
};

/* =====================================================
   HELPERS
   ===================================================== */
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function chip(v) {
  if (!v) return '<span class="text-muted">—</span>';
  const s = String(v);
  const display = s.length > 12 ? s.slice(0,10)+'…' : s;
  return `<span class="id-chip" title="${esc(s)}">${esc(display)}</span>`;
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('th-TH', { dateStyle:'short', timeStyle:'short' }); }
  catch { return String(d); }
}

function roleBadge(v) {
  const map = {
    passenger:  '<span class="badge b-blue">👤 ผู้โดยสาร</span>',
    driver:     '<span class="badge b-green">🚌 คนขับ</span>',
    admin:      '<span class="badge b-purple">👤 Admin</span>',
    superadmin: '<span class="badge b-red">⭐ Super Admin</span>',
    super_admin:'<span class="badge b-red">⭐ Super Admin</span>',
  };
  return map[v] || `<span class="badge b-gray">${esc(v ?? '—')}</span>`;
}

function adminTypeBadge(v) {
  const map = {
    super_admin: '<span class="badge b-red">⭐ Super Admin</span>',
    route_admin: '<span class="badge b-purple">🛣️ Route Admin</span>',
  };
  return map[v] || `<span class="badge b-gray">${esc(v ?? '—')}</span>`;
}

function statusBadge(v) {
  if (!v) return '<span class="badge b-gray">—</span>';
  const map = {
    active:      '<span class="badge b-green">✅ ใช้งาน</span>',
    inactive:    '<span class="badge b-gray">⛔ ไม่ใช้งาน</span>',
    suspended:   '<span class="badge b-red">🚫 ระงับ</span>',
    on_duty:     '<span class="badge b-green">🟢 ปฏิบัติงาน</span>',
    off_duty:    '<span class="badge b-gray">⚫ ไม่ปฏิบัติ</span>',
    on:          '<span class="badge b-green">🟢 ให้บริการ</span>',
    off:         '<span class="badge b-gray">⚫ ไม่ได้ใช้งาน</span>',
    maintenance: '<span class="badge b-orange">🔧 ซ่อมบำรุง</span>',
    waiting:     '<span class="badge b-yellow">⏳ รอรับ</span>',
    picked_up:   '<span class="badge b-teal">✅ รับแล้ว</span>',
    cancelled:   '<span class="badge b-red">❌ ยกเลิก</span>',
    online:      '<span class="badge b-green">🟢 Online</span>',
    offline:     '<span class="badge b-red">🔴 Offline</span>',
  };
  return map[String(v).toLowerCase()] || `<span class="badge b-gray">${esc(v)}</span>`;
}

/* =====================================================
   TOAST
   ===================================================== */
function toast(msg, type = 'info') {
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${esc(msg)}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => { el.style.animation = 'toastOut .3s ease forwards'; setTimeout(() => el.remove(), 300); }, 3800);
}

/* =====================================================
   SIDEBAR TOGGLE (mobile)
   ===================================================== */
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('show');
  document.getElementById('menuToggle').classList.add('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
  document.getElementById('menuToggle').classList.remove('active');
}

function toggleSidebar() {
  const isOpen = document.getElementById('sidebar').classList.contains('open');
  isOpen ? closeSidebar() : openSidebar();
}

/* =====================================================
   NAVIGATION
   ===================================================== */
function navigate(section) {
  state.section = section;
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.section === section)
  );
  const cfg = SECTIONS[section];
  document.getElementById('pageTitle').textContent    = `${cfg.icon} ${cfg.title}`;
  document.getElementById('pageSubtitle').textContent = cfg.subtitle;
  // Auto-close sidebar on mobile after navigation
  if (window.innerWidth <= 900) closeSidebar();
  trackEvent('page_view', section);
  loadSection(section);
}

/* =====================================================
   LOAD SECTION
   ===================================================== */
async function loadSection(section) {
  const content = document.getElementById('mainContent');

  if (section === 'dashboard') { renderDashboard(); return; }
  if (section === 'analytics') { renderAnalytics(); return; }
  if (section === 'settings')  { renderSettings();  return; }

  const cfg = SECTIONS[section];
  content.innerHTML = `<div class="card"><div class="loading"><div class="spinner"></div> กำลังโหลดข้อมูล...</div></div>`;

  try {
    const raw   = await apiFetch(cfg.listPath);
    const items = extractList(raw);
    state.cache[section] = items;
    renderTable(section, items);
  } catch (err) {
    content.innerHTML = errCard(section, err.message);
  }
}

function errCard(section, msg) {
  return `<div class="card"><div class="card-body">
    <div class="empty-state">
      <div class="ei">⚠️</div>
      <h3>โหลดข้อมูลไม่ได้</h3>
      <p>${esc(msg)}</p>
      <button class="btn btn-primary" style="margin-top:14px" onclick="loadSection('${section}')">🔄 ลองอีกครั้ง</button>
    </div>
  </div></div>`;
}

/* =====================================================
   RENDER TABLE
   ===================================================== */
function renderTable(section, items) {
  const content = document.getElementById('mainContent');
  const cfg   = SECTIONS[section];
  const ro    = !!cfg.readOnly;
  const noEdit = !!cfg.noEdit;
  const colCount = cfg.columns.length + (ro ? 0 : 1);

  let rows = '';
  if (!items.length) {
    rows = `<tr><td colspan="${colCount}" style="text-align:center;padding:44px;color:var(--muted)">
      <div style="font-size:34px;margin-bottom:10px">📭</div>ยังไม่มีข้อมูล
    </td></tr>`;
  } else {
    rows = items.map(item => {
      const id = item[cfg.idField];
      let cells = cfg.columns.map(col => {
        const v = item[col.key];
        const html = col.r ? col.r(v, item) : (v != null ? esc(String(v)) : '—');
        return `<td>${col.bold ? `<strong>${html}</strong>` : html}</td>`;
      }).join('');
      if (!ro) {
        cells += `<td><div class="td-actions">
          ${!noEdit ? `<button class="btn btn-warning btn-icon btn-sm" title="แก้ไข" onclick="openEdit('${section}','${esc(String(id))}')">✏️</button>` : ''}
          <button class="btn btn-danger btn-icon btn-sm" title="ลบ" onclick="askDelete('${section}','${esc(String(id))}')">🗑️</button>
        </div></td>`;
      }
      return `<tr>${cells}</tr>`;
    }).join('');
  }

  content.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          ${cfg.icon} ${cfg.title}
          <span class="badge b-gray" style="margin-left:6px">${items.length} รายการ</span>
        </div>
        <div class="toolbar">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input id="searchInput" type="text" class="form-control"
              placeholder="ค้นหา..." oninput="filterTable()" autocomplete="off">
          </div>
          ${!ro ? `<button class="btn btn-primary" onclick="openCreate('${section}')">＋ เพิ่มรายการ</button>` : ''}
          <button class="btn btn-secondary btn-sm" onclick="loadSection('${section}')">🔄 รีเฟรช</button>
        </div>
      </div>
      <div class="table-wrap">
        <table id="dataTable">
          <thead><tr>
            ${cfg.columns.map(c => `<th>${c.label}</th>`).join('')}
            ${!ro ? '<th style="width:90px">จัดการ</th>' : ''}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function filterTable() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  document.querySelectorAll('#dataTable tbody tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

/* =====================================================
   DASHBOARD
   ===================================================== */
async function renderDashboard() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div class="card"><div class="loading"><div class="spinner"></div> กำลังโหลด Dashboard...</div></div>`;

  try {
    const raw = await apiFetch('/admin/summary');
    const s   = raw?.data || raw || {};

    const cards = [
      { icon:'🛣️', cls:'si-blue',   val: s.total_routes   ?? s.totalRoutes   ?? '—', label:'เส้นทางทั้งหมด'    },
      { icon:'🚍', cls:'si-green',  val: s.total_buses    ?? s.totalBuses    ?? '—', label:'รถโดยสารทั้งหมด'  },
      { icon:'🟢', cls:'si-yellow', val: s.active_buses   ?? s.activeBuses   ?? '—', label:'รถที่ออกให้บริการ' },
      { icon:'🚌', cls:'si-purple', val: s.total_drivers  ?? s.totalDrivers  ?? '—', label:'คนขับทั้งหมด'      },
      { icon:'👥', cls:'si-indigo', val: s.total_users    ?? s.totalUsers    ?? '—', label:'ผู้ใช้งานทั้งหมด'  },
      { icon:'⏳', cls:'si-red',    val: s.waiting_count  ?? s.waitingCount  ?? s.total_waiting ?? '—', label:'รายการรอรับ' },
      { icon:'👤', cls:'si-teal',   val: s.total_admins   ?? s.totalAdmins   ?? '—', label:'Admin ทั้งหมด'     },
    ];

    content.innerHTML = `
      <div class="stats-grid">
        ${cards.map(c => `
          <div class="stat-card">
            <div class="stat-icon ${c.cls}">${c.icon}</div>
            <div>
              <div class="stat-value">${c.val}</div>
              <div class="stat-label">${c.label}</div>
            </div>
          </div>`).join('')}
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">📋 Summary (Raw JSON)</div>
          <button class="btn btn-secondary btn-sm" onclick="renderDashboard()">🔄 รีเฟรช</button>
        </div>
        <div class="card-body">
          <pre>${esc(JSON.stringify(s, null, 2))}</pre>
        </div>
      </div>`;
  } catch (err) {
    content.innerHTML = errCard('dashboard', err.message);
  }
}

/* =====================================================
   ANALYTICS (Chart.js)
   ===================================================== */
let _chartInstances = {};

function destroyCharts() {
  Object.values(_chartInstances).forEach(c => { try { c.destroy(); } catch {} });
  _chartInstances = {};
}

function makeChart(id, config) {
  const el = document.getElementById(id);
  if (!el) return;
  if (_chartInstances[id]) { try { _chartInstances[id].destroy(); } catch {} }
  _chartInstances[id] = new Chart(el, config);
}

async function renderAnalytics() {
  destroyCharts();
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div class="card"><div class="loading"><div class="spinner"></div> กำลังโหลด Analytics...</div></div>`;

  try {
    const raw = await apiFetch('/admin/analytics?days=7');
    const d = raw?.data || {};

    const totalToday  = d.total_today ?? 0;
    const totalWeek   = d.total_week  ?? 0;
    const bySource    = d.by_source    || [];
    const byEvent     = d.by_event_type || [];
    const byPlatform  = d.by_platform  || [];
    const byDevice    = d.by_device_type || [];
    const daily       = d.daily_counts || [];
    const recent      = d.recent       || [];

    const webCount    = bySource.find(s => s.name === 'web_admin')?.count  ?? 0;
    const mobileCount = bySource.find(s => s.name === 'mobile_app')?.count ?? 0;

    function sourceBadge(s) {
      return s === 'web_admin'
        ? '<span class="badge b-blue">🌐 Web Admin</span>'
        : '<span class="badge b-green">📱 Mobile App</span>';
    }

    content.innerHTML = `
      <!-- Stat cards -->
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-icon si-blue">📅</div>
          <div><div class="stat-value">${totalToday}</div><div class="stat-label">Events วันนี้</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon si-indigo">📊</div>
          <div><div class="stat-value">${totalWeek}</div><div class="stat-label">Events 7 วัน</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon si-purple">🌐</div>
          <div><div class="stat-value">${webCount}</div><div class="stat-label">Web Admin</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon si-green">📱</div>
          <div><div class="stat-value">${mobileCount}</div><div class="stat-label">Mobile App</div></div>
        </div>
      </div>

      <!-- Row 1: Daily line + Source doughnut -->
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:16px">
        <div class="card">
          <div class="card-header">
            <div class="card-title">📅 Events รายวัน (7 วัน)</div>
            <button class="btn btn-secondary btn-sm" onclick="renderAnalytics()">🔄 รีเฟรช</button>
          </div>
          <div class="card-body" style="padding:16px">
            <canvas id="chartDaily" height="110"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">📡 Channel</div></div>
          <div class="card-body" style="display:flex;align-items:center;justify-content:center;padding:16px">
            <canvas id="chartSource" style="max-height:180px"></canvas>
          </div>
        </div>
      </div>

      <!-- Row 2: Platform bar + Device doughnut -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div class="card">
          <div class="card-header"><div class="card-title">💻 Platform / OS</div></div>
          <div class="card-body" style="padding:16px">
            <canvas id="chartPlatform" height="160"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">🎯 ประเภท Event</div></div>
          <div class="card-body" style="padding:16px">
            <canvas id="chartEvent" height="160"></canvas>
          </div>
        </div>
      </div>

      <!-- Recent events table -->
      <div class="card">
        <div class="card-header"><div class="card-title">🕐 Events ล่าสุด (20 รายการ)</div></div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>เวลา</th><th>Channel</th><th>Event</th><th>หน้า/Screen</th><th>Platform</th><th>Device</th><th>User ID</th>
            </tr></thead>
            <tbody>
              ${recent.length
                ? recent.map(e => `<tr>
                    <td>${fmtDate(e.created_at)}</td>
                    <td>${sourceBadge(e.source)}</td>
                    <td><span class="badge b-yellow">${esc(e.event_type)}</span></td>
                    <td>${esc(e.page || '—')}</td>
                    <td>${esc(e.platform || '—')}</td>
                    <td>${esc(e.device_type || '—')}</td>
                    <td>${e.user_id ? chip(e.user_id) : '<span class="text-muted">—</span>'}</td>
                  </tr>`).join('')
                : `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">
                    <div style="font-size:36px;margin-bottom:10px">📭</div>ยังไม่มี events — สร้าง table ใน Supabase แล้วลอง navigate เมนูใดก็ได้
                  </td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>`;

    // ---- Chart.js ----
    const chartDefaults = {
      plugins: { legend: { labels: { font: { family: 'Inter', size: 12 }, padding: 12 } } },
    };

    // 1. Daily line chart
    makeChart('chartDaily', {
      type: 'line',
      data: {
        labels: daily.map(d => d.date.slice(5)),
        datasets: [{
          label: 'Events',
          data: daily.map(d => d.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.1)',
          borderWidth: 2.5,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 4,
          tension: 0.4,
          fill: true,
        }],
      },
      options: {
        ...chartDefaults,
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: '#f1f5f9' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    });

    // 2. Source doughnut
    makeChart('chartSource', {
      type: 'doughnut',
      data: {
        labels: ['🌐 Web Admin', '📱 Mobile App'],
        datasets: [{
          data: [webCount, mobileCount],
          backgroundColor: ['#3b82f6', '#10b981'],
          borderColor: '#fff',
          borderWidth: 3,
          hoverOffset: 6,
        }],
      },
      options: {
        ...chartDefaults,
        cutout: '65%',
        plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } },
      },
    });

    // 3. Platform horizontal bar
    makeChart('chartPlatform', {
      type: 'bar',
      data: {
        labels: byPlatform.map(p => p.name),
        datasets: [{
          label: 'Events',
          data: byPlatform.map(p => p.count),
          backgroundColor: ['#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe','#ede9fe'],
          borderRadius: 6,
        }],
      },
      options: {
        ...chartDefaults,
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: '#f1f5f9' } },
          y: { ticks: { font: { size: 12 } }, grid: { display: false } },
        },
      },
    });

    // 4. Event types doughnut
    const evColors = ['#f59e0b','#3b82f6','#10b981','#ef4444','#8b5cf6','#06b6d4'];
    makeChart('chartEvent', {
      type: 'doughnut',
      data: {
        labels: byEvent.map(e => e.name),
        datasets: [{
          data: byEvent.map(e => e.count),
          backgroundColor: evColors,
          borderColor: '#fff',
          borderWidth: 3,
          hoverOffset: 6,
        }],
      },
      options: {
        ...chartDefaults,
        cutout: '60%',
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 8 } } },
      },
    });

  } catch (err) {
    content.innerHTML = errCard('analytics', err.message);
  }
}

/* =====================================================
   TRACK EVENT (fire & forget — ไม่รอ response)
   ===================================================== */
function trackEvent(eventType, page = '') {
  try {
    const ua = navigator.userAgent;
    const platform =
      /iPhone|iPad|iPod/.test(ua) ? 'iOS' :
      /Android/.test(ua)          ? 'Android' :
      /Windows/.test(ua)          ? 'Windows' :
      /Mac/.test(ua)              ? 'macOS' :
      /Linux/.test(ua)            ? 'Linux' : 'Unknown';
    const deviceType =
      /Mobi|Android.*Mobile|iPhone|iPod/.test(ua) ? 'mobile' :
      /iPad|Android(?!.*Mobile)/.test(ua)          ? 'tablet' : 'desktop';

    fetch(`${getApiBase()}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: JSON.stringify({ source: 'web_admin', eventType, page, platform, deviceType }),
    }).catch(() => {}); // silent fail — never block UX
  } catch {}
}

/* =====================================================
   SETTINGS
   ===================================================== */
function renderSettings() {
  const content = document.getElementById('mainContent');
  const current = getApiBase();
  content.innerHTML = `
    <div class="card" style="max-width:560px">
      <div class="card-header">
        <div class="card-title">⚙️ การตั้งค่า API</div>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">API Base URL</label>
          <input type="url" id="apiUrlInput" class="form-control"
            value="${esc(current)}" placeholder="https://your-api.workers.dev">
          <div style="font-size:12px;color:var(--muted);margin-top:5px">
            ค่าปัจจุบัน: <code>${esc(current)}</code>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:4px">
          <button class="btn btn-primary" onclick="saveApiUrl()">💾 บันทึก</button>
          <button class="btn btn-secondary" onclick="resetApiUrl()">🔄 Reset เป็นค่าเริ่มต้น</button>
        </div>
      </div>
    </div>

    <div class="card" style="max-width:560px;margin-top:16px">
      <div class="card-header">
        <div class="card-title">🔍 Health Check</div>
        <button class="btn btn-secondary btn-sm" onclick="runHealthCheck()">ตรวจสอบ</button>
      </div>
      <div class="card-body">
        <pre id="healthResult">กดปุ่ม "ตรวจสอบ" เพื่อดูสถานะ</pre>
      </div>
    </div>`;
}

function saveApiUrl() {
  const v = document.getElementById('apiUrlInput')?.value.trim();
  if (!v) { toast('กรุณากรอก URL', 'warning'); return; }
  localStorage.setItem(API_KEY, v);
  toast('บันทึก API URL สำเร็จ', 'success');
  renderSettings();
}

function resetApiUrl() {
  localStorage.removeItem(API_KEY);
  toast('Reset URL เป็นค่าเริ่มต้นแล้ว', 'info');
  renderSettings();
}

async function runHealthCheck() {
  const el = document.getElementById('healthResult');
  if (!el) return;
  el.textContent = 'กำลังตรวจสอบ...';
  try {
    const [h, hdb] = await Promise.all([
      apiFetch('/health', {}, false),
      apiFetch('/health/db', {}, false).catch(e => ({ error: e.message })),
    ]);
    el.textContent = JSON.stringify({ health: h, db: hdb }, null, 2);
  } catch (e) {
    el.textContent = `Error: ${e.message}`;
  }
}

/* =====================================================
   CRUD MODAL
   ===================================================== */
const modal = {
  section: null, mode: null, editId: null,
  el:        () => document.getElementById('crudModal'),
  form:      () => document.getElementById('modalForm'),
  titleEl:   () => document.getElementById('modalTitle'),
  bodyEl:    () => document.getElementById('modalBody'),
  submitBtn: () => document.getElementById('modalSubmitBtn'),
};

function openCreate(section) {
  const cfg = SECTIONS[section];
  modal.section = section; modal.mode = 'create'; modal.editId = null;
  modal.titleEl().textContent = `➕ เพิ่ม${cfg.title}`;
  modal.bodyEl().innerHTML    = buildForm(cfg.formFields, null, 'create');
  modal.submitBtn().textContent = '💾 บันทึก';
  modal.el().classList.remove('hidden');
}

async function openEdit(section, id) {
  const cfg = SECTIONS[section];
  modal.section = section; modal.mode = 'edit'; modal.editId = id;
  modal.titleEl().textContent   = `✏️ แก้ไข${cfg.title}`;
  modal.bodyEl().innerHTML      = `<div class="loading"><div class="spinner"></div></div>`;
  modal.submitBtn().textContent = '💾 บันทึกการแก้ไข';
  modal.el().classList.remove('hidden');

  try {
    let item = state.cache[section]?.find(x => String(x[cfg.idField]) === String(id));
    if (!item) {
      const r = await apiFetch(`${cfg.listPath}/${id}`);
      item = r?.data || r;
    }
    modal.bodyEl().innerHTML = buildForm(cfg.formFields, item, 'edit');
  } catch (err) {
    modal.bodyEl().innerHTML = `<p style="color:var(--danger);padding:8px">⚠️ ${esc(err.message)}</p>`;
  }
}

function closeModal() {
  modal.el().classList.add('hidden');
  modal.section = null; modal.mode = null; modal.editId = null;
}

async function submitModal() {
  const { section, mode, editId } = modal;
  const cfg = SECTIONS[section];
  const form = modal.form();
  if (!form.reportValidity()) return;

  const fd = new FormData(form);
  const body = {};
  fd.forEach((v, k) => { if (v !== '') body[k] = v; });
  if (mode === 'create' && cfg.extraCreate) Object.assign(body, cfg.extraCreate);

  const btn = modal.submitBtn();
  btn.disabled = true; btn.textContent = '⏳ กำลังบันทึก...';

  try {
    if (mode === 'create') {
      await apiFetch(cfg.createPath, { method:'POST', body: JSON.stringify(body) });
      toast(`เพิ่ม${cfg.title}สำเร็จ ✅`, 'success');
    } else {
      await apiFetch(cfg.updatePath(editId), { method:'PUT', body: JSON.stringify(body) });
      toast(`แก้ไข${cfg.title}สำเร็จ ✅`, 'success');
    }
    closeModal();
    loadSection(section);
  } catch (err) {
    toast(`❌ ${err.message}`, 'error');
    btn.disabled = false;
    btn.textContent = mode === 'create' ? '💾 บันทึก' : '💾 บันทึกการแก้ไข';
  }
}

function buildForm(fields, data, mode) {
  return fields
    .filter(f => !(mode === 'edit' && f.createOnly))
    .map(f => {
      const val = (f.rk && data) ? (data[f.rk] ?? '') : '';
      const req = f.req ? '<span class="req">*</span>' : '';
      const hint = f.hint ? `<div style="font-size:11px;color:var(--muted);margin-top:3px">${esc(f.hint)}</div>` : '';

      if (f.type === 'select') {
        const opts = (f.options || []).map(o =>
          `<option value="${esc(o.v)}" ${String(val) === o.v ? 'selected' : ''}>${o.l}</option>`
        ).join('');
        return `<div class="form-group">
          <label class="form-label">${esc(f.label)}${req}</label>
          <select name="${esc(f.n)}" class="form-control" ${f.req ? 'required' : ''}>
            <option value="">— เลือก —</option>${opts}
          </select>${hint}</div>`;
      }
      return `<div class="form-group">
        <label class="form-label">${esc(f.label)}${req}</label>
        <input type="${f.type}" name="${esc(f.n)}" class="form-control"
          value="${esc(String(val))}" placeholder="${esc(f.label)}" ${f.req ? 'required' : ''}>
        ${hint}</div>`;
    }).join('');
}

/* =====================================================
   CONFIRM DELETE
   ===================================================== */
const del = { section: null, id: null };

function askDelete(section, id) {
  del.section = section; del.id = id;
  const cfg = SECTIONS[section];
  document.getElementById('confirmText').textContent =
    `คุณต้องการลบ "${cfg.title}" (ID: ${id.slice(0,10)}…) ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`;
  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = false; btn.textContent = '🗑️ ยืนยันการลบ';
  document.getElementById('confirmModal').classList.remove('hidden');
}

function closeConfirm() {
  document.getElementById('confirmModal').classList.add('hidden');
  del.section = null; del.id = null;
}

async function executeDelete() {
  const cfg = SECTIONS[del.section];
  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true; btn.textContent = '⏳ กำลังลบ...';
  try {
    await apiFetch(cfg.deletePath(del.id), { method:'DELETE' });
    toast(`ลบ${cfg.title}สำเร็จ`, 'success');
    closeConfirm();
    loadSection(del.section);
  } catch (err) {
    toast(`❌ ลบไม่สำเร็จ: ${err.message}`, 'error');
    btn.disabled = false; btn.textContent = '🗑️ ยืนยันการลบ';
  }
}

// Close on backdrop click
document.addEventListener('click', e => {
  if (e.target.id === 'crudModal')    closeModal();
  if (e.target.id === 'confirmModal') closeConfirm();
});

/* =====================================================
   HEALTH CHECK
   ===================================================== */
async function checkHealth() {
  try {
    await apiFetch('/health', {}, false);
    document.getElementById('healthBadge').style.display = 'flex';
  } catch {
    const hb = document.getElementById('healthBadge');
    hb.style.display = 'flex';
    hb.innerHTML = `<span class="health-dot" style="background:var(--danger);animation:none"></span> ออฟไลน์`;
    hb.style.cssText += 'background:#fef2f2;border-color:#fca5a5;color:#991b1b';
  }
}

/* =====================================================
   LOGOUT
   ===================================================== */
function logout() {
  if (!confirm('ต้องการออกจากระบบ?')) return;
  clearAuth();
  window.location.replace('login.html');
}

/* =====================================================
   INIT
   ===================================================== */
async function init() {
  if (!getToken()) { window.location.replace('login.html'); return; }

  // Try to restore user from localStorage first (instant)
  const saved = localStorage.getItem(USER_KEY);
  if (saved) {
    try {
      const u = JSON.parse(saved);
      setUserUI(u);
    } catch {}
  }

  // Fetch live user info
  try {
    const r = await apiFetch('/auth/me');
    const u = r?.data || r?.user || r;
    state.user = u;
    setUserUI(u);
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
  } catch {
    document.getElementById('userName').textContent = 'Admin';
    document.getElementById('userAvatar').textContent = 'A';
  }

  checkHealth();
  navigate('dashboard');
}

function setUserUI(u) {
  if (!u) return;
  const name = u.username || u.full_name || u.email || 'Admin';
  document.getElementById('userName').textContent  = name;
  document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('userRole').textContent   = u.role || 'admin';
}

window.addEventListener('DOMContentLoaded', init);

/* =====================================================
   EXPOSE GLOBALS (required for inline onclick in HTML
   when loaded as type="module")
   ===================================================== */
window.navigate       = navigate;
window.toggleSidebar  = toggleSidebar;
window.closeSidebar   = closeSidebar;
window.logout         = logout;
window.openCreate     = openCreate;
window.openEdit       = openEdit;
window.askDelete      = askDelete;
window.closeModal     = closeModal;
window.submitModal    = submitModal;
window.closeConfirm   = closeConfirm;
window.executeDelete  = executeDelete;
window.filterTable    = filterTable;
window.saveApiUrl     = saveApiUrl;
window.resetApiUrl    = resetApiUrl;
window.runHealthCheck = runHealthCheck;
window.loadSection    = loadSection;
window.renderDashboard = renderDashboard;
window.renderAnalytics = renderAnalytics;
