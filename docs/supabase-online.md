# Supabase Online Setup

Use Supabase online as the main backend platform for this project.

## Required Values
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

## Recommended Usage
### Flutter app
Use:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY`
- `GOOGLE_MAPS_API_KEY`

### Cloudflare Worker
Use:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Optional Node scripts / migrations
Use:
- `DATABASE_URL`

## Current Strategy
- Supabase online for PostgreSQL, Auth, and Realtime
- Cloudflare Workers for API/business logic
- Flutter for Passenger + Driver mobile app
- Google Maps for map rendering

## Secret Handling
Do not commit real keys into git.
Store secrets in:
- Cloudflare Worker secrets/vars
- local `.env`
- Flutter secure config flow

## Later Tasks
- Fill real keys into runtime config
- Replace mock auth with Supabase Auth verification
- Connect Flutter app to Supabase Auth and Realtime
