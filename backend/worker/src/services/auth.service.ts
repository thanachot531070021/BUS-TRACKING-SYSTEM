import { loginAdmin, loginDriver, loginWithGoogle } from '../repositories/auth';
import type { Env } from '../types';

export async function driverLoginService(env: Env, phone: string, password: string) {
  return loginDriver(env, phone, password);
}

export async function adminLoginService(env: Env, username: string, password: string) {
  return loginAdmin(env, username, password);
}

export async function googleLoginService(env: Env, googleIdToken: string, email?: string, fullName?: string, avatarUrl?: string) {
  return loginWithGoogle(env, { googleIdToken, email, fullName, avatarUrl });
}
