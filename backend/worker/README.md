# Cloudflare Worker API

Backend is organized by domain and is now documented as **online-first** for Supabase.

## Structure
- `src/index.ts` — fetch entrypoint
- `src/router.ts` — main router entry
- `src/router/`
  - `public.ts`
  - `driver.ts`
  - `admin.ts`
- `src/types.ts` — shared types
- `src/lib/` — HTTP, auth, and Supabase helpers
- `src/middleware/` — auth / role guard middleware
- `src/data/` — mock seed data
- `src/repositories/` — data access layer
- `src/services/` — service layer
- `src/handlers/` — request handlers grouped by role

## Runtime Direction
- Primary mode: **Supabase online**
- Fallback mode: mock data for temporary development only

## Implemented API Groups

### Public / Passenger
- `GET /health`
- `POST /auth/google/login`
- `GET /routes`
- `GET /routes/:routeId`
- `GET /buses/live?routeId=...`
- `GET /buses/:busId`
- `GET /waiting?routeId=...`
- `GET /waiting/:waitingId`
- `POST /waiting` *(Bearer required)*
- `DELETE /waiting/:waitingId` *(Bearer required)*

### Driver
- `POST /auth/driver/login`
- `POST /drivers/duty` *(Driver/Admin token)*
- `POST /locations` *(Driver/Admin token)*
- `GET /driver/waiting?routeId=...` *(Driver/Admin token)*

### Admin
#### Identity / User Management
- `GET /admin/users`
- `POST /admin/users`
- `PUT /admin/users/:userId`
- `GET /admin/drivers`
- `POST /admin/drivers`
- `PUT /admin/drivers/:driverId`
- `GET /admin/admins`
- `POST /admin/admins`
- `PUT /admin/admins/:adminId`
- `GET /admin/route-admins`
- `POST /admin/route-admins`
- `DELETE /admin/route-admins/:assignmentId`

#### Route / Bus Management
- `POST /auth/admin/login`
- `GET /admin/routes`
- `GET /admin/routes/:routeId`
- `POST /admin/routes`
- `PUT /admin/routes/:routeId`
- `DELETE /admin/routes/:routeId`
- `GET /admin/buses`
- `GET /admin/buses/:busId`
- `POST /admin/buses`
- `PUT /admin/buses/:busId`
- `DELETE /admin/buses/:busId`
- `GET /admin/waiting?routeId=...`

## Online Config Needed Later
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- optional `SUPABASE_PUBLISHABLE_KEY` for Flutter setup

## Current Auth State
- Driver/Admin login still returns mock bearer tokens for now
- Google login is still starter-level
- Middleware and role guards are already in place
- Next step is wiring real Supabase Auth verification
