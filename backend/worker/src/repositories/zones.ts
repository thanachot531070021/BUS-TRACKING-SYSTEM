import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { CreateZoneBody, Env, JsonRecord, UpdateZoneBody, Zone } from '../types';

const ZONE_SELECT = 'id,zone_code,zone_name,description,province,status,created_at,updated_at,created_by,updated_by,created_by_user:users!fk_zones_created_by(id,full_name,username),updated_by_user:users!fk_zones_updated_by(id,full_name,username)';

export async function listZones(env: Env) {
  if (!usingSupabase(env)) return [] as Zone[];
  return supabaseFetch<Zone[]>(env, `zones?select=${ZONE_SELECT}&order=created_at.desc`);
}

export async function getZoneById(env: Env, zoneId: string) {
  if (!usingSupabase(env)) return null;
  const rows = await supabaseFetch<Zone[]>(env, `zones?select=${ZONE_SELECT}&id=eq.${zoneId}&limit=1`);
  return rows[0] ?? null;
}

export async function createZone(env: Env, body: CreateZoneBody, userId?: string | null) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      zone_code: body.zoneCode ?? null,
      zone_name: body.zoneName,
      description: body.description ?? null,
      status: body.status ?? 'active',
    } as Zone;
  }
  const created = await supabaseFetch<JsonRecord[]>(env, 'zones', {
    method: 'POST',
    body: JSON.stringify([{
      zone_code:   body.zoneCode ?? null,
      zone_name:   body.zoneName,
      description: body.description ?? null,
      province:    body.province ?? null,
      status:      body.status ?? 'active',
      created_by:  userId ?? null,
      updated_by:  userId ?? null,
    }]),
  });
  return created[0] as Zone;
}

export async function updateZone(env: Env, zoneId: string, body: UpdateZoneBody, userId?: string | null) {
  if (!usingSupabase(env)) return { id: zoneId, ...body } as Zone;
  const updated = await supabaseFetch<JsonRecord[]>(env, `zones?id=eq.${zoneId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      zone_code:   body.zoneCode,
      zone_name:   body.zoneName,
      description: body.description,
      province:    body.province,
      status:      body.status,
      updated_by:  userId ?? null,
    }),
  });
  return updated[0] as Zone;
}

export async function deleteZone(env: Env, zoneId: string) {
  if (!usingSupabase(env)) return { id: zoneId, deleted: true };
  await supabaseFetch<JsonRecord[]>(env, `zones?id=eq.${zoneId}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
  return { id: zoneId, deleted: true };
}

/** Get all route IDs that belong to a zone — used for zone_admin scope filtering */
export async function listRouteIdsByZone(env: Env, zoneId: string): Promise<string[]> {
  if (!usingSupabase(env)) return [];
  const rows = await supabaseFetch<{ id: string }[]>(env, `routes?select=id&zone_id=eq.${zoneId}`);
  return rows.map((r) => r.id);
}
