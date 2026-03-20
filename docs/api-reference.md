# API Reference — BUS TRACKING SYSTEM

Base API (current deployment):
- `https://bus-tracking-worker.thanachot-jo888.workers.dev`

## Authentication Notes
- Some endpoints are public.
- Some endpoints require `Authorization: Bearer <token>`.
- Current system is transitioning from mock auth to Supabase Auth-backed login.

---

## Health
### `GET /health`
Check worker status.

### `GET /health/db`
Check database connectivity and counts for key tables.

---

## Auth
### `POST /auth/register`
Create a new auth/profile scaffold user.

Body example:
```json
{
  "email": "user@example.com",
  "password": "12345678",
  "username": "user1",
  "fullName": "User One",
  "role": "passenger"
}
```

### `POST /auth/login`
Login with identifier + password.

Body example:
```json
{
  "identifier": "superadmin",
  "password": "12345678",
  "expectedRole": "admin"
}
```

### `GET /auth/me`
Get current user/profile from bearer token.

### `POST /auth/google/login`
Starter Google login endpoint.

---

## Public / Passenger
### `GET /routes`
List routes.

### `GET /routes/:routeId`
Get route detail.

### `GET /buses/live?routeId=...`
Get active/live buses.

### `GET /buses/:busId`
Get bus detail.

### `GET /waiting?routeId=...`
Get waiting list.

### `GET /waiting/:waitingId`
Get waiting detail.

### `POST /waiting`
Create waiting request.
Requires bearer token.

### `DELETE /waiting/:waitingId`
Cancel waiting request.
Requires bearer token.

---

## Driver
### `POST /auth/driver/login`
Driver login.

### `GET /driver/me`
Get driver profile and assigned bus.
Requires driver/admin token.

### `POST /drivers/duty`
Toggle driver duty on/off.
Requires driver/admin token.

### `POST /locations`
Send bus GPS location.
Requires driver/admin token.

### `GET /driver/waiting?routeId=...`
List waiting passengers for route.
Requires driver/admin token.

### `GET /driver/waiting-summary?routeId=...`
Summary of waiting passengers for route.
Requires driver/admin token.

### `POST /driver/waiting/:waitingId/pickup`
Mark waiting passenger as picked up.
Requires driver/admin token.

---

## Admin — Summary
### `GET /admin/summary`
Get admin dashboard summary.
Requires admin token.

### `GET /admin/waiting?routeId=...`
Get waiting list for admin monitoring.
Requires admin token.

### `GET /admin/waiting-summary?routeId=...`
Get waiting summary for admin monitoring.
Requires admin token.

---

## Admin — Users
### `GET /admin/users`
List users.

### `GET /admin/users/:userId`
Get user by id.

### `POST /admin/users`
Create user profile.

### `PUT /admin/users/:userId`
Update user profile.

### `DELETE /admin/users/:userId`
Delete user.

---

## Admin — Drivers
### `GET /admin/drivers`
List drivers.

### `GET /admin/drivers/:driverId`
Get driver by id.

### `POST /admin/drivers`
Create driver profile.

### `PUT /admin/drivers/:driverId`
Update driver profile.

### `DELETE /admin/drivers/:driverId`
Delete driver.

---

## Admin — Admins
### `GET /admin/admins`
List admins.

### `GET /admin/admins/:adminId`
Get admin by id.

### `POST /admin/admins`
Create admin profile.

### `PUT /admin/admins/:adminId`
Update admin profile.

### `DELETE /admin/admins/:adminId`
Delete admin.

---

## Admin — Route Admin Assignments
### `GET /admin/route-admins`
List route-admin assignments.

### `GET /admin/route-admins/:assignmentId`
Get assignment by id.

### `POST /admin/route-admins`
Create route-admin assignment.

### `DELETE /admin/route-admins/:assignmentId`
Delete assignment.

---

## Admin — Routes
### `GET /admin/routes`
List routes.

### `GET /admin/routes/:routeId`
Get route detail.

### `GET /admin/routes/:routeId/buses`
Get buses for route.

### `GET /admin/routes/:routeId/waiting-summary`
Get waiting summary for route.

### `POST /admin/routes`
Create route.

### `PUT /admin/routes/:routeId`
Update route.

### `DELETE /admin/routes/:routeId`
Delete route.

---

## Admin — Buses
### `GET /admin/buses`
List buses.

### `GET /admin/buses/:busId`
Get bus detail.

### `POST /admin/buses`
Create bus.

### `PUT /admin/buses/:busId`
Update bus.

### `DELETE /admin/buses/:busId`
Delete bus.
