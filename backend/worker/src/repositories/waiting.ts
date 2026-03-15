import { sampleWaiting } from '../data/mock';
import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { CreateWaitingBody, Env, JsonRecord, WaitingPoint } from '../types';

export async function listWaiting(env: Env, routeId?: string | null) {
  if (!usingSupabase(env)) {
    return routeId ? sampleWaiting.filter((point) => point.route_id === routeId) : sampleWaiting;
  }

  const query = routeId
    ? `active_waiting_passengers?select=*&route_id=eq.${routeId}`
    : 'active_waiting_passengers?select=*';

  const rows = await supabaseFetch<Array<Omit<WaitingPoint, 'waiting_count'> & { waiting_count?: number }>>(env, query);
  return rows.map((row) => ({ ...row, waiting_count: row.waiting_count ?? 1 }));
}

export async function getWaitingById(env: Env, waitingId: string) {
  if (!usingSupabase(env)) return sampleWaiting.find((point) => point.id === waitingId) ?? null;
  const rows = await supabaseFetch<JsonRecord[]>(env, `passenger_waiting?select=*&id=eq.${waitingId}&limit=1`);
  return rows[0] ?? null;
}

export async function createWaiting(env: Env, body: CreateWaitingBody) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      route_id: body.routeId,
      lat: body.lat,
      lng: body.lng,
      user_id: body.userId ?? null,
      status: 'waiting',
      created_at: new Date().toISOString(),
    };
  }

  const created = await supabaseFetch<JsonRecord[]>(env, 'passenger_waiting', {
    method: 'POST',
    body: JSON.stringify([{
      route_id: body.routeId,
      lat: body.lat,
      lng: body.lng,
      user_id: body.userId ?? null,
      status: 'waiting',
    }]),
  });

  return created[0];
}

export async function cancelWaiting(env: Env, waitingId: string) {
  if (!usingSupabase(env)) {
    return { id: waitingId, status: 'cancelled' };
  }

  const updated = await supabaseFetch<JsonRecord[]>(env, `passenger_waiting?id=eq.${waitingId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'cancelled' }),
  });

  return updated[0] ?? { id: waitingId, status: 'cancelled' };
}
