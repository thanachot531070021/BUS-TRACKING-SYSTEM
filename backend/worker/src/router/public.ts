import { handleHealth } from '../handlers/health';
import { handleCancelWaiting, handleCreateWaiting, handleListRoutes, handleListWaiting, handleLiveBuses } from '../handlers/passenger';
import { notFound } from '../lib/http';
import type { Env } from '../types';

function getIdFromPath(pathname: string, prefix: string) {
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).split('/')[0] || null;
}

export async function publicRouter(request: Request, env: Env) {
  const { pathname } = new URL(request.url);

  if (pathname === '/health' && request.method === 'GET') return handleHealth(env);
  if (pathname === '/routes' && request.method === 'GET') return handleListRoutes(env);
  if (pathname === '/buses/live' && request.method === 'GET') return handleLiveBuses(env, request);
  if (pathname === '/waiting' && request.method === 'GET') return handleListWaiting(env, request);
  if (pathname === '/waiting' && request.method === 'POST') return handleCreateWaiting(env, request);
  if (pathname.startsWith('/waiting/') && request.method === 'DELETE') {
    const waitingId = getIdFromPath(pathname, '/waiting/');
    return handleCancelWaiting(env, waitingId ?? '');
  }

  return notFound();
}
