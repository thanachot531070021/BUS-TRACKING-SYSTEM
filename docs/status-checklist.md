# BUS TRACKING SYSTEM Status Checklist

## Done
- [x] Project scaffold created under `C:\Web Source`
- [x] Split project into `apps`, `backend`, `supabase`, `docs`
- [x] Admin dashboard starter created with Vite-based setup
- [x] Flutter mobile starter structure created
- [x] Cloudflare Worker backend scaffold created
- [x] Supabase schema drafted
- [x] Backend refactored into router / services / repositories / handlers
- [x] User / Driver / Admin / Route Admin management APIs scaffolded
- [x] Auth middleware scaffold added
- [x] Role-based guard scaffold added
- [x] Route-admin scope scaffold added
- [x] Project direction switched to **Supabase online first**
- [x] Route / Bus / Waiting detail + delete APIs expanded
- [x] `.env.example` updated for online config
- [x] Supabase online setup doc added

## In Progress / Partial
- [ ] Real Supabase Auth verification (currently still mock token parsing)
- [ ] Worker connected with real online runtime secrets
- [ ] Route-admin scope enforcement completed for every route-scoped write
- [ ] Admin dashboard connected to live API data end-to-end
- [ ] Flutter app connected to real backend/Supabase

## Next Recommended Tasks
### Backend
- [ ] Replace mock auth with Supabase Auth JWT verification
- [ ] Add `GET /auth/me` or equivalent current-user endpoint
- [ ] Add register/login flow for username/email + password
- [ ] Finish route-admin scope checks using real DB lookups for all route/bus write actions
- [ ] Add stronger validation schemas for request bodies

### Supabase / Infra
- [ ] Put real values into Worker env/secrets
- [ ] Apply `supabase/schema.sql` to online project
- [ ] Enable Realtime on `routes`, `buses`, `bus_locations`, `passenger_waiting`
- [ ] Rotate any secrets/passwords that were shared in chat

### Admin Dashboard
- [ ] Connect dashboard to real `/admin/routes` and `/admin/buses`
- [ ] Add create/edit/delete route UI
- [ ] Add create/edit/delete bus UI
- [ ] Add login flow for admin
- [ ] Add user/driver/admin management screens

### Flutter App
- [ ] Install Flutter SDK on machine
- [ ] Add API service layer
- [ ] Add Supabase Auth integration
- [ ] Add Google Maps screens/widgets
- [ ] Add realtime bus tracking subscription
- [ ] Add passenger waiting submit/cancel flow
- [ ] Add driver duty + GPS posting flow

## Cleanup
- [ ] Remove temporary mock-only logic after real auth is wired
- [x] Remove large `supabase/cli/supabase.exe` from tracked project files
