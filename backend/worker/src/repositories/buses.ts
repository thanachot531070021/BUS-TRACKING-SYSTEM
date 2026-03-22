import { sampleBuses } from '../data/mock';
import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { BusLive, CreateBusBody, Env, JsonRecord, UpdateBusBody } from '../types';

export async function listLiveBuses(env: Env, routeId?: string | null) {
  if (!usingSupabase(env)) {
    return routeId ? sampleBuses.filter((bus) => bus.route_id === routeId) : sampleBuses;
  }

  const query = routeId
    ? `active_buses_live?select=*&route_id=eq.${routeId}`
    : 'active_buses_live?select=*';

  return supabaseFetch<BusLive[]>(env, query);
}

export async function listBusesByRoute(env: Env, routeId: string) {
  if (!usingSupabase(env)) return sampleBuses.filter((bus) => bus.route_id === routeId);
  return supabaseFetch<JsonRecord[]>(env, `buses?select=*&route_id=eq.${routeId}&order=created_at.desc`);
}

export async function getBusById(env: Env, busId: string) {
  if (!usingSupabase(env)) return sampleBuses.find((bus) => bus.id === busId) ?? null;
  const rows = await supabaseFetch<JsonRecord[]>(env, `buses?select=*&id=eq.${busId}&limit=1`);
  return rows[0] ?? null;
}

export async function listAdminBuses(env: Env, routeIds?: string[]) {
  if (!usingSupabase(env)) return sampleBuses;
  if (routeIds && routeIds.length === 0) return [];
  let query = 'buses?select=*&order=created_at.desc';
  if (routeIds && routeIds.length > 0) query += `&route_id=in.(${routeIds.join(',')})`;
  return supabaseFetch<JsonRecord[]>(env, query);
}

export async function createBus(env: Env, body: CreateBusBody) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      plate_number: body.plateNumber,
      route_id: body.routeId ?? null,
      driver_id: body.driverId ?? null,
      status: body.status ?? 'off',
    };
  }

  const created = await supabaseFetch<JsonRecord[]>(env, 'buses', {
    method: 'POST',
    body: JSON.stringify([{
      plate_number: body.plateNumber,
      route_id: body.routeId ?? null,
      driver_id: body.driverId ?? null,
      status: body.status ?? 'off',
    }]),
  });

  return created[0];
}

export async function updateBus(env: Env, busId: string, body: UpdateBusBody) {
  if (!usingSupabase(env)) {
    return { id: busId, ...body };
  }

  const updated = await supabaseFetch<JsonRecord[]>(env, `buses?id=eq.${busId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      plate_number: body.plateNumber,
      route_id: body.routeId,
      driver_id: body.driverId,
      status: body.status,
    }),
  });

  return updated[0];
}

export async function deleteBus(env: Env, busId: string) {
  if (!usingSupabase(env)) return { id: busId, deleted: true };
  await supabaseFetch<JsonRecord[]>(env, `buses?id=eq.${busId}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
  return { id: busId, deleted: true };
}

export async function updateDriverDuty(env: Env, busId: string, status: 'on' | 'off') {
  const timestamp = new Date().toISOString();

  if (!usingSupabase(env)) {
    return { bus_id: busId, status, timestamp };
  }

  const updated = await supabaseFetch<JsonRecord[]>(env, `buses?id=eq.${busId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, last_seen_at: timestamp }),
  });

  return updated[0] ?? { bus_id: busId, status, timestamp };
}

export async function createBusLocation(env: Env, body: { busId: string; lat: number; lng: number; speed?: number }) {
  const timestamp = new Date().toISOString();

  if (!usingSupabase(env)) {
    return {
      bus_id: body.busId,
      lat: body.lat,
      lng: body.lng,
      speed: body.speed ?? 0,
      recorded_at: timestamp,
    };
  }

  await supabaseFetch<JsonRecord[]>(env, 'bus_locations', {
    method: 'POST',
    body: JSON.stringify([{
      bus_id: body.busId,
      lat: body.lat,
      lng: body.lng,
      speed: body.speed ?? 0,
      recorded_at: timestamp,
    }]),
  });

  const updatedBus = await supabaseFetch<JsonRecord[]>(env, `buses?id=eq.${body.busId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      current_lat: body.lat,
      current_lng: body.lng,
      current_speed: body.speed ?? 0,
      last_seen_at: timestamp,
    }),
  });

  return updatedBus[0] ?? {
    bus_id: body.busId,
    current_lat: body.lat,
    current_lng: body.lng,
    current_speed: body.speed ?? 0,
    last_seen_at: timestamp,
  };
}
