import { badRequest, json, readJson } from '../lib/http';
import { listUsersService, createUserService, updateUserService } from '../services/users.service';
import { listDriversService, createDriverService, updateDriverService } from '../services/drivers.service';
import { listAdminsService, createAdminService, updateAdminService } from '../services/admins.service';
import { createRouteAdminService, deleteRouteAdminService, listRouteAdminsService } from '../services/route-admins.service';
import type { CreateAdminBody, CreateDriverBody, CreateRouteAdminBody, CreateUserBody, Env, UpdateAdminBody, UpdateDriverBody, UpdateUserBody } from '../types';

export async function handleAdminListUsers(env: Env) {
  return json({ data: await listUsersService(env) });
}

export async function handleAdminCreateUser(env: Env, request: Request) {
  const body = await readJson<CreateUserBody>(request);
  if (!body?.role) return badRequest('role is required');
  return json({ message: 'User created', data: await createUserService(env, body) }, 201);
}

export async function handleAdminUpdateUser(env: Env, request: Request, userId: string) {
  const body = await readJson<UpdateUserBody>(request);
  if (!userId) return badRequest('userId is required');
  return json({ message: 'User updated', data: await updateUserService(env, userId, body ?? {}) });
}

export async function handleAdminListDrivers(env: Env) {
  return json({ data: await listDriversService(env) });
}

export async function handleAdminCreateDriver(env: Env, request: Request) {
  const body = await readJson<CreateDriverBody>(request);
  if (!body?.userId) return badRequest('userId is required');
  return json({ message: 'Driver created', data: await createDriverService(env, body) }, 201);
}

export async function handleAdminUpdateDriver(env: Env, request: Request, driverId: string) {
  const body = await readJson<UpdateDriverBody>(request);
  if (!driverId) return badRequest('driverId is required');
  return json({ message: 'Driver updated', data: await updateDriverService(env, driverId, body ?? {}) });
}

export async function handleAdminListAdmins(env: Env) {
  return json({ data: await listAdminsService(env) });
}

export async function handleAdminCreateAdmin(env: Env, request: Request) {
  const body = await readJson<CreateAdminBody>(request);
  if (!body?.userId || !body.adminType) return badRequest('userId and adminType are required');
  return json({ message: 'Admin created', data: await createAdminService(env, body) }, 201);
}

export async function handleAdminUpdateAdmin(env: Env, request: Request, adminId: string) {
  const body = await readJson<UpdateAdminBody>(request);
  if (!adminId) return badRequest('adminId is required');
  return json({ message: 'Admin updated', data: await updateAdminService(env, adminId, body ?? {}) });
}

export async function handleAdminListRouteAdmins(env: Env) {
  return json({ data: await listRouteAdminsService(env) });
}

export async function handleAdminCreateRouteAdmin(env: Env, request: Request) {
  const body = await readJson<CreateRouteAdminBody>(request);
  if (!body?.routeId || !body.adminId) return badRequest('routeId and adminId are required');
  return json({ message: 'Route admin assigned', data: await createRouteAdminService(env, body) }, 201);
}

export async function handleAdminDeleteRouteAdmin(env: Env, assignmentId: string) {
  if (!assignmentId) return badRequest('assignmentId is required');
  return json({ message: 'Route admin assignment deleted', data: await deleteRouteAdminService(env, assignmentId) });
}
