import { createRoute, deleteRoute, getRouteById, listRoutes, updateRoute } from '../repositories/routes';
import type { CreateRouteBody, Env, UpdateRouteBody } from '../types';

export async function listRoutesService(env: Env) {
  return listRoutes(env);
}

export async function getRouteByIdService(env: Env, routeId: string) {
  return getRouteById(env, routeId);
}

export async function createRouteService(env: Env, body: CreateRouteBody) {
  return createRoute(env, body);
}

export async function updateRouteService(env: Env, routeId: string, body: UpdateRouteBody) {
  return updateRoute(env, routeId, body);
}

export async function deleteRouteService(env: Env, routeId: string) {
  return deleteRoute(env, routeId);
}
