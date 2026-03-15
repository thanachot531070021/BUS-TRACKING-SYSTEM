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
- Backend folders are split by router/service/repository domain
- Includes starter APIs for users, drivers, admins, route-admin assignments, routes, buses, waiting, and driver location flow

### Mobile
- Flutter structure has been separated into screens / services / models
- Flutter SDK is still required on this machine before running the mobile app

## Identity / Google Login Readiness
The database and backend now prepare for future Google login by storing:
- `auth_provider`
- `provider_user_id`
- `email`
- `email_verified`
- `given_name`
- `family_name`
- `avatar_url`
- internal app `role`

This keeps Google identity separate from app authorization.

## Workspace Scripts
From project root:
- `npm run dev:admin`
- `npm run dev:worker`
- `npm run build:admin`
- `npm run deploy:worker`

## Next Recommended Step
1. Replace mock auth with Supabase Auth / Google Sign-In
2. Add auth middleware and role guards
3. Connect admin dashboard to user-management APIs
4. Install Flutter SDK
5. Connect Supabase and Google Maps
