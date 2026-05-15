# Application Overview — BUS TRACKING SYSTEM

## 1. Project Purpose
BUS TRACKING SYSTEM is a transportation tracking platform for passengers, drivers, and administrators.

It is designed to:
- show bus routes and live bus positions
- allow passengers to indicate that they are waiting for a bus
- allow drivers to update duty status and GPS location
- allow admins to manage routes, buses, users, and system operations
- support realtime updates across the system

---

## 2. User Roles

There are 4 roles in the system. Zone isolation is enforced at the API level — no role (except super_admin) can view or manage data outside its own zone.

### Passenger (User)
Access scope: **all zones** (read-only on public data)

Main responsibilities:
- browse all available routes across all zones
- view live buses on a map
- mark "waiting for bus" on any route
- cancel waiting status

### Driver
Access scope: **own zone only** (implicitly via assigned route → zone)

Main responsibilities:
- log in to the system
- switch duty ON/OFF
- send GPS updates every 5–10 seconds
- view assigned route
- view waiting passengers on assigned route
- mark waiting passengers as picked up

A driver belongs to a zone through their `assigned_route_id → routes.zone_id`. They have no direct `zone_id` field.

### Zone Admin (admin_type: zone_admin)
Access scope: **own zone only** (enforced on all CRUD operations)

Main responsibilities:
- manage routes within their zone only
- manage buses on routes within their zone only
- manage drivers assigned to routes in their zone only
- manage other zone_admins within their zone only
- monitor waiting passengers and buses within their zone

Restrictions:
- cannot view or manage data in other zones
- cannot create or promote anyone to super_admin
- cannot assign drivers to routes outside their zone

### Super Admin (admin_type: super_admin)
Access scope: **all zones, no restrictions**

Main responsibilities:
- manage all zones (create, update, delete)
- manage all routes, buses, drivers, admins across all zones
- manage all user accounts
- monitor whole-system operations

---

## 3. Main System Modules

### A. Authentication & Authorization
Must support:
- login
- register
- current user (`/auth/me`)
- role-based access control (RBAC)
- zone-scoped access control for zone_admin
- Google login support

Purpose:
- identify users securely
- separate system roles and permissions
- connect Supabase Auth with internal business profiles

RBAC rules enforced at API middleware level:
- `super_admin` → unrestricted
- `zone_admin` → all reads/writes scoped to own zone; cannot cross zones or create super_admin
- `driver` → scoped to own assigned route (zone implied)
- `passenger` → read-only public data across all zones

### B. Route Management
Must support:
- create route
- update route
- delete route
- list routes
- route detail

Purpose:
- define transport routes
- connect buses and waiting passengers to routes

### C. Bus Management
Must support:
- create bus
- update bus
- delete bus
- list buses
- bus detail
- live bus list
- buses by route

Purpose:
- manage bus fleet
- assign buses to routes and drivers
- monitor operational state

### D. Driver Management
Must support:
- create driver
- update driver
- delete driver
- driver detail
- assigned route/bus

Purpose:
- manage operational staff
- connect drivers to user accounts and buses

### E. Admin Management
Must support:
- create admin
- update admin
- delete admin
- admin detail
- route-admin assignment

Purpose:
- separate super admin and route admin capabilities
- control management scope by role

### F. Passenger Waiting System
Must support:
- create waiting request
- cancel waiting request
- waiting detail
- waiting list
- waiting summary
- mark as picked up

Purpose:
- allow passengers to signal demand
- allow drivers to respond to waiting passengers
- allow admins to monitor demand in each route

### G. Realtime Tracking
Must support:
- bus location updates
- live bus query
- waiting updates
- realtime subscriptions

Purpose:
- provide live information to passengers, drivers, and admins

### H. Admin Web Application
Must support:
- dashboard summary (stats per zone)
- zone management UI (super_admin only)
- route management UI (grouped by zone)
- bus management UI (grouped by route, route auto-derived from driver)
- driver management UI (grouped by route, with bus plate linkage)
- admin management UI (zone_admin / super_admin)
- user management UI (super_admin only)
- passenger waiting monitoring (read-only)
- role-based visibility (zone_admin sees own zone only)

Purpose:
- give administrators a central operational control panel

### I. Mobile Application
Must support:
- passenger route browsing
- live bus map
- waiting flow
- driver duty flow
- driver waiting flow
- auth/profile flow

Purpose:
- provide the main end-user application for passengers and drivers

---

## 4. Technology Stack

### Frontend Mobile
- Flutter

### Frontend Admin
- Web Admin Dashboard

### Backend API
- Cloudflare Workers

### Database / Auth / Realtime
- Supabase

### Map
- Google Maps

---

## 5. Data & Auth Model

### Supabase Auth
Used for:
- email/password login
- session management
- JWT tokens
- identity provider handling

### Application Database Tables
Used for business logic and roles:
- `public.users`
- `public.admins`
- `public.drivers`
- `public.zones`
- `public.routes`
- `public.buses`
- `public.bus_locations`
- `public.passenger_waiting`

### Identity Linking
The intended link is:
- `public.users.auth_user_id = auth.users.id`

Meaning:
- Supabase Auth stores identity and credentials
- `public.users` stores business profile and role
- related tables store role-specific and operational data

---

## 6. How the System Is Used

### Passenger Flow
1. Open app
2. View routes
3. Open route/map
4. See live buses
5. Mark waiting for bus
6. Cancel waiting if necessary

### Driver Flow
1. Login
2. Open duty
3. App sends GPS periodically
4. View assigned route
5. View waiting passengers
6. Mark pickup complete

### Admin Flow
1. Login
2. View dashboard
3. Manage routes and buses
4. Manage users/drivers/admins
5. Monitor waiting passengers and operations

---

## 7. Current Project Direction
The current direction is:
- Supabase online-first
- Cloudflare Worker as API layer
- Admin web separated from API worker
- Mobile app and admin web both consume API and realtime services

---

## 8. Important Existing Documents
For more detail, check these files:

- `C:\Web Source\README.md`
- `C:\Web Source\docs\architecture.md`
- `C:\Web Source\docs\api-plan.md`
- `C:\Web Source\docs\api-reference.md`
- `C:\Web Source\docs\auth-flow.md`
- `C:\Web Source\admin-dashboard-rebuild.md`

---

## 9. Recommended Next Steps
1. Enable Supabase Realtime on `bus_locations` and `passenger_waiting`
2. Connect Flutter mobile app to real Supabase auth + API
3. Add JWT `exp` validation in `requireAuth` middleware
4. Review and enable RLS policies (currently bypassed by service_role_key)
5. Implement password change endpoint for admin-managed users
6. Wire Google Maps in Flutter app
