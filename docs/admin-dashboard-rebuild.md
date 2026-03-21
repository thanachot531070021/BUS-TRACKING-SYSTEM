# Admin Dashboard — Rebuild Summary

> **วันที่ทำ:** 21 มีนาคม 2026
> **ผู้ทำ:** Claude (AI Assistant)
> **Path โปรเจกต์:** `C:\Web Source\apps\admin_dashboard`
> **Live URL:** https://bus-tracking-admin-web.thanachot-jo888.workers.dev

---

## สรุปสิ่งที่ทำไป

Admin Dashboard ของระบบ **Bus Tracking System** ถูก rebuild ใหม่ทั้งหมด จากหน้าเดิมที่แสดงทุกอย่างใน scroll page เดียว → เป็น **SPA (Single-Page Application)** ที่มีหน้า Login แยก และเมนูแยกชัดเจน

---

## ไฟล์ที่เปลี่ยนแปลง

| ไฟล์ | การเปลี่ยนแปลง |
|------|---------------|
| `login.html` | ✅ **สร้างใหม่** — หน้า Login แยกต่างหาก |
| `index.html` | ✅ **เขียนใหม่ทั้งหมด** — SPA shell (Sidebar + Topbar + Content) |
| `styles.css` | ✅ **เขียนใหม่ทั้งหมด** — Modern design system |
| `script.js` | ✅ **เขียนใหม่ทั้งหมด** — SPA logic + CRUD + Section routing |
| `vite.config.js` | ✅ **อัปเดต** — Multi-page build (index + login) |

---

## โครงสร้างหน้าเว็บ

```
login.html          ← เข้าได้โดยไม่ต้อง login
    ↓ (หลัง login สำเร็จ)
index.html          ← SPA หลัก (ต้องมี token ถึงเข้าได้)
    ├── 📊 Dashboard
    ├── 👥 ผู้ใช้งาน
    ├── 🚌 คนขับรถ
    ├── 👤 ผู้ดูแลระบบ
    ├── 🛣️ เส้นทางรถ
    ├── 🚍 รถโดยสาร
    ├── ⏳ รายการรอรับ
    ├── 🔗 มอบหมายเส้นทาง
    └── ⚙️ การตั้งค่า API
```

---

## รายละเอียดแต่ละไฟล์

### `login.html`
- หน้า Login สำหรับ Admin โดยเฉพาะ (standalone, ไม่ใช้ external CSS)
- เรียก `POST /auth/login` พร้อม `expectedRole: "admin"`
- เก็บ token ลง `localStorage` key `bus-tracking-admin-token`
- ถ้ามี token อยู่แล้ว → redirect ไป `index.html` ทันที
- มี: animation, show/hide password, error shake animation, loading state

### `index.html`
- SPA shell — ไม่มี content ในตัว ทุกอย่าง inject ด้วย JS
- Sidebar navigation พร้อม active state
- Topbar แสดงชื่อ section + user info + logout button + health badge
- Modal สำหรับ CRUD (shared modal ใช้ได้กับทุก section)
- Modal ยืนยันการลบ
- Toast container
- โหลด `script.js` ด้วย `type="module"`

### `styles.css`
- ใช้ **CSS Variables** สำหรับ theming ทั้งหมด
- Sidebar: dark navy (`#0f172a`)
- Cards, tables, badges, modals, forms, toast, spinner
- Responsive (breakpoint 900px, 600px)

### `script.js`
- **Section Config Pattern** — แต่ละ section มี config object กำหนด:
  - `listPath`, `createPath`, `updatePath`, `deletePath`
  - `columns` สำหรับ render table
  - `formFields` สำหรับ render modal form (พร้อม response key mapping)
- **API field mapping**: Response ใช้ `snake_case` (เช่น `full_name`) → Form ส่ง `camelCase` (เช่น `fullName`)
- Functions หลัก:
  - `navigate(section)` — switch section + update sidebar
  - `loadSection(section)` — fetch data + render table
  - `renderDashboard()` — แสดง summary cards
  - `openCreate/openEdit/submitModal` — CRUD modal
  - `askDelete/executeDelete` — confirm + delete
  - `toast(msg, type)` — notification
- Expose functions ผ่าน `window.xxx` เพราะใช้ `type="module"` ทำให้ scope เป็น module ไม่ใช่ global

### `vite.config.js`
```js
build: {
  rollupOptions: {
    input: {
      main:  resolve(__dirname, 'index.html'),
      login: resolve(__dirname, 'login.html'),
    }
  }
}
```
เพิ่ม `login.html` เป็น entry point เพื่อให้ถูก build เข้า `dist/` ด้วย

---

## API Endpoints ที่ใช้

| Section | Endpoints |
|---------|-----------|
| Dashboard | `GET /admin/summary` |
| ผู้ใช้งาน | `GET/POST /admin/users`, `PUT/DELETE /admin/users/:id` |
| คนขับรถ | `GET/POST /admin/drivers`, `PUT/DELETE /admin/drivers/:id` |
| ผู้ดูแลระบบ | `GET/POST /admin/admins`, `PUT/DELETE /admin/admins/:id` |
| เส้นทางรถ | `GET/POST /admin/routes`, `PUT/DELETE /admin/routes/:id` |
| รถโดยสาร | `GET/POST /admin/buses`, `PUT/DELETE /admin/buses/:id` |
| รายการรอรับ | `GET /admin/waiting` (read-only) |
| มอบหมายเส้นทาง | `GET/POST /admin/route-admins`, `DELETE /admin/route-admins/:id` |
| Health | `GET /health`, `GET /health/db` |
| Auth | `POST /auth/login`, `GET /auth/me` |

> **API Base URL:** `https://bus-tracking-worker.thanachot-jo888.workers.dev`
> สามารถเปลี่ยนได้ในหน้า ⚙️ การตั้งค่า API

---

## Deployment

### โครงสร้าง Deployment
```
apps/admin_dashboard/         ← Source code (Vite)
    └── dist/                 ← Build output
          ├── index.html
          ├── login.html
          └── assets/
                ├── main.css
                └── main.js

backend/admin-web-worker/     ← Cloudflare Worker
    └── wrangler.toml         ← ชี้ assets ไปที่ dist/
```

### คำสั่ง Deploy
```bash
# 1. Build
cd "C:\Web Source\apps\admin_dashboard"
npm run build

# 2. Deploy
cd "C:\Web Source\backend\admin-web-worker"
npx wrangler deploy
```

### Live URL
```
https://bus-tracking-admin-web.thanachot-jo888.workers.dev
```

---

## ก่อน vs หลัง

| หัวข้อ | ก่อน | หลัง |
|--------|------|------|
| Login | อยู่ในหน้าเดียวกัน | หน้าแยก (`login.html`) |
| Navigation | Anchor links scroll | SPA menu สลับ section |
| CRUD Forms | Inline บนหน้า | Modal popup |
| Design | Basic | Modern cards, badges, sidebar |
| Auth Guard | ไม่มี | Redirect ไป login ถ้าไม่มี token |
| Search | ไม่มี | ค้นหาใน table แบบ real-time |
| Notifications | Status text | Toast notifications |
| API URL | กรอกใน input | ตั้งค่าได้ในหน้า Settings |

---

## Git Commit

```
refactor(admin-dashboard): rebuild as modern SPA with login page
Commit: 8dfa53a
Branch: master
```
