import { sampleRoutes } from '../data/mock';
import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { CreateRouteBody, Env, JsonRecord, RouteSummary, UpdateRouteBody } from '../types';

export async function listRoutes(env: Env, zoneId?: string) {
  if (!usingSupabase(env)) return sampleRoutes;

  let query = 'routes?select=id,route_code,route_name,start_location,end_location,route_polyline,status,zone_id&order=route_code.asc';
  if (zoneId) query += `&zone_id=eq.${zoneId}`;

  return supabaseFetch<RouteSummary[]>(env, query);
}

export async function getRouteById(env: Env, routeId: string) {
  if (!usingSupabase(env)) return sampleRoutes.find((r) => r.id === routeId) ?? null;
  const rows = await supabaseFetch<RouteSummary[]>(env, `routes?select=id,route_code,route_name,start_location,end_location,route_polyline,status,zone_id&id=eq.${routeId}&limit=1`);
  return rows[0] ?? null;
}

export async function createRoute(env: Env, body: CreateRouteBody) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      route_code: body.routeCode ?? `R-${Date.now()}`,
      route_name: body.routeName,
      start_location: body.startLocation ?? '',
      end_location: body.endLocation ?? '',
      route_polyline: body.routePolyline ?? '',
      status: body.status ?? 'active',
    };
  }

  const created = await supabaseFetch<JsonRecord[]>(env, 'routes', {
    method: 'POST',
    body: JSON.stringify([{
      route_code: body.routeCode ?? null,
      route_name: body.routeName,
      start_location: body.startLocation ?? null,
      end_location: body.endLocation ?? null,
      route_polyline: body.routePolyline ?? null,
      zone_id: (body as any).zoneId ?? null,
      status: body.status ?? 'active',
    }]),
  });

  return created[0];
}

export async function updateRoute(env: Env, routeId: string, body: UpdateRouteBody) {
  if (!usingSupabase(env)) return { id: routeId, ...body };

  const updated = await supabaseFetch<JsonRecord[]>(env, `routes?id=eq.${routeId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      route_code: body.routeCode,
      route_name: body.routeName,
      start_location: body.startLocation,
      end_location: body.endLocation,
      route_polyline: body.routePolyline,
      zone_id: (body as any).zoneId,
      status: body.status,
    }),
  });

  return updated[0];
}

export async function deleteRoute(env: Env, routeId: string) {
  if (!usingSupabase(env)) return { id: routeId, deleted: true };
  await supabaseFetch<JsonRecord[]>(env, `routes?id=eq.${routeId}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
  return { id: routeId, deleted: true };
}
