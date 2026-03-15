import { handleAdminCreateBus, handleAdminCreateRoute, handleAdminListBuses, handleAdminListRoutes, handleAdminLogin, handleAdminUpdateBus, handleAdminUpdateRoute, handleAdminWaiting } from '../handlers/admin';
import { handleAdminCreateAdmin, handleAdminCreateDriver, handleAdminCreateRouteAdmin, handleAdminCreateUser, handleAdminDeleteRouteAdmin, handleAdminListAdmins, handleAdminListDrivers, handleAdminListRouteAdmins, handleAdminListUsers, handleAdminUpdateAdmin, handleAdminUpdateDriver, handleAdminUpdateUser } from '../handlers/admin-users';
import { json, notFound } from '../lib/http';
import { requireAdminScope, requireRole } from '../middleware/auth.middleware';
import type { Env } from '../types';

function getIdFromPath(pathname: string, prefix: string) {
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).split('/')[0] || null;
}

function routeIdFromRequest(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get('routeId') || request.headers.get('x-route-id');
}

export async function adminRouter(request: Request, env: Env) {
  const { pathname } = new URL(request.url);

  if (pathname === '/auth/admin/login' && request.method === 'POST') return handleAdminLogin(env, request);

  if (pathname === '/admin/users' || pathname.startsWith('/admin/users/') || pathname === '/admin/admins' || pathname.startsWith('/admin/admins/') || pathname === '/admin/route-admins' || pathname.startsWith('/admin/route-admins/')) {
    const auth = requireRole(request, ['admin']);
    if (auth instanceof Response) return auth;
    if (auth.adminType === 'route_admin') {
      return json({ error: 'Forbidden: route admin cannot manage global identity resources' }, 403);
    }
  }

  if (pathname === '/admin/drivers' || pathname.startsWith('/admin/drivers/') || pathname === '/admin/routes' || pathname.startsWith('/admin/routes/') || pathname === '/admin/buses' || pathname.startsWith('/admin/buses/') || pathname === '/admin/waiting') {
    const scoped = await requireAdminScope(env, request, routeIdFromRequest(request));
    if (scoped instanceof Response) return scoped;
  }

  if (pathname === '/admin/users' && request.method === 'GET') return handleAdminListUsers(env);
  if (pathname === '/admin/users' && request.method === 'POST') return handleAdminCreateUser(env, request);
  if (pathname.startsWith('/admin/users/') && request.method === 'PUT') {
    const userId = getIdFromPath(pathname, '/admin/users/');
    return handleAdminUpdateUser(env, request, userId ?? '');
  }

  if (pathname === '/admin/drivers' && request.method === 'GET') return handleAdminListDrivers(env);
  if (pathname === '/admin/drivers' && request.method === 'POST') return handleAdminCreateDriver(env, request);
  if (pathname.startsWith('/admin/drivers/') && request.method === 'PUT') {
    const driverId = getIdFromPath(pathname, '/admin/drivers/');
    return handleAdminUpdateDriver(env, request, driverId ?? '');
  }

  if (pathname === '/admin/admins' && request.method === 'GET') return handleAdminListAdmins(env);
  if (pathname === '/admin/admins' && request.method === 'POST') return handleAdminCreateAdmin(env, request);
  if (pathname.startsWith('/admin/admins/') && request.method === 'PUT') {
    const adminId = getIdFromPath(pathname, '/admin/admins/');
    return handleAdminUpdateAdmin(env, request, adminId ?? '');
  }

  if (pathname === '/admin/route-admins' && request.method === 'GET') return handleAdminListRouteAdmins(env);
  if (pathname === '/admin/route-admins' && request.method === 'POST') return handleAdminCreateRouteAdmin(env, request);
  if (pathname.startsWith('/admin/route-admins/') && request.method === 'DELETE') {
    const assignmentId = getIdFromPath(pathname, '/admin/route-admins/');
    return handleAdminDeleteRouteAdmin(env, assignmentId ?? '');
  }

  if (pathname === '/admin/routes' && request.method === 'GET') return handleAdminListRoutes(env);
  if (pathname === '/admin/routes' && request.method === 'POST') return handleAdminCreateRoute(env, request);
  if (pathname.startsWith('/admin/routes/') && request.method === 'PUT') {
    const routeId = getIdFromPath(pathname, '/admin/routes/');
    return handleAdminUpdateRoute(env, request, routeId ?? routeIdFromRequest(request) ?? '');
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
