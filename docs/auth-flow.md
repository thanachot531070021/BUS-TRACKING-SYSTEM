# Auth Flow — BUS TRACKING SYSTEM

## Overview

Authentication uses **Supabase Auth** (email/password) as the identity layer.
`public.users` stores the business profile and role.
The two are linked via `public.users.auth_user_id = auth.users.id`.

---

## Login Flow

```
User enters username or email + password
    ↓
POST /auth/login
    ↓
Backend looks up public.users by username or email
    ↓
Resolves the matching Supabase Auth email
    ↓
Supabase Auth signin → returns JWT access_token
    ↓
Backend resolves app profile from public.users via auth_user_id
    ↓
Returns { token, user } to client
    ↓
Client stores token in localStorage
```

---

## Middleware Flow (protected routes)

```
Request with Authorization: Bearer <token>
    ↓
requireAuth middleware
    ↓
Decodes JWT (Supabase secret)
    ↓
Looks up public.users WHERE auth_user_id = jwt.sub
    ↓ (fallback)
If not found → tries email from JWT → auto-links auth_user_id
    ↓
Attaches { user, authUserId } to request context
    ↓
requireRole / requireAdminScope checks role + zone
```

---

## Admin RBAC

| admin_type | Access |
|-----------|--------|
| super_admin | All zones, all data |
| zone_admin | Own zone only — scoped via `enrichAdminScope()` |

`enrichAdminScope()` loads:
- `admin.zone_id`
- all `routeIds[]` belonging to that zone
- used to filter all subsequent queries

---

## User Creation (Admin-managed)

When Admin creates a user from the dashboard:
1. Backend calls Supabase Auth Admin API (service_role_key) to create Auth user
2. Creates `public.users` record
3. Newly created user can login immediately

For Driver creation — 2-step flow:
1. Creates Auth user + `public.users`
2. Creates `public.drivers` linked to that user
3. Optionally creates `public.buses` and links driver

---

## Known Limitations

| Issue | Status |
|-------|--------|
| JWT `exp` not validated | Open — expired tokens still pass `requireAuth` |
| No email verification for admin-created users | Intentional (`email_confirm: true` bypassed) |
| Password reset/change endpoint | Not yet implemented |

---

## Roles

| Role | login required | notes |
|------|---------------|-------|
| super_admin | Yes | Full access |
| zone_admin | Yes | Zone-scoped |
| driver | Yes | Route-scoped (via assigned_route_id) |
| passenger | Optional | Can use as guest or login with email |
