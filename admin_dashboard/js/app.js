/* ===== BUS TRACKING ADMIN — MAIN APP ===== */

// ===== STATE =====
const state = {
  section: 'dashboard',
  user: null,
  cache: {}
};

// ===== SECTION CONFIGS =====
const SECTIONS = {

  dashboard: {
    title: 'Dashboard', icon: '📊',
    subtitle: 'ภาพรวมระบบ Bus Tracking'
  },

  users: {
    title: 'ผู้ใช้งาน', icon: '👥',
    subtitle: 'จัดการข้อมูลผู้ใช้งานทั้งหมด',
    apiList:   () => api.getUsers(),
    apiCreate: (d) => api.createUser(d),
    apiUpdate: (id, d) => api.updateUser(id, d),
    apiDelete: (id) => api.deleteUser(id),
    apiGet:    (id) => api.getUser(id),
    idField: 'id',
    columns: [
      { key: 'id',       label: 'ID',           render: v => chip(v) },
      { key: 'username', label: 'Username',      render: v => `<strong>${v ?? '-'}</strong>` },
      { key: 'fullName', label: 'ชื่อ-นามสกุล' },
      { key: 'email',    label: 'Email' },
      { key: 'role',     label: 'บทบาท',         render: v => roleBadge(v) },
    ],
    formFields: [
      { name: 'username', label: 'Username',       type: 'text',     required: true  },
      { name: 'fullName', label: 'ชื่อ-นามสกุล',  type: 'text',     required: true  },
      { name: 'email',    label: 'Email',           type: 'email',    required: true  },
      { name: 'password', label: 'รหัสผ่าน',       type: 'password', required: false, createOnly: true },
      { name: 'role',     label: 'บทบาท',           type: 'select',   required: true,
        options: [
          { value: 'passenger', label: '🧑 ผู้โดยสาร' },
          { value: 'driver',    label: '🚌 คนขับรถ'  },
          { value: 'admin',     label: '👤 Admin'    },
        ]
      },
    ]
  },

  drivers: {
    title: 'คนขับรถ', icon: '🚌',
    subtitle: 'จัดการข้อมูลคนขับรถโดยสาร',
    apiList:   () => api.getDrivers(),
    apiCreate: (d) => api.createDriver(d),
    apiUpdate: (id, d) => api.updateDriver(id, d),
    apiDelete: (id) => api.deleteDriver(id),
    apiGet:    (id) => api.getDriver(id),
    idField: 'id',
    columns: [
      { key: 'id',            label: 'ID',            render: v => chip(v) },
      { key: 'name',          label: 'ชื่อคนขับ',     render: v => `<strong>${v ?? '-'}</strong>` },
      { key: 'licenseNumber', label: 'ใบขับขี่'       },
      { key: 'phone',         label: 'เบอร์โทร'       },
      { key: 'status',        label: 'สถานะ',          render: v => statusBadge(v) },
    ],
    formFields: [
      { name: 'name',          label: 'ชื่อคนขับ',      type: 'text', required: true  },
      { name: 'licenseNumber', label: 'หมายเลขใบขับขี่', type: 'text', required: false },
      { name: 'phone',         label: 'เบอร์โทรศัพท์',  type: 'text', required: false },
      { name: 'email',         label: 'Email',            type: 'email',required: false },
    ]
  },

  admins: {
    title: 'ผู้ดูแลระบบ', icon: '👤',
    subtitle: 'จัดการบัญชีผู้ดูแลระบบ',
    apiList:   () => api.getAdmins(),
    apiCreate: (d) => api.createAdmin(d),
    apiUpdate: (id, d) => api.updateAdmin(id, d),
    apiDelete: (id) => api.deleteAdmin(id),
    apiGet:    (id) => api.getAdmin(id),
    idField: 'id',
    columns: [
      { key: 'id',       label: 'ID',           render: v => chip(v) },
      { key: 'username', label: 'Username',      render: v => `<strong>${v ?? '-'}</strong>` },
      { key: 'fullName', label: 'ชื่อ-นามสกุล' },
      { key: 'email',    label: 'Email'          },
    ],
    formFields: [
      { name: 'username', label: 'Username',      type: 'text',     required: true  },
      { name: 'fullName', label: 'ชื่อ-นามสกุล', type: 'text',     required: true  },
      { name: 'email',    label: 'Email',          type: 'email',    required: true  },
      { name: 'password', label: 'รหัสผ่าน',      type: 'password', required: false, createOnly: true },
    ]
  },

  routes: {
    title: 'เส้นทางรถ', icon: '🛣️',
    subtitle: 'จัดการเส้นทางการให้บริการ',
    apiList:   () => api.getRoutes(),
    apiCreate: (d) => api.createRoute(d),
    apiUpdate: (id, d) => api.updateRoute(id, d),
    apiDelete: (id) => api.deleteRoute(id),
    apiGet:    (id) => api.getRoute(id),
    idField: 'id',
    columns: [
      { key: 'id',          label: 'ID',           render: v => chip(v) },
      { key: 'name',        label: 'ชื่อเส้นทาง',  render: v => `<strong>${v ?? '-'}</strong>` },
      { key: 'description', label: 'คำอธิบาย'      },
      { key: 'startPoint',  label: 'จุดเริ่มต้น'   },
      { key: 'endPoint',    label: 'จุดสิ้นสุด'    },
      { key: 'status',      label: 'สถานะ',          render: v => statusBadge(v) },
    ],
    formFields: [
      { name: 'name',        label: 'ชื่อเส้นทาง',  type: 'text',     required: true  },
      { name: 'description', label: 'คำอธิบาย',      type: 'textarea', required: false },
      { name: 'startPoint',  label: 'จุดเริ่มต้น',  type: 'text',     required: false },
      { name: 'endPoint',    label: 'จุดสิ้นสุด',   type: 'text',     required: false },
    ]
  },

  buses: {
    title: 'รถโดยสาร', icon: '🚍',
    subtitle: 'จัดการข้อมูลรถโดยสารทั้งหมด',
    apiList:   () => api.getBuses(),
    apiCreate: (d) => api.createBus(d),
    apiUpdate: (id, d) => api.updateBus(id, d),
    apiDelete: (id) => api.deleteBus(id),
    apiGet:    (id) => api.getBus(id),
    idField: 'id',
    columns: [
      { key: 'id',           label: 'ID',           render: v => chip(v) },
      { key: 'busNumber',    label: 'หมายเลขรถ',    render: v => `<strong>${v ?? '-'}</strong>` },
      { key: 'licensePlate', label: 'ทะเบียนรถ'     },
      { key: 'capacity',     label: 'ความจุ (คน)'   },
      { key: 'routeId',      label: 'Route ID',       render: v => v ? chip(v) : '-' },
      { key: 'status',       label: 'สถานะ',          render: v => statusBadge(v) },
    ],
    formFields: [
      { name: 'busNumber',    label: 'หมายเลขรถ',    type: 'text',   required: true  },
      { name: 'licensePlate', label: 'ทะเบียนรถ',    type: 'text',   required: false },
      { name: 'capacity',     label: 'ความจุผู้โดยสาร (คน)', type: 'number', required: false },
      { name: 'routeId',      label: 'Route ID',       type: 'text',   required: false },
    ]
  },

  routeAdmins: {
    title: 'มอบหมายเส้นทาง', icon: '🔗',
    subtitle: 'กำหนด Admin ประจำเส้นทาง',
    apiList:   () => api.getRouteAdmins(),
    apiCreate: (d) => api.createRouteAdmin(d),
    apiDelete: (id) => api.deleteRouteAdmin(id),
    idField: 'id',
    noEdit: true,
    columns: [
      { key: 'id',      label: 'ID',       render: v => chip(v) },
      { key: 'routeId', label: 'Route ID', render: v => v ? chip(v) : '-' },
      { key: 'adminId', label: 'Admin ID', render: v => v ? chip(v) : '-' },
    ],
    formFields: [
      { name: 'routeId', label: 'Route ID', type: 'text', required: true },
      { name: 'adminId', label: 'Admin ID', type: 'text', required: true },
    ]
  },

  waiting: {
    title: 'รายการรอรับ', icon: '⏳',
    subtitle: 'ติดตามรายการผู้โดยสารรอรับ',
    apiList: () => api.adminWaiting(),
    idField: 'id',
    readOnly: true,
    columns: [
      { key: 'id',        label: 'ID',         render: v => chip(v) },
      { key: 'userId',    label: 'User ID',     render: v => v ? chip(v) : '-' },
      { key: 'routeId',   label: 'Route ID',    render: v => v ? chip(v) : '-' },
      { key: 'status',    label: 'สถานะ',       render: v => statusBadge(v) },
      { key: 'createdAt', label: 'เวลา',        render: v => fmtDate(v) },
    ]
  }
};

