# API Plan

## Public / Passenger APIs
- `GET /health`
- `POST /auth/google/login`
- `GET /routes`
- `GET /buses/live?routeId={routeId}`
- `GET /waiting?routeId={routeId}`
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
- `POST /admin/routes` *(Admin token)*
- `PUT /admin/routes/{routeId}` *(Admin token)*
- `GET /admin/buses` *(Admin token)*
- `POST /admin/buses` *(Admin token)*
- `PUT /admin/buses/{busId}` *(Admin token)*
- `GET /admin/waiting?routeId={routeId}` *(Admin token)*

## Google-compatible User Data Design
- keep provider-neutral user table (`users`)
- store `auth_provider` such as `google`
- store `provider_user_id` from Google subject / OIDC `sub`
- store `email`, `email_verified`, `full_name`, `given_name`, `family_name`, `avatar_url`
- keep internal app role separate from auth provider
- future login should validate Google token / Supabase Auth identity, then map into local `users`

## Current Auth / Security State
- middleware now checks bearer token presence
- role guard now protects driver/admin routes
- tokens are still mock/starter tokens today
- next step is replacing mock token parsing with real Supabase Auth / Google token verification
