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
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        me: 'GET /auth/me (Bearer required)',
        googleLogin: 'POST /auth/google/login',
        passengerRoutes: 'GET /routes',
        passengerRouteById: 'GET /routes/:routeId',
        passengerLiveBuses: 'GET /buses/live?routeId=...',
        passengerBusById: 'GET /buses/:busId',
        passengerWaitingList: 'GET /waiting?routeId=...',
        passengerWaitingById: 'GET /waiting/:waitingId',
        passengerCreateWaiting: 'POST /waiting (Bearer required)',
        passengerCancelWaiting: 'DELETE /waiting/:waitingId (Bearer required)',
        driverLogin: 'POST /auth/driver/login',
        driverDuty: 'POST /drivers/duty (Driver/Admin token)',
        driverLocations: 'POST /locations (Driver/Admin token)',
        driverWaiting: 'GET /driver/waiting?routeId=... (Driver/Admin token)',
        adminLogin: 'POST /auth/admin/login',
        adminUsers: 'GET/POST /admin/users (Admin token)',
        adminUserById: 'PUT /admin/users/:userId (Admin token)',
        adminDrivers: 'GET/POST /admin/drivers (Admin token)',
        adminDriverById: 'PUT /admin/drivers/:driverId (Admin token)',
        adminAdmins: 'GET/POST /admin/admins (Admin token)',
        adminAdminById: 'PUT /admin/admins/:adminId (Admin token)',
        adminRouteAdmins: 'GET/POST /admin/route-admins (Admin token)',
        adminRouteAdminById: 'DELETE /admin/route-admins/:assignmentId (Admin token)',
        adminRoutes: 'GET/POST /admin/routes (Admin token)',
        adminRouteById: 'GET/PUT/DELETE /admin/routes/:routeId (Admin token)',
        adminBuses: 'GET/POST /admin/buses (Admin token)',
        adminBusById: 'GET/PUT/DELETE /admin/buses/:busId (Admin token)',
        adminWaiting: 'GET /admin/waiting?routeId=... (Admin token)',
        analyticsLogEvent: 'POST /analytics/event (Public — web_admin or mobile_app)',
        analyticsReport: 'GET /admin/analytics?days=7 (Admin token)',
      },
    });
  }

  const response = await publicRouter(request, env);
  if (response.status !== 404) return response;

  const driverResponse = await driverRouter(request, env);
  if (driverResponse.status !== 404) return driverResponse;

  return adminRouter(request, env);
}
