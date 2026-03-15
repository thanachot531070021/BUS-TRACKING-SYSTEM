import { badRequest, json, readJson } from '../lib/http';
import { listLiveBuses } from '../repositories/buses';
import { listRoutes } from '../repositories/routes';
import { cancelWaiting, createWaiting, listWaiting } from '../repositories/waiting';
import type { CreateWaitingBody, Env } from '../types';

export async function handleListRoutes(env: Env) {
  return json({ data: await listRoutes(env) });
}

export async function handleLiveBuses(env: Env, request: Request) {
  const routeId = new URL(request.url).searchParams.get('routeId');
  return json({ data: await listLiveBuses(env, routeId) });
}

export async function handleListWaiting(env: Env, request: Request) {
  const routeId = new URL(request.url).searchParams.get('routeId');
  return json({ data: await listWaiting(env, routeId) });
}

export async function handleCreateWaiting(env: Env, request: Request) {
  const body = await readJson<CreateWaitingBody>(request);
  if (!body?.routeId || body.lat === undefined || body.lng === undefined) {
    return badRequest('routeId, lat, lng are required');
  }

  return json({ message: 'Passenger waiting request accepted', data: await createWaiting(env, body) }, 201);
}

export async function handleCancelWaiting(env: Env, waitingId: string) {
  if (!waitingId) return badRequest('waitingId is required');
  return json({ message: 'Passenger waiting cancelled', data: await cancelWaiting(env, waitingId) });
}
