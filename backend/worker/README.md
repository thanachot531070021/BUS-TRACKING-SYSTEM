# Cloudflare Worker API

Backend starter for BUS TRACKING SYSTEM.

## Modes

The worker can run in 2 modes:

1. **Mock mode**
   - Used automatically when Supabase variables are empty
   - Good for frontend development

2. **Supabase mode**
   - Enabled when `SUPABASE_URL` and a key are configured
   - Reads/writes through Supabase REST API

## Current Endpoints

- `GET /health`
- `GET /routes`
- `GET /buses/live?routeId=...`
- `GET /waiting?routeId=...`
- `POST /waiting`
- `POST /locations`
- `POST /drivers/duty`

## Environment

Set in `wrangler.toml` / Cloudflare:

- `APP_NAME`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (secret)

## Example Commands

```bash
wrangler dev
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler deploy
```

## Notes

- `POST /locations` inserts into `bus_locations` and updates latest bus position in `buses`
- `POST /drivers/duty` updates current bus status
- `POST /waiting` creates a passenger waiting row
- Replace anon/service role choices carefully based on production security design
