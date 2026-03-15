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

## Runtime Direction
- Primary mode: **Supabase online**
- Fallback mode: mock data for temporary development only

## Admin Web Separation
- `apps/admin_dashboard/` = admin web source
- `backend/admin-web-worker/` = separate worker that serves built admin assets
- `backend/worker/` = API only

## Current Auth State
- `register / login / me` exist as online-ready scaffold endpoints
- admin dashboard now includes basic admin login/token storage flow
- Driver/Admin login still has mock fallback behavior until real Supabase JWT verification is finished
