import { badRequest, json, readJson } from '../lib/http';
import { adminLoginService } from '../services/auth.service';
import { createBusService, listAdminBusesService, updateBusService } from '../services/buses.service';
import { createRouteService, listRoutesService, updateRouteService } from '../services/routes.service';
import { listWaitingService } from '../services/waiting.service';
import type { CreateBusBody, CreateRouteBody, Env, UpdateBusBody, UpdateRouteBody } from '../types';

export async function handleAdminLogin(env: Env, request: Request) {
  const body = await readJson<{ username?: string; password?: string }>(request);
  if (!body?.username || !body.password) return badRequest('username and password are required');
  return json({ message: 'Admin login success', data: await adminLoginService(env, body.username, body.password) });
}

export async function handleAdminListRoutes(env: Env) {
  return json({ data: await listRoutesService(env) });
}

export async function handleAdminCreateRoute(env: Env, request: Request) {
  const body = await readJson<CreateRouteBody>(request);
  if (!body?.routeName) return badRequest('routeName is required');
  return json({ message: 'Route created', data: await createRouteService(env, body) }, 201);
}

export async function handleAdminUpdateRoute(env: Env, request: Request, routeId: string) {
  const body = await readJson<UpdateRouteBody>(request);
  if (!routeId) return badRequest('routeId is required');
  return json({ message: 'Route updated', data: await updateRouteService(env, routeId, body ?? {}) });
}

export async function handleAdminListBuses(env: Env) {
  return json({ data: await listAdminBusesService(env) });
}

export async function handleAdminCreateBus(env: Env, request: Request) {
  const body = await readJson<CreateBusBody>(request);
  if (!body?.plateNumber) return badRequest('plateNumber is required');
  return json({ message: 'Bus created', data: await createBusService(env, body) }, 201);
}

export async function handleAdminUpdateBus(env: Env, request: Request, busId: string) {
  const body = await readJson<UpdateBusBody>(request);
  if (!busId) return badRequest('busId is required');
  return json({ message: 'Bus updated', data: await updateBusService(env, busId, body ?? {}) });
}

export async function handleAdminWaiting(env: Env, request: Request) {
  const routeId = new URL(request.url).searchParams.get('routeId');
  return json({ data: await listWaitingService(env, routeId) });
}
