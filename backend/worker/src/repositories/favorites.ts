import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { Env, FavoriteRoute, JsonRecord } from '../types';

const ROUTE_SELECT = 'id,route_code,route_name,start_location,end_location,status';
const FAV_SELECT   = `id,user_id,route_id,created_at,route:routes!fk_fav_route_id(${ROUTE_SELECT})`;

export async function listFavoriteRoutes(env: Env, userId: string): Promise<FavoriteRoute[]> {
  if (!usingSupabase(env)) return [];
  return supabaseFetch<FavoriteRoute[]>(
    env,
    `user_favorite_routes?select=${FAV_SELECT}&user_id=eq.${userId}&order=created_at.desc`,
  );
}

export async function addFavoriteRoute(env: Env, userId: string, routeId: string): Promise<FavoriteRoute> {
  if (!usingSupabase(env)) return { id: crypto.randomUUID(), user_id: userId, route_id: routeId };
  const created = await supabaseFetch<JsonRecord[]>(env, 'user_favorite_routes', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([{ user_id: userId, route_id: routeId }]),
  });
  return created[0] as FavoriteRoute;
}

export async function removeFavoriteRoute(env: Env, userId: string, routeId: string) {
  if (!usingSupabase(env)) return { deleted: true };
  await supabaseFetch<JsonRecord[]>(
    env,
    `user_favorite_routes?user_id=eq.${userId}&route_id=eq.${routeId}`,
    { method: 'DELETE', headers: { Prefer: 'return=minimal' } },
  );
  return { deleted: true };
}

export async function isFavoriteRoute(env: Env, userId: string, routeId: string): Promise<boolean> {
  if (!usingSupabase(env)) return false;
  const rows = await supabaseFetch<{ id: string }[]>(
    env,
    `user_favorite_routes?user_id=eq.${userId}&route_id=eq.${routeId}&select=id&limit=1`,
  );
  return rows.length > 0;
}

/** Trip history: passenger_waiting records for a user */
export async function listUserTripHistory(env: Env, userId: string, limit = 20): Promise<JsonRecord[]> {
  if (!usingSupabase(env)) return [];
  return supabaseFetch<JsonRecord[]>(
    env,
    `passenger_waiting?select=id,route_id,status,lat,lng,created_at,updated_at,route:routes!fk_pw_route_id(route_code,route_name,start_location,end_location)&user_id=eq.${userId}&order=created_at.desc&limit=${limit}`,
  );
}
