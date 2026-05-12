# What Has Been Done / What Is Next

---

## Session 1 — Initial Scaffold
1. Built initial BUS TRACKING SYSTEM structure
2. Created Admin dashboard starter and split admin web into separate worker deployment target
3. Created Flutter mobile starter
4. Built Cloudflare Worker API starter and expanded many operational endpoints
5. Added Supabase schema and online-first config docs
6. Added user, driver, admin, route-admin API scaffolding
7. Added auth middleware, role guards, and route-admin scope scaffold
8. Expanded route / bus / waiting APIs with detail and delete endpoints
9. Added online-ready auth scaffold for register/login/me
10. Added admin CRUD-style UI scaffolds and management flows
11. Added DB health-check endpoint
12. Added API reference docs and auth flow docs
13. Fixed username → email → Supabase Auth login flow
14. Added SQL sync helper for `public.users.auth_user_id`

---

## Session 2 — RBAC, Zone System, Public Pages, Deployment

### Zone / RBAC Architecture
- Defined 4 roles: **super_admin**, **zone_admin**, **driver**, **passenger**
- Zone hierarchy: Zone → Routes → Buses → Driver (one bus per driver)
- Zone isolation enforced at API middleware level via `enrichAdminScope()`
- `routeIds[]` array used to scope zone_admin access to drivers/buses inside their zone
- Two-table admin identity: `users.role = 'admin'` + `admins.admin_type = 'super_admin' | 'zone_admin'`

### Backend — `C:\Web Source\backend\worker`
- Added `forbidden()` helper in `lib/http.ts`
- All driver/admin handlers now accept `auth?: AuthContext` and enforce zone isolation
- zone_admin cannot create or promote anyone to super_admin
- Driver assignment blocked if route not in zone_admin's zone
- Added sequential Supabase fetches in `handlers/structure.ts` (avoids connection pool error 1016)
- Added public endpoints: `GET /structure`, `GET /zones`, `GET /zones/:id`
- `listUsers` and `getUserById` now join `admin_profile:admins(admin_type,zone_id)` so frontend can distinguish super_admin vs zone_admin
- **`handleAdminCreateUser`**: now creates Supabase Auth user (via Admin Auth API) when `password` + `SUPABASE_SERVICE_ROLE_KEY` are present — so newly created users can log in immediately
- **`lib/supabase.ts`**: added `supabaseAdminAuthFetch()` using service_role_key for Auth Admin API
- **`middleware/auth.middleware.ts`**: added email fallback — if `auth_user_id` lookup fails, tries email from JWT payload and auto-links `auth_user_id` in `public.users` (fixes login for users whose profile was created before service role key was set)
- Deployed to: `https://bus-tracking-worker.thanachot-jo888.workers.dev`
- Required secret: `SUPABASE_SERVICE_ROLE_KEY` — set via `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`

### Admin Dashboard — `C:\Web Source\apps\admin_dashboard`
- `script.js` — `roleBadge(v, row)` checks `row.admin_profile` to show ⭐ Super Admin / 🗺️ Zone Admin badge correctly
- Users page: added **Super Admin** as role option in create form — auto-creates `admins` record with `admin_type = 'super_admin'`
- Users page edit: changing role from super_admin → admin deletes the `admins` record (prevents badge mismatch)
- Users page edit: changing role away from admin (e.g. → passenger/driver) also deletes the `admins` record
- Admins page: "เพิ่มรายการ" now opens `openAssignAdminModal()` — assigns existing admin-role user to an admin record (picks user, admin_type, zone, status)
- Admin type options filtered by current login role (zone_admin cannot see/pick super_admin)
- All new modal functions exported to `window.*` to survive Vite tree-shaking
- New public pages (no login required):
  - `zones.html` — zone/route/bus tree, search, expand/collapse, Google Maps link
  - `users.html` — full user structure by zone with detail drawer, copy email, tab filter
- `vite.config.js` updated with `zones` and `users` as Rollup build entries
- Deployed to: `https://bus-tracking-admin-dashboard.thanachot-jo888.workers.dev`
- Deploy config: `wrangler.jsonc` created in admin_dashboard directory

### Known Issue Fixed
- Users created via admin before `SUPABASE_SERVICE_ROLE_KEY` was set only exist in `public.users`, not in `auth.users` → they cannot log in. Fix: delete and recreate from admin dashboard, or manually add via Supabase Dashboard → Authentication → Users → Add user.

### Docs
- `application-overview.md` updated: 4-role model, zone isolation rules
- `backend/worker/README.md` updated: RBAC table, zone hierarchy diagram

---

## What Should Happen Next

### Remaining / Not Done Yet
- [ ] Edit admin record from Admins page (currently only assign + delete works)
- [ ] Zone Admin cannot currently self-register; must be created by super_admin
- [ ] Driver "create with user" flow (`openWithUserModal`) still exists but may need review
- [ ] Password reset / change password flow for admin-created users not yet implemented
- [ ] Supabase JWT expiry not validated in middleware (expired tokens still pass through)
- [ ] No email verification step for admin-created users (email_confirm: true bypasses it, intentional)
- [ ] Mobile app (Flutter) not yet connected to real backend/auth/realtime

### Next Recommended Steps
1. Test all CRUD operations (zones, routes, buses, drivers, admins, users) end-to-end
2. Test zone_admin login — verify zone isolation works (can't see other zones' data)
3. Test super_admin login — verify sees all data across all zones
4. Connect Flutter mobile app to real Supabase auth + API
5. Enable Supabase Realtime on `buses`, `bus_locations`, `passenger_waiting`
6. Add password change endpoint for admin-managed users
7. Consider adding Supabase JWT `exp` validation in `requireAuth` middleware
