# BUS TRACKING SYSTEM Architecture

## Stack

- Frontend Mobile: Flutter
- Frontend Admin: Web Dashboard
- Backend API: Cloudflare Workers
- Database: Supabase PostgreSQL
- Realtime: Supabase Realtime
- Map: Google Maps API

## Core Modules

### 1. Route Management
Entities:
- routes
- route_admins

### 2. Bus Management
Entities:
- buses
- drivers

### 3. Location Tracking
Entities:
- bus_locations
- buses.current_lat / current_lng / last_seen_at

Driver app sends location every 5–10 seconds.
Cloudflare Worker validates request and stores latest location.
Supabase Realtime broadcasts updates to passenger and admin clients.

### 4. Passenger Waiting
Entities:
- passenger_waiting

Passenger can create or cancel waiting request for a route.
Driver sees waiting points and total waiting passengers.

### 5. Authentication
- Passenger: guest or phone login
- Driver: authenticated login
- Admin: authenticated login with role restrictions

## Recommended API Groups

- `/auth/*`
- `/routes/*`
- `/buses/*`
- `/locations/*`
- `/waiting/*`
- `/admin/*`

## Suggested Realtime Channels

- `route:{routeId}:buses`
- `route:{routeId}:waiting`

## Notes

- Use row-level security in Supabase for admin/driver separation.
- Route Admin should only access assigned routes.
- Passenger reads should be public but filtered by active route/bus state.
