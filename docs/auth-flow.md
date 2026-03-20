# Auth Flow Notes

## Current Direction
- Supabase Auth is the long-term auth source.
- `public.users` stores business profile and role.
- Login should support username/email from UI, then map to the proper email for Supabase Auth.

## Current Test Accounts
These profiles exist in `public.users`:
- `superadmin`
- `routeadmin`
- `driver1`
- `passenger1`
- `passenger2`

Temporary test password target:
- `12345678`

## Intended Login Flow
1. User enters username or email.
2. Backend looks up `public.users`.
3. If username is used, backend resolves the matching email.
4. Backend logs into Supabase Auth with email + password.
5. Backend returns token + profile.

## Why This Matters
- Supabase Auth manages credentials/session/JWT.
- `public.users` manages business role/profile.
- This keeps auth and app authorization separated cleanly.
