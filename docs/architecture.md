# BUS TRACKING SYSTEM — Architecture

## Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | Flutter (Passenger + Driver) |
| Admin Web | Vanilla JS SPA (index.html + script.js) |
| Backend API | Cloudflare Workers (TypeScript) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Realtime | Supabase Realtime (planned) |
| Map | Google Maps API |

---

## Data Hierarchy

```
Zone
 └── Route(s)
      └── Bus(es)        ← 1 bus per driver
      └── Driver(s)      ← assigned via assigned_route_id
```

---

## Core Modules

### 1. Zone Management
Entities: `zones`
- Super Admin manages all zones
- Zone Admin is scoped to one zone

### 2. Route Management
Entities: `routes`
- Each route belongs to a zone (`zone_id`)
- Route code auto-generated from zone code

### 3. Bus & Driver Management
Entities: `buses`, `drivers`
- One driver per bus (`buses.driver_id = users.id`)
- Bus route auto-derived from driver's `assigned_route_id`
- Driver created alongside a User account (2-step flow)

### 4. Location Tracking
Entities: `bus_locations`, `buses.current_lat/lng/last_seen_at`
- Driver app sends GPS every 5–10 seconds
- Cloudflare Worker stores latest location in `buses` and history in `bus_locations`
- Supabase Realtime broadcasts updates (to be enabled)

### 5. Passenger Waiting
Entities: `passenger_waiting`
- Passenger marks "waiting" on a route
- Driver sees waiting points and count
- Passenger can cancel

### 6. Authentication & RBAC
Entities: `users`, `admins`
- Supabase Auth for identity (email/password)
- `public.users` stores role + business profile
- `public.admins` stores `admin_type` (super_admin / zone_admin) + `zone_id`
- 4 roles: `super_admin`, `zone_admin`, `driver`, `passenger`

---

## API Groups

| Path | Description |
|------|-------------|
| `/auth/*` | Login, register, me |
| `/routes/*` | Public route list |
| `/buses/*` | Live bus data |
| `/waiting/*` | Passenger waiting |
| `/driver/*` | Driver duty + GPS + waiting view |
| `/admin/*` | Admin CRUD (zones, routes, buses, drivers, admins, users) |
| `/structure` | Public zone/route/bus tree |
| `/health` | System health check |

---

## Realtime Channels (planned)

- `route:{routeId}:buses` — live bus positions
- `route:{routeId}:waiting` — waiting passenger updates

---

## Zone Isolation (RBAC)

| Role | Access Scope |
|------|-------------|
| super_admin | All zones, no restrictions |
| zone_admin | Own zone only (enforced at API middleware) |
| driver | Own assigned route (zone implied) |
| passenger | Read-only, all zones |

Zone isolation enforced via `enrichAdminScope()` middleware:
- loads `zone_id` + all `routeIds[]` in the zone
- all driver/bus/route queries filtered to those routeIds
