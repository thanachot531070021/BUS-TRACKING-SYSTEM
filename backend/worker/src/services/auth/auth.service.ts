import { loginAdmin, loginDriver } from '../../repositories/auth';
import type { Env } from '../../types';

export async function driverLoginService(env: Env, phone: string, password: string) {
  return loginDriver(env, phone, password);
}

export async function adminLoginService(env: Env, username: string, password: string) {
  return loginAdmin(env, username, password);
}
