import { createUser, findUserByUsernameOrEmail } from './users';
import { getSupabaseAnonKey, supabaseAuthFetch, usingSupabase } from '../lib/supabase';
import type { CreateUserBody, Env } from '../types';

type SupabaseAuthSession = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: {
    id: string;
    email?: string;
    phone?: string;
    user_metadata?: Record<string, unknown>;
  };
};

export async function registerWithPassword(env: Env, body: { email: string; password: string; username?: string; fullName?: string; role?: 'passenger' | 'driver' | 'admin' }) {
  if (!usingSupabase(env)) {
    const userPayload: CreateUserBody = {
      authProvider: 'email',
      email: body.email,
      emailVerified: false,
      username: body.username ?? body.email,
      fullName: body.fullName ?? body.username ?? body.email,
      role: body.role ?? 'passenger',
      status: 'active',
    };

    const user = await createUser(env, userPayload);
    return {
      session: {
        access_token: `mock-passenger-token:${user.id}`,
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      },
      user,
      note: 'Mock register only. Configure Supabase online keys for real auth.',
    };
  }

  const session = await supabaseAuthFetch<SupabaseAuthSession>(env, 'signup', {
    method: 'POST',
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      data: {
        username: body.username ?? null,
        full_name: body.fullName ?? null,
      },
    }),
  });

  const userPayload: CreateUserBody = {
    authUserId: session.user?.id ?? null,
    authProvider: 'email',
    email: session.user?.email ?? body.email,
    emailVerified: false,
    username: body.username ?? body.email,
    fullName: body.fullName ?? body.username ?? body.email,
    role: body.role ?? 'passenger',
    status: 'active',
  };

  const user = await createUser(env, userPayload);
  return { session, user };
}

export async function loginWithPassword(env: Env, body: { identifier: string; password: string; expectedRole?: 'driver' | 'admin' | 'passenger' }) {
  const user = await findUserByUsernameOrEmail(env, body.identifier);

  if (!usingSupabase(env)) {
    const role = body.expectedRole ?? (user?.role ?? 'passenger');

    if (role === 'driver') {
      return {
        role: 'driver',
        token: `mock-driver-token:${user?.id ?? body.identifier}`,
        user: user ?? { id: 'driver-user-001', username: body.identifier },
        note: 'Mock login only - replace with Supabase Auth',
      };
    }

    if (role === 'admin') {
      const isSuperAdmin = ['admin', 'superadmin', 'root', 'superadmin@example.com'].includes(body.identifier.toLowerCase());
      const adminType = isSuperAdmin ? 'super_admin' : 'route_admin';
      const adminId = isSuperAdmin ? 'admin-001' : 'admin-002';
      const userId = isSuperAdmin ? 'user-admin-super' : 'user-admin-route';
      const routeIds = isSuperAdmin ? '' : 'route-r1';

      return {
        role: 'admin',
        token: `mock-admin-token:${adminType}:${adminId}:${userId}:${routeIds}`,
        user: user ?? { id: userId, username: body.identifier, role: 'admin' },
        note: 'Mock login only - replace with Supabase Auth',
      };
    }

    return {
      role: 'passenger',
      token: `mock-passenger-token:${user?.id ?? body.identifier}`,
      user: user ?? { id: 'passenger-user-001', username: body.identifier },
      note: 'Mock login only - replace with Supabase Auth',
    };
  }

  const loginEmail = user?.email ?? body.identifier;
  if (!loginEmail) {
    throw new Error('No email found for login identifier');
  }

  const session = await supabaseAuthFetch<SupabaseAuthSession>(env, 'token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({
      email: loginEmail,
      password: body.password,
    }),
  });

  const profile = user ?? (session.user?.email ? await findUserByUsernameOrEmail(env, session.user.email) : null);

  return {
    role: profile?.role ?? body.expectedRole ?? 'passenger',
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    auth_user: session.user,
    profile,
    anon_key_hint: getSupabaseAnonKey(env).slice(0, 12),
  };
}

export async function loginDriver(env: Env, phoneOrUsername: string, password: string) {
  return loginWithPassword(env, { identifier: phoneOrUsername, password, expectedRole: 'driver' });
}

export async function loginAdmin(env: Env, username: string, password: string) {
  return loginWithPassword(env, { identifier: username, password, expectedRole: 'admin' });
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
    token: `mock-passenger-token:${providerUserId}`,
    user,
    note: 'Starter Google login flow only. Replace with real Google token verification or Supabase Auth.',
  };
}
