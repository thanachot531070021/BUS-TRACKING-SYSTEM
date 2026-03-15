import { handleAdminCreateBus, handleAdminCreateRoute, handleAdminListBuses, handleAdminListRoutes, handleAdminLogin, handleAdminUpdateBus, handleAdminUpdateRoute, handleAdminWaiting } from './handlers/admin';
import { handleDriverDuty, handleDriverLocation, handleDriverLogin, handleDriverWaiting } from './handlers/driver';
import { handleHealth } from './handlers/health';
import { notFound, json } from './lib/http';
import { usingSupabase } from './lib/supabase';
import { handleCancelWaiting, handleCreateWaiting, handleListRoutes, handleListWaiting, handleLiveBuses } from './handlers/passenger';
import type { Env } from './types';

function getIdFromPath(pathname: string, prefix: string) {
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).split('/')[0] || null;
}

export async function routeRequest(request: Request, env: Env) {
  const url = new URL(request.url);
  const { pathname } = url;

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

  if (pathname === '/health' && request.method === 'GET') return handleHealth(env);

  if (pathname === '/routes' && request.method === 'GET') return handleListRoutes(env);
  if (pathname === '/buses/live' && request.method === 'GET') return handleLiveBuses(env, request);
  if (pathname === '/waiting' && request.method === 'GET') return handleListWaiting(env, request);
  if (pathname === '/waiting' && request.method === 'POST') return handleCreateWaiting(env, request);

  if (pathname.startsWith('/waiting/') && request.method === 'DELETE') {
    const waitingId = getIdFromPath(pathname, '/waiting/');
    return handleCancelWaiting(env, waitingId ?? '');
  }

  if (pathname === '/auth/driver/login' && request.method === 'POST') return handleDriverLogin(env, request);
  if (pathname === '/drivers/duty' && request.method === 'POST') return handleDriverDuty(env, request);
  if (pathname === '/locations' && request.method === 'POST') return handleDriverLocation(env, request);
  if (pathname === '/driver/waiting' && request.method === 'GET') return handleDriverWaiting(env, request);

  if (pathname === '/auth/admin/login' && request.method === 'POST') return handleAdminLogin(env, request);
  if (pathname === '/admin/routes' && request.method === 'GET') return handleAdminListRoutes(env);
  if (pathname === '/admin/routes' && request.method === 'POST') return handleAdminCreateRoute(env, request);
  if (pathname.startsWith('/admin/routes/') && request.method === 'PUT') {
    const routeId = getIdFromPath(pathname, '/admin/routes/');
    return handleAdminUpdateRoute(env, request, routeId ?? '');
  }

  if (pathname === '/admin/buses' && request.method === 'GET') return handleAdminListBuses(env);
  if (pathname === '/admin/buses' && request.method === 'POST') return handleAdminCreateBus(env, request);
  if (pathname.startsWith('/admin/buses/') && request.method === 'PUT') {
    const busId = getIdFromPath(pathname, '/admin/buses/');
    return handleAdminUpdateBus(env, request, busId ?? '');
  }

  if (pathname === '/admin/waiting' && request.method === 'GET') return handleAdminWaiting(env, request);

  return notFound();
}
