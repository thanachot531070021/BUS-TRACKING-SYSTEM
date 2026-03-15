import { createDriver, listDrivers, updateDriver } from '../repositories/drivers';
import type { CreateDriverBody, Env, UpdateDriverBody } from '../types';

export async function listDriversService(env: Env) {
  return listDrivers(env);
}

export async function createDriverService(env: Env, body: CreateDriverBody) {
  return createDriver(env, body);
}

export async function updateDriverService(env: Env, driverId: string, body: UpdateDriverBody) {
  return updateDriver(env, driverId, body);
}
