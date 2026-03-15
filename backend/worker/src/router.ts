import { json } from './lib/http';
import { usingSupabase } from './lib/supabase';
import { adminRouter } from './router/admin';
import { driverRouter } from './router/driver';
import { publicRouter } from './router/public';
import type { Env } from './types';

export async function routeRequest(request: Request, env: Env) {
  const { pathname } = new URL(request.url);

  if (pathname === '/') {
    return json({
      app: env.APP_NAME,
      status: 'ok',
      mode: usingSupabase(env) ? 'supabase' : 'mock',
      endpoints: {
        health: 'GET /health',
        passengerRoutes: 'GET /routes',
        passengerLiveBuses: 'GET /buses/live?routeId=...',
        passengerWaitingList: 'GET /waiting?routeId=...',
        passengerCreateWaiting: 'POST /waiting',
        passengerCancelWaiting: 'DELETE /waiting/:waitingId',
        driverLogin: 'POST /auth/driver/login',
        driverDuty: 'POST /drivers/duty',
        driverLocations: 'POST /locations',
        driverWaiting: 'GET /driver/waiting?routeId=...',
        adminLogin: 'POST /auth/admin/login',
        adminRoutes: 'GET/POST /admin/routes',
        adminRouteById: 'PUT /admin/routes/:routeId',
        adminBuses: 'GET/POST /admin/buses',
        adminBusById: 'PUT /admin/buses/:busId',
        adminWaiting: 'GET /admin/waiting?routeId=...',
      },
    });
  }

  const response = await publicRouter(request, env);
  if (response.status !== 404) return response;

  const driverResponse = await driverRouter(request, env);
  if (driverResponse.status !== 404) return driverResponse;

  return adminRouter(request, env);
}
