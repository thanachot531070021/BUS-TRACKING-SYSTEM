import { createDriver, deleteDriver, findDriverByUserId, getDriverById, listDrivers, updateDriver } from '../repositories/drivers';
import type { CreateDriverBody, Env, UpdateDriverBody } from '../types';

export async function listDriversService(env: Env) {
  return listDrivers(env);
}

export async function getDriverByIdService(env: Env, driverId: string) {
  return getDriverById(env, driverId);
}

export async function getDriverByUserIdService(env: Env, userId: string) {
  return findDriverByUserId(env, userId);
}

export async function createDriverService(env: Env, body: CreateDriverBody) {
  return createDriver(env, body);
}

export async function updateDriverService(env: Env, driverId: string, body: UpdateDriverBody) {
  return updateDriver(env, driverId, body);
}

export async function deleteDriverService(env: Env, driverId: string) {
  return deleteDriver(env, driverId);
}
