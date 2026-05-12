# Cloudflare Worker API

Backend is organized by domain and is now documented as **online-first** for Supabase.

## Role-Based Access Control (RBAC)

| Role | Scope | Notes |
|---|---|---|
| `super_admin` | All zones, all data | No restrictions |
| `zone_admin` | Own zone only | Cannot cross zones; cannot create/promote super_admin |
| `driver` | Own route only | Zone implied via `assigned_route_id → routes.zone_id` |
| `passenger` | Public data, all zones | Read-only |

### Zone Isolation (zone_admin)
- All list, get, create, update, delete operations are scoped to `zone_id`
- Drivers are scoped via `routeIds` (routes in the zone)
- Attempting to read/write data outside own zone returns `403 Forbidden`
- Cannot set `adminType: super_admin` when creating or updating admins

### Zone Hierarchy
```
Zone
  └── Route[] (many routes per zone)
        └── Bus[] (many buses per route)
              └── Driver (one driver per bus)
```

## Structure
- `src/index.ts` — fetch entrypoint
- `src/router.ts` — main router entry
- `src/router/`
  - `public.ts`
  - `driver.ts`
  - `admin.ts`
- `src/types.ts` — shared types
- `src/lib/`
  - `http.ts`
  - `auth.ts`
  - `supabase.ts`
  - `validate.ts`
- `src/middleware/` — auth / role guard middleware
- `src/schemas/` — request validation schemas
- `src/data/` — mock seed data
- `src/repositories/` — data access layer
- `src/services/` — service layer
- `src/handlers/` — request handlers grouped by role

## Admin Web Separation
- `apps/admin_dashboard/` = admin web source
- `backend/admin-web-worker/` = separate worker that serves built admin assets
- `backend/worker/` = API only

## Current Admin Web State
- admin login panel exists
- token is stored in browser localStorage
- dashboard reads from admin endpoints when token is present
- create/update/delete route UI exists
- create/update/delete bus UI exists
- create/update/delete user UI exists
- create/update/delete driver UI exists
- create/update/delete admin UI exists
- route-admin assignment create/delete UI exists
- management sections are grouped into cleaner operational panels
