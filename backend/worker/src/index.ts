export interface Env {
  APP_NAME: string;
}

type RouteSummary = {
  id: string;
  routeCode: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  status: 'active' | 'inactive';
};

type BusLive = {
  id: string;
  plateNumber: string;
  routeId: string;
  routeName: string;
  driverId: string;
  status: 'on' | 'off' | 'maintenance';
  lat: number;
  lng: number;
  speed: number;
  lastSeenAt: string;
};

type WaitingPoint = {
  id: string;
  routeId: string;
  routeName: string;
  lat: number;
  lng: number;
  waitingCount: number;
  status: 'waiting' | 'cancelled' | 'picked_up';
  timestamp: string;
};

const sampleRoutes: RouteSummary[] = [
  {
    id: 'route-r1',
    routeCode: 'R1',
    routeName: 'Campus Loop',
    startLocation: 'Main Gate',
    endLocation: 'Engineering Building',
    status: 'active',
  },
  {
    id: 'route-r2',
    routeCode: 'R2',
    routeName: 'City Connector',
    startLocation: 'Bus Terminal',
    endLocation: 'Central Market',
    status: 'active',
  },
];

const sampleBuses: BusLive[] = [
  {
    id: 'bus-001',
    plateNumber: '10-1234',
    routeId: 'route-r1',
    routeName: 'Campus Loop',
    driverId: 'driver-001',
    status: 'on',
    lat: 13.7563,
    lng: 100.5018,
    speed: 32,
    lastSeenAt: new Date().toISOString(),
  },
  {
    id: 'bus-002',
    plateNumber: '20-5678',
    routeId: 'route-r2',
    routeName: 'City Connector',
    driverId: 'driver-002',
    status: 'on',
    lat: 13.7465,
    lng: 100.5346,
    speed: 18,
    lastSeenAt: new Date().toISOString(),
  },
];

const sampleWaiting: WaitingPoint[] = [
  {
    id: 'wait-001',
    routeId: 'route-r1',
    routeName: 'Campus Loop',
    lat: 13.7512,
    lng: 100.5031,
    waitingCount: 3,
    status: 'waiting',
    timestamp: new Date().toISOString(),
  },
];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization',
    },
  });
}

async function readJson<T>(request: Request): Promise<T | null> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  return request.json<T>();
}

function notFound() {
  return json({ error: 'Not Found' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS', 'access-control-allow-headers': 'content-type,authorization' } });
    }

    if (url.pathname === '/') {
      return json({
        app: env.APP_NAME,
        status: 'ok',
        endpoints: {
          health: 'GET /health',
          routes: 'GET /routes',
          liveBuses: 'GET /buses/live?routeId=route-r1',
          waitingList: 'GET /waiting?routeId=route-r1',
          createWaiting: 'POST /waiting',
          updateBusLocation: 'POST /locations',
          driverDuty: 'POST /drivers/duty',
        },
      });
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return json({ ok: true, service: 'worker', app: env.APP_NAME });
    }

    if (url.pathname === '/routes' && request.method === 'GET') {
      return json({ data: sampleRoutes });
    }

    if (url.pathname === '/buses/live' && request.method === 'GET') {
      const routeId = url.searchParams.get('routeId');
      const data = routeId ? sampleBuses.filter((bus) => bus.routeId === routeId) : sampleBuses;
      return json({ data });
    }

    if (url.pathname === '/waiting' && request.method === 'GET') {
      const routeId = url.searchParams.get('routeId');
      const data = routeId ? sampleWaiting.filter((point) => point.routeId === routeId) : sampleWaiting;
      return json({ data });
    }

    if (url.pathname === '/waiting' && request.method === 'POST') {
      const body = await readJson<{ routeId: string; lat: number; lng: number; userId?: string }>(request);
      if (!body?.routeId || body.lat === undefined || body.lng === undefined) {
        return json({ error: 'routeId, lat, lng are required' }, 400);
      }

      return json({
        message: 'Passenger waiting request accepted',
        data: {
          id: crypto.randomUUID(),
          routeId: body.routeId,
          lat: body.lat,
          lng: body.lng,
          userId: body.userId ?? null,
          status: 'waiting',
          timestamp: new Date().toISOString(),
        },
      }, 201);
    }

    if (url.pathname === '/locations' && request.method === 'POST') {
      const body = await readJson<{ busId: string; lat: number; lng: number; speed?: number }>(request);
      if (!body?.busId || body.lat === undefined || body.lng === undefined) {
        return json({ error: 'busId, lat, lng are required' }, 400);
      }

      return json({
        message: 'Bus location update accepted',
        data: {
          busId: body.busId,
          lat: body.lat,
          lng: body.lng,
          speed: body.speed ?? 0,
          timestamp: new Date().toISOString(),
        },
      }, 201);
    }

    if (url.pathname === '/drivers/duty' && request.method === 'POST') {
      const body = await readJson<{ busId: string; status: 'on' | 'off' }>(request);
      if (!body?.busId || !body.status) {
        return json({ error: 'busId and status are required' }, 400);
      }

      return json({
        message: 'Driver duty status updated',
        data: {
          busId: body.busId,
          status: body.status,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return notFound();
  },
};
