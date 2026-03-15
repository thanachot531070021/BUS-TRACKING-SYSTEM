# Cloudflare Worker API

Backend has been reorganized into modules so it is easier to maintain and expand.

## Structure

- `src/index.ts` — fetch entrypoint
- `src/router.ts` — route mapping
- `src/types.ts` — shared types
- `src/lib/` — HTTP and Supabase helpers
- `src/data/` — mock seed data
- `src/repositories/` — data access layer
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
- `POST /auth/admin/login`
- `GET /admin/routes`
- `POST /admin/routes`
- `PUT /admin/routes/:routeId`
- `GET /admin/buses`
- `POST /admin/buses`
- `PUT /admin/buses/:busId`
- `GET /admin/waiting?routeId=...`

## Notes

- Authentication endpoints are currently mock/starter endpoints.
- Supabase mode is used when env vars are configured.
- Route Admin authorization is not enforced yet; that should be the next backend security step.
