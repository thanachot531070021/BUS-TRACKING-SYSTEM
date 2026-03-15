# Project Structure

## Root
- `package.json` — workspace scripts for web/admin and worker
- `.gitignore`
- `.env.example`
- `README.md`

## Apps
### `apps/admin_dashboard/`
- Vite-based admin dashboard
- `index.html`
- `script.js`
- `styles.css`
- `package.json`
- `vite.config.js`

### `apps/mobile_app/`
- Flutter mobile app for Passenger + Driver
- `lib/screens/`
- `lib/services/`
- `lib/models/`
- `pubspec.yaml`

## Backend
### `backend/worker/`
- Cloudflare Worker API
- `src/index.ts`
- `wrangler.toml`
- `package.json`

## Database
### `supabase/`
- `schema.sql`

## Docs
- `architecture.md`
- `api-plan.md`
- `next-steps.md`
- `project-structure.md`
