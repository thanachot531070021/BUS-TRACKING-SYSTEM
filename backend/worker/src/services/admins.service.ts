import { createAdmin, deleteAdmin, findAdminByUserId, getAdminById, listAdmins, updateAdmin } from '../repositories/admins';
import type { CreateAdminBody, Env, UpdateAdminBody } from '../types';

export const listAdminsService         = (env: Env, zoneId?: string) => listAdmins(env, zoneId);
export const getAdminByIdService       = (env: Env, id: string) => getAdminById(env, id);
export const findAdminByUserIdService  = (env: Env, userId: string) => findAdminByUserId(env, userId);
export const createAdminService        = (env: Env, body: CreateAdminBody, userId?: string | null) => createAdmin(env, body, userId);
export const updateAdminService        = (env: Env, id: string, body: UpdateAdminBody, userId?: string | null) => updateAdmin(env, id, body, userId);
export const deleteAdminService        = (env: Env, id: string) => deleteAdmin(env, id);
