import { createZone, deleteZone, getZoneById, listZones, updateZone } from '../repositories/zones';
import type { CreateZoneBody, Env, UpdateZoneBody } from '../types';

export const listZonesService   = (env: Env) => listZones(env);
export const getZoneByIdService = (env: Env, id: string) => getZoneById(env, id);
export const createZoneService  = (env: Env, body: CreateZoneBody, userId?: string | null) => createZone(env, body, userId);
export const updateZoneService  = (env: Env, id: string, body: UpdateZoneBody, userId?: string | null) => updateZone(env, id, body, userId);
export const deleteZoneService  = (env: Env, id: string) => deleteZone(env, id);
