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

## Current Runtime Direction
### Web / Admin
- Uses **Vite** for local development

### Backend
- Uses **Cloudflare Workers** as the API layer
- Uses **Supabase online** as the primary database/auth/realtime platform
- Uses mock fallback mode only as a temporary development fallback when online keys are not configured
- Includes route/bus/waiting/user-management APIs and auth/role scaffolding

### Mobile
- Flutter structure has been separated into screens / services / models
- Flutter SDK is still required on this machine before running the mobile app

## Online Config Strategy
Fill real values later using:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_MAPS_API_KEY`

## Workspace Scripts
From project root:
- `npm run dev:admin`
- `npm run dev:worker`
- `npm run build:admin`
- `npm run deploy:worker`

## Next Recommended Step
1. Fill online Supabase keys into runtime config
2. Replace mock token parsing with real Supabase Auth verification
3. Connect admin dashboard to route/bus/user APIs
4. Install Flutter SDK
5. Connect Supabase Realtime and Google Maps in Flutter
