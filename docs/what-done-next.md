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
10. Added admin CRUD UI scaffold for routes and buses
11. Added health/db-check endpoint and online seed SQL for test data

## What should happen next
1. Run `supabase/seed.sql` in Supabase SQL Editor
2. Check `/health/db` and `/routes` again
3. Replace mock token verification with real Supabase JWT verification
4. Continue user/driver/admin CRUD UI and API hardening
5. Connect Flutter app to Auth + API + Realtime + Google Maps
