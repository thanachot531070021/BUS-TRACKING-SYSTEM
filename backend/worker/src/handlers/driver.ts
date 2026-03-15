import { badRequest, json, readJson } from '../lib/http';
import { loginDriver } from '../repositories/auth';
import { createBusLocation, updateDriverDuty } from '../repositories/buses';
import { listWaiting } from '../repositories/waiting';
import type { Env, UpdateDriverDutyBody, UpdateLocationBody } from '../types';

export async function handleDriverLogin(env: Env, request: Request) {
  const body = await readJson<{ phone?: string; password?: string }>(request);
  if (!body?.phone || !body.password) return badRequest('phone and password are required');
  return json({ message: 'Driver login success', data: await loginDriver(env, body.phone, body.password) });
}

export async function handleDriverDuty(env: Env, request: Request) {
  const body = await readJson<UpdateDriverDutyBody>(request);
  if (!body?.busId || !body.status) return badRequest('busId and status are required');
  return json({ message: 'Driver duty status updated', data: await updateDriverDuty(env, body.busId, body.status) });
}

export async function handleDriverLocation(env: Env, request: Request) {
  const body = await readJson<UpdateLocationBody>(request);
  if (!body?.busId || body.lat === undefined || body.lng === undefined) {
    return badRequest('busId, lat, lng are required');
  }

  return json({ message: 'Bus location update accepted', data: await createBusLocation(env, body) }, 201);
}

export async function handleDriverWaiting(env: Env, request: Request) {
  const routeId = new URL(request.url).searchParams.get('routeId');
  return json({ data: await listWaiting(env, routeId) });
}
