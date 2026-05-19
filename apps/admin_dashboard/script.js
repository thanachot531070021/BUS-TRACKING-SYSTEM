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
function forceLogout(reason = 'expired') {
  clearAuth();
  window.location.replace(`login.html?reason=${reason}`);
}

function scheduleTokenExpiry() {
  const token = getToken();
  if (!token) return;
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]));
    if (!exp) return;
    const msLeft = exp * 1000 - Date.now();
    if (msLeft <= 0) { forceLogout(); return; }
    setTimeout(() => forceLogout(), msLeft);
  } catch {}
}

async function apiFetch(path, opts = {}, auth = true) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await fetch(`${getApiBase()}${path}`, { ...opts, headers });
  if (res.status === 401) { forceLogout(); throw new Error('Session expired'); }
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
const state = {
  section: 'dashboard', user: null, adminType: null, zoneId: null, zoneLabel: null,
  cache: {}, filtered: {}, pagination: {}, _busDriverTab: 'buses',
};

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
    groupBy: item => {
      const labels = { passenger: '👤 ผู้โดยสาร', driver: '🚌 คนขับรถ', admin: '🛡️ Admin', super_admin: '⭐ Super Admin' };
      return labels[item.role] || item.role || 'ไม่ระบุบทบาท';
    },
    groupByWhen: () => state.adminType === 'super_admin',
    listPath:   '/admin/users',
    createPath: '/admin/users',
    updatePath: id => `/admin/users/${id}`,
    deletePath: id => `/admin/users/${id}`,
    idField: 'id',
    resetPassword: true,
    columns: [
      { key: 'id',        label: 'ID',           r: chip },
      { key: 'username',  label: 'Username',      bold: true },
      { key: 'full_name', label: 'ชื่อ-นามสกุล' },
      { key: 'email',     label: 'Email' },
      { key: 'role',      label: 'บทบาท',         r: (v, row) => roleBadge(v, row) },
      { key: 'status',    label: 'สถานะ',          r: statusBadge },
    ],
    formFields: [
      { n: 'username',     rk: 'username',     label: 'Username',      type: 'text',     req: true  },
      { n: 'email',        rk: 'email',        label: 'Email',          type: 'email',    req: true  },
      { n: 'fullName',     rk: 'full_name',    label: 'ชื่อ-นามสกุล',  type: 'text',     req: false },
      { n: 'phoneNumber',  rk: 'phone_number', label: 'เบอร์โทร',       type: 'text',     req: false },
      { n: 'password',     rk: null,           label: 'รหัสผ่าน',       type: 'password', req: false, createOnly: true },
      { n: 'role',      rk: 'role',      label: 'บทบาท',           type: 'select',   req: true,
        options: [
          { v: 'passenger',  l: '🧑 ผู้โดยสาร'  },
          { v: 'driver',     l: '🚌 คนขับรถ'    },
          { v: 'admin',      l: '👤 Admin'      },
          { v: 'super_admin', l: '⭐ Super Admin (สร้าง Admin record ให้อัตโนมัติ)' },
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

  zones: {
    title: 'โซน', icon: '🗺️',
    subtitle: 'จัดการโซนพื้นที่การให้บริการ',
    listPath:   '/admin/zones',
    createPath: '/admin/zones',
    updatePath: id => `/admin/zones/${id}`,
    deletePath: id => `/admin/zones/${id}`,
    idField: 'id',
    prefetch: ['/admin/provinces'],
    groupBy: item => item.province || 'ไม่ระบุจังหวัด',
    columns: [
      { key: 'zone_code',   label: 'รหัสโซน',     bold: true },
      { key: 'zone_name',   label: 'ชื่อโซน'  },
      { key: 'province',    label: 'จังหวัด',      r: v => v ? esc(v) : '—' },
      { key: 'description', label: 'รายละเอียด',   r: v => v ? esc(v) : '—' },
      { key: 'status',      label: 'สถานะ',         r: statusBadge },
      { key: 'created_by',  label: 'สร้างโดย',      r: (v, row) => row?.created_by_user ? esc(row.created_by_user.full_name || row.created_by_user.username || v) : (v ? chip(v) : '—') },
      { key: 'updated_by',  label: 'แก้ไขล่าสุดโดย', r: (v, row) => row?.updated_by_user ? esc(row.updated_by_user.full_name || row.updated_by_user.username || v) : (v ? chip(v) : '—') },
    ],
    formFields: [
      { n: 'zoneCode',    rk: 'zone_code',    label: 'รหัสโซน',     type: 'text', req: false },
      { n: 'zoneName',    rk: 'zone_name',    label: 'ชื่อโซน',      type: 'text', req: true  },
      { n: 'province', rk: 'province', label: 'จังหวัด', type: 'async-select', req: false,
        fetchPath: '/admin/provinces',
        labelFn: p => p.name_th,
        valueFn:  p => p.name_th,
      },
      { n: 'description', rk: 'description',  label: 'รายละเอียด',  type: 'text', req: false },
      { n: 'status',      rk: 'status',       label: 'สถานะ',        type: 'select', req: false,
        options: [{ v: 'active', l: '✅ ใช้งาน' }, { v: 'inactive', l: '⛔ ไม่ใช้งาน' }]
      },
    ],
  },

  drivers: {
    title: 'คนขับรถ', icon: '🚌',
    subtitle: 'จัดการข้อมูลคนขับรถโดยสาร',
    groupBy: item => {
      if (!item.assigned_route_id) return 'ยังไม่ได้กำหนดเส้นทาง';
      const routes = (_ssCache && _ssCache['/admin/routes']) || [];
      const r = routes.find(x => x.id === item.assigned_route_id);
      return r ? [r.route_code, r.route_name].filter(Boolean).join(' — ') : String(item.assigned_route_id);
    },
    listPath:   '/admin/drivers',
    createPath: '/admin/drivers/with-user',
    updatePath: id => `/admin/drivers/${id}`,
    deletePath: id => `/admin/drivers/${id}`,
    idField: 'id',
    withUserCreate: true,
    resetPassword: true,
    prefetch: ['/admin/routes', '/admin/buses'],
    columns: [
      { key: 'user',          label: 'ชื่อ',          r: (v,row) => v ? `<strong>${esc(v.full_name||v.username||'—')}</strong><br><small style="color:var(--muted)">${esc(v.email||'')}</small>` : chip(row.user_id) },
      { key: 'employee_code', label: 'รหัสพนักงาน',   bold: false },
      { key: 'license_no',    label: 'ใบขับขี่'       },
      { key: 'assigned_route_id', label: 'เส้นทาง',   r: v => lookupLabel('/admin/routes', v, r => [r.route_code, r.route_name].filter(Boolean).join(' — ')) },
      { key: 'user_id', label: 'ทะเบียนรถ', r: v => {
        if (!v) return '<span style="color:var(--muted)">—</span>';
        const buses = (_ssCache && _ssCache['/admin/buses']) || [];
        const bus = buses.find(b => String(b.driver_id) === String(v));
        return bus
          ? `<span style="font-weight:600;font-family:'JetBrains Mono',monospace;font-size:12.5px">${esc(bus.plate_number)}</span>`
          : '<span style="color:var(--muted)">—</span>';
      }},
      { key: 'status',        label: 'สถานะ',          r: statusBadge },
      { key: 'created_by', label: 'สร้างโดย', r: (v, row) => row?.created_by_user ? esc(row.created_by_user.full_name || row.created_by_user.username || v) : (v ? chip(v) : '—') },
      { key: 'updated_by', label: 'แก้ไขล่าสุดโดย', r: (v, row) => row?.updated_by_user ? esc(row.updated_by_user.full_name || row.updated_by_user.username || v) : (v ? chip(v) : '—') },
    ],
    formFields: [
      { n: 'fullName',    rk: 'full_name',    label: 'ชื่อ-นามสกุล', type: 'text',  req: false, fromUser: true },
      { n: 'email',       rk: 'email',        label: 'Email',         type: 'email', req: false, fromUser: true },
      { n: 'phoneNumber', rk: 'phone_number', label: 'เบอร์โทร',      type: 'text',  req: false, fromUser: true },
      { n: 'employeeCode',    rk: 'employee_code',    label: 'รหัสพนักงาน',     type: 'text', req: false },
      { n: 'licenseNo',       rk: 'license_no',       label: 'เลขที่ใบอนุญาต (กรมขนส่ง)', type: 'text', req: true },
      { n: 'licenseType',     rk: 'license_type',     label: 'ประเภทใบอนุญาต', type: 'select', req: false,
        options: [
          { v: 'public_car',        l: '🚗 รถยนต์สาธารณะ (แท็กซี่)' },
          { v: 'public_bus',        l: '🚌 รถโดยสาร (บัส)' },
          { v: 'public_motorcycle', l: '🏍️ รถจักรยานยนต์สาธารณะ (วิน)' },
        ]
      },
      { n: 'licenseIssueDate',  rk: 'license_issue_date',  label: 'วันออกบัตร',    type: 'date', req: false },
      { n: 'licenseExpiryDate', rk: 'license_expiry_date', label: 'วันหมดอายุ',    type: 'date', req: false },
      { n: 'dateOfBirth',       rk: 'date_of_birth',       label: 'วันเดือนปีเกิด', type: 'date', req: false },
      { n: 'address',           rk: 'address',             label: 'ที่อยู่',         type: 'text', req: false },
      { n: 'photoUrl',          rk: 'photo_url',           label: 'URL รูปถ่าย',    type: 'url',  req: false,
        hint: 'ลิงก์รูปถ่ายผู้ขับ (ขนาดมาตรฐาน)'
      },
      { n: 'assignedRouteId', rk: 'assigned_route_id', label: 'เส้นทาง', type: 'async-select', req: false,
        fetchPath: '/admin/routes',
        labelFn: r => [r.route_code, r.route_name].filter(Boolean).join(' — '),
        valueFn:  r => r.id,
      },
      { n: 'status', rk: 'status', label: 'สถานะ', type: 'select', req: false,
        options: [{ v: 'active', l: '✅ ใช้งาน' }, { v: 'inactive', l: '⛔ ไม่ใช้งาน' }]
      },
    ],
  },

  admins: {
    title: 'ผู้ดูแลระบบ', icon: '👤',
    subtitle: 'จัดการบัญชีผู้ดูแลระบบ',
    groupBy: item => {
      const labels = { super_admin: '⭐ Super Admin', zone_admin: '🗺️ Zone Admin' };
      return labels[item.admin_type] || item.admin_type || 'ไม่ระบุประเภท';
    },
    listPath:   '/admin/admins',
    createPath: '/admin/admins',
    updatePath: id => `/admin/admins/${id}`,
    deletePath: id => `/admin/admins/${id}`,
    idField: 'id',
    withUserCreate: true,
    resetPassword: true,
    prefetch: ['/admin/zones'],
    columns: [
      { key: 'user',       label: 'ชื่อ',        r: (v,row) => v ? `<strong>${esc(v.full_name||v.username||'—')}</strong><br><small style="color:var(--muted)">${esc(v.email||'')}</small>` : chip(row.user_id) },
      { key: 'admin_type', label: 'ประเภท',       r: adminTypeBadge },
      { key: 'zone_id',    label: 'โซน',          r: (v, row) => {
        const z = row?.zone;
        if (z) return `<span style="font-weight:500" title="${esc(v||'')}">${esc([z.zone_code, z.zone_name].filter(Boolean).join(' — '))}</span>`;
        return lookupLabel('/admin/zones', v, zz => [zz.zone_code, zz.zone_name].filter(Boolean).join(' — '));
      }},
      { key: 'status',     label: 'สถานะ',         r: statusBadge },
      { key: 'created_by', label: 'สร้างโดย', r: (v, row) => row?.created_by_user ? esc(row.created_by_user.full_name || row.created_by_user.username || v) : (v ? chip(v) : '—') },
      { key: 'updated_by', label: 'แก้ไขล่าสุดโดย', r: (v, row) => row?.updated_by_user ? esc(row.updated_by_user.full_name || row.updated_by_user.username || v) : (v ? chip(v) : '—') },
    ],
    formFields: [
      { n: 'adminType', rk: 'admin_type', label: 'ประเภท Admin', type: 'select', req: true,
        options: [
          { v: 'super_admin', l: '⭐ Super Admin' },
          { v: 'zone_admin',  l: '🗺️ Zone Admin'  },
        ]
      },
      { n: 'zoneId', rk: 'zone_id', label: 'โซน', type: 'async-select', req: false,
        fetchPath: '/admin/zones',
        labelFn: z => [z.zone_code, z.zone_name].filter(Boolean).join(' — '),
        valueFn:  z => z.id,
      },
      { n: 'avatarUrl', rk: 'avatar_url', label: 'URL รูปโปรไฟล์', type: 'url', req: false,
        hint: 'ลิงก์รูปโปรไฟล์ผู้ดูแลระบบ'
      },
      { n: 'status', rk: 'status', label: 'สถานะ', type: 'select', req: false,
        options: [{ v: 'active', l: '✅ ใช้งาน' }, { v: 'inactive', l: '⛔ ไม่ใช้งาน' }]
      },
    ],
  },

  routes: {
    title: 'เส้นทางรถ', icon: '🛣️',
    subtitle: 'จัดการเส้นทางการให้บริการ',
    groupBy: item => {
      const z = item.zone;
      return z ? [z.zone_code, z.zone_name].filter(Boolean).join(' — ') : (item.zone_id || 'ไม่ระบุโซน');
    },
    listPath:   '/admin/routes',
    createPath: '/admin/routes',
    updatePath: id => `/admin/routes/${id}`,
    deletePath: id => `/admin/routes/${id}`,
    idField: 'id',
    prefetch: ['/admin/zones'],
    columns: [
      { key: 'route_code',     label: 'รหัสเส้นทาง',  bold: true },
      { key: 'route_name',     label: 'ชื่อเส้นทาง'  },
      { key: 'start_location', label: 'จุดเริ่มต้น'  },
      { key: 'start_coords',  label: 'พิกัดเริ่ม',   r: v => v ? `<code style="font-size:11px">${esc(v)}</code>` : '—' },
      { key: 'end_location',  label: 'จุดสิ้นสุด'   },
      { key: 'end_coords',    label: 'พิกัดปลาย',    r: v => v ? `<code style="font-size:11px">${esc(v)}</code>` : '—' },
      { key: 'zone_id',        label: 'โซน',           r: (v, row) => {
        const z = row?.zone;
        if (z) return `<span style="font-weight:500" title="${esc(v||'')}">${esc([z.zone_code, z.zone_name].filter(Boolean).join(' — '))}</span>`;
        return lookupLabel('/admin/zones', v, zz => [zz.zone_code, zz.zone_name].filter(Boolean).join(' — '));
      }},
      { key: 'waypoints', label: 'เส้นทาง', r: v => {
        try { const n = v ? JSON.parse(v).length : 0; return n >= 2 ? `<span class="badge b-blue">${n} จุด</span>` : '<span style="color:#9ca3af">—</span>'; }
        catch { return '<span style="color:#9ca3af">—</span>'; }
      }},
      { key: 'status',         label: 'สถานะ',          r: statusBadge },
      { key: 'created_by', label: 'สร้างโดย', r: (v, row) => row?.created_by_user ? esc(row.created_by_user.full_name || row.created_by_user.username || v) : (v ? chip(v) : '—') },
      { key: 'updated_by', label: 'แก้ไขล่าสุดโดย', r: (v, row) => row?.updated_by_user ? esc(row.updated_by_user.full_name || row.updated_by_user.username || v) : (v ? chip(v) : '—') },
    ],
    extraRowBtns: item => `<button class="btn btn-icon btn-sm" style="background:#eff6ff;color:#2563eb;border:1.5px solid #bfdbfe" title="วาดเส้นทาง" data-wp-id="${esc(String(item.id))}">🗺️</button>`,
    formFields: [
      { n: 'zoneId', rk: 'zone_id', label: 'โซน', type: 'async-select', req: true,
        fetchPath: '/admin/zones',
        labelFn: z => [z.zone_code, z.zone_name].filter(Boolean).join(' — '),
        valueFn:  z => z.id,
      },
      { n: 'routeCode',     rk: 'route_code',     label: 'รหัสเส้นทาง',  type: 'text', req: true,
        hint: 'สร้างอัตโนมัติเมื่อเลือกโซน หรือกรอกเอง'
      },
      { n: 'routeName',     rk: 'route_name',     label: 'ชื่อเส้นทาง',   type: 'text', req: true  },
      { n: 'startLocation', rk: 'start_location', label: 'จุดเริ่มต้น (ชื่อ)', type: 'text', req: false },
      { n: 'startCoords',   rk: 'start_coords',   label: 'พิกัดจุดเริ่มต้น',  type: 'text', req: false, hint: 'เช่น 13.756331,100.501765' },
      { n: 'endLocation',   rk: 'end_location',   label: 'จุดสิ้นสุด (ชื่อ)', type: 'text', req: false },
      { n: 'endCoords',     rk: 'end_coords',     label: 'พิกัดจุดสิ้นสุด',   type: 'text', req: false, hint: 'เช่น 13.756331,100.501765' },
      { n: 'status', rk: 'status', label: 'สถานะ', type: 'select', req: false,
        options: [{ v: 'active', l: '✅ ใช้งาน' }, { v: 'inactive', l: '⛔ ไม่ใช้งาน' }]
      },
    ],
  },

  buses: {
    title: 'รถโดยสาร', icon: '🚍',
    subtitle: 'จัดการข้อมูลรถโดยสารทั้งหมด',
    groupBy: item => {
      if (!item.route_id) return 'ยังไม่ได้กำหนดเส้นทาง';
      const r = item.route;
      if (r) return [r.route_code, r.route_name].filter(Boolean).join(' — ');
      const routes = (_ssCache && _ssCache['/admin/routes']) || [];
      const cached = routes.find(x => x.id === item.route_id);
      return cached ? [cached.route_code, cached.route_name].filter(Boolean).join(' — ') : String(item.route_id);
    },
    listPath:   '/admin/buses',
    createPath: '/admin/buses',
    updatePath: id => `/admin/buses/${id}`,
    deletePath: id => `/admin/buses/${id}`,
    idField: 'id',
    prefetch: ['/admin/routes', '/admin/drivers'],
    columns: [
      { key: 'plate_number', label: 'ทะเบียนรถ',  bold: true },
      { key: 'route_id',     label: 'เส้นทาง',     r: (v, row) => {
        const r = row?.route;
        if (r) return `<span style="font-weight:500">${esc([r.route_code, r.route_name].filter(Boolean).join(' — '))}</span>`;
        if (!v) return '<span style="color:var(--muted)">—</span>';
        return lookupLabel('/admin/routes', v, rt => [rt.route_code, rt.route_name].filter(Boolean).join(' — '));
      }},
      { key: 'driver_id',    label: 'คนขับ',        r: (v, row) => {
        const u = row?.driver_user;
        if (u) return `<span style="font-weight:500">${esc(u.full_name || u.username || v)}</span>`;
        if (!v) return '<span style="color:var(--muted)">—</span>';
        const drivers = (_ssCache && _ssCache['/admin/drivers']) || [];
        const d = drivers.find(x => String(x.user_id) === String(v));
        if (d) return `<span style="font-weight:500">${esc(d.user?.full_name || d.user?.username || d.employee_code || v)}</span>`;
        return chip(v);
      }},
      { key: 'status',       label: 'สถานะ',         r: statusBadge },
      { key: 'created_by', label: 'สร้างโดย', r: (v, row) => row?.created_by_user ? esc(row.created_by_user.full_name || row.created_by_user.username || v) : (v ? chip(v) : '—') },
      { key: 'updated_by', label: 'แก้ไขล่าสุดโดย', r: (v, row) => row?.updated_by_user ? esc(row.updated_by_user.full_name || row.updated_by_user.username || v) : (v ? chip(v) : '—') },
    ],
    formFields: [
      { n: 'plateNumber', rk: 'plate_number', label: 'ทะเบียนรถ', type: 'text', req: true },
      { n: 'driverId', rk: 'driver_id', label: 'คนขับ', type: 'async-select', req: false,
        fetchPath: '/admin/drivers',
        labelFn: d => d.user ? (d.user.full_name || d.user.username || d.employee_code || d.id) : (d.employee_code || d.id),
        valueFn:  d => d.user_id,
        filterFn: driver => {
          const buses = state.cache['buses'] || [];
          const currentBusId = modal.mode === 'edit' ? modal.editId : null;
          const takenIds = new Set(
            buses.filter(b => !currentBusId || String(b.id) !== String(currentBusId))
                 .map(b => b.driver_id).filter(Boolean)
          );
          return !takenIds.has(driver.user_id);
        },
        onSelect: (_id, driver) => {
          const routeId = driver?.assigned_route_id || '';
          const hiddenEl = document.getElementById('f_route_hidden');
          const displayEl = document.getElementById('f_route_display');
          if (hiddenEl) hiddenEl.value = routeId;
          if (displayEl) {
            if (!routeId) {
              displayEl.textContent = '— คนขับนี้ยังไม่มีเส้นทาง —';
              displayEl.style.color = 'var(--muted)';
            } else {
              const routes = _ssCache['/admin/routes'] || [];
              const route = routes.find(r => r.id === routeId);
              displayEl.textContent = route
                ? [route.route_code, route.route_name].filter(Boolean).join(' — ')
                : routeId;
              displayEl.style.color = 'var(--text)';
            }
          }
        },
      },
      { n: 'routeId', rk: 'route_id', label: 'เส้นทาง', type: 'async-select', req: false,
        fetchPath: '/admin/routes',
        labelFn: r => [r.route_code, r.route_name].filter(Boolean).join(' — '),
        valueFn:  r => r.id,
        locked: true,
        placeholder: '— เลือกคนขับก่อน —',
      },
      { n: 'status', rk: 'status', label: 'สถานะ', type: 'select', req: false,
        options: [
          { v: 'off',         l: '⚫ ไม่ได้ใช้งาน' },
          { v: 'on',          l: '🟢 ให้บริการ'     },
          { v: 'maintenance', l: '🔧 ซ่อมบำรุง'     },
        ]
      },
    ],
  },

  busDriver: {
    title: 'รถและคนขับ', icon: '🚌',
    subtitle: 'จัดการรถโดยสารและคนขับรถ',
  },

  waiting: {
    title: 'รายการรอรับ', icon: '⏳',
    subtitle: 'ติดตามรายการผู้โดยสารที่รอรับ',
    listPath: '/admin/waiting',
    idField: 'id',
    readOnly: true,
    prefetch: ['/admin/users', '/admin/routes'],
    columns: [
      { key: 'id',         label: 'ID',         r: chip },
      { key: 'user_id',    label: 'ผู้โดยสาร',  r: v => lookupLabel('/admin/users', v, u => u.full_name || u.username || u.email || u.id) },
      { key: 'route_id',   label: 'เส้นทาง',    r: v => lookupLabel('/admin/routes', v, r => [r.route_code, r.route_name].filter(Boolean).join(' — ')) },
      { key: 'status',     label: 'สถานะ',       r: statusBadge },
      { key: 'lat',        label: 'Lat' },
      { key: 'lng',        label: 'Lng' },
      { key: 'created_at', label: 'เวลา',        r: fmtDate },
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

function lookupLabel(fetchPath, id, labelFn) {
  if (!id) return '<span style="color:var(--muted)">—</span>';
  const s = String(id);
  const items = _ssCache[fetchPath];
  if (!items) return chip(id); // ยังไม่ได้โหลด cache → fallback เป็น chip
  const found = items.find(i => String(i.id) === s);
  if (!found) return chip(id);
  return `<span style="font-weight:500" title="ID: ${esc(s)}">${esc(labelFn(found))}</span>`;
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('th-TH', { dateStyle:'short', timeStyle:'short' }); }
  catch { return String(d); }
}

function roleBadge(v, row) {
  // If user has admin_profile, show the specific admin type instead of generic 'admin'
  const adminProfile = Array.isArray(row?.admin_profile) ? row.admin_profile[0] : row?.admin_profile;
  if (v === 'admin' && adminProfile?.admin_type === 'super_admin') {
    return '<span class="badge b-red">⭐ Super Admin</span>';
  }
  if (v === 'admin' && adminProfile?.admin_type === 'zone_admin') {
    return '<span class="badge b-purple">🗺️ Zone Admin</span>';
  }
  const map = {
    passenger:  '<span class="badge b-blue">👤 ผู้โดยสาร</span>',
    driver:     '<span class="badge b-green">🚌 คนขับ</span>',
    admin:      '<span class="badge b-purple">👤 Admin</span>',
    super_admin:'<span class="badge b-red">⭐ Super Admin</span>',
  };
  return map[v] || `<span class="badge b-gray">${esc(v ?? '—')}</span>`;
}

function adminTypeBadge(v) {
  const map = {
    super_admin: '<span class="badge b-red">⭐ Super Admin</span>',
    zone_admin:  '<span class="badge b-purple">🗺️ Zone Admin</span>',
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
   ASYNC SEARCHABLE SELECT
   ===================================================== */
const _ssCache = {};

function ssToggle(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.classList.contains('open');
  document.querySelectorAll('.ss-container.open').forEach(c => c.classList.remove('open'));
  if (!isOpen) {
    el.classList.add('open');
    setTimeout(() => el.querySelector('.ss-search-input')?.focus(), 50);
  }
}

function ssFilter(id, q) {
  const el = document.getElementById(id);
  if (!el) return;
  const lq = q.toLowerCase();
  let any = false;
  el.querySelectorAll('.ss-option').forEach(opt => {
    const show = opt.textContent.toLowerCase().includes(lq);
    opt.classList.toggle('ss-hidden', !show);
    if (show) any = true;
  });
  let nr = el.querySelector('.ss-no-results');
  if (!any) {
    if (!nr) {
      nr = document.createElement('div');
      nr.className = 'ss-no-results';
      nr.textContent = 'ไม่พบข้อมูล';
      el.querySelector('.ss-options-list')?.appendChild(nr);
    }
  } else { nr?.remove(); }
}

async function initAsyncSelect(containerId, fetchPath, labelFn, valueFn, currentVal, onSelect = null, filterFn = null) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const listEl = el.querySelector('.ss-options-list');
  const hiddenEl = el.querySelector('input[type=hidden]');
  const triggerLabel = el.querySelector('.ss-trigger-label');
  if (!listEl) return;
  try {
    if (!_ssCache[fetchPath]) {
      const raw = await apiFetch(fetchPath);
      _ssCache[fetchPath] = extractList(raw);
    }
    const items = _ssCache[fetchPath];
    const visibleItems = filterFn ? items.filter(filterFn) : items;

    // Empty state — ไม่มีข้อมูลในรายการ
    if (visibleItems.length === 0) {
      listEl.innerHTML = `
        <div class="ss-option" data-value="">— เลือก —</div>
        <div class="ss-no-results" style="padding:14px;text-align:center;color:var(--muted)">
          📭 ไม่มีข้อมูล
        </div>`;
      triggerLabel.textContent = '— เลือก —';
      triggerLabel.classList.add('ph');
      listEl.querySelector('.ss-option')?.addEventListener('click', () => {
        if (hiddenEl) hiddenEl.value = '';
        triggerLabel.textContent = '— เลือก —';
        triggerLabel.classList.add('ph');
        el.classList.remove('open');
      });
      return;
    }

    listEl.innerHTML = `<div class="ss-option" data-value="">— เลือก —</div>` +
      visibleItems.map(item => {
        const v = String(valueFn(item));
        const l = esc(labelFn(item));
        const sel = v === String(currentVal ?? '') ? ' selected' : '';
        return `<div class="ss-option${sel}" data-value="${esc(v)}" title="${l}">${l}</div>`;
      }).join('');
    // Set label + hidden value for pre-selected value
    if (currentVal) {
      const found = items.find(i => String(valueFn(i)) === String(currentVal));
      if (found) {
        triggerLabel.textContent = labelFn(found);
        triggerLabel.classList.remove('ph');
        if (hiddenEl) hiddenEl.value = String(valueFn(found));
      } else { triggerLabel.textContent = '— เลือก —'; triggerLabel.classList.add('ph'); }
    } else { triggerLabel.textContent = '— เลือก —'; triggerLabel.classList.add('ph'); }
    // Click handlers
    listEl.querySelectorAll('.ss-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const v = opt.dataset.value;
        if (hiddenEl) hiddenEl.value = v;
        triggerLabel.textContent = v ? opt.textContent : '— เลือก —';
        triggerLabel.classList.toggle('ph', !v);
        listEl.querySelectorAll('.ss-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        el.classList.remove('open');
        el.querySelector('.ss-search-input').value = '';
        el.querySelectorAll('.ss-option').forEach(o => o.classList.remove('ss-hidden'));
        el.querySelector('.ss-no-results')?.remove();
        if (v && onSelect) {
          const item = items.find(i => String(valueFn(i)) === v);
          onSelect(v, item);
        }
      });
    });
  } catch (e) {
    if (triggerLabel) { triggerLabel.textContent = '⚠️ โหลดไม่ได้'; triggerLabel.classList.add('ph'); }
  }
}

function populateAsyncSelects(fields, data, defaults = {}) {
  (fields || []).filter(f => f.type === 'async-select').forEach(f => {
    // Zone Admin: zone_id rendered as static display ใน buildForm — ข้าม initAsyncSelect
    if (f.rk === 'zone_id' && state.adminType === 'zone_admin') return;
    // Locked fields are rendered as read-only display — skip initAsyncSelect
    if (f.locked) return;
    const currentVal = (f.rk && data) ? (data[f.rk] ?? '')
                     : (f.rk && defaults[f.rk] != null) ? defaults[f.rk]
                     : '';
    initAsyncSelect(`ss_${f.n}`, f.fetchPath, f.labelFn, f.valueFn, String(currentVal), f.onSelect || null, f.filterFn || null);
  });
}

/* =====================================================
   PAGINATION
   ===================================================== */
function getActiveSection() {
  return state.section;
}

function gotoPage(section, page) {
  const pg = state.pagination[section];
  if (!pg) return;
  const items = state.filtered[section] ?? state.cache[section] ?? [];
  const totalPages = Math.ceil(items.length / pg.pageSize) || 1;
  pg.page = Math.max(1, Math.min(page, totalPages));
  renderTable(section, items);
}

function changePageSize(section, size) {
  if (!state.pagination[section]) state.pagination[section] = { page: 1, pageSize: 25 };
  state.pagination[section].pageSize = Number(size);
  state.pagination[section].page = 1;
  gotoPage(section, 1);
}

function toggleGroup(headerRow) {
  const gid = headerRow.dataset.groupId;
  const section = headerRow.dataset.section;
  const key = headerRow.dataset.groupKey;
  const isCollapsed = headerRow.classList.toggle('is-collapsed');
  if (state.collapsedGroups?.[section]) state.collapsedGroups[section][key] = isCollapsed;
  const table = headerRow.closest('table');
  table.querySelectorAll(`tr[data-group-member="${gid}"]`).forEach(row => {
    row.classList.toggle('tbl-row-hidden', isCollapsed);
  });
}

function _reinjectBusDriverTabs() {
  const tab = state._busDriverTab || 'buses';
  const card = document.getElementById('mainContent')?.querySelector('.card');
  if (card && !card.querySelector('.tab-btns')) {
    card.insertAdjacentHTML('afterbegin', _busDriverTabsHtml(tab));
  }
}

function _busDriverTabsHtml(tab) {
  return `<div class="tab-btns" style="display:flex;gap:8px;margin-bottom:16px">
    <button class="btn ${tab==='buses'?'btn-primary':'btn-secondary'}" onclick="renderBusDriver('buses')">🚍 รถโดยสาร</button>
    <button class="btn ${tab==='drivers'?'btn-primary':'btn-secondary'}" onclick="renderBusDriver('drivers')">🧑‍✈️ คนขับรถ</button>
  </div>`;
}

/* =====================================================
   ALERT DIALOG (centered popup for save errors)
   ===================================================== */
function alertDialog(msg, title = 'เกิดข้อผิดพลาด') {
  document.getElementById('_alertDialog')?.remove();
  if (!document.getElementById('_alertDialogStyle')) {
    const s = document.createElement('style');
    s.id = '_alertDialogStyle';
    s.textContent = '@keyframes _adBg{from{opacity:0}to{opacity:1}}@keyframes _adBox{from{transform:scale(.88) translateY(24px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}';
    document.head.appendChild(s);
  }
  const isEmail = /email|อีเมล/i.test(msg);
  const iconBg = isEmail ? '#fef3c7' : '#fef2f2';
  const icon   = isEmail ? '📧' : '❌';
  const btnClr = isEmail ? '#f59e0b' : '#ef4444';
  const btnShd = isEmail ? 'rgba(245,158,11,.35)' : 'rgba(239,68,68,.35)';

  const el = document.createElement('div');
  el.id = '_alertDialog';
  el.style.cssText = 'position:fixed;inset:0;z-index:199999;background:rgba(15,23,42,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px;animation:_adBg .2s ease';
  el.innerHTML = `
    <div style="background:#fff;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25),0 0 0 1px rgba(0,0,0,.04);padding:32px 28px 28px;max-width:400px;width:100%;text-align:center;animation:_adBox .28s cubic-bezier(.34,1.56,.64,1)">
      <div style="width:68px;height:68px;border-radius:50%;background:${iconBg};display:flex;align-items:center;justify-content:center;margin:0 auto 18px;font-size:32px;box-shadow:0 4px 16px rgba(0,0,0,.08)">${icon}</div>
      <div style="font-size:17px;font-weight:700;color:#1e293b;margin-bottom:8px;line-height:1.3">${esc(title)}</div>
      <div style="font-size:13.5px;color:#64748b;line-height:1.7;margin-bottom:24px">${esc(msg)}</div>
      <button id="_alertOkBtn" style="padding:11px 40px;background:${btnClr};color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px ${btnShd}">ตกลง</button>
    </div>`;
  el.querySelector('#_alertOkBtn').addEventListener('click', () => el.remove());
  el.addEventListener('click', e => { if (e.target === el) el.remove(); });
  document.body.appendChild(el);
  setTimeout(() => el.querySelector('#_alertOkBtn')?.focus(), 50);
}

/* =====================================================
   RESET PASSWORD MODAL
   ===================================================== */
function openResetPasswordModal(section, itemId) {
  let userId, displayName;
  if (section === 'users') {
    userId = itemId;
    const item = (state.cache['users'] || []).find(x => String(x.id) === String(itemId));
    displayName = item?.username || item?.full_name || item?.email || itemId;
  } else {
    const item = (state.cache[section] || []).find(x => String(x.id) === String(itemId));
    userId = item?.user_id;
    displayName = item?.user?.full_name || item?.user?.username || item?.user?.email || itemId;
  }
  if (!userId) { toast('ไม่พบข้อมูล User', 'error'); return; }

  document.getElementById('_resetPwDialog')?.remove();
  if (!document.getElementById('_alertDialogStyle')) {
    const s = document.createElement('style');
    s.id = '_alertDialogStyle';
    s.textContent = '@keyframes _adBg{from{opacity:0}to{opacity:1}}@keyframes _adBox{from{transform:scale(.88) translateY(24px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}';
    document.head.appendChild(s);
  }

  const el = document.createElement('div');
  el.id = '_resetPwDialog';
  el.style.cssText = 'position:fixed;inset:0;z-index:199999;background:rgba(15,23,42,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px;animation:_adBg .2s ease';
  el.innerHTML = `
    <div style="background:#fff;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25),0 0 0 1px rgba(0,0,0,.04);padding:32px 28px 28px;max-width:400px;width:100%;animation:_adBox .28s cubic-bezier(.34,1.56,.64,1)">
      <div style="text-align:center;margin-bottom:22px">
        <div style="width:62px;height:62px;border-radius:50%;background:#eff6ff;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:28px;box-shadow:0 4px 16px rgba(0,0,0,.08)">🔑</div>
        <div style="font-size:17px;font-weight:700;color:#1e293b;margin-bottom:4px">Reset Password</div>
        <div style="font-size:13px;color:#64748b">${esc(displayName)}</div>
      </div>
      <div style="margin-bottom:20px">
        <label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:6px">รหัสผ่านใหม่ <span style="color:#ef4444">*</span></label>
        <div style="position:relative">
          <input id="_resetPwInput" type="password" placeholder="อย่างน้อย 6 ตัวอักษร" autocomplete="new-password"
            style="width:100%;padding:10px 40px 10px 12px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box;transition:border-color .15s"
            oninput="this.style.borderColor=this.value.length>=6?'#10b981':'#e5e7eb'">
          <button type="button" onclick="var i=document.getElementById('_resetPwInput');i.type=i.type==='password'?'text':'password';this.textContent=i.type==='password'?'👁️':'🙈'"
            style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;padding:2px">👁️</button>
        </div>
      </div>
      <div style="display:flex;gap:10px">
        <button onclick="document.getElementById('_resetPwDialog')?.remove()"
          style="flex:1;padding:11px;border:1.5px solid #e5e7eb;border-radius:10px;background:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;color:#64748b">
          ยกเลิก
        </button>
        <button id="_resetPwSubmit"
          style="flex:2;padding:11px;background:#3b82f6;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(59,130,246,.35)">
          🔑 Reset Password
        </button>
      </div>
    </div>`;

  el.addEventListener('click', e => { if (e.target === el) el.remove(); });
  el.querySelector('#_resetPwSubmit').addEventListener('click', async () => {
    const newPassword = document.getElementById('_resetPwInput')?.value?.trim();
    if (!newPassword || newPassword.length < 6) {
      toast('กรุณากรอกรหัสผ่านอย่างน้อย 6 ตัวอักษร', 'warning');
      return;
    }
    const btn = el.querySelector('#_resetPwSubmit');
    btn.disabled = true; btn.textContent = '⏳ กำลัง Reset...';
    try {
      await apiFetch(`/admin/users/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
      el.remove();
      toast(`Reset password ของ ${displayName} สำเร็จ ✅`, 'success');
      loadSection(section);
    } catch (err) {
      alertDialog(err.message || 'ไม่สามารถ reset password ได้', 'Reset ไม่สำเร็จ');
    } finally {
      if (el.parentElement) { btn.disabled = false; btn.textContent = '🔑 Reset Password'; }
    }
  });

  document.body.appendChild(el);
  setTimeout(() => document.getElementById('_resetPwInput')?.focus(), 50);
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

const SECTION_ICONS_SVG = {
  dashboard: `<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>`,
  analytics: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
  zones:     `<polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="15.5"/><line x1="22" y1="8.5" x2="12" y2="15.5"/><line x1="2" y1="8.5" x2="12" y2="15.5"/>`,
  users:     `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  admins:    `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>`,
  routes:    `<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>`,
  drivers:   `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>`,
  buses:     `<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>`,
  waiting:   `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
  settings:  `<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>`,
};

function _sectionSvg(section, size = 19, stroke = 1.75) {
  const paths = SECTION_ICONS_SVG[section] || SECTION_ICONS_SVG.dashboard;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function toggleCollapse() {
  const sidebar = document.getElementById('sidebar');
  const btn     = document.getElementById('collapseBtn');
  const collapsed = sidebar.classList.toggle('collapsed');
  if (btn) btn.innerHTML = collapsed
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/></svg>`;
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
  document.getElementById('pageTitle').textContent    = cfg.title;
  document.getElementById('pageSubtitle').textContent = cfg.subtitle;
  const tile = document.getElementById('topbarPageTile');
  if (tile) tile.innerHTML = _sectionSvg(section, 22, 1.75);
  // Auto-close sidebar on mobile after navigation
  if (window.innerWidth <= 900) closeSidebar();
  return loadSection(section);
}

/* =====================================================
   LOAD SECTION
   ===================================================== */
async function loadSection(section) {
  const content = document.getElementById('mainContent');

  if (section === 'dashboard') return renderDashboard();
  if (section === 'analytics') return renderAnalytics();
  if (section === 'settings')  return renderSettings();
  if (section === 'busDriver') return renderBusDriver('drivers');

  const cfg = SECTIONS[section];
  if (!cfg?.listPath) return;
  content.innerHTML = `<div class="card"><div class="loading"><div class="spinner"></div> กำลังโหลดข้อมูล...</div></div>`;

  try {
    // Fetch main list + pre-fetch related data (for lookupLabel) แบบ parallel
    // กรอง path ที่ยังไม่มี cache หรือ cache ว่าง (ป้องกัน empty-array ที่ผิดพลาด)
    const prefetchPaths = (cfg.prefetch || []).filter(p => !_ssCache[p] || _ssCache[p].length === 0);
    const [raw] = await Promise.all([
      apiFetch(cfg.listPath),
      ...prefetchPaths.map(path =>
        apiFetch(path)
          .then(r => {
            const items = extractList(r);
            if (items.length > 0) _ssCache[path] = items; // เก็บเฉพาะข้อมูลที่มีจริง
          })
          .catch(() => {}) // silent fail — ไม่บล็อก main list
      ),
    ]);
    const items = extractList(raw);
    state.cache[section] = items;
    state.filtered[section] = items;
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
   RENDER TABLE (with pagination)
   ===================================================== */
function renderTable(section, allItems) {
  const content = document.getElementById('mainContent');
  const cfg     = SECTIONS[section];
  const ro      = !!cfg.readOnly;
  const noEdit  = !!cfg.noEdit;
  const colCount = cfg.columns.length + (ro ? 0 : 1);

  // Pagination state
  if (!state.pagination[section]) state.pagination[section] = { page: 1, pageSize: 25 };
  const pg = state.pagination[section];
  const effectiveGroupBy = cfg.groupBy && (!cfg.groupByWhen || cfg.groupByWhen()) ? cfg.groupBy : null;
  const sortedItems = effectiveGroupBy
    ? [...allItems].sort((a, b) => {
        const ka = effectiveGroupBy(a), kb = effectiveGroupBy(b);
        return ka < kb ? -1 : ka > kb ? 1 : 0;
      })
    : allItems;
  const total = sortedItems.length;
  const totalPages = Math.ceil(total / pg.pageSize) || 1;
  pg.page = Math.max(1, Math.min(pg.page, totalPages));
  const start = (pg.page - 1) * pg.pageSize;
  const items = sortedItems.slice(start, start + pg.pageSize);

  const renderItemCells = item => {
    const id = item[cfg.idField];
    let cells = cfg.columns.map(col => {
      const v = item[col.key];
      const html = col.r ? col.r(v, item) : (v != null ? esc(String(v)) : '—');
      return `<td>${col.bold ? `<strong>${html}</strong>` : html}</td>`;
    }).join('');
    if (!ro) {
      cells += `<td><div class="td-actions">
        ${!noEdit ? `<button class="btn btn-warning btn-icon btn-sm" title="แก้ไข" onclick="openEdit('${section}','${esc(String(id))}')">✏️</button>` : ''}
        ${cfg.resetPassword ? `<button class="btn btn-icon btn-sm" title="Reset Password" style="background:#eff6ff;color:#3b82f6;border:1.5px solid #bfdbfe" onclick="openResetPasswordModal('${section}','${esc(String(id))}')">🔑</button>` : ''}
        ${cfg.extraRowBtns ? cfg.extraRowBtns(item) : ''}
        <button class="btn btn-danger btn-icon btn-sm" title="ลบ" onclick="askDelete('${section}','${esc(String(id))}')">🗑️</button>
      </div></td>`;
    }
    return cells;
  };

  let rows = '';
  if (!total) {
    rows = `<tr><td colspan="${colCount}" style="text-align:center;padding:44px;color:var(--muted)">
      <div style="font-size:34px;margin-bottom:10px">📭</div>ยังไม่มีข้อมูล
    </td></tr>`;
  } else if (effectiveGroupBy) {
    const groupMap = new Map();
    for (const item of sortedItems) {
      const key = effectiveGroupBy(item);
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key).push(item);
    }
    const groupKeyList = [...groupMap.keys()];
    if (!state.collapsedGroups) state.collapsedGroups = {};
    if (!state.collapsedGroups[section]) state.collapsedGroups[section] = {};
    rows = '';
    let lastGroup = null;
    for (const item of items) {
      const key = effectiveGroupBy(item);
      if (key !== lastGroup) {
        const groupCount = groupMap.get(key)?.length ?? 0;
        const gid = groupKeyList.indexOf(key);
        const isCollapsed = !!state.collapsedGroups[section][key];
        rows += `<tr class="tbl-group-header${isCollapsed ? ' is-collapsed' : ''}" data-group-id="${gid}" data-section="${section}" data-group-key="${esc(key)}" onclick="toggleGroup(this)">
          <td colspan="${colCount}"><div class="tbl-group-inner">
            <span class="tbl-group-chevron"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
            <span class="tbl-group-label">${esc(key)}</span>
            <span class="tbl-group-count">${groupCount} รายการ</span>
          </div></td>
        </tr>`;
        lastGroup = key;
      }
      const gid = groupKeyList.indexOf(key);
      const isCollapsed = !!state.collapsedGroups[section][key];
      rows += `<tr data-group-member="${gid}"${isCollapsed ? ' class="tbl-row-hidden"' : ''}>${renderItemCells(item)}</tr>`;
    }
  } else {
    rows = items.map(item => `<tr>${renderItemCells(item)}</tr>`).join('');
  }

  // Pagination bar
  const pgBar = total > 0 ? `
    <div class="pg-bar">
      <div class="pg-info">แสดง ${start+1}–${Math.min(start+pg.pageSize, total)} จาก ${total} รายการ</div>
      <div class="pg-controls">
        <select class="pg-size" onchange="changePageSize('${section}',this.value)">
          ${[10,25,50,100].map(n=>`<option value="${n}"${pg.pageSize===n?' selected':''}>${n} ต่อหน้า</option>`).join('')}
        </select>
        <button class="pg-btn" onclick="gotoPage('${section}',1)" ${pg.page<=1?'disabled':''}>«</button>
        <button class="pg-btn" onclick="gotoPage('${section}',${pg.page-1})" ${pg.page<=1?'disabled':''}>‹</button>
        <span class="pg-cur">หน้า ${pg.page} / ${totalPages}</span>
        <button class="pg-btn" onclick="gotoPage('${section}',${pg.page+1})" ${pg.page>=totalPages?'disabled':''}>›</button>
        <button class="pg-btn" onclick="gotoPage('${section}',${totalPages})" ${pg.page>=totalPages?'disabled':''}>»</button>
      </div>
    </div>` : '';

  // Preserve existing search value if re-rendering
  const prevSearch = document.getElementById('searchInput')?.value || '';

  content.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          ${cfg.icon} ${cfg.title}
          <span class="badge b-gray" style="margin-left:6px">${total} รายการ</span>
        </div>
        <div class="toolbar">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input id="searchInput" type="text" class="form-control"
              placeholder="ค้นหา..." value="${esc(prevSearch)}" oninput="filterTable()" autocomplete="off">
          </div>
          ${!ro ? (cfg.withUserCreate
            ? `<button class="btn btn-primary" onclick="openWithUserModal('${section}')">＋ เพิ่มรายการ</button>`
            : cfg.assignAdminCreate
            ? `<button class="btn btn-primary" onclick="openAssignAdminModal()">＋ เพิ่มรายการ</button>`
            : `<button class="btn btn-primary" onclick="openCreate('${section}')">＋ เพิ่มรายการ</button>`) : ''}
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
      ${pgBar}
    </div>`;
}

function filterTable() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const section = getActiveSection();
  const allItems = state.cache[section] || [];
  state.filtered[section] = q
    ? allItems.filter(item => JSON.stringify(item).toLowerCase().includes(q))
    : allItems;
  if (state.pagination[section]) state.pagination[section].page = 1;
  renderTable(section, state.filtered[section]);
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
    const isZone = s.zone_scoped || state.adminType === 'zone_admin';

    const scopeLabel = isZone
      ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:10px 16px;background:var(--bg);border-radius:10px;border:1px solid var(--border)">
          <span style="font-size:18px">🗺️</span>
          <span style="font-weight:600;color:var(--primary)">โซนของคุณ: ${esc(state.zoneLabel || state.zoneId || '—')}</span>
          <span style="font-size:12px;color:var(--muted);margin-left:4px">ข้อมูลแสดงเฉพาะในโซนนี้</span>
        </div>`
      : '';

    const cards = [
      { icon:'🛣️', cls:'si-blue',   val: s.total_routes   ?? '—', label: isZone ? 'เส้นทางในโซน'      : 'เส้นทางทั้งหมด'    },
      { icon:'🚍', cls:'si-green',  val: s.total_buses    ?? '—', label: isZone ? 'รถในโซน'           : 'รถโดยสารทั้งหมด'  },
      { icon:'🟢', cls:'si-yellow', val: s.active_buses   ?? '—', label:'รถที่ออกให้บริการ'                                  },
      { icon:'🚌', cls:'si-purple', val: s.total_drivers  ?? '—', label: isZone ? 'คนขับในโซน'         : 'คนขับทั้งหมด'      },
      ...(!isZone ? [{ icon:'👥', cls:'si-indigo', val: s.total_users ?? '—', label:'ผู้ใช้งานทั้งหมด' }] : []),
      { icon:'⏳', cls:'si-red',    val: s.waiting_count  ?? '—', label: isZone ? 'รอรับในโซน'         : 'รายการรอรับทั้งหมด' },
      { icon:'👤', cls:'si-teal',   val: s.total_admins   ?? '—', label: isZone ? 'Admin ในโซน'        : 'Admin ทั้งหมด'     },
    ];

    content.innerHTML = `
      ${scopeLabel}
      <div class="stats-grid">
        ${cards.map(c => `
          <div class="stat-card">
            <div class="stat-icon ${c.cls}">${c.icon}</div>
            <div>
              <div class="stat-value">${c.val}</div>
              <div class="stat-label">${c.label}</div>
            </div>
          </div>`).join('')}
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
  if (state.adminType === 'zone_admin') { renderZoneAnalytics(); return; }
  renderGlobalAnalytics();
}

async function renderZoneAnalytics() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div class="card"><div class="loading"><div class="spinner"></div> กำลังโหลด...</div></div>`;
  try {
    const [sumRaw, routesRaw, busesRaw] = await Promise.all([
      apiFetch('/admin/summary'),
      apiFetch('/admin/routes'),
      apiFetch('/admin/buses'),
    ]);
    const s      = sumRaw?.data || {};
    const routes = extractList(routesRaw);
    const buses  = extractList(busesRaw);

    const busByRoute = {};
    for (const b of buses) {
      if (!busByRoute[b.route_id]) busByRoute[b.route_id] = { total: 0, active: 0 };
      busByRoute[b.route_id].total++;
      if (b.status === 'on') busByRoute[b.route_id].active++;
    }

    content.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:10px 16px;background:var(--bg);border-radius:10px;border:1px solid var(--border)">
        <span style="font-size:18px">🗺️</span>
        <span style="font-weight:600;color:var(--primary)">Analytics โซนของคุณ: ${esc(state.zoneLabel || state.zoneId || '—')}</span>
        <button class="btn btn-secondary btn-sm" style="margin-left:auto" onclick="renderAnalytics()">🔄 รีเฟรช</button>
      </div>

      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card"><div class="stat-icon si-blue">🛣️</div><div><div class="stat-value">${s.total_routes ?? '—'}</div><div class="stat-label">เส้นทางในโซน</div></div></div>
        <div class="stat-card"><div class="stat-icon si-green">🚍</div><div><div class="stat-value">${s.total_buses ?? '—'}</div><div class="stat-label">รถในโซน</div></div></div>
        <div class="stat-card"><div class="stat-icon si-yellow">🟢</div><div><div class="stat-value">${s.active_buses ?? '—'}</div><div class="stat-label">รถออกให้บริการ</div></div></div>
        <div class="stat-card"><div class="stat-icon si-purple">🚌</div><div><div class="stat-value">${s.total_drivers ?? '—'}</div><div class="stat-label">คนขับในโซน</div></div></div>
        <div class="stat-card"><div class="stat-icon si-red">⏳</div><div><div class="stat-value">${s.waiting_count ?? '—'}</div><div class="stat-label">รอรับในโซน</div></div></div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">🛣️ เส้นทางในโซน</div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>รหัส</th><th>ชื่อเส้นทาง</th><th>จุดเริ่มต้น</th><th>จุดสิ้นสุด</th><th>รถทั้งหมด</th><th>รถที่วิ่ง</th><th>สถานะ</th></tr></thead>
            <tbody>
              ${routes.length
                ? routes.map(r => {
                    const bInfo = busByRoute[r.id] || { total: 0, active: 0 };
                    return `<tr>
                      <td><code>${esc(r.route_code || '—')}</code></td>
                      <td>${esc(r.route_name || '—')}</td>
                      <td>${esc(r.start_location || '—')}</td>
                      <td>${esc(r.end_location || '—')}</td>
                      <td style="text-align:center">${bInfo.total}</td>
                      <td style="text-align:center">${bInfo.active > 0 ? `<span style="color:#10b981;font-weight:600">${bInfo.active}</span>` : '0'}</td>
                      <td>${statusBadge(r.status)}</td>
                    </tr>`;
                  }).join('')
                : `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)"><div style="font-size:36px;margin-bottom:10px">📭</div>ยังไม่มีเส้นทาง</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>`;
  } catch (err) {
    content.innerHTML = errCard('analytics', err.message);
  }
}

async function renderGlobalAnalytics() {
  destroyCharts();
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div class="card"><div class="loading"><div class="spinner"></div> กำลังโหลด Analytics...</div></div>`;

  try {
    const raw = await apiFetch('/admin/analytics?days=7');
    const d = raw?.data || {};

    const totalToday  = d.total_today ?? 0;
    const totalWeek   = d.total_week  ?? 0;
    const bySource    = d.by_source      || [];
    const byPlatform  = d.by_platform    || [];
    const byDevice    = d.by_device_type || [];
    const daily       = d.daily_counts   || [];
    const recent      = d.recent         || [];

    const webCount    = bySource.find(s => s.name === 'web_admin')?.count  ?? 0;
    const mobileCount = bySource.find(s => s.name === 'mobile_app')?.count ?? 0;
    const uniqueUsers = new Set(recent.filter(e => e.user_id).map(e => e.user_id)).size;

    function sourceBadge(s) {
      return s === 'web_admin'
        ? '<span class="badge b-blue">🌐 Web Admin</span>'
        : '<span class="badge b-green">📱 Mobile App</span>';
    }

    content.innerHTML = `
      <!-- Stat cards -->
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-icon si-blue">🔑</div>
          <div><div class="stat-value">${totalToday}</div><div class="stat-label">Login วันนี้</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon si-indigo">📊</div>
          <div><div class="stat-value">${totalWeek}</div><div class="stat-label">Login 7 วัน</div></div>
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
            <div class="card-title">📅 Login รายวัน (7 วัน)</div>
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
          <div class="card-header"><div class="card-title">📲 ประเภทอุปกรณ์</div></div>
          <div class="card-body" style="display:flex;align-items:center;justify-content:center;padding:16px">
            <canvas id="chartDevice" style="max-height:180px"></canvas>
          </div>
        </div>
      </div>

      <!-- Recent logins table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">🕐 Login ล่าสุด (1 ครั้ง/user/วัน)</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>เวลา</th><th>Channel</th><th>Platform</th><th>Device</th><th>User ID</th><th>IP</th>
            </tr></thead>
            <tbody>
              ${recent.length
                ? recent.map(e => `<tr>
                    <td>${fmtDate(e.created_at)}</td>
                    <td>${sourceBadge(e.source)}</td>
                    <td>${esc(e.platform || '—')}</td>
                    <td>${esc(e.device_type || '—')}</td>
                    <td>${e.user_id ? chip(e.user_id) : '<span class="text-muted">—</span>'}</td>
                    <td><code style="font-size:11px">${esc(e.ip_hint || '—')}</code></td>
                  </tr>`).join('')
                : `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--muted)">
                    <div style="font-size:36px;margin-bottom:10px">📭</div>ยังไม่มีข้อมูล Login
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
          label: 'Login',
          data: daily.map(d => d.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.12)',
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
          label: 'Login',
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

    // 4. Device doughnut
    const devColors = ['#f59e0b','#06b6d4','#10b981'];
    makeChart('chartDevice', {
      type: 'doughnut',
      data: {
        labels: byDevice.map(dv => dv.name),
        datasets: [{
          data: byDevice.map(dv => dv.count),
          backgroundColor: devColors,
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
   TRACK DAILY SESSION
   เช็ค localStorage ก่อน — ถ้าวันนี้ยิงไปแล้วก็ไม่ยิงซ้ำ
   ใช้สำหรับ session ที่ค้างข้ามวัน (ไม่ได้ login ใหม่)
   ===================================================== */
function trackDailySession() {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const stored = localStorage.getItem('analytics_day');
    if (stored === today) return; // already tracked today — skip
    trackEvent('login', 'session_resume');
    localStorage.setItem('analytics_day', today);
  } catch {}
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

async function openCreate(section) {
  const cfg = SECTIONS[section];
  modal.section = section; modal.mode = 'create'; modal.editId = null;
  modal.titleEl().textContent = `➕ เพิ่ม${cfg.title}`;

  // Routes + zone_admin: pre-fetch zones so buildForm can show zone name (not UUID)
  if (section === 'routes' && state.adminType === 'zone_admin' && state.zoneId) {
    if (!_ssCache['/admin/zones'] || !_ssCache['/admin/zones'].length) {
      try {
        const raw = await apiFetch('/admin/zones');
        _ssCache['/admin/zones'] = extractList(raw);
      } catch (_) {}
    }
    // Update zoneLabel from fresh cache if it was missing
    if (!state.zoneLabel) {
      const z = (_ssCache['/admin/zones'] || []).find(z => z.id === state.zoneId);
      if (z) state.zoneLabel = [z.zone_code, z.zone_name].filter(Boolean).join(' — ');
    }
  }

  // Zone Admin: ใส่ zoneId เป็น default อัตโนมัติ
  const defaults = (state.adminType === 'zone_admin' && state.zoneId)
    ? { zone_id: state.zoneId } : {};

  modal.bodyEl().innerHTML    = buildForm(cfg.formFields, null, 'create', defaults);
  modal.submitBtn().textContent = '💾 บันทึก';
  modal.submitBtn().disabled  = false;
  modal.submitBtn().onclick   = submitModal;
  modal.el().classList.remove('hidden');

  // Routes + super_admin: exclude zone from populateAsyncSelects to avoid race condition
  // (we'll init zone SS ourselves below with the onSelect callback)
  const fieldsForPopulate = (section === 'routes' && state.adminType !== 'zone_admin')
    ? cfg.formFields.filter(f => !(f.type === 'async-select' && f.rk === 'zone_id'))
    : cfg.formFields;
  populateAsyncSelects(fieldsForPopulate, null, defaults);

  // Zone Admin: ล็อค zone dropdown ไม่ให้เปลี่ยน
  if (state.adminType === 'zone_admin' && state.zoneId) {
    const trigger = document.querySelector('#ss_zoneId .ss-trigger');
    if (trigger) {
      trigger.style.pointerEvents = 'none';
      trigger.style.background    = 'var(--bg)';
      trigger.title = 'โซนถูกกำหนดจากบัญชีของคุณ';
    }
  }

  // Routes: auto-generate routeCode from zone_code
  if (section === 'routes') {
    const codeInput = document.getElementById('f_routeCode');
    if (state.adminType === 'zone_admin' && state.zoneId) {
      // zone_admin: cache is already warm (pre-fetched above)
      const zones = _ssCache['/admin/zones'] || [];
      const zone  = zones.find(z => z.id === state.zoneId);
      // Fallback: extract zone_code from state.zoneLabel (e.g. "CM001 — เชียงใหม่" → "CM001")
      const zoneCode = zone?.zone_code || (state.zoneLabel ? state.zoneLabel.split(' — ')[0].trim() : '');
      if (codeInput && !codeInput.value) {
        codeInput.value = genRouteCode(zoneCode);
      }
    } else {
      // super_admin: init zone SS with onSelect → auto-fill routeCode
      // (populateAsyncSelects skipped zone above, so no race condition)
      initAsyncSelect('ss_zoneId', '/admin/zones',
        z => [z.zone_code, z.zone_name].filter(Boolean).join(' — '),
        z => z.id, '',
        (_zoneId, zone) => {
          const inp = document.getElementById('f_routeCode');
          if (inp) inp.value = genRouteCode(zone?.zone_code || '');
        });
    }
    // Add regenerate button next to routeCode field
    const codeGroup = codeInput?.closest('.form-group');
    if (codeGroup && !codeGroup.querySelector('.btn-regen')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary btn-sm btn-regen';
      btn.style.marginTop = '6px';
      btn.textContent = '🔄 สุ่มรหัสใหม่';
      btn.onclick = () => {
        const zoneId  = state.zoneId || document.querySelector('#ss_zoneId input[type=hidden]')?.value;
        const zones   = _ssCache['/admin/zones'] || [];
        const zone    = zones.find(z => z.id === zoneId);
        const zCode   = zone?.zone_code || (state.zoneLabel ? state.zoneLabel.split(' — ')[0].trim() : '');
        const inp     = document.getElementById('f_routeCode');
        if (inp) inp.value = genRouteCode(zCode);
      };
      codeGroup.appendChild(btn);
    }
  }
}

async function openEdit(section, id) {
  const cfg = SECTIONS[section];
  modal.section = section; modal.mode = 'edit'; modal.editId = id;
  modal.titleEl().textContent   = `✏️ แก้ไข${cfg.title}`;
  modal.bodyEl().innerHTML      = `<div class="loading"><div class="spinner"></div></div>`;
  modal.submitBtn().textContent = '💾 บันทึกการแก้ไข';
  modal.submitBtn().onclick     = submitModal;   // always reset to submitModal
  modal.el().classList.remove('hidden');

  try {
    let item = state.cache[section]?.find(x => String(x[cfg.idField]) === String(id));
    if (!item) {
      const r = await apiFetch(`${cfg.listPath}/${id}`);
      item = r?.data || r;
    }
    // Flatten nested user fields so buildForm can read them at top level
    if (section === 'drivers' && item?.user) {
      item = { ...item, ...item.user };
    }
    modal.bodyEl().innerHTML = buildForm(cfg.formFields, item, 'edit');
    populateAsyncSelects(cfg.formFields, item);

    if (cfg.resetPassword) {
      const resetAt = item?.password_reset_at || (section === 'drivers' && item?.user?.password_reset_at);
      const resetById = item?.password_reset_by || (section === 'drivers' && item?.user?.password_reset_by);
      if (resetAt) {
        const dateStr = new Date(resetAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
        let byName = '';
        if (resetById) {
          const cachedUsers = state.cache['users'] || [];
          const byUser = cachedUsers.find(u => u.id === resetById);
          byName = byUser ? (byUser.full_name || byUser.username || resetById) : resetById;
        }
        modal.bodyEl().insertAdjacentHTML('beforeend', `
          <div style="margin-top:12px;padding:10px 14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;font-size:12.5px;color:#0369a1">
            🔑 Reset รหัสผ่านล่าสุด: <strong>${dateStr}</strong>${byName ? ` โดย <strong>${esc(byName)}</strong>` : ''}
          </div>`);
      }
    }

    // Drivers: inject plate number section at the bottom
    if (section === 'drivers') {
      const buses = _ssCache['/admin/buses'] || state.cache['buses'] || [];
      const driverUserId = item.user_id;
      const currentBus = driverUserId ? buses.find(b => String(b.driver_id) === String(driverUserId)) : null;
      modal.bodyEl().insertAdjacentHTML('beforeend', `
        <div style="border-top:1.5px dashed var(--border);margin:16px 0 12px;padding-top:14px">
          <div style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:10px;display:flex;align-items:center;gap:6px">
            🚍 รถโดยสาร
          </div>
          <input type="hidden" id="edit_busId" value="${esc(currentBus?.id || '')}">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">ทะเบียนรถ
              <small style="color:var(--muted);font-weight:400"> — ${currentBus ? 'แก้ไขทะเบียนรถที่ผูกอยู่' : 'กรอกเพื่อสร้างรถใหม่และผูกกับคนขับ'}</small>
            </label>
            <input type="text" class="form-control" id="edit_plateNumber" value="${esc(currentBus?.plate_number || '')}" placeholder="เช่น กข 1234">
          </div>
        </div>`);
    }
  } catch (err) {
    modal.bodyEl().innerHTML = `<p style="color:var(--danger);padding:8px">⚠️ ${esc(err.message)}</p>`;
  }
}

function closeModal() {
  modal.el().classList.add('hidden');
  modal.section = null; modal.mode = null; modal.editId = null;
  // Reset submit button เสมอ — ป้องกันปุ่ม disabled ค้างหลัง save สำเร็จ
  const btn = modal.submitBtn();
  if (btn) { btn.disabled = false; btn.textContent = '💾 บันทึก'; }
}

async function checkUsernameUnique(username, excludeUserId = null) {
  if (!username) return true;
  try {
    const cached = state.cache['users'];
    const users = cached?.length ? cached : extractList(await apiFetch('/admin/users'));
    return !users.some(u => u.username === username && u.id !== excludeUserId);
  } catch {
    return true; // zone_admin — let DB handle
  }
}

async function checkPhoneUnique(phone, excludeUserId = null) {
  if (!phone) return true;
  try {
    const cached = state.cache['users'];
    const users = cached?.length ? cached : extractList(await apiFetch('/admin/users'));
    return !users.some(u => u.phone_number === phone && u.id !== excludeUserId);
  } catch { return true; }
}

async function checkPlateUnique(plate, excludeBusId = null) {
  if (!plate) return true;
  try {
    const cached = state.cache['buses']?.length ? state.cache['buses'] : (_ssCache['/admin/buses'] || null);
    const buses = cached?.length ? cached : extractList(await apiFetch('/admin/buses'));
    return !buses.some(b => b.plate_number === plate && b.id !== excludeBusId);
  } catch { return true; }
}

async function checkDriverAvailable(driverUserId, excludeBusId = null) {
  if (!driverUserId) return true;
  try {
    const cached = state.cache['buses'];
    const buses = cached?.length ? cached : extractList(await apiFetch('/admin/buses'));
    const conflict = buses.find(b => b.driver_id === driverUserId && b.id !== excludeBusId);
    return conflict ? conflict : null; // return conflicting bus or null
  } catch { return null; }
}

async function checkLicenseNoUnique(licenseNo, excludeDriverId = null) {
  if (!licenseNo) return true;
  try {
    const cached = state.cache['drivers'];
    const drivers = cached?.length ? cached : extractList(await apiFetch('/admin/drivers'));
    return !drivers.some(d => d.license_no === licenseNo && d.id !== excludeDriverId);
  } catch { return true; }
}

async function checkEmailUnique(email, excludeUserId = null) {
  if (!email) return true;
  try {
    const cached = state.cache['users'];
    const users = cached?.length ? cached : extractList(await apiFetch('/admin/users'));
    return !users.some(u => u.email === email && u.id !== excludeUserId);
  } catch {
    return true; // zone_admin can't access /admin/users — DB unique constraint will catch duplicates
  }
}

async function submitModal() {
  const { section, mode, editId } = modal;
  const cfg = SECTIONS[section];
  const form = modal.form();
  if (!form.reportValidity()) return;

  // Validate required async-select fields (hidden inputs are not checked by reportValidity)
  if (mode === 'create' || mode === 'edit') {
    for (const f of (cfg.formFields || [])) {
      if (f.type === 'async-select' && f.req) {
        const hidden = form.querySelector(`input[type=hidden][name="${f.n}"]`);
        if (!hidden?.value) {
          toast(`กรุณาเลือก "${f.label}"`, 'error');
          return;
        }
      }
    }
  }

  const fd = new FormData(form);
  const body = {};
  fd.forEach((v, k) => { if (v !== '') body[k] = v; });
  if (mode === 'create' && cfg.extraCreate) Object.assign(body, cfg.extraCreate);

  if (section === 'users') {
    const excludeId = mode === 'edit' ? editId : null;
    if (body.username && !(await checkUsernameUnique(body.username, excludeId))) {
      alertDialog('Username นี้ถูกใช้งานแล้ว กรุณาใช้ Username อื่น', 'Username ซ้ำ');
      return;
    }
    if (body.email && !(await checkEmailUnique(body.email, excludeId))) {
      alertDialog('Email นี้ถูกใช้งานแล้ว กรุณาใช้ Email อื่น', 'Email ซ้ำ');
      return;
    }
    if (body.phoneNumber && !(await checkPhoneUnique(body.phoneNumber, excludeId))) {
      alertDialog('เบอร์โทรนี้ถูกใช้งานแล้ว กรุณาใช้เบอร์โทรอื่น', 'เบอร์โทรซ้ำ');
      return;
    }
  }

  if (section === 'buses') {
    const excludeBusId = mode === 'edit' ? editId : null;
    if (body.plateNumber && !(await checkPlateUnique(body.plateNumber, excludeBusId))) {
      alertDialog('ทะเบียนรถนี้มีอยู่ในระบบแล้ว กรุณาใช้ทะเบียนอื่น', 'ทะเบียนรถซ้ำ');
      return;
    }
    if (body.driverId) {
      const conflict = await checkDriverAvailable(body.driverId, excludeBusId);
      if (conflict) {
        alertDialog(`คนขับนี้ถูกผูกกับรถทะเบียน ${conflict.plate_number || 'อื่น'} แล้ว ไม่สามารถใช้คนขับซ้ำได้`, 'คนขับซ้ำ');
        return;
      }
    }
  }

  if (section === 'drivers' && mode === 'edit') {
    const driverItem = state.cache['drivers']?.find(d => String(d.id) === String(editId));
    const excludeUserId = driverItem?.user_id ?? null;
    if (body.phoneNumber && !(await checkPhoneUnique(body.phoneNumber, excludeUserId))) {
      alertDialog('เบอร์โทรนี้ถูกใช้งานแล้ว กรุณาใช้เบอร์โทรอื่น', 'เบอร์โทรซ้ำ');
      return;
    }
    if (body.licenseNo && !(await checkLicenseNoUnique(body.licenseNo, editId))) {
      alertDialog('เลขที่ใบขับขี่นี้ถูกใช้งานในระบบแล้ว', 'ใบขับขี่ซ้ำ');
      return;
    }
    const _editPlate   = document.getElementById('edit_plateNumber')?.value?.trim() || null;
    const _editBusId   = document.getElementById('edit_busId')?.value?.trim() || null;
    if (_editPlate && !(await checkPlateUnique(_editPlate, _editBusId || null))) {
      alertDialog('ทะเบียนรถนี้มีอยู่ในระบบแล้ว กรุณาใช้ทะเบียนอื่น', 'ทะเบียนรถซ้ำ');
      return;
    }
  }

  const btn = modal.submitBtn();
  btn.disabled = true; btn.textContent = '⏳ กำลังบันทึก...';

  try {
    if (mode === 'create') {
      // Super Admin: สร้าง user (role=admin) แล้ว auto สร้าง admin record (admin_type=super_admin)
      if (section === 'users' && body.role === 'super_admin') {
        btn.textContent = '⏳ กำลังสร้าง Super Admin...';
        body.role = 'admin';
        const userRes = await apiFetch(cfg.createPath, { method: 'POST', body: JSON.stringify(body) });
        const userId = userRes?.data?.id || userRes?.id;
        if (!userId) throw new Error('สร้าง User ไม่สำเร็จ');
        btn.textContent = '⏳ กำลังสร้าง Admin record...';
        await apiFetch('/admin/admins', { method: 'POST', body: JSON.stringify({ userId, adminType: 'super_admin', status: 'active' }) });
        toast('เพิ่ม Super Admin สำเร็จ ✅', 'success');
      } else {
        await apiFetch(cfg.createPath, { method:'POST', body: JSON.stringify(body) });
        toast(`เพิ่ม${cfg.title}สำเร็จ ✅`, 'success');
      }
    } else {
      if (section === 'users') {
        btn.textContent = '⏳ กำลังอัปเดต...';
        const existingItem = state.cache['users']?.find(u => String(u.id) === String(editId));
        const adminProfile = Array.isArray(existingItem?.admin_profile) ? existingItem.admin_profile[0] : existingItem?.admin_profile;

        if (body.role === 'super_admin') {
          // เปลี่ยนเป็น super_admin → update user (role=admin) + upsert admin record
          body.role = 'admin';
          await apiFetch(cfg.updatePath(editId), { method: 'PUT', body: JSON.stringify(body) });
          if (adminProfile) {
            const adminsRes = await apiFetch('/admin/admins');
            const allAdmins = Array.isArray(adminsRes?.data) ? adminsRes.data : [];
            const myAdmin = allAdmins.find(a => a.user_id === editId);
            if (myAdmin) {
              await apiFetch(`/admin/admins/${myAdmin.id}`, { method: 'PUT', body: JSON.stringify({ adminType: 'super_admin' }) });
            } else {
              await apiFetch('/admin/admins', { method: 'POST', body: JSON.stringify({ userId: editId, adminType: 'super_admin', status: 'active' }) });
            }
          } else {
            await apiFetch('/admin/admins', { method: 'POST', body: JSON.stringify({ userId: editId, adminType: 'super_admin', status: 'active' }) });
          }
          toast('อัปเดตเป็น Super Admin สำเร็จ ✅', 'success');
        } else if (adminProfile && body.role !== 'admin') {
          // เปลี่ยนจาก admin/super_admin เป็น role อื่น (passenger/driver) → ลบ admin record ด้วย
          await apiFetch(cfg.updatePath(editId), { method: 'PUT', body: JSON.stringify(body) });
          const adminsRes = await apiFetch('/admin/admins');
          const allAdmins = Array.isArray(adminsRes?.data) ? adminsRes.data : [];
          const myAdmin = allAdmins.find(a => a.user_id === editId);
          if (myAdmin) await apiFetch(`/admin/admins/${myAdmin.id}`, { method: 'DELETE' });
          toast('อัปเดตผู้ใช้งานสำเร็จ ✅', 'success');
        } else if (adminProfile && body.role === 'admin') {
          // เปลี่ยนจาก super_admin → admin ปกติ → ลบ admin record เพื่อเคลียร์ admin_type
          await apiFetch(cfg.updatePath(editId), { method: 'PUT', body: JSON.stringify(body) });
          const adminsRes = await apiFetch('/admin/admins');
          const allAdmins = Array.isArray(adminsRes?.data) ? adminsRes.data : [];
          const myAdmin = allAdmins.find(a => a.user_id === editId);
          if (myAdmin) await apiFetch(`/admin/admins/${myAdmin.id}`, { method: 'DELETE' });
          toast('อัปเดตเป็น Admin (ไม่มีโซน) สำเร็จ ✅', 'success');
        } else {
          await apiFetch(cfg.updatePath(editId), { method: 'PUT', body: JSON.stringify(body) });
          toast('แก้ไขผู้ใช้งานสำเร็จ ✅', 'success');
        }
      } else if (section === 'drivers') {
        await apiFetch(cfg.updatePath(editId), { method: 'PUT', body: JSON.stringify(body) });

        // Handle bus plate: update existing bus OR create new one if plate was provided
        const newPlate     = document.getElementById('edit_plateNumber')?.value?.trim() || null;
        const existingBusId = document.getElementById('edit_busId')?.value?.trim() || null;
        if (newPlate) {
          if (existingBusId) {
            await apiFetch(`/admin/buses/${existingBusId}`, { method: 'PUT', body: JSON.stringify({ plateNumber: newPlate }) });
          } else {
            const driverItem = state.cache['drivers']?.find(d => String(d.id) === String(editId));
            const userId = driverItem?.user_id;
            if (userId) {
              const routeId = body.assignedRouteId || driverItem?.assigned_route_id || null;
              await apiFetch('/admin/buses', { method: 'POST', body: JSON.stringify({ plateNumber: newPlate, driverId: userId, routeId, status: 'on' }) });
            }
          }
          delete _ssCache['/admin/buses'];
        }
        toast(`แก้ไข${cfg.title}สำเร็จ ✅`, 'success');
      } else {
        await apiFetch(cfg.updatePath(editId), { method:'PUT', body: JSON.stringify(body) });
        toast(`แก้ไข${cfg.title}สำเร็จ ✅`, 'success');
      }
    }
    closeModal();
    if (section === 'buses') delete _ssCache['/admin/buses'];
    loadSection(section);
  } catch (err) {
    alertDialog(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'บันทึกไม่สำเร็จ');
    btn.disabled = false;
    btn.textContent = mode === 'create' ? '💾 บันทึก' : '💾 บันทึกการแก้ไข';
  }
}

function buildForm(fields, data, mode, defaults = {}) {
  return fields
    .filter(f => !(mode === 'edit' && f.createOnly))
    .map(f => {
      const val = (f.rk && data) ? (data[f.rk] ?? '')
                : (f.rk && defaults[f.rk] != null) ? defaults[f.rk]
                : '';
      const req = f.req ? '<span class="req">*</span>' : '';
      const hint = f.hint ? `<div style="font-size:11px;color:var(--muted);margin-top:3px">${esc(f.hint)}</div>` : '';

      if (f.type === 'async-select') {
        // Zone Admin: render zone_id เป็น static locked display — ไม่ต้อง fetch /admin/zones
        if (f.rk === 'zone_id' && state.adminType === 'zone_admin') {
          const effectiveVal = String(val || state.zoneId || '');
          const cachedZone   = (_ssCache[f.fetchPath] || []).find(z => String(z.id) === effectiveVal);
          const displayText  = cachedZone ? esc(f.labelFn(cachedZone))
                             : state.zoneLabel ? esc(state.zoneLabel)
                             : esc(effectiveVal || '— ไม่ระบุ —');
          return `<div class="form-group">
            <label class="form-label">${esc(f.label)}</label>
            <input type="hidden" name="${esc(f.n)}" value="${esc(effectiveVal)}">
            <div class="form-control" style="background:var(--bg);pointer-events:none;display:flex;align-items:center;gap:8px">
              🗺️ ${displayText}
              <span style="font-size:11px;color:var(--muted);margin-left:auto">โซนของคุณ 🔒</span>
            </div>
          </div>`;
        }

        // Locked: auto-derived from another field, not manually editable
        if (f.locked) {
          let displayText = f.placeholder || '— เลือกก่อน —';
          let hasVal = false;
          if (val) {
            const cached = _ssCache[f.fetchPath] || [];
            const found = cached.find(x => String(f.valueFn(x)) === String(val));
            if (found) { displayText = f.labelFn(found); hasVal = true; }
          }
          return `<div class="form-group">
            <label class="form-label">${esc(f.label)}<small style="color:var(--muted);font-weight:400;margin-left:6px">— กำหนดอัตโนมัติจากคนขับ</small></label>
            <input type="hidden" name="${esc(f.n)}" id="f_route_hidden" value="${esc(String(val))}">
            <div id="f_route_display" class="form-control" style="background:var(--bg);pointer-events:none;color:${hasVal ? 'var(--text)' : 'var(--muted)'}">
              ${esc(displayText)}
            </div>
            ${hint}
          </div>`;
        }

        return `<div class="form-group">
          <label class="form-label">${esc(f.label)}${req}</label>
          <div class="ss-container" id="ss_${esc(f.n)}">
            <input type="hidden" name="${esc(f.n)}" value="${esc(String(val))}">
            <div class="ss-trigger" onclick="ssToggle('ss_${esc(f.n)}')">
              <span class="ss-trigger-label ph">กำลังโหลด...</span>
              <span class="ss-trigger-arrow">▾</span>
            </div>
            <div class="ss-panel">
              <input type="text" class="ss-search-input" placeholder="🔍 ค้นหา..."
                oninput="ssFilter('ss_${esc(f.n)}', this.value)" autocomplete="off">
              <div class="ss-options-list">
                <div class="ss-loading-opt">กำลังโหลด...</div>
              </div>
            </div>
          </div>${hint}</div>`;
      }
      if (f.type === 'select') {
        // zone_admin: cannot set adminType to super_admin
        const availableOptions = (f.n === 'adminType' && state.adminType === 'zone_admin')
          ? (f.options || []).filter(o => o.v !== 'super_admin')
          : (f.options || []);
        const opts = availableOptions.map(o =>
          `<option value="${esc(o.v)}" ${String(val) === o.v ? 'selected' : ''}>${o.l}</option>`
        ).join('');
        return `<div class="form-group">
          <label class="form-label">${esc(f.label)}${req}</label>
          <select id="f_${esc(f.n)}" name="${esc(f.n)}" class="form-control" ${f.req ? 'required' : ''}>
            <option value="">— เลือก —</option>${opts}
          </select>${hint}</div>`;
      }
      return `<div class="form-group">
        <label class="form-label">${esc(f.label)}${req}</label>
        <input id="f_${esc(f.n)}" type="${f.type}" name="${esc(f.n)}" class="form-control"
          value="${esc(String(val))}" placeholder="${esc(f.hint || f.label)}"
          ${f.type === 'number' ? 'step="any"' : ''} ${f.req ? 'required' : ''}>
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
  const input = document.getElementById('confirmDeleteInput');
  input.value = '';
  input.style.borderColor = '#e2e8f0';
  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true; btn.style.opacity = '.4'; btn.style.cursor = 'not-allowed';
  document.getElementById('confirmModal').classList.remove('hidden');
  setTimeout(() => input.focus(), 80);
}

function onConfirmInput() {
  const input = document.getElementById('confirmDeleteInput');
  const btn = document.getElementById('confirmDeleteBtn');
  const ok = input.value.trim() === 'ลบ';
  input.style.borderColor = input.value ? (ok ? '#22c55e' : '#ef4444') : '#e2e8f0';
  btn.disabled = !ok;
  btn.style.opacity = ok ? '1' : '.4';
  btn.style.cursor = ok ? 'pointer' : 'not-allowed';
}

function closeConfirm() {
  document.getElementById('confirmModal').classList.add('hidden');
  const input = document.getElementById('confirmDeleteInput');
  input.value = '';
  input.style.borderColor = '#e2e8f0';
  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true; btn.style.opacity = '.4'; btn.style.cursor = 'not-allowed';
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
    if (del.section === 'buses') delete _ssCache['/admin/buses'];
    loadSection(del.section);
  } catch (err) {
    toast(`❌ ลบไม่สำเร็จ: ${err.message}`, 'error');
    btn.disabled = false; btn.textContent = '🗑️ ยืนยันการลบ';
  }
}

// Close SS dropdowns on outside click (modal ปิดได้เฉพาะปุ่ม X / ยกเลิก เท่านั้น)
document.addEventListener('click', e => {
  if (!e.target.closest('.ss-container') && !e.target.closest('.ss-wrap')) {
    document.querySelectorAll('.ss-container.open').forEach(c => c.classList.remove('open'));
  }
});

/* =====================================================
   RENDER NAV — show/hide super-admin-only items
   ===================================================== */
const NAV_GROUPS = [
  {
    label: 'ภาพรวม',
    items: [
      { section: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
      { section: 'analytics', icon: 'bar-chart-3',      label: 'Analytics' },
    ],
  },
  {
    label: 'การจัดการระบบ',
    superAdminOnly: true,
    items: [
      { section: 'zones',  icon: 'layers',  label: 'โซน' },
      { section: 'users',  icon: 'users',   label: 'ผู้ใช้งาน' },
    ],
  },
  {
    label: 'บัญชีผู้ดูแล',
    items: [
      { section: 'admins', icon: 'shield-check', label: 'ผู้ดูแลระบบ' },
    ],
  },
  {
    label: 'การเดินรถ',
    items: [
      { section: 'routes',  icon: 'route',          label: 'เส้นทางรถ' },
      { section: 'drivers', icon: 'user-check',  label: 'คนขับรถ' },
      { section: 'buses',   icon: 'bus',             label: 'รถโดยสาร' },
      { section: 'waiting', icon: 'clock',           label: 'รายการรอรับ' },
    ],
  },
  {
    label: 'การตั้งค่า',
    superAdminOnly: true,
    items: [
      { section: 'settings', icon: 'settings-2', label: 'การตั้งค่า API' },
    ],
  },
];

function renderNav() {
  const isSuperAdmin = state.adminType === 'super_admin';
  const nav = document.getElementById('sidebarNav');
  if (!nav) return;

  nav.innerHTML = NAV_GROUPS
    .filter(g => !g.superAdminOnly || isSuperAdmin)
    .map(g => `
      <div class="nav-group">
        <div class="nav-group-label">${g.label}</div>
        ${g.items.map(item => `
          <button class="nav-item${state.section === item.section ? ' active' : ''}" data-section="${item.section}" onclick="navigate('${item.section}')">
            <span class="nav-icon">${_sectionSvg(item.section, 19, state.section === item.section ? 2 : 1.75)}</span>
            <span class="nav-label">${item.label}</span>
          </button>`).join('')}
      </div>`).join('');

  const roleEl = document.getElementById('userRole');
  if (roleEl && state.adminType) {
    const labels = { super_admin: '⭐ Super Admin', zone_admin: '🗺️ Zone Admin' };
    roleEl.textContent = labels[state.adminType] || state.adminType;
  }
}

/* =====================================================
   BUS + DRIVER — merged section with tabs
   ===================================================== */
async function renderBusDriver(tab = 'buses') {
  state._busDriverTab = tab;
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div class="loading"><div class="spinner"></div> กำลังโหลด...</div>`;
  try {
    const cfg = SECTIONS[tab];
    // Fetch main list + pre-fetch related data แบบ parallel
    const prefetchPaths = (cfg.prefetch || []).filter(p => !_ssCache[p] || _ssCache[p].length === 0);
    const [raw] = await Promise.all([
      apiFetch(cfg.listPath),
      ...prefetchPaths.map(path =>
        apiFetch(path)
          .then(r => {
            const items = extractList(r);
            if (items.length > 0) _ssCache[path] = items;
          })
          .catch(() => {})
      ),
    ]);
    const items = extractList(raw);
    state.cache[tab] = items;
    state.filtered[tab] = items;
    renderTable(tab, items);
    const card = content.querySelector('.card');
    if (card) card.insertAdjacentHTML('afterbegin', _busDriverTabsHtml(tab));
  } catch (err) {
    content.innerHTML = _busDriverTabsHtml(tab) + errCard(tab, err.message);
  }
}

/* =====================================================
   HELPERS: route code gen + driver-route cascade
   ===================================================== */
function genRouteCode(zoneCode) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return zoneCode ? `${String(zoneCode).toUpperCase()}-${rand}` : rand;
}

const _ssRouteHtml = `
  <input type="hidden" id="wu_routeId" value="">
  <div class="ss-trigger" onclick="ssToggle('wu_routeId_ss')">
    <span class="ss-trigger-label ph">— เลือกเส้นทาง —</span>
    <span class="ss-trigger-arrow">▾</span>
  </div>
  <div class="ss-panel">
    <input type="text" class="ss-search-input" placeholder="🔍 ค้นหาเส้นทาง..."
      oninput="ssFilter('wu_routeId_ss', this.value)" autocomplete="off">
    <div class="ss-options-list"><div class="ss-loading-opt">กำลังโหลด...</div></div>
  </div>`;

async function autoGenEmployeeCode(routeId) {
  const el = document.getElementById('wu_employeeCode');
  if (!el || el.value) return; // ไม่ทับถ้ากรอกไว้แล้ว
  const route = (_ssCache['/admin/routes'] || []).find(r => r.id === routeId);
  if (!route?.route_code) return;
  const drivers = _ssCache['/admin/drivers'] || state.cache['drivers'] || [];
  const count = drivers.filter(d => d.assigned_route_id === routeId).length;
  el.value = `${route.route_code}-${String(count + 1).padStart(3, '0')}`;
}

async function filterDriverRoutesByZone(zoneId) {
  if (!_ssCache['/admin/routes']) {
    const raw = await apiFetch('/admin/routes');
    _ssCache['/admin/routes'] = extractList(raw);
  }
  const routes = (_ssCache['/admin/routes'] || []).filter(r => r.zone_id === zoneId);

  const routeGroup = document.getElementById('wu_driverRouteGroup');
  if (routeGroup) routeGroup.style.display = '';

  const routeSS  = document.getElementById('wu_routeId_ss');
  if (!routeSS) return;
  const listEl      = routeSS.querySelector('.ss-options-list');
  const hiddenEl    = routeSS.querySelector('input[type=hidden]');
  const triggerLabel = routeSS.querySelector('.ss-trigger-label');
  if (!listEl) return;

  if (hiddenEl) hiddenEl.value = '';
  if (triggerLabel) { triggerLabel.textContent = '— เลือกเส้นทาง —'; triggerLabel.classList.add('ph'); }

  if (routes.length === 0) {
    listEl.innerHTML = `<div class="ss-no-results" style="padding:14px;text-align:center;color:var(--muted)">📭 ไม่มีเส้นทางในโซนนี้</div>`;
    return;
  }

  listEl.innerHTML = `<div class="ss-option" data-value="">— เลือก —</div>` +
    routes.map(r => {
      const v = esc(r.id);
      const l = esc([r.route_code, r.route_name].filter(Boolean).join(' — '));
      return `<div class="ss-option" data-value="${v}" title="${l}">${l}</div>`;
    }).join('');

  listEl.querySelectorAll('.ss-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const v = opt.dataset.value;
      if (hiddenEl) hiddenEl.value = v;
      if (triggerLabel) {
        triggerLabel.textContent = v ? opt.textContent : '— เลือกเส้นทาง —';
        triggerLabel.classList.toggle('ph', !v);
      }
      listEl.querySelectorAll('.ss-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      routeSS.classList.remove('open');
      const search = routeSS.querySelector('.ss-search-input');
      if (search) search.value = '';
      listEl.querySelectorAll('.ss-option').forEach(o => o.classList.remove('ss-hidden'));
      if (v) autoGenEmployeeCode(v);
    });
  });
}

/* =====================================================
   2-STEP CREATE: Driver/Admin with User
   ===================================================== */
function openWithUserModal(section) {
  const isDriver = section === 'drivers';
  const title = isDriver ? '➕ เพิ่มคนขับรถ' : '➕ เพิ่มผู้ดูแลระบบ';
  const _isSuperAdmin = state.adminType === 'super_admin';
  const _driverRouteZoneHtml = !_isSuperAdmin ? `
    <div class="form-group">
      <label class="form-label">โซน</label>
      <div class="form-control" style="background:var(--bg);pointer-events:none;display:flex;align-items:center;gap:8px">
        🗺️ ${esc(state.zoneLabel || state.zoneId || '—')}
        <span style="font-size:11px;color:var(--muted);margin-left:auto">โซนของคุณ 🔒</span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">เส้นทาง (ในโซนของคุณ)</label>
      <div class="ss-container" id="wu_routeId_ss">${_ssRouteHtml}</div>
    </div>` : `
    <div class="form-group">
      <label class="form-label">โซน <span style="color:var(--danger)">*</span></label>
      <div class="ss-container" id="wu_driverZone_ss">
        <input type="hidden" id="wu_driverZone" value="">
        <div class="ss-trigger" onclick="ssToggle('wu_driverZone_ss')">
          <span class="ss-trigger-label ph">— เลือกโซนก่อน —</span>
          <span class="ss-trigger-arrow">▾</span>
        </div>
        <div class="ss-panel">
          <input type="text" class="ss-search-input" placeholder="🔍 ค้นหาโซน..."
            oninput="ssFilter('wu_driverZone_ss', this.value)" autocomplete="off">
          <div class="ss-options-list"><div class="ss-loading-opt">กำลังโหลด...</div></div>
        </div>
      </div>
    </div>
    <div class="form-group" id="wu_driverRouteGroup" style="display:none">
      <label class="form-label">เส้นทาง</label>
      <div class="ss-container" id="wu_routeId_ss">${_ssRouteHtml}</div>
    </div>`;

  const step2Fields = isDriver ? `
    ${_driverRouteZoneHtml}
    <div class="form-group">
      <label class="form-label">รหัสพนักงาน <small style="color:var(--muted)">(สร้างอัตโนมัติเมื่อเลือกเส้นทาง)</small></label>
      <input type="text" class="form-control" id="wu_employeeCode" placeholder="เช่น R01-001">
    </div>
    <div class="form-group">
      <label class="form-label">หมายเลขใบขับขี่ (กรมขนส่ง) <span class="req">*</span></label>
      <input type="text" class="form-control" id="wu_licenseNo" required placeholder="เช่น 12345678901234">
    </div>
    <div class="form-group">
      <label class="form-label">ประเภทใบอนุญาต</label>
      <select class="form-control" id="wu_licenseType">
        <option value="">— ไม่ระบุ —</option>
        <option value="public_car">🚗 รถยนต์สาธารณะ (แท็กซี่)</option>
        <option value="public_bus">🚌 รถโดยสาร (บัส)</option>
        <option value="public_motorcycle">🏍️ รถจักรยานยนต์สาธารณะ (วิน)</option>
      </select>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group">
        <label class="form-label">วันออกบัตร</label>
        <input type="date" class="form-control" id="wu_licenseIssueDate">
      </div>
      <div class="form-group">
        <label class="form-label">วันหมดอายุ</label>
        <input type="date" class="form-control" id="wu_licenseExpiryDate">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">วันเดือนปีเกิด</label>
      <input type="date" class="form-control" id="wu_dateOfBirth">
    </div>
    <div class="form-group">
      <label class="form-label">ที่อยู่</label>
      <input type="text" class="form-control" id="wu_address" placeholder="ที่อยู่ปัจจุบัน">
    </div>
    <div class="form-group">
      <label class="form-label">URL รูปถ่าย</label>
      <input type="url" class="form-control" id="wu_photoUrl" placeholder="https://...">
    </div>
    <div class="form-group">
      <label class="form-label">สถานะ</label>
      <select class="form-control" id="wu_driverStatus">
        <option value="active">✅ ใช้งาน</option>
        <option value="inactive">⛔ ไม่ใช้งาน</option>
      </select>
    </div>
    <div style="border-top:1.5px dashed var(--border);margin:16px 0 12px;padding-top:14px">
      <div style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:10px;display:flex;align-items:center;gap:6px">
        🚍 รถโดยสาร <span style="font-weight:400;color:var(--muted)">(ไม่บังคับ)</span>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">ทะเบียนรถ
          <small style="color:var(--muted);font-weight:400"> — ถ้ากรอก ระบบจะสร้างรถโดยสารและผูกคนขับให้อัตโนมัติ</small>
        </label>
        <input type="text" class="form-control" id="wu_plateNumber" placeholder="เช่น กข 1234">
      </div>
    </div>` : `
    <div class="form-group">
      <label class="form-label">ประเภท Admin <span style="color:var(--danger)">*</span></label>
      <select class="form-control" id="wu_adminType">
        <option value="zone_admin">🗺️ Zone Admin</option>
        ${state.adminType !== 'zone_admin' ? '<option value="super_admin">⭐ Super Admin</option>' : ''}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">โซน</label>
      ${state.adminType === 'zone_admin' && state.zoneId ? `
        <input type="hidden" id="wu_zoneId" value="${esc(state.zoneId)}">
        <div class="form-control" style="background:var(--bg);pointer-events:none;display:flex;align-items:center;gap:8px">
          🗺️ ${esc(state.zoneLabel || state.zoneId)}
          <span style="font-size:11px;color:var(--muted);margin-left:auto">โซนของคุณ 🔒</span>
        </div>` : `
        <div class="ss-container" id="wu_zoneId_ss">
          <input type="hidden" id="wu_zoneId" value="">
          <div class="ss-trigger" onclick="ssToggle('wu_zoneId_ss')">
            <span class="ss-trigger-label ph">— เลือกโซน —</span>
            <span class="ss-trigger-arrow">▾</span>
          </div>
          <div class="ss-panel">
            <input type="text" class="ss-search-input" placeholder="🔍 ค้นหาโซน..."
              oninput="ssFilter('wu_zoneId_ss', this.value)" autocomplete="off">
            <div class="ss-options-list"><div class="ss-loading-opt">กำลังโหลด...</div></div>
          </div>
        </div>`}
    </div>`;

  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = `
    <div style="background:var(--bg);border-radius:8px;padding:12px;margin-bottom:16px">
      <div style="font-weight:600;margin-bottom:10px;color:var(--primary)">👤 ขั้นตอนที่ 1 — ข้อมูล User</div>
      <div class="form-group">
        <label class="form-label">ชื่อเต็ม</label>
        <input type="text" class="form-control" id="wu_fullName" placeholder="ชื่อ-นามสกุล">
      </div>
      <div class="form-group">
        <label class="form-label">Username <span style="color:var(--danger)">*</span></label>
        <input type="text" class="form-control" id="wu_username" placeholder="username">
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" class="form-control" id="wu_email" placeholder="email@example.com">
      </div>
      <div class="form-group">
        <label class="form-label">เบอร์โทร</label>
        <input type="tel" class="form-control" id="wu_phone" placeholder="0812345678">
      </div>
      <div class="form-group">
        <label class="form-label">รหัสผ่าน <small style="color:var(--muted)">(ต้องใส่เพื่อให้ login ได้)</small></label>
        <input type="password" class="form-control" id="wu_password" placeholder="รหัสผ่าน (ขั้นต่ำ 6 ตัว)" autocomplete="new-password">
      </div>
    </div>
    <div style="background:var(--bg);border-radius:8px;padding:12px">
      <div style="font-weight:600;margin-bottom:10px;color:var(--primary)">${isDriver ? '🚌 ขั้นตอนที่ 2 — ข้อมูลคนขับ' : '👤 ขั้นตอนที่ 2 — ข้อมูล Admin'}</div>
      ${step2Fields}
    </div>`;

  const submitBtn = document.getElementById('modalSubmitBtn');
  submitBtn.disabled = false;
  submitBtn.onclick  = () => submitWithUser(section);
  document.getElementById('crudModal').classList.remove('hidden');

  // Populate async selects
  if (isDriver) {
    if (_isSuperAdmin) {
      // super_admin: zone dropdown → on select → filter routes
      initAsyncSelect('wu_driverZone_ss', '/admin/zones',
        z => [z.zone_code, z.zone_name].filter(Boolean).join(' — '),
        z => z.id, '',
        (zoneId) => filterDriverRoutesByZone(zoneId));
      // Pre-cache routes silently so cascade is instant
      apiFetch('/admin/routes').then(r => { if (!_ssCache['/admin/routes']) _ssCache['/admin/routes'] = extractList(r); }).catch(() => {});
    } else {
      // zone_admin: routes already filtered by backend
      initAsyncSelect('wu_routeId_ss', '/admin/routes',
        r => [r.route_code, r.route_name].filter(Boolean).join(' — '),
        r => r.id, '', (routeId) => autoGenEmployeeCode(routeId));
    }
  } else {
    // Super Admin เท่านั้นที่ต้องเลือกโซน — Zone Admin ใช้ static display แทน
    if (state.adminType !== 'zone_admin') {
      initAsyncSelect('wu_zoneId_ss', '/admin/zones',
        z => [z.zone_code, z.zone_name].filter(Boolean).join(' — '),
        z => z.id, '');
    }
  }
}

/* =====================================================
   ASSIGN ADMIN MODAL
   ===================================================== */
async function openAssignAdminModal() {
  modal.section = 'admins'; modal.mode = 'create'; modal.editId = null;
  modal.titleEl().textContent = '➕ เพิ่มผู้ดูแลระบบ';

  // Build form HTML manually
  const isSuperAdmin = state.adminType === 'super_admin';
  const adminTypeOptions = isSuperAdmin
    ? `<option value="super_admin">⭐ Super Admin</option><option value="zone_admin">🗺️ Zone Admin</option>`
    : `<option value="zone_admin">🗺️ Zone Admin</option>`;

  modal.bodyEl().innerHTML = `
    <div class="form-group">
      <label class="form-label">เลือกผู้ใช้ (role=admin) <span class="req">*</span></label>
      <div id="ss_assign_userId" class="ss-wrap">
        <div class="ss-trigger" tabindex="0"><span class="ss-trigger-label ph">— เลือก —</span><span class="ss-arrow">▾</span></div>
        <div class="ss-dropdown">
          <input class="ss-search-input" placeholder="ค้นหา..." autocomplete="off"/>
          <div class="ss-options-list"></div>
        </div>
        <input type="hidden" id="assign_userId" name="userId"/>
      </div>
      <small class="form-hint">แสดงเฉพาะ user ที่มี role=admin และยังไม่มี admin record</small>
    </div>
    <div class="form-group">
      <label class="form-label">ประเภท Admin <span class="req">*</span></label>
      <select id="assign_adminType" class="form-control" onchange="toggleAssignZone()">
        ${adminTypeOptions}
      </select>
    </div>
    <div class="form-group" id="assign_zoneGroup" style="display:none">
      <label class="form-label">โซน <span class="req">*</span></label>
      <div id="ss_assign_zoneId" class="ss-wrap">
        <div class="ss-trigger" tabindex="0"><span class="ss-trigger-label ph">— เลือก —</span><span class="ss-arrow">▾</span></div>
        <div class="ss-dropdown">
          <input class="ss-search-input" placeholder="ค้นหา..." autocomplete="off"/>
          <div class="ss-options-list"></div>
        </div>
        <input type="hidden" id="assign_zoneId" name="zoneId"/>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">สถานะ</label>
      <select id="assign_status" class="form-control">
        <option value="active">✅ ใช้งาน</option>
        <option value="inactive">⛔ ไม่ใช้งาน</option>
      </select>
    </div>`;

  modal.submitBtn().textContent = '💾 บันทึก';
  modal.submitBtn().disabled = false;
  modal.submitBtn().onclick = submitAssignAdmin;
  modal.el().classList.remove('hidden');

  // Init async select for user list — show users with role=admin (no existing admin record)
  await initAssignUserSelect();

  // Init zone select
  initAsyncSelect('ss_assign_zoneId', '/admin/zones',
    z => [z.zone_code, z.zone_name].filter(Boolean).join(' — '),
    z => z.id, '');

  // Show zone group if default type is zone_admin
  toggleAssignZone();
}

function toggleAssignZone() {
  const adminType = document.getElementById('assign_adminType')?.value;
  const zoneGroup = document.getElementById('assign_zoneGroup');
  if (zoneGroup) zoneGroup.style.display = (adminType === 'zone_admin') ? '' : 'none';
}

async function initAssignUserSelect() {
  const containerId = 'ss_assign_userId';
  const el = document.getElementById(containerId);
  if (!el) return;
  const listEl = el.querySelector('.ss-options-list');
  const hiddenEl = document.getElementById('assign_userId');
  const triggerLabel = el.querySelector('.ss-trigger-label');
  if (!listEl) return;

  // Setup trigger toggle and search
  el.querySelector('.ss-trigger').addEventListener('click', () => el.classList.toggle('open'));
  el.querySelector('.ss-search-input').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    listEl.querySelectorAll('.ss-option').forEach(o => {
      o.classList.toggle('ss-hidden', q && !o.textContent.toLowerCase().includes(q));
    });
  });
  document.addEventListener('click', e => { if (!el.contains(e.target)) el.classList.remove('open'); });

  try {
    // Load all admins to know which user_ids already have admin records
    const [usersRaw, adminsRaw] = await Promise.all([
      apiFetch('/admin/users?role=admin'),
      apiFetch('/admin/admins'),
    ]);
    const users = extractList(usersRaw);
    const admins = extractList(adminsRaw);
    const usedUserIds = new Set(admins.map(a => a.user_id));
    const eligible = users.filter(u => !usedUserIds.has(u.id));

    if (eligible.length === 0) {
      listEl.innerHTML = `<div class="ss-no-results" style="padding:14px;text-align:center;color:var(--muted)">📭 ไม่มีผู้ใช้ที่พร้อมกำหนดเป็น Admin<br><small>ให้สร้าง user ที่มี role=admin ในหน้า ผู้ใช้งาน ก่อน</small></div>`;
      triggerLabel.textContent = '— ไม่มีข้อมูล —';
      return;
    }

    listEl.innerHTML = `<div class="ss-option" data-value="">— เลือก —</div>` +
      eligible.map(u => {
        const v = u.id;
        const l = esc(`${u.full_name || u.username || '—'} (${u.email || u.username})`);
        return `<div class="ss-option" data-value="${esc(v)}" title="${l}">${l}</div>`;
      }).join('');

    listEl.querySelectorAll('.ss-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const v = opt.dataset.value;
        if (hiddenEl) hiddenEl.value = v;
        triggerLabel.textContent = v ? opt.textContent : '— เลือก —';
        triggerLabel.classList.toggle('ph', !v);
        listEl.querySelectorAll('.ss-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        el.classList.remove('open');
        el.querySelector('.ss-search-input').value = '';
        el.querySelectorAll('.ss-option').forEach(o => o.classList.remove('ss-hidden'));
      });
    });
  } catch (e) {
    triggerLabel.textContent = '⚠️ โหลดไม่ได้';
    triggerLabel.classList.add('ph');
  }
}

async function submitAssignAdmin() {
  const userId    = document.getElementById('assign_userId')?.value?.trim();
  const adminType = document.getElementById('assign_adminType')?.value;
  const zoneId    = document.getElementById('assign_zoneId')?.value?.trim() || null;
  const status    = document.getElementById('assign_status')?.value || 'active';

  if (!userId) { toast('กรุณาเลือกผู้ใช้', 'error'); return; }
  if (adminType === 'zone_admin' && !zoneId) { toast('กรุณาเลือกโซนสำหรับ Zone Admin', 'error'); return; }

  const btn = modal.submitBtn();
  btn.disabled = true; btn.textContent = '⏳ กำลังบันทึก...';

  try {
    await apiFetch('/admin/admins', {
      method: 'POST',
      body: JSON.stringify({ userId, adminType, zoneId: zoneId || null, status }),
    });
    toast('เพิ่มผู้ดูแลระบบสำเร็จ ✅', 'success');
    closeModal();
    loadSection('admins');
  } catch (err) {
    toast(`❌ ${err.message}`, 'error');
    btn.disabled = false; btn.textContent = '💾 บันทึก';
  }
}

async function submitWithUser(section) {
  const isDriver = section === 'drivers';
  const username = document.getElementById('wu_username')?.value?.trim();
  if (!username) { toast('กรุณากรอก Username', 'error'); return; }

  // super_admin adding driver: must select zone first (so routes are filtered)
  if (isDriver && state.adminType === 'super_admin') {
    const driverZone = document.getElementById('wu_driverZone')?.value?.trim();
    if (!driverZone) { toast('กรุณาเลือกโซนก่อน', 'error'); return; }
  }

  if (!(await checkUsernameUnique(username))) {
    alertDialog('Username นี้ถูกใช้งานแล้ว กรุณาใช้ Username อื่น', 'Username ซ้ำ');
    return;
  }

  const email = document.getElementById('wu_email')?.value?.trim() || null;
  if (email && !(await checkEmailUnique(email))) {
    alertDialog('Email นี้ถูกใช้งานแล้ว กรุณาใช้ Email อื่น', 'Email ซ้ำ');
    return;
  }

  const phone = document.getElementById('wu_phone')?.value?.trim() || null;
  if (phone && !(await checkPhoneUnique(phone))) {
    alertDialog('เบอร์โทรนี้ถูกใช้งานแล้ว กรุณาใช้เบอร์โทรอื่น', 'เบอร์โทรซ้ำ');
    return;
  }

  if (isDriver) {
    const licenseNo = document.getElementById('wu_licenseNo')?.value?.trim() || null;
    if (licenseNo && !(await checkLicenseNoUnique(licenseNo))) {
      alertDialog('เลขที่ใบขับขี่นี้ถูกใช้งานในระบบแล้ว', 'ใบขับขี่ซ้ำ');
      return;
    }
    const plateNumber = document.getElementById('wu_plateNumber')?.value?.trim() || null;
    if (plateNumber && !(await checkPlateUnique(plateNumber))) {
      alertDialog('ทะเบียนรถนี้มีอยู่ในระบบแล้ว กรุณาใช้ทะเบียนอื่น', 'ทะเบียนรถซ้ำ');
      return;
    }
  }

  const body = {
    fullName:    document.getElementById('wu_fullName')?.value?.trim() || null,
    username,
    email,
    phoneNumber: document.getElementById('wu_phone')?.value?.trim() || null,
    password:    document.getElementById('wu_password')?.value?.trim() || null,
    ...(isDriver ? {
      employeeCode:      document.getElementById('wu_employeeCode')?.value?.trim() || null,
      licenseNo:         document.getElementById('wu_licenseNo')?.value?.trim() || null,
      licenseType:       document.getElementById('wu_licenseType')?.value || null,
      licenseIssueDate:  document.getElementById('wu_licenseIssueDate')?.value || null,
      licenseExpiryDate: document.getElementById('wu_licenseExpiryDate')?.value || null,
      dateOfBirth:       document.getElementById('wu_dateOfBirth')?.value || null,
      address:           document.getElementById('wu_address')?.value?.trim() || null,
      photoUrl:          document.getElementById('wu_photoUrl')?.value?.trim() || null,
      status:            document.getElementById('wu_driverStatus')?.value || 'active',
      assignedRouteId:   document.getElementById('wu_routeId')?.value?.trim() || null,
    } : {
      adminType: document.getElementById('wu_adminType')?.value || 'zone_admin',
      zoneId:    document.getElementById('wu_zoneId')?.value?.trim() || null,
    }),
  };

  const plateNumber = isDriver ? (document.getElementById('wu_plateNumber')?.value?.trim() || null) : null;
  const path = isDriver ? '/admin/drivers/with-user' : '/admin/admins/with-user';
  try {
    document.getElementById('modalSubmitBtn').disabled = true;
    const res = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) });

    if (isDriver && plateNumber) {
      const userId = res?.data?.user?.id;
      if (userId) {
        try {
          await apiFetch('/admin/buses', {
            method: 'POST',
            body: JSON.stringify({
              plateNumber,
              driverId:  userId,
              routeId:   body.assignedRouteId || null,
              status:    'on',
            }),
          });
          toast('สร้างคนขับรถและรถโดยสารเรียบร้อยแล้ว ✅', 'success');
        } catch (busErr) {
          toast(`สร้างคนขับสำเร็จ แต่สร้างรถไม่สำเร็จ: ${busErr.message || 'ลองสร้างรถแยกภายหลัง'}`, 'warning');
        }
      } else {
        toast('คนขับรถสร้างสำเร็จ ✅', 'success');
      }
    } else {
      toast(`${isDriver ? 'คนขับรถ' : 'ผู้ดูแลระบบ'}สร้างสำเร็จ ✅`, 'success');
    }

    closeModal();
    delete _ssCache['/admin/buses']; // invalidate so next render re-fetches
    if (section === 'drivers') renderBusDriver('drivers');
    else loadSection('admins');
  } catch (err) {
    alertDialog(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'บันทึกไม่สำเร็จ');
  } finally {
    document.getElementById('modalSubmitBtn').disabled = false;
  }
}

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
  try { await _init(); } finally { document.getElementById('appLoader')?.classList.add('hidden'); }
}

async function _init() {
  scheduleTokenExpiry();

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
    trackDailySession();

    // Fetch admin type for role-based nav
    if (u?.role === 'admin') {
      try {
        const ar = await apiFetch('/admin/admins');
        const admins = extractList(ar);
        const uid = u.id || u.user_id;
        const myAdmin = admins.find(a =>
          a.user_id === uid || a?.user?.id === uid
        );
        if (myAdmin) {
          state.adminType = myAdmin.admin_type;
          state.zoneId    = myAdmin.zone_id ?? null;
          // เก็บ zone label ไว้ใช้แสดงผลโดยไม่ต้อง fetch /admin/zones ซ้ำ
          if (myAdmin.zone) {
            state.zoneLabel = [myAdmin.zone.zone_code, myAdmin.zone.zone_name].filter(Boolean).join(' — ') || null;
          }
        } else {
          // fallback: call /auth/me again or check if super admin by process of elimination
          console.warn('[init] Could not find admin record for user', uid, 'in', admins.length, 'admins');
        }
      } catch (e) {
        console.error('[init] Failed to fetch admin list:', e);
      }
    }
  } catch {
    document.getElementById('userName').textContent = 'Admin';
    document.getElementById('userAvatar').textContent = 'A';
  }

  renderNav();
  checkHealth();
  await navigate('dashboard');
}

function setUserUI(u) {
  if (!u) return;
  const name = u.username || u.full_name || u.email || 'Admin';
  document.getElementById('userName').textContent  = name;
  document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('userRole').textContent   = u.role || 'admin';
}

/* =====================================================
   WAYPOINT EDITOR
   ===================================================== */
let _wpMap = null;
let _wpPolyline = null;
let _wpRoadPolyline = null;
let _wpMarkers = [];
let _wpPoints = [];
let _wpRouteId = null;
let _wpSaving = false;
let _wpEncoded = null; // encoded polyline string from Directions API
const MAPS_API_KEY = 'AIzaSyD7S9gqNZQ4rQDbNlDdCr0uDGz1RhWvwwM ';

let _mapsLoadPromise = null;
function _loadGoogleMaps() {
  if (_mapsLoadPromise) return _mapsLoadPromise;
  _mapsLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const timeout = setTimeout(() => {
      reject(new Error('Google Maps ใช้เวลาโหลดนานเกินไป — ตรวจสอบ API key และการเชื่อมต่ออินเตอร์เน็ต'));
    }, 15000);
    window._googleMapsReady = () => { clearTimeout(timeout); resolve(); };
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&callback=_googleMapsReady&loading=async`;
    s.async = true;
    s.onerror = () => {
      clearTimeout(timeout);
      _mapsLoadPromise = null;
      reject(new Error('โหลด Google Maps ไม่สำเร็จ — อาจเกิดจาก API key ถูก restrict หรือ Maps JavaScript API ไม่ได้เปิดใช้งาน'));
    };
    document.head.appendChild(s);
  });
  _mapsLoadPromise.catch(() => { _mapsLoadPromise = null; }); // allow retry on error
  return _mapsLoadPromise;
}

async function openWaypointEditor(routeId) {
  const route = (state.cache['routes'] || []).find(r => r.id === routeId);
  if (!route) return;
  _wpRouteId = routeId;
  _wpEncoded = route.route_polyline || null; // restore saved road polyline
  _wpPoints = [];
  try { const p = route.waypoints ? JSON.parse(route.waypoints) : []; if (Array.isArray(p)) _wpPoints = p.map(pt => ({lat: Number(pt.lat), lng: Number(pt.lng)})); } catch {}

  document.getElementById('wpTitle').textContent = `วาดเส้นทาง: ${route.route_name}`;
  document.getElementById('wpMeta').textContent = 'กำลังโหลดแผนที่...';
  document.getElementById('wpSnapStatus').textContent = '';
  document.getElementById('wpMap').innerHTML = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#f8fafc;color:#64748b;font-size:13px">
    <div style="width:32px;height:32px;border:3px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:spin .8s linear infinite"></div>
    <span>กำลังโหลดแผนที่...</span>
  </div>`;
  const overlay = document.getElementById('wpOverlay');
  overlay.style.display = 'flex';

  try {
    await _loadGoogleMaps();
  } catch (err) {
    document.getElementById('wpMeta').textContent = `❌ ${err.message}`;
    document.getElementById('wpMap').innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;padding:24px;text-align:center;color:#dc2626">
      <div style="font-size:48px">🗺️</div>
      <div style="font-weight:700;font-size:16px">โหลด Google Maps ไม่สำเร็จ</div>
      <div style="font-size:13px;color:#64748b;max-width:400px">${err.message}</div>
      <div style="font-size:12px;color:#94a3b8;max-width:420px;line-height:1.6">วิธีแก้ไข: ไปที่ <b>Google Cloud Console → APIs & Services → Credentials</b> → เลือก API key → ตั้ง Application restrictions เป็น <b>None</b> หรือเพิ่ม HTTP referrer สำหรับ localhost/domain ของคุณ แล้วตรวจสอบว่าเปิด <b>Maps JavaScript API</b> และ <b>Directions API</b> แล้ว</div>
    </div>`;
    return;
  }

  // Wait for browser to lay out the flex container before Google Maps measures the div
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  _wpInitMap(route);
}

function _parseCoords(str) {
  if (!str) return null;
  const [la, ln] = str.split(',').map(Number);
  if (isNaN(la) || isNaN(ln)) return null;
  return {lat: la, lng: ln};
}

function _wpInitMap(route) {
  const mapEl = document.getElementById('wpMap');
  mapEl.innerHTML = ''; // clear loading overlay / previous error message
  const startPt = _parseCoords(route.start_coords);
  const center = _wpPoints[0] ?? startPt ?? {lat: 13.7563, lng: 100.5018};

  _wpMap = new google.maps.Map(mapEl, {
    center,
    zoom: _wpPoints.length > 0 ? 13 : 12,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });
  // Force map to recalculate its size after container is laid out (immediate + delayed)
  google.maps.event.trigger(_wpMap, 'resize');
  setTimeout(() => { google.maps.event.trigger(_wpMap, 'resize'); _wpFitPoints(route); }, 300);

  // Reference markers: start (green) / end (red)
  const endPt = _parseCoords(route.end_coords);
  if (startPt) new google.maps.Marker({ position: startPt, map: _wpMap, title: 'จุดต้นทาง', icon: { url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle cx="9" cy="9" r="8" fill="%2316a34a" stroke="white" stroke-width="2"/><text x="9" y="13" text-anchor="middle" font-size="9" fill="white">S</text></svg>' }});
  if (endPt)   new google.maps.Marker({ position: endPt,   map: _wpMap, title: 'จุดปลายทาง', icon: { url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle cx="9" cy="9" r="8" fill="%23dc2626" stroke="white" stroke-width="2"/><text x="9" y="13" text-anchor="middle" font-size="9" fill="white">E</text></svg>' }});

  _wpPolyline = new google.maps.Polyline({
    path: _wpPoints,
    map: _wpMap,
    strokeColor: '#2563EB',
    strokeWeight: 4,
    strokeOpacity: 0.9,
  });

  _wpMap.addListener('click', e => {
    _wpPoints.push({lat: e.latLng.lat(), lng: e.latLng.lng()});
    _wpRedraw();
  });

  _wpRedraw();

  // Restore saved road polyline (from previous snap-to-roads)
  if (_wpEncoded) {
    const path = _decodePolyline5(_wpEncoded);
    _wpRoadPolyline = new google.maps.Polyline({
      path,
      map: _wpMap,
      strokeColor: '#10b981',
      strokeWeight: 5,
      strokeOpacity: 0.9,
      zIndex: 5,
    });
    _wpPolyline.setOptions({ strokeOpacity: 0.25, strokeColor: '#94a3b8' });
    const bounds = new google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    _wpMap.fitBounds(bounds, 60);
    const status = document.getElementById('wpSnapStatus');
    status.textContent = '✅ เส้นทางตามถนน (บันทึกแล้ว)'; status.style.color = '#16a34a';
  } else {
    _wpFitPoints(route);
  }
}

function _wpMarkerIcon(idx, total) {
  const isFirst = idx === 0, isLast = idx === total - 1;
  const fill = isFirst ? '%2316a34a' : isLast ? '%23dc2626' : '%232563eb';
  const label = isFirst ? '▶' : isLast ? '⏹' : String(idx + 1);
  return { url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36"><rect x="1" y="1" width="26" height="26" rx="7" fill="${fill}" stroke="white" stroke-width="2"/><polygon points="9,26 19,26 14,35" fill="${fill}"/><text x="14" y="18" text-anchor="middle" font-size="${label.length > 1 ? 9 : 13}" fill="white" font-weight="bold">${label}</text></svg>`, anchor: new google.maps.Point(14, 35) };
}

function _wpRedraw() {
  _wpMarkers.forEach(m => m.setMap(null));
  _wpMarkers = [];
  const n = _wpPoints.length;
  _wpPoints.forEach((pt, i) => {
    const m = new google.maps.Marker({ position: pt, map: _wpMap, icon: _wpMarkerIcon(i, n), zIndex: i + 10 });
    m.addListener('click', () => { _wpPoints.splice(i, 1); _wpRedraw(); });
    _wpMarkers.push(m);
  });
  _wpPolyline?.setPath(_wpPoints);
  document.getElementById('wpMeta').textContent = n > 0 ? `${n} จุด` : 'ยังไม่มีจุด — คลิกบนแผนที่เพื่อเริ่ม';
  document.getElementById('wpPointCount').textContent = n >= 2 ? `${n} จุด พร้อมบันทึก` : n === 1 ? 'ต้องการอย่างน้อย 2 จุด' : '';
}

function _wpFitPoints(route) {
  const allPts = [..._wpPoints];
  const s = _parseCoords(route?.start_coords), e = _parseCoords(route?.end_coords);
  if (s) allPts.push(s);
  if (e) allPts.push(e);
  if (allPts.length === 0) return;
  if (allPts.length === 1) { _wpMap.setCenter(allPts[0]); _wpMap.setZoom(14); return; }
  const bounds = new google.maps.LatLngBounds();
  allPts.forEach(p => bounds.extend(p));
  _wpMap.fitBounds(bounds, 60);
}

function wpUndo() {
  if (_wpPoints.length > 0) { _wpPoints.pop(); _wpRedraw(); }
}

function wpClear() {
  if (_wpPoints.length === 0) return;
  if (!confirm(`ล้าง ${_wpPoints.length} จุดทั้งหมด?`)) return;
  _wpPoints = [];
  _wpRedraw();
}

function _decodePolyline5(encoded) {
  const pts = [];
  let idx = 0, lat = 0, lng = 0;
  while (idx < encoded.length) {
    let shift = 0, r = 0, b;
    do { b = encoded.charCodeAt(idx++) - 63; r |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (r & 1) ? ~(r >> 1) : (r >> 1);
    shift = 0; r = 0;
    do { b = encoded.charCodeAt(idx++) - 63; r |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (r & 1) ? ~(r >> 1) : (r >> 1);
    pts.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return pts;
}

async function wpSnapToRoads() {
  if (_wpPoints.length < 2) { alert('ต้องมีอย่างน้อย 2 จุดก่อนจับเส้นตามถนน'); return; }

  const btn = document.getElementById('wpSnapBtn');
  const status = document.getElementById('wpSnapStatus');
  btn.textContent = '⏳ กำลังคำนวณ...'; btn.disabled = true;
  status.textContent = ''; status.style.color = '';

  try {
    // OSRM — free routing engine, no API key needed
    const coords = _wpPoints.map(p => `${p.lng},${p.lat}`).join(';');
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=polyline`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error(data.message || 'ไม่พบเส้นทาง');

    const route = data.routes[0];
    _wpEncoded = route.geometry; // encoded polyline5 string

    const path = _decodePolyline5(_wpEncoded);

    // Show road polyline (green) over the straight preview (blue)
    if (_wpRoadPolyline) _wpRoadPolyline.setMap(null);
    _wpRoadPolyline = new google.maps.Polyline({
      path,
      map: _wpMap,
      strokeColor: '#10b981',
      strokeWeight: 5,
      strokeOpacity: 0.9,
      zIndex: 5,
    });

    // Fade out the straight-line preview
    _wpPolyline.setOptions({ strokeOpacity: 0.25, strokeColor: '#94a3b8' });

    const totalKm = (route.distance / 1000).toFixed(1);
    status.textContent = `✅ จับเส้นตามถนนแล้ว · ${totalKm} km`; status.style.color = '#16a34a';
    document.getElementById('wpMeta').textContent = `${_wpPoints.length} จุดอ้างอิง · ระยะทางประมาณ ${totalKm} km`;

    // Fit bounds to road route
    const bounds = new google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    _wpMap.fitBounds(bounds, 60);
  } catch (err) {
    status.textContent = `❌ ไม่สำเร็จ: ${err.message}`; status.style.color = '#dc2626';
  } finally {
    btn.textContent = '🚗 จับเส้นตามถนน'; btn.disabled = false;
  }
}

function wpLocateMe() {
  if (!navigator.geolocation) { alert('เบราว์เซอร์นี้ไม่รองรับ Geolocation'); return; }
  const btn = document.getElementById('wpLocateBtn');
  btn.textContent = '⏳'; btn.disabled = true;
  navigator.geolocation.getCurrentPosition(
    pos => {
      btn.textContent = '📍 ตำแหน่งของฉัน'; btn.disabled = false;
      _wpMap.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      _wpMap.setZoom(16);
    },
    err => {
      btn.textContent = '📍 ตำแหน่งของฉัน'; btn.disabled = false;
      alert('ระบุตำแหน่งไม่ได้: ' + err.message);
    },
    { timeout: 10000 }
  );
}

function _wpSetSaving(on) {
  _wpSaving = on;
  const ov = document.getElementById('wpSaveOverlay');
  if (ov) ov.style.display = on ? 'flex' : 'none';
}

async function wpSave() {
  if (_wpSaving) return;
  if (_wpPoints.length < 2) { alert('ต้องมีอย่างน้อย 2 จุด'); return; }
  _wpSetSaving(true);
  try {
    const body = { waypoints: JSON.stringify(_wpPoints) };
    if (_wpEncoded) body.routePolyline = _wpEncoded;
    await apiFetch(`/admin/routes/${_wpRouteId}`, { method: 'PUT', body: JSON.stringify(body) });
    toast(_wpEncoded ? '✅ บันทึกเส้นทาง (ตามถนน) สำเร็จ' : '✅ บันทึกเส้นทางสำเร็จ', 'success');
    closeWaypointEditor();
    delete state.cache['routes'];
    loadSection('routes').catch(e => console.warn('reload routes:', e));
  } catch (err) {
    _wpSetSaving(false);
    toast('❌ บันทึกไม่สำเร็จ: ' + err.message, 'error');
  }
}

function closeWaypointEditor() {
  _wpSetSaving(false);
  document.getElementById('wpOverlay').style.display = 'none';
  _wpMarkers.forEach(m => m.setMap(null));
  if (_wpRoadPolyline) _wpRoadPolyline.setMap(null);
  _wpMarkers = []; _wpPoints = []; _wpMap = null; _wpPolyline = null;
  _wpRoadPolyline = null; _wpEncoded = null; _wpRouteId = null;
}

window.addEventListener('DOMContentLoaded', init);

// Event delegation for dynamically-generated waypoint editor buttons
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-wp-id]');
  if (btn) openWaypointEditor(btn.dataset.wpId);
});

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
window.onConfirmInput = onConfirmInput;
window.executeDelete  = executeDelete;
window.filterTable    = filterTable;
window.saveApiUrl     = saveApiUrl;
window.resetApiUrl    = resetApiUrl;
window.runHealthCheck = runHealthCheck;
window.loadSection    = loadSection;
window.renderDashboard = renderDashboard;
window.renderAnalytics = renderAnalytics;
window.renderBusDriver = renderBusDriver;
window.submitWithUser          = submitWithUser;
window.openWithUserModal       = openWithUserModal;
window.filterDriverRoutesByZone = filterDriverRoutesByZone;
window.genRouteCode            = genRouteCode;
window.openAssignAdminModal = openAssignAdminModal;
window.toggleAssignZone     = toggleAssignZone;
window.gotoPage             = gotoPage;
window.toggleGroup          = toggleGroup;
window.changePageSize  = changePageSize;
window.ssToggle        = ssToggle;
window.ssFilter        = ssFilter;
window.openResetPasswordModal = openResetPasswordModal;
window.openWaypointEditor  = openWaypointEditor;
window.closeWaypointEditor = closeWaypointEditor;
window.wpUndo        = wpUndo;
window.wpClear       = wpClear;
window.wpSave        = wpSave;
window.wpSnapToRoads = wpSnapToRoads;
window.wpLocateMe    = wpLocateMe;
