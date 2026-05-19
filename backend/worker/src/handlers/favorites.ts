import { badRequest, json, readJson } from '../lib/http';
import {
  addFavoriteRouteService, isFavoriteRouteService,
  listFavoriteRoutesService, listUserTripHistoryService, removeFavoriteRouteService,
} from '../services/favorites.service';
import type { AuthContext, Env } from '../types';

export async function handleListFavorites(env: Env, auth: AuthContext) {
  return json({ data: await listFavoriteRoutesService(env, auth.userId) });
}

export async function handleAddFavorite(env: Env, request: Request, auth: AuthContext) {
  const body = await readJson<{ routeId?: string }>(request);
  if (!body?.routeId) return badRequest('routeId is required');
  const already = await isFavoriteRouteService(env, auth.userId, body.routeId);
  if (already) return json({ message: 'Already in favorites' });
  return json({ message: 'Added to favorites', data: await addFavoriteRouteService(env, auth.userId, body.routeId) }, 201);
}

export async function handleRemoveFavorite(env: Env, routeId: string, auth: AuthContext) {
  if (!routeId) return badRequest('routeId is required');
  return json({ message: 'Removed from favorites', data: await removeFavoriteRouteService(env, auth.userId, routeId) });
}

export async function handleListTripHistory(env: Env, request: Request, auth: AuthContext) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 100);
  return json({ data: await listUserTripHistoryService(env, auth.userId, limit) });
}
