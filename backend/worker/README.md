# Cloudflare Worker API

Backend has been reorganized into modules and folders by domain.

## Structure
- `src/index.ts` — fetch entrypoint
- `src/router/`
  - `public/`
  - `driver/`
  - `admin/`
- `src/types.ts` — shared types
- `src/lib/` — HTTP and Supabase helpers
- `src/data/` — mock seed data
- `src/repositories/` — data access layer
- `src/services/`
  - `auth/`
  - `routes/`
  - `buses/`
  - `waiting/`
  - `users/`
  - `drivers/`
  - `admins/`
  - `route-admins/`
- `src/handlers/` — request handlers grouped by role

## Implemented API Groups

### Public / Passenger
- `GET /health`
- `GET /routes`
- `GET /buses/live?routeId=...`
- `GET /waiting?routeId=...`
- `POST /waiting`
- `DELETE /waiting/:waitingId`

### Driver
- `POST /auth/driver/login`
- `POST /drivers/duty`
- `POST /locations`
- `GET /driver/waiting?routeId=...`

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

## Notes
- Authentication endpoints are currently mock/starter endpoints.
- Supabase mode is used when env vars are configured.
- Route Admin authorization is not enforced yet; that should be the next backend security step.
