import { json } from '../lib/http';
import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { Env } from '../types';

export async function handleHealth(env: Env) {
  return json({
    ok: true,
    service: 'worker',
    app: env.APP_NAME,
    mode: usingSupabase(env) ? 'supabase' : 'mock',
  });
}

export async function handleDbHealth(env: Env) {
  if (!usingSupabase(env)) {
    return json({ ok: true, mode: 'mock', checks: { routes: 2, buses: 2, users: 3 } });
  }

  const [routes, buses, users, waiting] = await Promise.all([
    supabaseFetch<any[]>(env, 'routes?select=id&limit=1000'),
    supabaseFetch<any[]>(env, 'buses?select=id&limit=1000'),
    supabaseFetch<any[]>(env, 'users?select=id&limit=1000'),
    supabaseFetch<any[]>(env, 'passenger_waiting?select=id&limit=1000'),
  ]);

  return json({
    ok: true,
    mode: 'supabase',
    checks: {
      routes: routes.length,
      buses: buses.length,
      users: users.length,
      waiting: waiting.length,
    },
  });
}
