import { handleCurrentUser, handleFacebookLogin, handleGoogleLogin, handlePasswordLogin, handleRegister } from '../handlers/auth';
import { handleDbHealth, handleHealth } from '../handlers/health';
import { handleCancelWaiting, handleCreateWaiting, handleGetBusById, handleGetRouteById, handleGetWaitingById, handleListRoutes, handleListWaiting, handleLiveBuses } from '../handlers/passenger';
import { handleAdminListZones, handleAdminGetZoneById } from '../handlers/zones';
import { handleListProvinces } from '../handlers/provinces';
import { handleGetStructure } from '../handlers/structure';
import { handleListAnnouncements } from '../handlers/announcements';
import { handleAddFavorite, handleListFavorites, handleListTripHistory, handleRemoveFavorite } from '../handlers/favorites';
import { notFound } from '../lib/http';
import { requireAuth } from '../middleware/auth.middleware';
import type { Env } from '../types';

function getIdFromPath(pathname: string, prefix: string) {
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).split('/')[0] || null;
}

export async function publicRouter(request: Request, env: Env) {
  const { pathname } = new URL(request.url);

  if (pathname === '/health' && request.method === 'GET') return handleHealth(env);
  if (pathname === '/health/db' && request.method === 'GET') return handleDbHealth(env);
  if (pathname === '/auth/register' && request.method === 'POST') return handleRegister(env, request);
  if (pathname === '/auth/login' && request.method === 'POST') return handlePasswordLogin(env, request);
  if (pathname === '/auth/me' && request.method === 'GET') return handleCurrentUser(env, request);
  if (pathname === '/auth/google/login' && request.method === 'POST') return handleGoogleLogin(env, request);
  if (pathname === '/auth/facebook/login' && request.method === 'POST') return handleFacebookLogin(env, request);
  if (pathname === '/structure' && request.method === 'GET') return handleGetStructure(env);
  if (pathname === '/provinces' && request.method === 'GET') return handleListProvinces(env);
  if (pathname === '/zones' && request.method === 'GET') return handleAdminListZones(env);
  if (pathname.startsWith('/zones/') && request.method === 'GET') {
    const zoneId = getIdFromPath(pathname, '/zones/');
    return handleAdminGetZoneById(env, zoneId ?? '');
  }
  if (pathname === '/routes' && request.method === 'GET') return handleListRoutes(env);
  if (pathname.startsWith('/routes/') && request.method === 'GET') {
    const routeId = getIdFromPath(pathname, '/routes/');
    return handleGetRouteById(env, routeId ?? '');
  }
  if (pathname === '/buses/live' && request.method === 'GET') return handleLiveBuses(env, request);
  if (pathname.startsWith('/buses/') && request.method === 'GET') {
    const busId = getIdFromPath(pathname, '/buses/');
    return handleGetBusById(env, busId ?? '');
  }
  if (pathname === '/waiting' && request.method === 'GET') return handleListWaiting(env, request);
  if (pathname === '/waiting' && request.method === 'POST') {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    return handleCreateWaiting(env, request);
  }
  if (pathname.startsWith('/waiting/') && request.method === 'GET') {
    const waitingId = getIdFromPath(pathname, '/waiting/');
    return handleGetWaitingById(env, waitingId ?? '');
  }
  if (pathname.startsWith('/waiting/') && request.method === 'DELETE') {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const waitingId = getIdFromPath(pathname, '/waiting/');
    return handleCancelWaiting(env, waitingId ?? '');
  }

  // ── Announcements (public read) ──────────────────────────────────────────
  if (pathname === '/announcements' && request.method === 'GET') return handleListAnnouncements(env);

  // ── User: favorites (requires Bearer) ───────────────────────────────────
  if (pathname === '/user/favorites' && request.method === 'GET') {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    return handleListFavorites(env, auth);
  }
  if (pathname === '/user/favorites' && request.method === 'POST') {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    return handleAddFavorite(env, request, auth);
  }
  if (pathname.startsWith('/user/favorites/') && request.method === 'DELETE') {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const routeId = getIdFromPath(pathname, '/user/favorites/');
    return handleRemoveFavorite(env, routeId ?? '', auth);
  }

  // ── User: trip history (requires Bearer) ────────────────────────────────
  if (pathname === '/user/history' && request.method === 'GET') {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    return handleListTripHistory(env, request, auth);
  }

  return notFound();
}
