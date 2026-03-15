import { json } from '../lib/http';
import { usingSupabase } from '../lib/supabase';
import type { Env } from '../types';

export async function handleHealth(env: Env) {
  return json({
    ok: true,
    service: 'worker',
    app: env.APP_NAME,
    mode: usingSupabase(env) ? 'supabase' : 'mock',
  });
}
