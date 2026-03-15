# Cloudflare Worker API

This is the backend starter for BUS TRACKING SYSTEM.

## Current Endpoints

- `GET /health`
- `GET /routes`
- `GET /buses/live?routeId=...`
- `GET /waiting?routeId=...`
- `POST /waiting`
- `POST /locations`
- `POST /drivers/duty`

## Current State

Right now these endpoints return mock/starter responses so frontend work can begin immediately.

## Next Integration Step

Replace sample data in `src/index.ts` with:
- Supabase REST queries, or
- direct database access through a secure API layer

## Example POST Body

### `/waiting`
```json
{
  "routeId": "route-r1",
  "lat": 13.7512,
  "lng": 100.5031,
  "userId": "optional-user-id"
}
```

### `/locations`
```json
{
  "busId": "bus-001",
  "lat": 13.7563,
  "lng": 100.5018,
  "speed": 30
}
```

### `/drivers/duty`
```json
{
  "busId": "bus-001",
  "status": "on"
}
```
