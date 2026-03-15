import type { Env } from '../types';

export function usingSupabase(env: Env) {
  return Boolean(env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY));
}

export function getSupabaseBaseUrl(env: Env) {
  if (!env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL is not configured');
  }
  return env.SUPABASE_URL;
}

export function getSupabaseAnonKey(env: Env) {
  if (!env.SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_ANON_KEY is not configured');
  }
  return env.SUPABASE_ANON_KEY;
}

export function getSupabaseServiceRoleKey(env: Env) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }
  return env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function supabaseFetch<T>(env: Env, path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getSupabaseBaseUrl(env);
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error('Supabase environment variables are not configured');
  }

  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${text}`);
  }

  if (response.status === 204) return [] as T;
  return response.json<T>();
}

export async function supabaseAuthFetch<T>(env: Env, path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getSupabaseBaseUrl(env);
  const anonKey = getSupabaseAnonKey(env);

  const response = await fetch(`${baseUrl}/auth/v1/${path}`, {
    ...init,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase auth request failed: ${response.status} ${text}`);
  }

  return response.json<T>();
}
