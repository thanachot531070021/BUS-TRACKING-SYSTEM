import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { CreateRouteAdminBody, Env, JsonRecord, RouteAdminAssignment } from '../types';

const mockRouteAdmins: RouteAdminAssignment[] = [
  {
    id: 'route-admin-001',
    route_id: 'route-r1',
    admin_id: 'admin-002',
  },
];

export async function listRouteAdmins(env: Env) {
  if (!usingSupabase(env)) return mockRouteAdmins;
  return supabaseFetch<RouteAdminAssignment[]>(env, 'route_admins?select=*&order=created_at.desc');
}

export async function listRouteIdsForAdmin(env: Env, adminId: string) {
  if (!usingSupabase(env)) {
    return mockRouteAdmins.filter((item) => item.admin_id === adminId).map((item) => item.route_id);
  }

  const rows = await supabaseFetch<RouteAdminAssignment[]>(env, `route_admins?select=route_id&admin_id=eq.${adminId}`);
  return rows.map((row) => row.route_id);
}

export async function createRouteAdmin(env: Env, body: CreateRouteAdminBody) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      route_id: body.routeId,
      admin_id: body.adminId,
    };
  }

  const created = await supabaseFetch<JsonRecord[]>(env, 'route_admins', {
    method: 'POST',
    body: JSON.stringify([{
      route_id: body.routeId,
      admin_id: body.adminId,
    }]),
  });

  return created[0];
}

export async function deleteRouteAdmin(env: Env, assignmentId: string) {
  if (!usingSupabase(env)) return { id: assignmentId, deleted: true };

  await supabaseFetch<JsonRecord[]>(env, `route_admins?id=eq.${assignmentId}`, {
    method: 'DELETE',
    headers: {
      Prefer: 'return=minimal',
    },
  });

  return { id: assignmentId, deleted: true };
}
