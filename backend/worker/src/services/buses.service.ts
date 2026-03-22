import { createBus, createBusLocation, deleteBus, getBusById, listAdminBuses, listBusesByRoute, listLiveBuses, updateBus, updateDriverDuty } from '../repositories/buses';
import type { CreateBusBody, Env, UpdateBusBody, UpdateDriverDutyBody, UpdateLocationBody } from '../types';

export async function listLiveBusesService(env: Env, routeId?: string | null) {
  return listLiveBuses(env, routeId);
}

export async function listBusesByRouteService(env: Env, routeId: string) {
  return listBusesByRoute(env, routeId);
}

export async function getBusByIdService(env: Env, busId: string) {
  return getBusById(env, busId);
}

export async function listAdminBusesService(env: Env, routeIds?: string[]) {
  return listAdminBuses(env, routeIds);
}

export async function createBusService(env: Env, body: CreateBusBody) {
  return createBus(env, body);
}

export async function updateBusService(env: Env, busId: string, body: UpdateBusBody) {
  return updateBus(env, busId, body);
}

export async function deleteBusService(env: Env, busId: string) {
  return deleteBus(env, busId);
}

export async function updateDriverDutyService(env: Env, body: UpdateDriverDutyBody) {
  return updateDriverDuty(env, body.busId, body.status);
}

export async function createBusLocationService(env: Env, body: UpdateLocationBody) {
  return createBusLocation(env, body);
}
