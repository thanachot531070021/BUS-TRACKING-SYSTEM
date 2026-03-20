# Auth User Sync

## Purpose
Sync existing `public.users` rows with Supabase Auth accounts using email.

## File
- `supabase/sync-auth-user-id.sql`

## What it does
- matches `public.users.email` with `auth.users.email`
- writes `auth.users.id` into `public.users.auth_user_id`

## When to use
Use this after:
- creating auth accounts manually in Supabase Dashboard
- importing test users into Supabase Auth
- having legacy profile rows that were created before auth accounts existed

## Expected result
After running the sync SQL:
- `/auth/me` should start resolving profiles correctly
- middleware can map JWT auth user -> `public.users`
- role-based protected endpoints can move closer to real auth behavior

## Recommended check after running
1. Run the SQL file
2. Test:
   - `POST /auth/admin/login`
   - `GET /auth/me`
3. Verify mapped rows in the result query
