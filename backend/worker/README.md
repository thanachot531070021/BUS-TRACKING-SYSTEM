# Cloudflare Worker API

Backend has been reorganized into modules and folders by domain.

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
- `src/services/`
  - `auth.service.ts`
  - `routes.service.ts`
  - `buses.service.ts`
  - `waiting.service.ts`
  - `users.service.ts`
  - `drivers.service.ts`
  - `admins.service.ts`
  - `route-admins.service.ts`
- `src/handlers/` — request handlers grouped by role

## Implemented API Groups

### Public / Passenger
- `GET /health`
- `POST /auth/google/login`
- `GET /routes`
- `GET /buses/live?routeId=...`
- `GET /waiting?routeId=...`
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
- `POST /admin/routes`
- `PUT /admin/routes/:routeId`
- `GET /admin/buses`
- `POST /admin/buses`
- `PUT /admin/buses/:busId`
- `GET /admin/waiting?routeId=...`

## Google-ready User Model
User data is designed to support future Google login / OIDC mapping:
- `auth_provider`
- `provider_user_id`
- `email`
- `email_verified`
- `given_name`
- `family_name`
- `avatar_url`
- app `role` kept separate from identity provider

## Current Auth State
- Driver/Admin login currently returns mock bearer tokens
- Google login currently creates/maps a local passenger user in starter mode
- Middleware now enforces bearer token and role checks on protected routes
- Replace mock token decoding with real Supabase Auth / Google token verification next
