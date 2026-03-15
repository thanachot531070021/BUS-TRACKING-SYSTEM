import { badRequest, json, readJson } from '../lib/http';
import { driverLoginService } from '../services/auth.service';
import { createBusLocationService, getBusByIdService, updateDriverDutyService } from '../services/buses.service';
import { getDriverByUserIdService } from '../services/drivers.service';
import { getWaitingSummaryService, listWaitingService, markWaitingPickedUpService } from '../services/waiting.service';
import type { Env } from '../types';
import { validateDriverDutyBody, validateLocationBody } from '../schemas/driver.schema';

export async function handleDriverLogin(env: Env, request: Request) {
  const body = await readJson<{ phone?: string; password?: string }>(request);
  if (!body?.phone || !body.password) return badRequest('phone and password are required');
  return json({ message: 'Driver login success', data: await driverLoginService(env, body.phone, body.password) });
}

export async function handleDriverDuty(env: Env, request: Request) {
  const body = await readJson(request);
  const validated = validateDriverDutyBody(body);
  if (!validated.ok) return badRequest(validated.error);
  return json({ message: 'Driver duty status updated', data: await updateDriverDutyService(env, validated.data) });
}

export async function handleDriverLocation(env: Env, request: Request) {
  const body = await readJson(request);
  const validated = validateLocationBody(body);
  if (!validated.ok) return badRequest(validated.error);

  return json({ message: 'Bus location update accepted', data: await createBusLocationService(env, validated.data) }, 201);
}

export async function handleDriverWaiting(env: Env, request: Request) {
  const routeId = new URL(request.url).searchParams.get('routeId');
  return json({ data: await listWaitingService(env, routeId) });
}

export async function handleDriverWaitingSummary(env: Env, request: Request) {
  const routeId = new URL(request.url).searchParams.get('routeId');
  return json({ data: await getWaitingSummaryService(env, routeId) });
}

export async function handleDriverProfile(env: Env, request: Request, userId: string) {
  const driver = await getDriverByUserIdService(env, userId);
  if (!driver) return json({ data: null }, 404);

  const assignedBus = driver.assigned_bus_id ? await getBusByIdService(env, driver.assigned_bus_id) : null;
  return json({ data: { ...driver, assigned_bus: assignedBus } });
}

export async function handleDriverPickupWaiting(env: Env, waitingId: string) {
  if (!waitingId) return badRequest('waitingId is required');
  return json({ message: 'Waiting marked as picked up', data: await markWaitingPickedUpService(env, waitingId) });
}
