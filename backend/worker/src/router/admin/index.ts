import { handleAdminCreateBus, handleAdminCreateRoute, handleAdminListBuses, handleAdminListRoutes, handleAdminLogin, handleAdminUpdateBus, handleAdminUpdateRoute, handleAdminWaiting } from '../../handlers/admin';
import { notFound } from '../../lib/http';
import type { Env } from '../../types';

function getIdFromPath(pathname: string, prefix: string) {
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).split('/')[0] || null;
}

export async function adminRouter(request: Request, env: Env) {
  const { pathname } = new URL(request.url);

  if (pathname === '/auth/admin/login' && request.method === 'POST') return handleAdminLogin(env, request);
  if (pathname === '/admin/routes' && request.method === 'GET') return handleAdminListRoutes(env);
  if (pathname === '/admin/routes' && request.method === 'POST') return handleAdminCreateRoute(env, request);
  if (pathname.startsWith('/admin/routes/') && request.method === 'PUT') {
    const routeId = getIdFromPath(pathname, '/admin/routes/');
    return handleAdminUpdateRoute(env, request, routeId ?? '');
  }

  if (pathname === '/admin/buses' && request.method === 'GET') return handleAdminListBuses(env);
  if (pathname === '/admin/buses' && request.method === 'POST') return handleAdminCreateBus(env, request);
  if (pathname.startsWith('/admin/buses/') && request.method === 'PUT') {
    const busId = getIdFromPath(pathname, '/admin/buses/');
    return handleAdminUpdateBus(env, request, busId ?? '');
  }

  if (pathname === '/admin/waiting' && request.method === 'GET') return handleAdminWaiting(env, request);

  return notFound();
}
