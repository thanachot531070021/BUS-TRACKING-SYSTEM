# Auth Flow Notes

## Current Direction
- Supabase Auth is the long-term auth source.
- `public.users` stores business profile and role.
- Login supports username/email from UI, then maps to the proper email for Supabase Auth.
- Protected API routes now move closer to `auth_user_id`-based profile resolution.

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
5. Supabase returns an access token.
6. API resolves the app profile from `public.users`.

## Important Link Field
Primary app-profile link should be:
- `public.users.auth_user_id = auth.users.id`

## Current State
- Login flow now supports username -> email -> Supabase Auth.
- Middleware can now decode JWT payload and attempt profile lookup by `auth_user_id`.
- Remaining work: make all protected flows rely on verified Supabase JWT + linked `auth_user_id` consistently.
