import { createUser } from './users';
import type { CreateUserBody, Env } from '../types';

export async function loginDriver(_env: Env, phone: string, password: string) {
  return {
    role: 'driver',
    token: `mock-driver-token-${phone}`,
    user: {
      id: 'driver-user-001',
      phone,
      name: 'Mock Driver',
    },
    note: password ? 'Mock login only - replace with Supabase Auth' : 'Password missing',
  };
}

export async function loginAdmin(_env: Env, username: string, password: string) {
  return {
    role: 'admin',
    token: `mock-admin-token-${username}`,
    user: {
      id: 'admin-user-001',
      username,
      name: 'Mock Admin',
      adminType: 'super_admin',
    },
    note: password ? 'Mock login only - replace with Supabase Auth' : 'Password missing',
  };
}

export async function loginWithGoogle(env: Env, body: { googleIdToken: string; email?: string; fullName?: string; avatarUrl?: string }) {
  const providerUserId = `google-sub-${body.googleIdToken.slice(0, 12)}`;

  const userPayload: CreateUserBody = {
    authProvider: 'google',
    providerUserId,
    email: body.email ?? null,
    emailVerified: true,
    fullName: body.fullName ?? 'Google User',
    avatarUrl: body.avatarUrl ?? null,
    role: 'passenger',
    status: 'active',
  };

  const user = await createUser(env, userPayload);

  return {
    role: 'passenger',
    token: `mock-passenger-token-${providerUserId}`,
    user,
    note: 'Starter Google login flow only. Replace with real Google token verification or Supabase Auth.',
  };
}
