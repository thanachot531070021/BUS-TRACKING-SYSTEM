# API Plan

## Public / Passenger APIs
- `GET /health`
- `POST /auth/google/login`
- `GET /routes`
- `GET /routes/{routeId}`
- `GET /buses/live?routeId={routeId}`
- `GET /buses/{busId}`
- `GET /waiting?routeId={routeId}`
- `GET /waiting/{waitingId}`
- `POST /waiting` *(Bearer required)*
- `DELETE /waiting/{waitingId}` *(Bearer required)*

## Driver APIs
- `POST /auth/driver/login`
- `POST /drivers/duty` *(Driver/Admin token)*
- `POST /locations` *(Driver/Admin token)*
- `GET /driver/waiting?routeId={routeId}` *(Driver/Admin token)*

## Admin APIs
### User Management
- `GET /admin/users` *(Admin token)*
- `POST /admin/users` *(Admin token)*
- `PUT /admin/users/{userId}` *(Admin token)*
- `GET /admin/drivers` *(Admin token)*
- `POST /admin/drivers` *(Admin token)*
- `PUT /admin/drivers/{driverId}` *(Admin token)*
- `GET /admin/admins` *(Admin token)*
- `POST /admin/admins` *(Admin token)*
- `PUT /admin/admins/{adminId}` *(Admin token)*
- `GET /admin/route-admins` *(Admin token)*
- `POST /admin/route-admins` *(Admin token)*
- `DELETE /admin/route-admins/{assignmentId}` *(Admin token)*

### Route / Bus Management
- `POST /auth/admin/login`
- `GET /admin/routes` *(Admin token)*
- `GET /admin/routes/{routeId}` *(Admin token)*
- `POST /admin/routes` *(Admin token)*
- `PUT /admin/routes/{routeId}` *(Admin token)*
- `DELETE /admin/routes/{routeId}` *(Admin token)*
- `GET /admin/buses` *(Admin token)*
- `GET /admin/buses/{busId}` *(Admin token)*
- `POST /admin/buses` *(Admin token)*
- `PUT /admin/buses/{busId}` *(Admin token)*
- `DELETE /admin/buses/{busId}` *(Admin token)*
- `GET /admin/waiting?routeId={routeId}` *(Admin token)*

## Online-first Config Plan
- use Supabase online as primary database/auth/realtime backend
- keep worker envs ready for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- keep Flutter ready for `SUPABASE_URL`, publishable/anon key, and Google Maps key

## Current Auth / Security State
- middleware checks bearer token presence
- role guards protect driver/admin routes
- route-admin scope scaffold exists
- next step is replacing mock token parsing with real Supabase Auth verification
