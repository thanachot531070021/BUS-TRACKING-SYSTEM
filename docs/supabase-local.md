# Supabase Local Setup

## Current Status
This repository is prepared for Supabase local development, but the current machine still needs:
- Docker Desktop
- Supabase CLI

## Recommended Install Order (Windows)
1. Install Docker Desktop
2. Install Supabase CLI
3. Restart terminal

## Commands
From `C:\Web Source`:

```bash
supabase start
supabase db reset
```

Expected local services:
- API: `http://127.0.0.1:54321`
- DB: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Studio: `http://127.0.0.1:54323`
- Inbucket: `http://127.0.0.1:54324`

## Auth Strategy for Phase 1
Use Supabase Auth with local email/password first.

Suggested login identifiers:
- Admin: username + password (mapped to auth email internally)
- Driver: username/phone + password
- Passenger: guest first, then optional signup

## App Data Mapping
- Supabase Auth handles password/session/JWT
- `public.users` stores app profile + role + username
- `public.admins` stores admin type
- `public.drivers` stores driver profile
- `public.route_admins` stores route scoping

## Phase 2 Later
Add Google Sign-In after local auth flow is stable.
