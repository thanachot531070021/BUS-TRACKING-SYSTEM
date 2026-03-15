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

- `POST /auth/admin/login`
- `GET /admin/routes`
- `POST /admin/routes`
- `PUT /admin/routes/{routeId}`
- `GET /admin/buses`
- `POST /admin/buses`
- `PUT /admin/buses/{busId}`
- `GET /admin/waiting?routeId={routeId}`

## Next Security / Auth Work

- Replace mock auth with Supabase Auth
- Add JWT/session verification middleware
- Add role guard for Driver / Admin
- Restrict Route Admin to assigned routes only
- Add audit logging for admin write actions

## Notes

- Passenger can be guest or authenticated by phone.
- Driver and Admin must be authenticated.
- Live updates should come from Supabase Realtime subscriptions.
