import { createDriver, deleteDriver, findDriverByUserId, getDriverById, listDrivers, updateDriver } from '../repositories/drivers';
import type { CreateDriverBody, Env, UpdateDriverBody } from '../types';

export const listDriversService          = (env: Env, routeIds?: string[]) => listDrivers(env, routeIds);
export const getDriverByIdService        = (env: Env, id: string) => getDriverById(env, id);
export const getDriverByUserIdService    = (env: Env, userId: string) => findDriverByUserId(env, userId);
export const createDriverService         = (env: Env, body: CreateDriverBody) => createDriver(env, body);
export const updateDriverService         = (env: Env, id: string, body: UpdateDriverBody) => updateDriver(env, id, body);
export const deleteDriverService         = (env: Env, id: string) => deleteDriver(env, id);
