import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { Env, Province } from '../types';

export async function listProvinces(env: Env) {
  if (!usingSupabase(env)) return [] as Province[];
  return supabaseFetch<Province[]>(
    env,
    'provinces?select=id,name_th,name_en,geography_id&deleted_at=is.null&order=name_th.asc',
  );
}
