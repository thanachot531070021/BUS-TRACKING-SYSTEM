# BUS TRACKING SYSTEM

Starter project scaffold generated from `Requirement.txt`.

## Structure

- `apps/mobile_app/` — Flutter app for Passenger + Driver
- `apps/admin_dashboard/` — Web dashboard for Admin
- `backend/worker/` — Cloudflare Workers API
- `supabase/schema.sql` — PostgreSQL schema for Supabase
- `docs/architecture.md` — System architecture and flow

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

## Suggested Next Steps

1. Create Supabase project and run `supabase/schema.sql`
2. Configure Google Maps API keys
3. Implement Flutter screens in `apps/mobile_app/lib/`
4. Deploy `backend/worker/` to Cloudflare Workers
5. Connect realtime subscriptions from Supabase Realtime
