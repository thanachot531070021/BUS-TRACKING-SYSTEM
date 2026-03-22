import { createZone, deleteZone, getZoneById, listZones, updateZone } from '../repositories/zones';
import type { CreateZoneBody, Env, UpdateZoneBody } from '../types';

export const listZonesService   = (env: Env) => listZones(env);
export const getZoneByIdService = (env: Env, id: string) => getZoneById(env, id);
export const createZoneService  = (env: Env, body: CreateZoneBody) => createZone(env, body);
export const updateZoneService  = (env: Env, id: string, body: UpdateZoneBody) => updateZone(env, id, body);
export const deleteZoneService  = (env: Env, id: string) => deleteZone(env, id);
