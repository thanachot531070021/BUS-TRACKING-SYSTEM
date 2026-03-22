import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { AdminProfile, CreateAdminBody, Env, JsonRecord, UpdateAdminBody } from '../types';

const mockAdmins: AdminProfile[] = [
  { id: 'admin-001', user_id: 'user-admin-super', admin_type: 'super_admin', status: 'active' },
];

/** List admins, optionally scoped to a zone (for zone_admin viewing same-zone admins) */
export async function listAdmins(env: Env, zoneId?: string) {
  if (!usingSupabase(env)) return mockAdmins;

  let query = 'admins?select=*,user:users(id,full_name,username,email)&order=created_at.desc';
  if (zoneId) query += `&zone_id=eq.${zoneId}`;

  return supabaseFetch<JsonRecord[]>(env, query);
}

export async function getAdminById(env: Env, adminId: string) {
  if (!usingSupabase(env)) return mockAdmins.find((a) => a.id === adminId) ?? null;
  const rows = await supabaseFetch<JsonRecord[]>(env, `admins?select=*,user:users(id,full_name,username,email)&id=eq.${adminId}&limit=1`);
  return rows[0] ?? null;
}

export async function findAdminByUserId(env: Env, userId: string) {
  if (!usingSupabase(env)) return mockAdmins.find((a) => a.user_id === userId) ?? null;
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
      zone_id: (body as any).zoneId ?? null,
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
      zone_id: (body as any).zoneId,
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
