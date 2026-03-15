# API Plan

## Passenger APIs

- `GET /routes`
- `GET /buses/live?routeId={routeId}`
- `GET /waiting?routeId={routeId}`
- `POST /waiting`
- `DELETE /waiting/{waitingId}`

## Driver APIs

- `POST /auth/login`
- `POST /drivers/duty`
- `POST /locations`
- `GET /driver/route`
- `GET /driver/waiting?routeId={routeId}`

## Admin APIs

- `GET /admin/routes`
- `POST /admin/routes`
- `PUT /admin/routes/{routeId}`
- `GET /admin/buses`
- `POST /admin/buses`
- `PUT /admin/buses/{busId}`
- `GET /admin/waiting`

## Notes

- Passenger can be guest or authenticated by phone.
- Driver and Admin must be authenticated.
- Route Admin authorization must be restricted to assigned routes.
- Live updates should come from Supabase Realtime subscriptions.
