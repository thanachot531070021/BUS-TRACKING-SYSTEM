# BUS TRACKING SYSTEM — Status Checklist

Last updated: 2026-05-15

---

## Backend (`C:\Web Source\backend\worker`)

### Auth & Middleware
- [x] Supabase JWT decode and verification in middleware
- [x] `requireAuth` — Bearer token → profile lookup by `auth_user_id`
- [x] Auto-link fallback — if no `auth_user_id` match, finds by email from JWT and links automatically
- [x] `requireRole` — role-based guard
- [x] `enrichAdminScope` — loads admin type + zone + routeIds[] for zone_admin
- [x] `requireAdminScope` — combines role check + zone enforcement
- [x] zone_admin cannot create super_admin (403 Forbidden)
- [x] zone_admin cannot assign drivers to routes outside their zone
- [ ] JWT `exp` (expiry) not yet validated — expired tokens still pass

### Zone Management
- [x] List zones
- [x] Create zone
- [x] Update zone
- [x] Delete zone
- [x] Public `GET /zones` and `GET /zones/:id`
- [x] Public `GET /structure` — full zone/route/driver/bus tree

### User Management
- [x] List users (with admin_profile join)
- [x] Get user by ID
- [x] Create user — also creates Supabase Auth user via service_role_key
- [x] Update user
- [x] Delete user

### Admin Management
- [x] List admins
- [x] Create admin
- [x] Update admin
- [x] Delete admin
- [x] `POST /admin/admins/with-user` — 2-step: creates user + admin record

### Driver Management
- [x] List drivers (zone-scoped for zone_admin)
- [x] Create driver
- [x] Update driver (also updates linked user fields)
- [x] Delete driver
- [x] `POST /admin/drivers/with-user` — 2-step: creates user + driver record
- [x] Password reset endpoint

### Bus Management
- [x] List buses (zone-scoped, with embedded route + driver_user)
- [x] Create bus
- [x] Update bus
- [x] Delete bus
- [x] `active_buses_live` view for live tracking

### Route Management
- [x] Full CRUD for routes (zone-scoped)

### Public Endpoints
- [x] `GET /structure`
- [x] `GET /zones`, `GET /zones/:id`
- [x] `GET /routes`, `GET /routes/:id`
- [x] `GET /buses/live`, `GET /buses/:id`
- [x] `GET /waiting`, `POST /waiting`, `DELETE /waiting/:id`

### Infrastructure
- [x] Deployed to Cloudflare Workers
- [x] `SUPABASE_URL` set in `wrangler.toml`
- [x] `SUPABASE_ANON_KEY` set in `wrangler.toml`
- [x] `SUPABASE_SERVICE_ROLE_KEY` set as Wrangler secret

---

## Admin Dashboard (`C:\Web Source\apps\admin_dashboard`)

### Login
- [x] Login page (`login.html`) — email/password
- [x] Token stored in localStorage
- [x] Redirect to dashboard on success
- [x] Logout button

### Layout & Navigation
- [x] Sidebar with role-based nav items (super_admin sees all; zone_admin sees subset)
- [x] Topbar with page title, user info, health badge
- [x] Mobile responsive sidebar (toggle/overlay)
- [x] App loader on startup
- [x] Grouped tables with collapse/expand per section

### Dashboard
- [x] Summary stats cards (zones, routes, buses, drivers)
- [x] Zone-scoped stats for zone_admin

### Zones Page (super_admin only)
- [x] List all zones
- [x] Create zone
- [x] Edit zone
- [x] Delete zone

### Routes Page
- [x] List routes, grouped by zone (collapse/expand)
- [x] Create route — zone selector → auto-generate route_code (with 🔄 regenerate button)
- [x] Zone Admin: zone locked to own zone
- [x] Edit route
- [x] Delete route

### Drivers Page (busDriver tab)
- [x] List drivers, grouped by assigned route (collapse/expand)
- [x] Columns: ชื่อ, รหัสพนักงาน, ใบขับขี่, เส้นทาง, ทะเบียนรถ, สถานะ, สร้างโดย, แก้ไขล่าสุดโดย
- [x] Create driver — 2-step modal (User account → Driver info)
  - [x] Auto-generate employee_code from route selection
  - [x] Optional plate number → auto-creates bus (status = on) and links driver
- [x] Edit driver
  - [x] Bus section in edit form: shows current plate / create new bus if none
  - [x] Plate number change updates linked bus
- [x] Delete driver
- [x] Reset password (generates temp password, shows to admin)

### Buses Page (busDriver tab)
- [x] List buses, grouped by route (collapse/expand)
- [x] Columns: ทะเบียนรถ, เส้นทาง, คนขับ, สถานะ, สร้างโดย, แก้ไขล่าสุดโดย
- [x] Create bus — route auto-derived from driver selection (not manually editable)
- [x] Driver dropdown shows only unassigned drivers
- [x] Edit bus — same route auto-derive logic
- [x] Delete bus

### Admins Page
- [x] List admins with zone info
- [x] Create admin — 2-step modal (User account → Admin type + zone)
- [x] Edit admin record
- [x] Delete admin
- [ ] zone_admin filter on list (backend enforces; frontend shows all for now)

### Users Page (super_admin only)
- [x] List all users with role badges
- [x] Create user (all roles, including super_admin → auto-creates admins record)
- [x] Edit user role (promotes/demotes admins record accordingly)
- [x] Delete user
- [x] Reset password

### Waiting Page
- [x] Read-only list of passenger_waiting records

### Searchable Async Select (SS)
- [x] Reusable async dropdown with search
- [x] filterFn support (hide already-assigned drivers in bus form)
- [x] Auto-fill current value on open (hidden input written on initial load)

### Infrastructure
- [x] Vanilla JS ES module (no build step)
- [x] All modal/handler functions on `window.*`
- [x] Deployed to Cloudflare Workers (static assets via `wrangler.jsonc`)

---

## Supabase

- [x] `public.users` — user profile + role + auth_user_id link
- [x] `public.admins` — admin_type + zone_id
- [x] `public.drivers` — driver profile + assigned_route_id
- [x] `public.routes` — route definitions + zone_id
- [x] `public.buses` — bus fleet + driver_id + route_id
- [x] `public.zones` — zone definitions
- [x] `public.passenger_waiting` — waiting requests
- [x] `public.bus_locations` — GPS history
- [ ] Supabase Realtime not yet enabled on bus_locations / passenger_waiting
- [ ] RLS policies currently bypassed by service_role_key (review before production)

---

## Flutter Mobile App

- [x] App scaffold (Passenger + Driver flows) — all phases complete
- [ ] Not yet connected to real Supabase auth
- [ ] Not yet connected to real API
- [ ] Google Maps integration not yet complete
- [ ] Realtime bus tracking not yet wired

---

## Known Issues

| Issue | Status | Notes |
|-------|--------|-------|
| JWT expiry not validated | Open | Expired tokens still pass `requireAuth` |
| Supabase Free tier auto-pauses | Known | Restore from Supabase dashboard if 530 error |
| RLS policies not active | Open | Service role key bypasses all RLS |
| Flutter not wired to backend | Open | Scaffold complete; needs API integration |

---

## Deployed URLs

| Service | URL |
|---------|-----|
| Backend API | `https://bus-tracking-worker.thanachot-jo888.workers.dev` |
| Admin Dashboard | `https://bus-tracking-admin-dashboard.thanachot-jo888.workers.dev` |
