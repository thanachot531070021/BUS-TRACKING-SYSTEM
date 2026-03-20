# What Has Been Done / What Is Next

## What has been done
1. Built initial BUS TRACKING SYSTEM structure
2. Created Admin dashboard starter and split admin web into separate worker deployment target
3. Created Flutter mobile starter
4. Built Cloudflare Worker API starter and expanded many operational endpoints
5. Added Supabase schema and online-first config docs
6. Added user, driver, admin, route-admin API scaffolding
7. Added auth middleware, role guards, and route-admin scope scaffold
8. Expanded route / bus / waiting APIs with detail and delete endpoints
9. Added online-ready auth scaffold for register/login/me
10. Added admin CRUD-style UI scaffolds and management flows
11. Added DB health-check endpoint
12. Added API reference docs and auth flow docs
13. Fixed username -> email -> Supabase Auth login flow
14. Added SQL sync helper for `public.users.auth_user_id`

## What should happen next
1. Run `supabase/sync-auth-user-id.sql` in Supabase SQL Editor
2. Test `/auth/me` again
3. Continue replacing remaining mock auth behavior in protected routes
4. Keep improving admin UX and real CRUD flows
5. Connect Flutter app to Auth + API + Realtime + Google Maps
