# Next Implementation Steps

## Backend
- Add authentication for Driver/Admin
- Add admin CRUD endpoints for routes and buses
- Add cancellation endpoint for waiting records
- Add route-based authorization for Route Admin

## Mobile App
- Add HTTP client service layer
- Add Google Maps widget
- Add route detail page
- Add driver live GPS posting service
- Add passenger waiting submit/cancel actions

## Admin Dashboard
- Add create/edit route forms
- Add create/edit bus forms
- Add role-based login
- Integrate real map markers

## Infrastructure
- Create Supabase project
- Run `supabase/schema.sql`
- Enable Realtime on buses, bus_locations, passenger_waiting, routes
- Configure Cloudflare Worker environment variables
- Configure Google Maps API keys
