import { addFavoriteRoute, isFavoriteRoute, listFavoriteRoutes, listUserTripHistory, removeFavoriteRoute } from '../repositories/favorites';
import type { Env } from '../types';

export const listFavoriteRoutesService = (env: Env, userId: string) => listFavoriteRoutes(env, userId);
export const addFavoriteRouteService   = (env: Env, userId: string, routeId: string) => addFavoriteRoute(env, userId, routeId);
export const removeFavoriteRouteService = (env: Env, userId: string, routeId: string) => removeFavoriteRoute(env, userId, routeId);
export const isFavoriteRouteService    = (env: Env, userId: string, routeId: string) => isFavoriteRoute(env, userId, routeId);
export const listUserTripHistoryService = (env: Env, userId: string, limit?: number) => listUserTripHistory(env, userId, limit);
