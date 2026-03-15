# BUS TRACKING SYSTEM

Starter project scaffold generated from `Requirement.txt`.

## Structure

- `apps/mobile_app/` — Flutter app for Passenger + Driver
- `apps/admin_dashboard/` — Web dashboard for Admin
- `backend/worker/` — Cloudflare Workers API
- `supabase/schema.sql` — PostgreSQL schema for Supabase
- `docs/architecture.md` — System architecture and flow
- `docs/api-plan.md` — planned API surface

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

## Current Build Status

Implemented now:
- starter database schema in `supabase/schema.sql`
- starter Cloudflare Worker endpoints with mock responses
- admin dashboard starter UI
- mobile Flutter starter app
- architecture and API planning docs

## Suggested Next Steps

1. Create Supabase project and run `supabase/schema.sql`
2. Replace worker mock data with real Supabase queries
3. Configure Google Maps API keys
4. Build Flutter screens for route list, map, waiting, and driver duty
5. Build admin CRUD pages for routes and buses
