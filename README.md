# BUS TRACKING SYSTEM

Structured starter project generated from `Requirement.txt`.

## Project Layout

- `apps/mobile_app/` — Flutter app for Passenger + Driver
- `apps/admin_dashboard/` — Vite-based Admin Dashboard
- `backend/worker/` — Cloudflare Workers API
- `supabase/schema.sql` — PostgreSQL schema for Supabase
- `docs/` — architecture, API plan, roadmap, project structure

## Main Features

### Passenger
- Browse routes
- View buses that are ON duty
- View live bus positions on map
- Mark "waiting for bus"
- Cancel waiting status

### Driver
- Login
- Switch ON/OFF duty
- Send GPS every 5–10 seconds
- See own route and passenger waiting points

### Admin
- Super Admin: manage routes, admins, buses
- Route Admin: manage own routes and buses only

## Current Dev Setup

### Web / Admin
- Uses **Vite** for local development

### Backend
- Uses **Cloudflare Workers** with mock mode and Supabase mode

### Mobile
- Flutter structure has been separated into screens / services / models
- Flutter SDK is still required on this machine before running the mobile app

## Workspace Scripts

From project root:

- `npm run dev:admin`
- `npm run dev:worker`
- `npm run build:admin`
- `npm run deploy:worker`

## Important Notes

Worker supports two modes:

1. **Mock mode** — works immediately without Supabase credentials
2. **Supabase mode** — activated when these env vars are configured:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

## Next Recommended Step

1. Install Node dependencies
2. Run admin dashboard with Vite
3. Run worker locally with Wrangler
4. Install Flutter SDK
5. Connect Supabase and Google Maps
