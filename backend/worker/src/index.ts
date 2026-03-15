export interface Env {
  APP_NAME: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

type JsonRecord = Record<string, unknown>;

type RouteSummary = {
  id: string;
  route_code: string;
  route_name: string;
  start_location: string;
  end_location: string;
  status: 'active' | 'inactive';
};

type BusLive = {
  id: string;
  plate_number: string;
  route_id: string;
  route_name: string;
  driver_id: string;
  status: 'on' | 'off' | 'maintenance';
  current_lat: number;
  current_lng: number;
  current_speed: number;
  last_seen_at: string;
};

type WaitingPoint = {
  id: string;
  route_id: string;
  route_name: string;
  lat: number;
  lng: number;
  waiting_count: number;
  status: 'waiting' | 'cancelled' | 'picked_up';
  created_at: string;
};

const sampleRoutes: RouteSummary[] = [
  {
    id: 'route-r1',
    route_code: 'R1',
    route_name: 'Campus Loop',
    start_location: 'Main Gate',
    end_location: 'Engineering Building',
    status: 'active',
  },
  {
    id: 'route-r2',
    route_code: 'R2',
    route_name: 'City Connector',
    start_location: 'Bus Terminal',
    end_location: 'Central Market',
    status: 'active',
  },
];

const sampleBuses: BusLive[] = [
  {
    id: 'bus-001',
    plate_number: '10-1234',
    route_id: 'route-r1',
    route_name: 'Campus Loop',
    driver_id: 'driver-001',
    status: 'on',
    current_lat: 13.7563,
    current_lng: 100.5018,
    current_speed: 32,
    last_seen_at: new Date().toISOString(),
  },
  {
    id: 'bus-002',
    plate_number: '20-5678',
    route_id: 'route-r2',
    route_name: 'City Connector',
    driver_id: 'driver-002',
    status: 'on',
    current_lat: 13.7465,
    current_lng: 100.5346,
    current_speed: 18,
    last_seen_at: new Date().toISOString(),
  },
];

const sampleWaiting: WaitingPoint[] = [
  {
    id: 'wait-001',
    route_id: 'route-r1',
    route_name: 'Campus Loop',
    lat: 13.7512,
    lng: 100.5031,
    waiting_count: 3,
    status: 'waiting',
    created_at: new Date().toISOString(),
  },
];

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(),
    },
  });
}

async function readJson<T>(request: Request): Promise<T | null> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  return request.json<T>();
}

function usingSupabase(env: Env) {
  return Boolean(env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY));
}

async function supabaseFetch<T>(env: Env, path: string, init?: RequestInit): Promise<T> {
  const baseUrl = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

  if (!baseUrl || !key) {
    throw new Error('Supabase environment variables are not configured');
  }

  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${text}`);
  }

  if (response.status === 204) {
    return [] as T;
  }

  return response.json<T>();
}

async function getRoutes(env: Env) {
  if (!usingSupabase(env)) return sampleRoutes;
  return supabaseFetch<RouteSummary[]>(env, 'routes?select=id,route_code,route_name,start_location,end_location,status&status=eq.active&order=route_code.asc');
}

async function getLiveBuses(env: Env, routeId?: string | null) {
  if (!usingSupabase(env)) {
    return routeId ? sampleBuses.filter((bus) => bus.route_id === routeId) : sampleBuses;
  }

  const query = routeId
    ? `active_buses_live?select=*&route_id=eq.${routeId}`
    : 'active_buses_live?select=*';

  return supabaseFetch<BusLive[]>(env, query);
}

async function getWaiting(env: Env, routeId?: string | null) {
  if (!usingSupabase(env)) {
    return routeId ? sampleWaiting.filter((point) => point.route_id === routeId) : sampleWaiting;
  }

  const query = routeId
    ? `active_waiting_passengers?select=*&route_id=eq.${routeId}`
    : 'active_waiting_passengers?select=*';

  const rows = await supabaseFetch<Array<Omit<WaitingPoint, 'waiting_count'> & { waiting_count?: number }>>(env, query);
  return rows.map((row) => ({ ...row, waiting_count: row.waiting_count ?? 1 }));
}

async function createWaiting(env: Env, body: { routeId: string; lat: number; lng: number; userId?: string }) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      route_id: body.routeId,
      lat: body.lat,
      lng: body.lng,
      user_id: body.userId ?? null,
      status: 'waiting',
      created_at: new Date().toISOString(),
    };
  }

  const payload = [{
    route_id: body.routeId,
    lat: body.lat,
    lng: body.lng,
    user_id: body.userId ?? null,
    status: 'waiting',
  }];

  const created = await supabaseFetch<JsonRecord[]>(env, 'passenger_waiting', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return created[0];
}

async function createLocation(env: Env, body: { busId: string; lat: number; lng: number; speed?: number }) {
  const timestamp = new Date().toISOString();

  if (!usingSupabase(env)) {
    return {
      bus_id: body.busId,
      lat: body.lat,
      lng: body.lng,
      speed: body.speed ?? 0,
      recorded_at: timestamp,
    };
  }

  await supabaseFetch<JsonRecord[]>(env, 'bus_locations', {
    method: 'POST',
    body: JSON.stringify([
      {
        bus_id: body.busId,
        lat: body.lat,
        lng: body.lng,
        speed: body.speed ?? 0,
        recorded_at: timestamp,
      },
    ]),
  });

  const updatedBus = await supabaseFetch<JsonRecord[]>(env, `buses?id=eq.${body.busId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      current_lat: body.lat,
      current_lng: body.lng,
      current_speed: body.speed ?? 0,
      last_seen_at: timestamp,
    }),
  });

  return updatedBus[0] ?? {
    bus_id: body.busId,
    current_lat: body.lat,
    current_lng: body.lng,
    current_speed: body.speed ?? 0,
    last_seen_at: timestamp,
  };
}

