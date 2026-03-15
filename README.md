# BUS TRACKING SYSTEM

Structured starter project generated from `Requirement.txt`.

## Project Layout
- `apps/mobile_app/` — Flutter app for Passenger + Driver
- `apps/admin_dashboard/` — Admin web source (Vite)
- `backend/worker/` — Cloudflare Workers API
- `backend/admin-web-worker/` — Cloudflare Worker for serving admin website
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
### Admin Web
- `apps/admin_dashboard` = source code
- `backend/admin-web-worker` = separate worker deployment for the website

### Backend API
- `backend/worker` = API worker
- validation schemas are now separated under `src/schemas/`
- request validation helpers are under `src/lib/validate.ts`
- uses **Supabase online** as the primary database/auth/realtime platform

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
- `npm run build:admin`
- `npm run dev:worker`
- `npm run dev:admin-web-worker`
- `npm run deploy:worker`
- `npm run deploy:admin-web-worker`

## Next Recommended Step
1. Connect admin web to authenticated admin APIs
2. Replace mock token parsing with real Supabase Auth verification
3. Add stronger validation for remaining management endpoints
4. Install Flutter SDK
5. Connect Supabase Realtime and Google Maps in Flutter
