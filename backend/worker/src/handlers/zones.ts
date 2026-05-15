import { badRequest, json, readJson } from '../lib/http';
import { createZoneService, deleteZoneService, getZoneByIdService, listZonesService, updateZoneService } from '../services/zones.service';
import type { AuthContext, CreateZoneBody, Env, UpdateZoneBody } from '../types';

export async function handleAdminListZones(env: Env) {
  return json({ data: await listZonesService(env) });
}

export async function handleAdminGetZoneById(env: Env, zoneId: string) {
  if (!zoneId) return badRequest('zoneId is required');
  return json({ data: await getZoneByIdService(env, zoneId) });
}

export async function handleAdminCreateZone(env: Env, request: Request, auth?: AuthContext) {
  const body = await readJson<CreateZoneBody>(request);
  if (!body?.zoneName) return badRequest('zoneName is required');
  return json({ message: 'Zone created', data: await createZoneService(env, body, auth?.userId) }, 201);
}

export async function handleAdminUpdateZone(env: Env, request: Request, zoneId: string, auth?: AuthContext) {
  const body = await readJson<UpdateZoneBody>(request);
  if (!zoneId) return badRequest('zoneId is required');
  return json({ message: 'Zone updated', data: await updateZoneService(env, zoneId, body ?? {}, auth?.userId) });
}

export async function handleAdminDeleteZone(env: Env, zoneId: string) {
  if (!zoneId) return badRequest('zoneId is required');
  return json({ message: 'Zone deleted', data: await deleteZoneService(env, zoneId) });
}
