import { createAdmin, deleteAdmin, getAdminById, listAdmins, updateAdmin } from '../repositories/admins';
import type { CreateAdminBody, Env, UpdateAdminBody } from '../types';

export async function listAdminsService(env: Env) {
  return listAdmins(env);
}

export async function getAdminByIdService(env: Env, adminId: string) {
  return getAdminById(env, adminId);
}

export async function createAdminService(env: Env, body: CreateAdminBody) {
  return createAdmin(env, body);
}

export async function updateAdminService(env: Env, adminId: string, body: UpdateAdminBody) {
  return updateAdmin(env, adminId, body);
}

export async function deleteAdminService(env: Env, adminId: string) {
  return deleteAdmin(env, adminId);
}
