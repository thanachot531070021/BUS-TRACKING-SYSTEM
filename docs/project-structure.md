# Project Structure

## Root

```
C:\Web Source\
├── apps/
│   ├── admin_dashboard/    ← Admin Web SPA
│   └── mobile_app/         ← Flutter Mobile App
├── backend/
│   └── worker/             ← Cloudflare Workers API
├── supabase/
│   └── schema.sql          ← Database schema
├── docs/                   ← This folder
├── Requirement.txt         ← System requirements
└── deploy.ps1              ← Deploy script
```

---

## `apps/admin_dashboard/`

Vanilla JS SPA — no framework, no build step required.

```
admin_dashboard/
├── index.html      ← SPA shell (Sidebar + Topbar + Content + Modals)
├── login.html      ← Login page (standalone)
├── styles.css      ← Design system (CSS variables, components)
└── script.js       ← All SPA logic (ES module)
```

Key patterns in `script.js`:
- `SECTIONS` config — per-section `listPath`, `columns`, `formFields`, `groupBy`, `prefetch`
- `renderTable(section, items)` — grouped table with collapse/expand
- `_ssCache` — prefetched API data cache (keyed by path)
- `state.cache[section]` — section list data
- All event-handler functions exported to `window.*` (required for inline `onclick`)

Admin Dashboard Sections:
| Section | Description |
|---------|-------------|
| dashboard | Stats summary |
| zones | Zone management (super_admin only) |
| routes | Route management, grouped by zone |
| busDriver (drivers tab) | Driver management, grouped by route |
| busDriver (buses tab) | Bus management, grouped by route |
| admins | Admin account management |
| users | User management (super_admin only) |
| waiting | Passenger waiting list (read-only) |
| data | Analytics |

---

## `apps/mobile_app/`

Flutter app for Passenger and Driver flows.

```
lib/
├── main.dart
├── config/api_config.dart
├── models/          ← user, route, bus, waiting
├── services/        ← api, auth, route, bus, waiting, location
├── providers/       ← auth, route, driver
└── screens/
    ├── splash_screen.dart
    ├── auth/login_screen.dart
    ├── passenger/   ← passenger_home, route_detail
    └── driver/      ← driver_home, waiting_list
```

---

## `backend/worker/`

Cloudflare Workers API (TypeScript).

```
src/
├── index.ts                    ← Entry point + router
├── router/
│   └── admin.ts                ← Admin route definitions
├── handlers/
│   ├── auth.ts
│   ├── admin.ts
│   ├── admin-users.ts
│   ├── zones.ts
│   └── ...
├── repositories/
│   ├── zones.ts
│   ├── routes.ts
│   ├── buses.ts
│   ├── drivers.ts
│   └── admins.ts
├── services/
│   ├── zones.service.ts
│   ├── routes.service.ts
│   ├── buses.service.ts
│   ├── drivers.service.ts
│   └── admins.service.ts
├── middleware/
│   └── auth.middleware.ts      ← JWT verify + RBAC + zone scope
├── lib/
│   ├── supabase.ts             ← supabaseFetch + supabaseAdminAuthFetch
│   └── http.ts                 ← ok/err/forbidden helpers
├── schemas/
│   └── route.schema.ts
└── types.ts
```

---

## `supabase/`

```
supabase/
├── schema.sql          ← Full DB schema (current)
└── migrations/         ← (if any)
```

Key tables: `users`, `admins`, `drivers`, `routes`, `buses`, `zones`, `bus_locations`, `passenger_waiting`

---

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Backend API | Cloudflare Workers | `https://bus-tracking-worker.thanachot-jo888.workers.dev` |
| Admin Dashboard | Cloudflare Workers (static) | `https://bus-tracking-admin-dashboard.thanachot-jo888.workers.dev` |
