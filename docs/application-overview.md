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

### Passenger
Main responsibilities:
- browse available routes
- view live buses on a map
- mark "waiting for bus"
- cancel waiting status

### Driver
Main responsibilities:
- log in to the system
- switch duty ON/OFF
- send GPS updates every 5–10 seconds
- view assigned route
- view waiting passengers
- mark waiting passengers as picked up

### Route Admin
Main responsibilities:
- manage only assigned routes
- monitor buses and waiting passengers in assigned routes
- handle route-scoped operations

### Super Admin
Main responsibilities:
- manage all routes
- manage buses
- manage users
- manage drivers
- manage admins
- manage route-admin assignments
- monitor whole-system operations

---

## 3. Main System Modules

### A. Authentication & Authorization
Must support:
- login
- register
- current user (`/auth/me`)
- role-based access control
- route-admin scope control
- future Google login support

Purpose:
- identify users securely
- separate system roles and permissions
- connect Supabase Auth with internal business profiles

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
- dashboard summary
- route management UI
- bus management UI
- user management UI
- driver management UI
- admin management UI
- route-admin assignment UI
- monitoring views

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
- `public.drivers`
- `public.admins`
- `public.route_admins`
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
1. finish linking `auth_user_id` correctly for all users
2. complete real Supabase JWT verification in middleware
3. continue improving admin web UX/UI and data-management flows
4. connect Flutter app to auth + API + realtime + maps
5. test the full end-to-end flow with real data
