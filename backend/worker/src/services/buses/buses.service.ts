import { createBus, createBusLocation, listAdminBuses, listLiveBuses, updateBus, updateDriverDuty } from '../../repositories/buses';
import type { CreateBusBody, Env, UpdateBusBody, UpdateDriverDutyBody, UpdateLocationBody } from '../../types';

export async function listLiveBusesService(env: Env, routeId?: string | null) {
  return listLiveBuses(env, routeId);
}

export async function listAdminBusesService(env: Env) {
  return listAdminBuses(env);
}

export async function createBusService(env: Env, body: CreateBusBody) {
  return createBus(env, body);
}

export async function updateBusService(env: Env, busId: string, body: UpdateBusBody) {
  return updateBus(env, busId, body);
}

export async function updateDriverDutyService(env: Env, body: UpdateDriverDutyBody) {
  return updateDriverDuty(env, body.busId, body.status);
}

export async function createBusLocationService(env: Env, body: UpdateLocationBody) {
  return createBusLocation(env, body);
}
