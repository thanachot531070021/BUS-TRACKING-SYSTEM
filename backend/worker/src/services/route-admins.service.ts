import { createRouteAdmin, deleteRouteAdmin, listRouteAdmins } from '../repositories/route-admins';
import type { CreateRouteAdminBody, Env } from '../types';

export async function listRouteAdminsService(env: Env) {
  return listRouteAdmins(env);
}

export async function createRouteAdminService(env: Env, body: CreateRouteAdminBody) {
  return createRouteAdmin(env, body);
}

export async function deleteRouteAdminService(env: Env, assignmentId: string) {
  return deleteRouteAdmin(env, assignmentId);
}
