import type { Env } from '../types';

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