// ===== HELPERS =====
function shortId(id) {
  if (!id) return '';
  const s = String(id);
  return s.length > 12 ? s.slice(0, 8) + '…' : s;
}

function chip(v) {
  if (!v) return '<span class="text-muted">-</span>';
  return `<span class="id-chip" title="${v}">${shortId(v)}</span>`;
}

function fmtDate(d) {
  if (!d) return '-';
  try { return new Date(d).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return d; }
}

function roleBadge(role) {
  const map = {
    passenger:  '<span class="badge b-blue">👤 ผู้โดยสาร</span>',
    driver:     '<span class="badge b-green">🚌 คนขับ</span>',
    admin:      '<span class="badge b-purple">👤 Admin</span>',
    superadmin: '<span class="badge b-red">⭐ Super Admin</span>',
  };
  return map[role] || `<span class="badge b-gray">${role ?? '-'}</span>`;
}

function statusBadge(s) {
  if (!s) return '<span class="badge b-gray">-</span>';
  const map = {
    active:    '<span class="badge b-green">✅ ใช้งาน</span>',
    inactive:  '<span class="badge b-gray">⛔ ไม่ใช้งาน</span>',
    on_duty:   '<span class="badge b-green">🟢 ปฏิบัติงาน</span>',
    off_duty:  '<span class="badge b-gray">⚫ ไม่ปฏิบัติ</span>',
    waiting:   '<span class="badge b-yellow">⏳ รอรับ</span>',
    picked_up: '<span class="badge b-teal">✅ รับแล้ว</span>',
    cancelled: '<span class="badge b-red">❌ ยกเลิก</span>',
    online:    '<span class="badge b-green">🟢 Online</span>',
    offline:   '<span class="badge b-red">🔴 Offline</span>',
  };
  return map[String(s).toLowerCase()] || `<span class="badge b-gray">${s}</span>`;
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== TOAST =====
function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ===== NAVIGATION =====
function navigate(section) {
  state.section = section;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.section === section);
  });
  const cfg = SECTIONS[section];
  document.getElementById('pageTitle').textContent = `${cfg.icon} ${cfg.title}`;
  document.getElementById('pageSubtitle').textContent = cfg.subtitle;
  renderSection(section);
}

