# Cloudflare Worker API

Backend is organized by domain and is now documented as **online-first** for Supabase.

## Structure
- `src/index.ts` — fetch entrypoint
- `src/router.ts` — main router entry
- `src/router/`
  - `public.ts`
  - `driver.ts`
  - `admin.ts`
- `src/types.ts` — shared types
- `src/lib/`
  - `http.ts`
  - `auth.ts`
  - `supabase.ts`
  - `validate.ts`
- `src/middleware/` — auth / role guard middleware
- `src/schemas/` — request validation schemas
- `src/data/` — mock seed data
- `src/repositories/` — data access layer
- `src/services/` — service layer
- `src/handlers/` — request handlers grouped by role

## Admin Web Separation
- `apps/admin_dashboard/` = admin web source
- `backend/admin-web-worker/` = separate worker that serves built admin assets
- `backend/worker/` = API only

## Current Admin Web State
- admin login panel exists
- token is stored in browser localStorage
- dashboard reads from admin endpoints when token is present
- create/update/delete route UI scaffold exists
- create/update/delete bus UI scaffold exists
- users/drivers/admins overview panels exist
- UX feedback for form states and loading/errors is improved
