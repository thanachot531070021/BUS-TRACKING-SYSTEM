import { badRequest, json, readJson } from '../lib/http';
import { adminLoginService } from '../services/auth.service';
import { createBusService, deleteBusService, getBusByIdService, listAdminBusesService, listBusesByRouteService, updateBusService } from '../services/buses.service';
import { createRouteService, deleteRouteService, getRouteByIdService, listRoutesService, updateRouteService } from '../services/routes.service';
import { getWaitingSummaryService, listWaitingService } from '../services/waiting.service';
import { listDriversService } from '../services/drivers.service';
import { listUsersService } from '../services/users.service';
import type { Env, UpdateBusBody, UpdateRouteBody } from '../types';
import { validateCreateBusBody } from '../schemas/bus.schema';
import { validateCreateRouteBody } from '../schemas/route.schema';

export async function handleAdminLogin(env: Env, request: Request) {
  const body = await readJson<{ username?: string; password?: string }>(request);
  if (!body?.username || !body.password) return badRequest('username and password are required');
  return json({ message: 'Admin login success', data: await adminLoginService(env, body.username, body.password) });
}

export async function handleAdminDashboardSummary(env: Env) {
  const [routes, buses, drivers, users] = await Promise.all([
    listRoutesService(env),
    listAdminBusesService(env),
    listDriversService(env),
    listUsersService(env),
  ]);

  return json({
    data: {
      total_routes: routes.length,
      total_buses: buses.length,
      total_drivers: drivers.length,
      total_users: users.length,
      active_buses: buses.filter((bus: any) => bus.status === 'on').length,
    },
  });
}

export async function handleAdminListRoutes(env: Env) {
  return json({ data: await listRoutesService(env) });
}

export async function handleAdminGetRouteById(env: Env, routeId: string) {
  if (!routeId) return badRequest('routeId is required');
  return json({ data: await getRouteByIdService(env, routeId) });
}

export async function handleAdminCreateRoute(env: Env, request: Request) {
  const body = await readJson(request);
  const validated = validateCreateRouteBody(body);
  if (!validated.ok) return badRequest(validated.error);
  return json({ message: 'Route created', data: await createRouteService(env, validated.data) }, 201);
}

export async function handleAdminUpdateRoute(env: Env, request: Request, routeId: string) {
  const body = await readJson<UpdateRouteBody>(request);
  if (!routeId) return badRequest('routeId is required');
  return json({ message: 'Route updated', data: await updateRouteService(env, routeId, body ?? {}) });
}

export async function handleAdminDeleteRoute(env: Env, routeId: string) {
  if (!routeId) return badRequest('routeId is required');
  return json({ message: 'Route deleted', data: await deleteRouteService(env, routeId) });
}

export async function handleAdminRouteBuses(env: Env, routeId: string) {
  if (!routeId) return badRequest('routeId is required');
  return json({ data: await listBusesByRouteService(env, routeId) });
}

export async function handleAdminRouteWaitingSummary(env: Env, routeId: string) {
  if (!routeId) return badRequest('routeId is required');
  return json({ data: await getWaitingSummaryService(env, routeId) });
}

export async function handleAdminListBuses(env: Env) {
  return json({ data: await listAdminBusesService(env) });
}

export async function handleAdminGetBusById(env: Env, busId: string) {
  if (!busId) return badRequest('busId is required');
  return json({ data: await getBusByIdService(env, busId) });
}

export async function handleAdminCreateBus(env: Env, request: Request) {
  const body = await readJson(request);
  const validated = validateCreateBusBody(body);
  if (!validated.ok) return badRequest(validated.error);
  return json({ message: 'Bus created', data: await createBusService(env, validated.data) }, 201);
}

export async function handleAdminUpdateBus(env: Env, request: Request, busId: string) {
  const body = await readJson<UpdateBusBody>(request);
  if (!busId) return badRequest('busId is required');
  return json({ message: 'Bus updated', data: await updateBusService(env, busId, body ?? {}) });
}

export async function handleAdminDeleteBus(env: Env, busId: string) {
  if (!busId) return badRequest('busId is required');
  return json({ message: 'Bus deleted', data: await deleteBusService(env, busId) });
}

export async function handleAdminWaiting(env: Env, request: Request) {
  const routeId = new URL(request.url).searchParams.get('routeId');
  return json({ data: await listWaitingService(env, routeId) });
}

export async function handleAdminWaitingSummary(env: Env, request: Request) {
  const routeId = new URL(request.url).searchParams.get('routeId');
  return json({ data: await getWaitingSummaryService(env, routeId) });
}