// ===== RENDER SECTION =====
async function renderSection(section) {
  const content = document.getElementById('mainContent');

  if (section === 'dashboard') { renderDashboard(); return; }

  const cfg = SECTIONS[section];
  if (!cfg) return;

  content.innerHTML = `<div class="card"><div class="loading"><div class="spinner"></div> กำลังโหลดข้อมูล...</div></div>`;

  try {
    const raw = await cfg.apiList();
    const items = extractList(raw);
    state.cache[section] = items;
    renderTable(section, items);
  } catch (err) {
    content.innerHTML = errCard(section, err.message);
  }
}

function errCard(section, msg) {
  return `<div class="card"><div class="card-body"><div class="empty-state">
    <div class="ei">⚠️</div>
    <h3>ไม่สามารถโหลดข้อมูลได้</h3>
    <p>${esc(msg)}</p>
    <button class="btn btn-primary" style="margin-top:16px" onclick="renderSection('${section}')">🔄 ลองอีกครั้ง</button>
  </div></div></div>`;
}

// ===== RENDER TABLE =====
function renderTable(section, items) {
  const content = document.getElementById('mainContent');
  const cfg = SECTIONS[section];
  const ro = !!cfg.readOnly;
  const noEdit = !!cfg.noEdit;
  const colCount = cfg.columns.length + (ro ? 0 : 1);

  let rows = '';
  if (!items.length) {
    rows = `<tr><td colspan="${colCount}" style="text-align:center;padding:48px;color:var(--text-muted)">
      <div style="font-size:36px;margin-bottom:10px">📭</div>ไม่มีข้อมูล
    </td></tr>`;
  } else {
    rows = items.map(item => {
      const id = item[cfg.idField];
      let cells = cfg.columns.map(col => {
        const val = item[col.key];
        return `<td>${col.render ? col.render(val, item) : (val ?? '-')}</td>`;
      }).join('');

      if (!ro) {
        cells += `<td><div class="actions">
          ${!noEdit ? `<button class="btn btn-warning btn-icon btn-sm" onclick="openEdit('${section}','${id}')" title="แก้ไข">✏️</button>` : ''}
          <button class="btn btn-danger btn-icon btn-sm" onclick="askDelete('${section}','${id}')" title="ลบ">🗑️</button>
        </div></td>`;
      }
      return `<tr>${cells}</tr>`;
    }).join('');
  }

  content.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">${cfg.icon} ${cfg.title}
          <span class="badge b-gray" style="margin-left:6px">${items.length} รายการ</span>
        </div>
        <div class="toolbar">
          <div class="search-wrap">
            <span class="s-icon">🔍</span>
            <input id="searchInput" type="text" class="form-control" placeholder="ค้นหา..." oninput="filterTable()">
          </div>
          ${!ro ? `<button class="btn btn-primary" onclick="openCreate('${section}')">＋ เพิ่มรายการ</button>` : ''}
          <button class="btn btn-secondary btn-sm" onclick="renderSection('${section}')">🔄 รีเฟรช</button>
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

// ===== FILTER =====
function filterTable() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  document.querySelectorAll('#dataTable tbody tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

// ===== DASHBOARD =====
async function renderDashboard() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div class="card"><div class="loading"><div class="spinner"></div> กำลังโหลด Dashboard...</div></div>`;

  try {
    const raw = await api.summary();
    const s = raw?.data || raw || {};

    const statCards = [
      { icon: '🛣️', cls: 'si-blue',   val: s.totalRoutes  ?? s.routes  ?? s.routeCount  ?? '—', label: 'เส้นทางทั้งหมด'   },
      { icon: '🚍', cls: 'si-green',  val: s.totalBuses   ?? s.buses   ?? s.busCount    ?? '—', label: 'รถโดยสารทั้งหมด' },
      { icon: '🟢', cls: 'si-yellow', val: s.activeBuses  ?? s.busesOnDuty ?? s.activeBusCount ?? '—', label: 'รถที่ออกให้บริการ' },
      { icon: '🚌', cls: 'si-purple', val: s.totalDrivers ?? s.drivers ?? s.driverCount  ?? '—', label: 'คนขับทั้งหมด'     },
      { icon: '👥', cls: 'si-indigo', val: s.totalUsers   ?? s.users   ?? s.userCount    ?? '—', label: 'ผู้ใช้งานทั้งหมด' },
      { icon: '⏳', cls: 'si-red',    val: s.totalWaiting ?? s.waitingCount ?? s.waiting ?? '—', label: 'รายการรอรับ'      },
      { icon: '👤', cls: 'si-teal',   val: s.totalAdmins  ?? s.admins  ?? s.adminCount  ?? '—', label: 'Admin ทั้งหมด'   },
    ];

    content.innerHTML = `
      <div class="stats-grid">
        ${statCards.map(c => `
          <div class="stat-card">
            <div class="stat-icon ${c.cls}">${c.icon}</div>
            <div>
              <div class="stat-value">${c.val}</div>
              <div class="stat-label">${c.label}</div>
            </div>
          </div>`).join('')}
      </div>

      <div class="card" style="margin-top:8px">
        <div class="card-header">
          <div class="card-title">📋 ข้อมูล Summary (Raw)</div>
          <button class="btn btn-secondary btn-sm" onclick="renderDashboard()">🔄 รีเฟรช</button>
        </div>
        <div class="card-body">
          <pre style="font-size:12px;color:var(--text-muted);background:#f8fafc;padding:16px;border-radius:8px;overflow-x:auto;line-height:1.6">${JSON.stringify(s, null, 2)}</pre>
        </div>
      </div>`;
  } catch (err) {
    content.innerHTML = errCard('dashboard', err.message);
  }
}

// ===== MODAL CRUD =====
const modal = {
  el:      () => document.getElementById('crudModal'),
  form:    () => document.getElementById('modalForm'),
  title:   () => document.getElementById('modalTitle'),
  body:    () => document.getElementById('modalBody'),
  submitBtn: () => document.getElementById('modalSubmitBtn'),
  section: null, mode: null, editId: null
};

function openCreate(section) {
  const cfg = SECTIONS[section];
  modal.section = section; modal.mode = 'create'; modal.editId = null;
  modal.title().textContent = `➕ เพิ่ม${cfg.title}`;
  modal.body().innerHTML = buildFormFields(cfg.formFields, null, 'create');
  modal.submitBtn().textContent = '💾 บันทึก';
  modal.el().classList.remove('hidden');
}

async function openEdit(section, id) {
  const cfg = SECTIONS[section];
  modal.section = section; modal.mode = 'edit'; modal.editId = id;
  modal.title().textContent = `✏️ แก้ไข${cfg.title}`;
  modal.body().innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  modal.submitBtn().textContent = '💾 บันทึกการแก้ไข';
  modal.el().classList.remove('hidden');

  try {
    let item = state.cache[section]?.find(x => String(x[cfg.idField]) === String(id));
    if (!item && cfg.apiGet) {
      const r = await cfg.apiGet(id);
      item = r?.data || r;
    }
    modal.body().innerHTML = buildFormFields(cfg.formFields, item, 'edit');
  } catch (err) {
    modal.body().innerHTML = `<p style="color:var(--danger);padding:16px">⚠️ โหลดข้อมูลไม่ได้: ${esc(err.message)}</p>`;
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
  const data = {};
  fd.forEach((v, k) => { if (v !== '') data[k] = v; });

  const btn = modal.submitBtn();
  btn.disabled = true;
  btn.textContent = '⏳ กำลังบันทึก...';

  try {
    if (mode === 'create') {
      await cfg.apiCreate(data);
      toast(`เพิ่ม${cfg.title}สำเร็จ ✅`, 'success');
    } else {
      await cfg.apiUpdate(editId, data);
      toast(`แก้ไข${cfg.title}สำเร็จ ✅`, 'success');
    }
    closeModal();
    renderSection(section);
  } catch (err) {
    toast(`❌ เกิดข้อผิดพลาด: ${err.message}`, 'error');
    btn.disabled = false;
    btn.textContent = mode === 'create' ? '💾 บันทึก' : '💾 บันทึกการแก้ไข';
  }
}

// ===== BUILD FORM FIELDS =====
function buildFormFields(fields, data, mode) {
  return fields
    .filter(f => !(mode === 'edit' && f.createOnly))
    .map(f => {
      const val = data?.[f.name] ?? '';
      const req = f.required ? '<span class="req">*</span>' : '';

      if (f.type === 'select') {
        const opts = f.options.map(o =>
          `<option value="${o.value}" ${String(val) === o.value ? 'selected' : ''}>${o.label}</option>`
        ).join('');
        return `<div class="form-group">
          <label class="form-label">${f.label}${req}</label>
          <select name="${f.name}" class="form-control" ${f.required ? 'required' : ''}>
            <option value="">— เลือก —</option>${opts}
          </select></div>`;
      }
      if (f.type === 'textarea') {
        return `<div class="form-group">
          <label class="form-label">${f.label}${req}</label>
          <textarea name="${f.name}" class="form-control" rows="3" ${f.required ? 'required' : ''}>${esc(val)}</textarea></div>`;
      }
      return `<div class="form-group">
        <label class="form-label">${f.label}${req}</label>
        <input type="${f.type}" name="${f.name}" class="form-control"
          value="${esc(val)}" placeholder="${f.label}" ${f.required ? 'required' : ''}></div>`;
    }).join('');
}

// ===== CONFIRM DELETE =====
const delState = { section: null, id: null };

function askDelete(section, id) {
  delState.section = section; delState.id = id;
  const cfg = SECTIONS[section];
  document.getElementById('confirmText').textContent =
    `คุณต้องการลบ ${cfg.title} (ID: ${shortId(id)}) ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`;
  document.getElementById('confirmModal').classList.remove('hidden');
}

function closeConfirm() {
  document.getElementById('confirmModal').classList.add('hidden');
  delState.section = null; delState.id = null;
}

async function executeDelete() {
  const { section, id } = delState;
  const cfg = SECTIONS[section];
  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true; btn.textContent = '⏳ กำลังลบ...';

  try {
    await cfg.apiDelete(id);
    toast(`ลบ${cfg.title}สำเร็จ`, 'success');
    closeConfirm();
    renderSection(section);
  } catch (err) {
    toast(`❌ ลบไม่สำเร็จ: ${err.message}`, 'error');
    btn.disabled = false; btn.textContent = '🗑️ ยืนยันการลบ';
  }
}

// ===== CLOSE OVERLAYS ON BACKDROP =====
document.addEventListener('click', e => {
  if (e.target.id === 'crudModal')    closeModal();
  if (e.target.id === 'confirmModal') closeConfirm();
});

// ===== HEALTH CHECK =====
async function checkHealth() {
  try {
    await api.health();
    document.getElementById('healthBadge').innerHTML =
      `<span class="health-dot"></span> ระบบออนไลน์`;
    document.getElementById('healthBadge').style.display = 'flex';
  } catch {
    document.getElementById('healthBadge').innerHTML =
      `<span class="health-dot" style="background:var(--danger);animation:none"></span> ออฟไลน์`;
    document.getElementById('healthBadge').style.background = '#fef2f2';
    document.getElementById('healthBadge').style.borderColor = '#fca5a5';
    document.getElementById('healthBadge').style.color = '#991b1b';
  }
}

// ===== LOGOUT =====
function logout() {
  if (confirm('ต้องการออกจากระบบ?')) {
    clearToken();
    window.location.href = 'login.html';
  }
}

// ===== INIT =====
async function init() {
  const token = getToken();
  if (!token) { window.location.href = 'login.html'; return; }

  // Load user profile
  try {
    const r = await api.me();
    state.user = r?.data || r?.user || r;
    const name = state.user?.username || state.user?.fullName || 'Admin';
    document.getElementById('userName').textContent = name;
    document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
    document.getElementById('userRole').textContent = state.user?.role || 'admin';
  } catch {
    document.getElementById('userName').textContent = 'Admin';
    document.getElementById('userAvatar').textContent = 'A';
    document.getElementById('userRole').textContent = 'admin';
  }

  checkHealth();
  navigate('dashboard');
}

window.addEventListener('DOMContentLoaded', init);
