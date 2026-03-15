import { badRequest, json, readJson } from '../lib/http';
import { driverLoginService } from '../services/auth.service';
import { createBusLocationService, updateDriverDutyService } from '../services/buses.service';
import { listWaitingService } from '../services/waiting.service';
import type { Env, UpdateDriverDutyBody, UpdateLocationBody } from '../types';

export async function handleDriverLogin(env: Env, request: Request) {
  const body = await readJson<{ phone?: string; password?: string }>(request);
  if (!body?.phone || !body.password) return badRequest('phone and password are required');
  return json({ message: 'Driver login success', data: await driverLoginService(env, body.phone, body.password) });
}

export async function handleDriverDuty(env: Env, request: Request) {
  const body = await readJson<UpdateDriverDutyBody>(request);
  if (!body?.busId || !body.status) return badRequest('busId and status are required');
  return json({ message: 'Driver duty status updated', data: await updateDriverDutyService(env, body) });
}

export async function handleDriverLocation(env: Env, request: Request) {
  const body = await readJson<UpdateLocationBody>(request);
  if (!body?.busId || body.lat === undefined || body.lng === undefined) {
    return badRequest('busId, lat, lng are required');
  }

  return json({ message: 'Bus location update accepted', data: await createBusLocationService(env, body) }, 201);
}

export async function handleDriverWaiting(env: Env, request: Request) {
  const routeId = new URL(request.url).searchParams.get('routeId');
  return json({ data: await listWaitingService(env, routeId) });
}
