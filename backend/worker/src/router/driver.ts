import { handleDriverDuty, handleDriverLocation, handleDriverLogin, handleDriverPickupWaiting, handleDriverProfile, handleDriverWaiting, handleDriverWaitingSummary } from '../handlers/driver';
import { notFound } from '../lib/http';
import { requireRole } from '../middleware/auth.middleware';
import type { Env } from '../types';

function getIdFromPath(pathname: string, prefix: string) {
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).split('/')[0] || null;
}

export async function driverRouter(request: Request, env: Env) {
  const { pathname } = new URL(request.url);

  if (pathname === '/auth/driver/login' && request.method === 'POST') return handleDriverLogin(env, request);

  if (pathname === '/drivers/duty' || pathname === '/locations' || pathname === '/driver/waiting' || pathname === '/driver/waiting-summary' || pathname === '/driver/me' || pathname.startsWith('/driver/waiting/')) {
    const auth = requireRole(request, ['driver', 'admin']);
    if (auth instanceof Response) return auth;

    if (pathname === '/driver/me' && request.method === 'GET') {
      return handleDriverProfile(env, request, auth.userId);
    }
  }

  if (pathname === '/drivers/duty' && request.method === 'POST') return handleDriverDuty(env, request);
  if (pathname === '/locations' && request.method === 'POST') return handleDriverLocation(env, request);
  if (pathname === '/driver/waiting' && request.method === 'GET') return handleDriverWaiting(env, request);
  if (pathname === '/driver/waiting-summary' && request.method === 'GET') return handleDriverWaitingSummary(env, request);
  if (pathname.startsWith('/driver/waiting/') && pathname.endsWith('/pickup') && request.method === 'POST') {
    const waitingId = getIdFromPath(pathname, '/driver/waiting/');
    return handleDriverPickupWaiting(env, waitingId ?? '');
  }

  return notFound();
}
