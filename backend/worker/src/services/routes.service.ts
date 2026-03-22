import { createRoute, deleteRoute, getRouteById, listRoutes, updateRoute } from '../repositories/routes';
import type { CreateRouteBody, Env, UpdateRouteBody } from '../types';

export const listRoutesService   = (env: Env, zoneId?: string) => listRoutes(env, zoneId);
export const getRouteByIdService = (env: Env, id: string) => getRouteById(env, id);
export const createRouteService  = (env: Env, body: CreateRouteBody) => createRoute(env, body);
export const updateRouteService  = (env: Env, id: string, body: UpdateRouteBody) => updateRoute(env, id, body);
export const deleteRouteService  = (env: Env, id: string) => deleteRoute(env, id);
