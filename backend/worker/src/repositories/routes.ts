import { sampleRoutes } from '../data/mock';
import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { CreateRouteBody, Env, JsonRecord, RouteSummary, UpdateRouteBody } from '../types';

export async function listRoutes(env: Env) {
  if (!usingSupabase(env)) return sampleRoutes;
  return supabaseFetch<RouteSummary[]>(env, 'routes?select=id,route_code,route_name,start_location,end_location,route_polyline,status&order=route_code.asc');
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
      status: body.status ?? 'active',
    }]),
  });

  return created[0];
}

export async function updateRoute(env: Env, routeId: string, body: UpdateRouteBody) {
  if (!usingSupabase(env)) {
    return { id: routeId, ...body };
  }

  const updated = await supabaseFetch<JsonRecord[]>(env, `routes?id=eq.${routeId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      route_code: body.routeCode,
      route_name: body.routeName,
      start_location: body.startLocation,
      end_location: body.endLocation,
      route_polyline: body.routePolyline,
      status: body.status,
    }),
  });

  return updated[0];
}
