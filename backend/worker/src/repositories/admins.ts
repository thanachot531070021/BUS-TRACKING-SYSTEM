import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { AdminProfile, CreateAdminBody, Env, JsonRecord, UpdateAdminBody } from '../types';

const mockAdmins: AdminProfile[] = [
  { id: 'admin-001', user_id: 'user-admin-super', admin_type: 'super_admin', status: 'active' },
];

const ADMIN_SELECT = 'id,user_id,admin_type,zone_id,avatar_url,status,created_at,created_by,updated_by,user:users!admins_user_id_fkey(id,full_name,username,email),zone:zones(id,zone_code,zone_name),created_by_user:users!fk_admins_created_by(id,full_name,username),updated_by_user:users!fk_admins_updated_by(id,full_name,username)';

/** List admins, optionally scoped to a zone (for zone_admin viewing same-zone admins) */
export async function listAdmins(env: Env, zoneId?: string) {
  if (!usingSupabase(env)) return mockAdmins;

  let query = `admins?select=${ADMIN_SELECT}&order=created_at.desc`;
  if (zoneId) query += `&zone_id=eq.${zoneId}`;

  return supabaseFetch<JsonRecord[]>(env, query);
}

export async function getAdminById(env: Env, adminId: string) {
  if (!usingSupabase(env)) return mockAdmins.find((a) => a.id === adminId) ?? null;
  const rows = await supabaseFetch<JsonRecord[]>(env, `admins?select=${ADMIN_SELECT}&id=eq.${adminId}&limit=1`);
  return rows[0] ?? null;
}

export async function findAdminByUserId(env: Env, userId: string) {
  if (!usingSupabase(env)) return mockAdmins.find((a) => a.user_id === userId) ?? null;
  const rows = await supabaseFetch<AdminProfile[]>(env, `admins?select=*&user_id=eq.${userId}&limit=1`);
  return rows[0] ?? null;
}

export async function createAdmin(env: Env, body: CreateAdminBody, userId?: string | null) {
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
      zone_id: body.zoneId ?? null,
      avatar_url: body.avatarUrl ?? null,
      status: body.status ?? 'active',
      created_by: userId ?? null,
      updated_by: userId ?? null,
    }]),
  });

  return created[0];
}

export async function updateAdmin(env: Env, adminId: string, body: UpdateAdminBody, userId?: string | null) {
  if (!usingSupabase(env)) return { id: adminId, ...body };

  const updated = await supabaseFetch<JsonRecord[]>(env, `admins?id=eq.${adminId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      user_id: body.userId,
      admin_type: body.adminType,
      zone_id: body.zoneId,
      avatar_url: body.avatarUrl,
      status: body.status,
      updated_by: userId ?? null,
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
