import { loginAdmin, loginDriver, loginWithGoogle, loginWithPassword, registerWithPassword } from '../repositories/auth';
import { findUserByUsernameOrEmail, getUserByAuthUserId, getUserById } from '../repositories/users';
import type { Env } from '../types';

export async function driverLoginService(env: Env, phone: string, password: string) {
  return loginDriver(env, phone, password);
}

export async function adminLoginService(env: Env, username: string, password: string) {
  return loginAdmin(env, username, password);
}

export async function passwordLoginService(env: Env, identifier: string, password: string, expectedRole?: 'driver' | 'admin' | 'passenger') {
  return loginWithPassword(env, { identifier, password, expectedRole });
}

export async function registerService(env: Env, email: string, password: string, username?: string, fullName?: string, role?: 'passenger' | 'driver' | 'admin') {
  return registerWithPassword(env, { email, password, username, fullName, role });
}

export async function googleLoginService(env: Env, googleIdToken: string, email?: string, fullName?: string, avatarUrl?: string) {
  return loginWithGoogle(env, { googleIdToken, email, fullName, avatarUrl });
}

export async function currentUserService(env: Env, identifier: string, mode: 'profile-id' | 'auth-user-id' = 'profile-id') {
  if (mode === 'auth-user-id') {
    const byAuthId = await getUserByAuthUserId(env, identifier);
    if (byAuthId) return byAuthId;
  }

  const byId = await getUserById(env, identifier);
  if (byId) return byId;
  return findUserByUsernameOrEmail(env, identifier);
}
