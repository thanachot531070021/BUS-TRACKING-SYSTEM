import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { CreateUserBody, Env, JsonRecord, UpdateUserBody, UserProfile } from '../types';

const mockUsers: UserProfile[] = [
  {
    id: 'user-passenger-001',
    auth_provider: 'google',
    provider_user_id: 'google-001',
    email: 'passenger@example.com',
    email_verified: true,
    username: 'passenger1',
    full_name: 'Mock Passenger',
    given_name: 'Mock',
    family_name: 'Passenger',
    avatar_url: null,
    role: 'passenger',
    status: 'active',
  },
  {
    id: 'user-admin-super',
    auth_provider: 'email',
    provider_user_id: null,
    email: 'superadmin@example.com',
    email_verified: true,
    username: 'superadmin',
    full_name: 'Mock Super Admin',
    given_name: 'Mock',
    family_name: 'SuperAdmin',
    avatar_url: null,
    role: 'admin',
    status: 'active',
  },
  {
    id: 'user-admin-route',
    auth_provider: 'email',
    provider_user_id: null,
    email: 'routeadmin@example.com',
    email_verified: true,
    username: 'routeadmin',
    full_name: 'Mock Route Admin',
    given_name: 'Mock',
    family_name: 'RouteAdmin',
    avatar_url: null,
    role: 'admin',
    status: 'active',
  },
];

export async function listUsers(env: Env) {
  if (!usingSupabase(env)) return mockUsers;
  return supabaseFetch<UserProfile[]>(env, 'users?select=*&order=created_at.desc');
}

export async function getUserById(env: Env, userId: string) {
  if (!usingSupabase(env)) return mockUsers.find((user) => user.id === userId) ?? null;
  const rows = await supabaseFetch<UserProfile[]>(env, `users?select=*&id=eq.${userId}&limit=1`);
  return rows[0] ?? null;
}

export async function findUserByUsernameOrEmail(env: Env, identifier: string) {
  if (!usingSupabase(env)) {
    return mockUsers.find((user) => user.username === identifier || user.email === identifier || user.phone_number === identifier) ?? null;
  }

  const rows = await supabaseFetch<UserProfile[]>(env, `users?select=*&or=(username.eq.${identifier},email.eq.${identifier},phone_number.eq.${identifier})&limit=1`);
  return rows[0] ?? null;
}

export async function createUser(env: Env, body: CreateUserBody) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      auth_provider: body.authProvider ?? 'guest',
      provider_user_id: body.providerUserId ?? null,
      email: body.email ?? null,
      email_verified: body.emailVerified ?? false,
      username: body.username ?? null,
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
      username: body.username ?? null,
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
      username: body.username,
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

export async function deleteUser(env: Env, userId: string) {
  if (!usingSupabase(env)) return { id: userId, deleted: true };
  await supabaseFetch<JsonRecord[]>(env, `users?id=eq.${userId}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
  return { id: userId, deleted: true };
}
