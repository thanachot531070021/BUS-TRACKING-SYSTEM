import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { CreateUserBody, Env, JsonRecord, UpdateUserBody, UserProfile } from '../types';

const mockUsers: UserProfile[] = [
  {
    id: 'user-passenger-001',
    auth_provider: 'google',
    provider_user_id: 'google-001',
    email: 'passenger@example.com',
    email_verified: true,
    full_name: 'Mock Passenger',
    given_name: 'Mock',
    family_name: 'Passenger',
    avatar_url: null,
    role: 'passenger',
    status: 'active',
  },
];

export async function listUsers(env: Env) {
  if (!usingSupabase(env)) return mockUsers;
  return supabaseFetch<UserProfile[]>(env, 'users?select=*&order=created_at.desc');
}

export async function createUser(env: Env, body: CreateUserBody) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      auth_provider: body.authProvider ?? 'guest',
      provider_user_id: body.providerUserId ?? null,
      email: body.email ?? null,
      email_verified: body.emailVerified ?? false,
      phone_number: body.phoneNumber ?? null,
      full_name: body.fullName ?? null,
      given_name: body.givenName ?? null,
      family_name: body.familyName ?? null,
      avatar_url: body.avatarUrl ?? null,
      role: body.role,
      status: body.status ?? 'active',
    };
  }

  const created = await supabaseFetch<JsonRecord[]>(env, 'users', {
    method: 'POST',
    body: JSON.stringify([{
      auth_user_id: body.authUserId ?? null,
      auth_provider: body.authProvider ?? 'guest',
      provider_user_id: body.providerUserId ?? null,
      email: body.email ?? null,
      email_verified: body.emailVerified ?? false,
      phone_number: body.phoneNumber ?? null,
      full_name: body.fullName ?? null,
      given_name: body.givenName ?? null,
      family_name: body.familyName ?? null,
      avatar_url: body.avatarUrl ?? null,
      role: body.role,
      status: body.status ?? 'active',
    }]),
  });

  return created[0];
}

export async function updateUser(env: Env, userId: string, body: UpdateUserBody) {
  if (!usingSupabase(env)) return { id: userId, ...body };

  const updated = await supabaseFetch<JsonRecord[]>(env, `users?id=eq.${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      auth_user_id: body.authUserId,
      auth_provider: body.authProvider,
      provider_user_id: body.providerUserId,
      email: body.email,
      email_verified: body.emailVerified,
      phone_number: body.phoneNumber,
      full_name: body.fullName,
      given_name: body.givenName,
      family_name: body.familyName,
      avatar_url: body.avatarUrl,
      role: body.role,
      status: body.status,
      last_login_at: new Date().toISOString(),
    }),
  });

  return updated[0];
}
