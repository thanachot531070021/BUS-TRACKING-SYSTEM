# Admin Web Worker

This worker serves the built admin website as a separate deployment target from the API worker.

## Purpose
- Keep admin web hosting separate from API logic
- Allow separate deploys for admin UI and backend API

## Build Flow
1. Build admin web:
   - `npm run build:admin`
2. Run/deploy admin web worker:
   - `npm run dev:admin-web-worker`
   - `npm run deploy:admin-web-worker`

## Notes
- Static assets are served from `apps/admin_dashboard/dist`
- API worker remains in `backend/worker`
