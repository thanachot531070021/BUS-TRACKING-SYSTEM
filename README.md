# BUS TRACKING SYSTEM

Starter project scaffold generated from `Requirement.txt`.

## Structure

- `apps/mobile_app/` — Flutter app for Passenger + Driver
- `apps/admin_dashboard/` — Web dashboard for Admin
- `backend/worker/` — Cloudflare Workers API
- `supabase/schema.sql` — PostgreSQL schema for Supabase
- `docs/architecture.md` — system architecture and flow
- `docs/api-plan.md` — planned API surface
- `docs/next-steps.md` — implementation roadmap

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
- Cloudflare Worker endpoints with mock mode + Supabase integration mode
- admin dashboard starter UI that fetches data from Worker API
- mobile Flutter starter app with Passenger / Driver / Admin sections
- architecture, API planning, and roadmap docs

## Important Backend Notes

Worker supports two modes:

1. **Mock mode** — works immediately without Supabase credentials
2. **Supabase mode** — activated when these env vars are configured:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

## Suggested Next Steps

1. Create Supabase project and run `supabase/schema.sql`
2. Put Supabase values into Worker environment
3. Run `wrangler dev` to test APIs locally
4. Build Flutter HTTP + map integration
5. Add admin CRUD pages and authentication
