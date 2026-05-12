# BUS TRACKING SYSTEM — Status Checklist

---

## Backend (`C:\Web Source\backend\worker`)

### Auth & Middleware
- [x] Supabase JWT decode and verification in middleware
- [x] `requireAuth` — Bearer token → profile lookup by `auth_user_id`
- [x] Auto-link fallback — if no `auth_user_id` match, finds by email from JWT and links automatically
- [x] `requireRole` — role-based guard
- [x] `enrichAdminScope` — loads admin type + zone + route IDs for zone_admin
- [x] `requireAdminScope` — combines role check + zone enforcement
- [x] zone_admin cannot create super_admin (403 Forbidden)
- [x] zone_admin cannot assign drivers to routes outside their zone
- [ ] JWT `exp` (expiry) not yet validated — expired tokens still pass

### User Management
- [x] List users (with admin_profile join)
- [x] Get user by ID
- [x] Create user — **also creates Supabase Auth user** if password + service_role_key present
- [x] Update user
- [x] Delete user

### Admin Management
- [x] List admins
- [x] Create admin (assign existing user as admin)
- [x] Update admin
- [x] Delete admin
- [x] Admin with-user creation (legacy — use Users page instead)

### Driver / Bus / Route
- [x] Full CRUD for drivers (zone-scoped for zone_admin)
- [x] Full CRUD for buses
- [x] Full CRUD for routes
- [x] Zone filtering on all list endpoints

### Public Endpoints (no auth)
- [x] `GET /structure` — full zone/route/driver/passenger tree
- [x] `GET /zones` — list all zones
- [x] `GET /zones/:id` — zone detail

### Infrastructure
- [x] Deployed to Cloudflare Workers
- [x] `SUPABASE_URL` — set as env var in `wrangler.toml`
- [x] `SUPABASE_ANON_KEY` — set as env var in `wrangler.toml`
- [x] `SUPABASE_SERVICE_ROLE_KEY` — set as Wrangler secret (`wrangler secret put`)
- [x] `supabaseAdminAuthFetch()` helper using service_role_key
- [x] Sequential Supabase fetches in `/structure` (avoids connection pool error 1016)

---

## Admin Dashboard (`C:\Web Source\apps\admin_dashboard`)

### Login
- [x] Login page with email/password
- [x] Token stored in localStorage
- [x] Redirect to dashboard on success
- [x] Logout

### Users Page
- [x] List all users with correct role badges (⭐ Super Admin / 🗺️ Zone Admin / 🚌 Driver / 🧑 Passenger)
- [x] Create user (all roles including super_admin)
- [x] Create super_admin → auto-creates `admins` record
- [x] Edit user role → super_admin: upserts admin record
- [x] Edit user role → admin (from super_admin): deletes admin record
- [x] Edit user role → passenger/driver: deletes admin record
- [x] Delete user

### Admins Page
- [x] List admins with zone info
- [x] "เพิ่มรายการ" — assign existing admin-role user as admin (modal with user picker, type, zone)
- [x] Edit admin record
- [x] Delete admin
- [ ] zone_admin cannot see admins outside their zone (frontend filter not yet added — backend enforces it)

### Zones / Routes / Buses / Drivers Pages
- [x] Full CRUD UI for zones
- [x] Full CRUD UI for routes (with zone selector)
- [x] Full CRUD UI for buses (with route selector)
- [x] Full CRUD UI for drivers (with route selector)
- [x] zone_admin sees/edits only their zone's data (enforced by backend)

### Public Pages (no login required)
- [x] `zones.html` — zone/route/bus tree, search, expand all, Google Maps link
- [x] `users.html` — user structure by zone, tab filter, copy email, detail drawer

### Infrastructure
- [x] Vite multi-entry build (index, login, zones, users)
- [x] `wrangler.jsonc` created for static asset deploy
- [x] Deployed to Cloudflare Workers (static assets)
- [x] All modal functions exported to `window.*` (required for Vite tree-shaking)

---

## Supabase

- [x] `public.users` — main user profile table (with `auth_user_id` linking to `auth.users`)
- [x] `public.admins` — admin type + zone assignment
- [x] `public.drivers` — driver profile + route/bus assignment
- [x] `public.routes` — route definitions
- [x] `public.buses` — bus fleet
- [x] `public.zones` — zone definitions
- [x] `public.passenger_waiting` — waiting requests
- [ ] Supabase Realtime not yet enabled on bus_locations / passenger_waiting
- [ ] RLS policies — currently bypassed by service_role_key (review before production)

---

## Flutter Mobile App

- [x] App scaffold created (Passenger + Driver flows)
- [ ] Not yet connected to real Supabase auth
- [ ] Not yet connected to real API
- [ ] Google Maps integration not yet complete
- [ ] Realtime bus tracking not yet wired

---

## Known Issues / Gotchas

| Issue | Status | Notes |
|-------|--------|-------|
| Users created before `SUPABASE_SERVICE_ROLE_KEY` was set cannot login | Workaround available | Delete + recreate user, or add via Supabase Auth dashboard |
| JWT expiry not validated | Open | Expired tokens still pass `requireAuth` |
| Supabase Free tier auto-pauses after inactivity | Known | Restore from Supabase dashboard if 530 error appears |
| Supabase connection pool error 1016 | Fixed | Changed `/structure` to sequential awaits instead of Promise.all |
| `openWithUserModal` / `openAssignAdminModal` tree-shaken by Vite | Fixed | All functions now explicitly assigned to `window.*` |

---

## Deployed URLs

| Service | URL |
|---------|-----|
| Backend API | `https://bus-tracking-worker.thanachot-jo888.workers.dev` |
| Admin Dashboard | `https://bus-tracking-admin-dashboard.thanachot-jo888.workers.dev` |
