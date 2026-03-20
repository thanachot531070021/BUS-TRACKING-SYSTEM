import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { AdminProfile, CreateAdminBody, Env, JsonRecord, UpdateAdminBody } from '../types';

const mockAdmins: AdminProfile[] = [
  {
    id: 'admin-001',
    user_id: 'user-admin-super',
    admin_type: 'super_admin',
    status: 'active',
  },
  {
    id: 'admin-002',
    user_id: 'user-admin-route',
    admin_type: 'route_admin',
    status: 'active',
  },
];

export async function listAdmins(env: Env) {
  if (!usingSupabase(env)) return mockAdmins;
  return supabaseFetch<AdminProfile[]>(env, 'admins?select=*&order=created_at.desc');
}

export async function getAdminById(env: Env, adminId: string) {
  if (!usingSupabase(env)) return mockAdmins.find((admin) => admin.id === adminId) ?? null;
  const rows = await supabaseFetch<AdminProfile[]>(env, `admins?select=*&id=eq.${adminId}&limit=1`);
  return rows[0] ?? null;
}

export async function findAdminByUserId(env: Env, userId: string) {
  if (!usingSupabase(env)) return mockAdmins.find((admin) => admin.user_id === userId) ?? null;
  const rows = await supabaseFetch<AdminProfile[]>(env, `admins?select=*&user_id=eq.${userId}&limit=1`);
  return rows[0] ?? null;
}

export async function createAdmin(env: Env, body: CreateAdminBody) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      user_id: body.userId,
      admin_type: body.adminType,
      status: body.status ?? 'active',
    };
  }

  const created = await supabaseFetch<JsonRecord[]>(env, 'admins', {
    method: 'POST',
    body: JSON.stringify([{
      user_id: body.userId,
      admin_type: body.adminType,
      status: body.status ?? 'active',
    }]),
  });

  return created[0];
}

export async function updateAdmin(env: Env, adminId: string, body: UpdateAdminBody) {
  if (!usingSupabase(env)) return { id: adminId, ...body };

  const updated = await supabaseFetch<JsonRecord[]>(env, `admins?id=eq.${adminId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      user_id: body.userId,
      admin_type: body.adminType,
      status: body.status,
    }),
  });

  return updated[0];
}

export async function deleteAdmin(env: Env, adminId: string) {
  if (!usingSupabase(env)) return { id: adminId, deleted: true };
  await supabaseFetch<JsonRecord[]>(env, `admins?id=eq.${adminId}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
  return { id: adminId, deleted: true };
}
