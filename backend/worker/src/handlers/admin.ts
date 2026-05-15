import { badRequest, json, readJson } from '../lib/http';
import { adminLoginService } from '../services/auth.service';
import { createBusService, deleteBusService, findBusByDriverIdService, getBusByIdService, listAdminBusesService, listBusesByRouteService, updateBusService } from '../services/buses.service';
import { createRouteService, deleteRouteService, getRouteByIdService, listRoutesService, updateRouteService } from '../services/routes.service';
import { getWaitingSummaryService, listWaitingService } from '../services/waiting.service';
import { listDriversService } from '../services/drivers.service';
import { listUsersService } from '../services/users.service';
import { listAdminsService } from '../services/admins.service';
import type { AuthContext, Env, UpdateBusBody, UpdateRouteBody } from '../types';
import { validateCreateBusBody } from '../schemas/bus.schema';
import { validateCreateRouteBody } from '../schemas/route.schema';

export async function handleAdminLogin(env: Env, request: Request) {
  const body = await readJson<{ username?: string; password?: string }>(request);
  if (!body?.username || !body.password) return badRequest('username and password are required');
  return json({ message: 'Admin login success', data: await adminLoginService(env, body.username, body.password) });
}

export async function handleAdminDashboardSummary(env: Env, auth?: AuthContext) {
  const isZoneAdmin = auth?.adminType === 'zone_admin';
  const zoneId      = isZoneAdmin ? auth!.zoneId  : undefined;
  const routeIds    = isZoneAdmin ? (auth!.routeIds ?? []) : undefined;

  const [routes, buses, drivers, users, admins, allWaiting] = await Promise.all([
    listRoutesService(env, zoneId),
    listAdminBusesService(env, routeIds),
    listDriversService(env, routeIds),
    listUsersService(env),
    listAdminsService(env, zoneId ?? undefined),
    listWaitingService(env),
  ]);

  const waitingArr   = allWaiting as any[];
  const waitingCount = routeIds
    ? waitingArr.filter(w => routeIds.includes(w.route_id)).length
    : waitingArr.length;

  return json({
    data: {
      total_routes:  routes.length,
      total_buses:   buses.length,
      total_drivers: drivers.length,
      total_users:   users.length,
      active_buses:  buses.filter((bus: any) => bus.status === 'on').length,
      waiting_count: waitingCount,
      total_admins:  (admins as any[]).length,
      zone_scoped:   isZoneAdmin,
    },
  });
}

export async function handleAdminListRoutes(env: Env, auth?: AuthContext) {
  const zoneId = auth?.adminType === 'zone_admin' ? auth.zoneId : undefined;
  return json({ data: await listRoutesService(env, zoneId) });
}

export async function handleAdminGetRouteById(env: Env, routeId: string) {
  if (!routeId) return badRequest('routeId is required');
  return json({ data: await getRouteByIdService(env, routeId) });
}

export async function handleAdminCreateRoute(env: Env, request: Request, auth?: AuthContext) {
  const body = await readJson(request);
  const validated = validateCreateRouteBody(body);
  if (!validated.ok) return badRequest(validated.error);
  return json({ message: 'Route created', data: await createRouteService(env, validated.data, auth?.userId) }, 201);
}

export async function handleAdminUpdateRoute(env: Env, request: Request, routeId: string, auth?: AuthContext) {
  const body = await readJson<UpdateRouteBody>(request);
  if (!routeId) return badRequest('routeId is required');
  return json({ message: 'Route updated', data: await updateRouteService(env, routeId, body ?? {}, auth?.userId) });
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

export async function handleAdminListBuses(env: Env, auth?: AuthContext) {
  const routeIds = auth?.adminType === 'zone_admin' ? (auth.routeIds ?? []) : undefined;
  return json({ data: await listAdminBusesService(env, routeIds) });
}

export async function handleAdminGetBusById(env: Env, busId: string) {
  if (!busId) return badRequest('busId is required');
  return json({ data: await getBusByIdService(env, busId) });
}

export async function handleAdminCreateBus(env: Env, request: Request, auth?: AuthContext) {
  const body = await readJson(request);
  const validated = validateCreateBusBody(body);
  if (!validated.ok) return badRequest(validated.error);
  if (validated.data.driverId) {
    const taken = await findBusByDriverIdService(env, validated.data.driverId) as any;
    if (taken) return json({ error: `คนขับนี้ถูกผูกกับรถทะเบียน ${taken.plate_number || 'อื่น'} แล้ว ไม่สามารถใช้คนขับซ้ำได้` }, 409);
  }
  try {
    return json({ message: 'Bus created', data: await createBusService(env, validated.data, auth?.userId) }, 201);
  } catch (e) {
    const msg = String((e as any)?.message ?? '');
    if (msg.includes('23505') || msg.includes('duplicate key')) return json({ error: 'ทะเบียนรถนี้มีอยู่ในระบบแล้ว' }, 409);
    throw e;
  }
}

export async function handleAdminUpdateBus(env: Env, request: Request, busId: string, auth?: AuthContext) {
  const body = await readJson<UpdateBusBody>(request);
  if (!busId) return badRequest('busId is required');
  if (body?.driverId) {
    const taken = await findBusByDriverIdService(env, body.driverId) as any;
    if (taken && taken.id !== busId) return json({ error: `คนขับนี้ถูกผูกกับรถทะเบียน ${taken.plate_number || 'อื่น'} แล้ว ไม่สามารถใช้คนขับซ้ำได้` }, 409);
  }
  try {
    return json({ message: 'Bus updated', data: await updateBusService(env, busId, body ?? {}, auth?.userId) });
  } catch (e) {
    const msg = String((e as any)?.message ?? '');
    if (msg.includes('23505') || msg.includes('duplicate key')) return json({ error: 'ทะเบียนรถนี้มีอยู่ในระบบแล้ว' }, 409);
    throw e;
  }
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
