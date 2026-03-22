import { createAdmin, deleteAdmin, getAdminById, listAdmins, updateAdmin } from '../repositories/admins';
import type { CreateAdminBody, Env, UpdateAdminBody } from '../types';

export const listAdminsService   = (env: Env, zoneId?: string) => listAdmins(env, zoneId);
export const getAdminByIdService = (env: Env, id: string) => getAdminById(env, id);
export const createAdminService  = (env: Env, body: CreateAdminBody) => createAdmin(env, body);
export const updateAdminService  = (env: Env, id: string, body: UpdateAdminBody) => updateAdmin(env, id, body);
export const deleteAdminService  = (env: Env, id: string) => deleteAdmin(env, id);