async function updateDriverDuty(env: Env, body: { busId: string; status: 'on' | 'off' }) {
  const timestamp = new Date().toISOString();

  if (!usingSupabase(env)) {
    return { bus_id: body.busId, status: body.status, timestamp };
  }

  const updated = await supabaseFetch<JsonRecord[]>(env, `buses?id=eq.${body.busId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: body.status,
      last_seen_at: timestamp,
    }),
  });

  return updated[0] ?? { bus_id: body.busId, status: body.status, timestamp };
}

function notFound() {
  return json({ error: 'Not Found' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      if (url.pathname === '/') {
        return json({
          app: env.APP_NAME,
          status: 'ok',
          mode: usingSupabase(env) ? 'supabase' : 'mock',
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
        return json({ ok: true, service: 'worker', app: env.APP_NAME, mode: usingSupabase(env) ? 'supabase' : 'mock' });
      }

      if (url.pathname === '/routes' && request.method === 'GET') {
        return json({ data: await getRoutes(env) });
      }

      if (url.pathname === '/buses/live' && request.method === 'GET') {
        return json({ data: await getLiveBuses(env, url.searchParams.get('routeId')) });
      }

      if (url.pathname === '/waiting' && request.method === 'GET') {
        return json({ data: await getWaiting(env, url.searchParams.get('routeId')) });
      }

      if (url.pathname === '/waiting' && request.method === 'POST') {
        const body = await readJson<{ routeId: string; lat: number; lng: number; userId?: string }>(request);
        if (!body?.routeId || body.lat === undefined || body.lng === undefined) {
          return json({ error: 'routeId, lat, lng are required' }, 400);
        }

        return json({ message: 'Passenger waiting request accepted', data: await createWaiting(env, body) }, 201);
      }

      if (url.pathname === '/locations' && request.method === 'POST') {
        const body = await readJson<{ busId: string; lat: number; lng: number; speed?: number }>(request);
        if (!body?.busId || body.lat === undefined || body.lng === undefined) {
          return json({ error: 'busId, lat, lng are required' }, 400);
        }

        return json({ message: 'Bus location update accepted', data: await createLocation(env, body) }, 201);
      }

      if (url.pathname === '/drivers/duty' && request.method === 'POST') {
        const body = await readJson<{ busId: string; status: 'on' | 'off' }>(request);
        if (!body?.busId || !body.status) {
          return json({ error: 'busId and status are required' }, 400);
        }

        return json({ message: 'Driver duty status updated', data: await updateDriverDuty(env, body) });
      }

      return notFound();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return json({ error: message }, 500);
    }
  },
};
