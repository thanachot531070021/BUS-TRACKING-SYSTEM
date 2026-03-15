# API Plan

## Public / Passenger APIs
- `GET /health`
- `GET /routes`
- `GET /buses/live?routeId={routeId}`
- `GET /waiting?routeId={routeId}`
- `POST /waiting`
- `DELETE /waiting/{waitingId}`

## Driver APIs
- `POST /auth/driver/login`
- `POST /drivers/duty`
- `POST /locations`
- `GET /driver/waiting?routeId={routeId}`

## Admin APIs
### User Management
- `GET /admin/users`
- `POST /admin/users`
- `PUT /admin/users/{userId}`
- `GET /admin/drivers`
- `POST /admin/drivers`
- `PUT /admin/drivers/{driverId}`
- `GET /admin/admins`
- `POST /admin/admins`
- `PUT /admin/admins/{adminId}`
- `GET /admin/route-admins`
- `POST /admin/route-admins`
- `DELETE /admin/route-admins/{assignmentId}`

### Route / Bus Management
- `POST /auth/admin/login`
- `GET /admin/routes`
- `POST /admin/routes`
- `PUT /admin/routes/{routeId}`
- `GET /admin/buses`
- `POST /admin/buses`
- `PUT /admin/buses/{busId}`
- `GET /admin/waiting?routeId={routeId}`

## Google-compatible User Data Design
- keep provider-neutral user table (`users`)
- store `auth_provider` such as `google`
- store `provider_user_id` from Google subject / OIDC sub
- store `email`, `email_verified`, `full_name`, `given_name`, `family_name`, `avatar_url`
- keep internal app role separate from auth provider
- future login should validate Google token / Supabase Auth identity, then map into local `users`

## Next Security / Auth Work
- Replace mock auth with Supabase Auth / Google Sign-In
- Add JWT/session verification middleware
- Add role guard for Driver / Admin
- Restrict Route Admin to assigned routes only
- Add audit logging for admin write actions
