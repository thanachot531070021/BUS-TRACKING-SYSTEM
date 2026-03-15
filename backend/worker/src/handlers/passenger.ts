import { badRequest, json, readJson } from '../lib/http';
import { listLiveBusesService } from '../services/buses.service';
import { listRoutesService } from '../services/routes.service';
import { cancelWaitingService, createWaitingService, listWaitingService } from '../services/waiting.service';
import type { CreateWaitingBody, Env } from '../types';

export async function handleListRoutes(env: Env) {
  return json({ data: await listRoutesService(env) });
}

export async function handleLiveBuses(env: Env, request: Request) {
  const routeId = new URL(request.url).searchParams.get('routeId');
  return json({ data: await listLiveBusesService(env, routeId) });
}

export async function handleListWaiting(env: Env, request: Request) {
  const routeId = new URL(request.url).searchParams.get('routeId');
  return json({ data: await listWaitingService(env, routeId) });
}

export async function handleCreateWaiting(env: Env, request: Request) {
  const body = await readJson<CreateWaitingBody>(request);
  if (!body?.routeId || body.lat === undefined || body.lng === undefined) {
    return badRequest('routeId, lat, lng are required');
  }

  return json({ message: 'Passenger waiting request accepted', data: await createWaitingService(env, body) }, 201);
}

export async function handleCancelWaiting(env: Env, waitingId: string) {
  if (!waitingId) return badRequest('waitingId is required');
  return json({ message: 'Passenger waiting cancelled', data: await cancelWaitingService(env, waitingId) });
}
