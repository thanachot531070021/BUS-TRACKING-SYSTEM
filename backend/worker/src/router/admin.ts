import { handleAdminCreateBus, handleAdminCreateRoute, handleAdminListBuses, handleAdminListRoutes, handleAdminLogin, handleAdminUpdateBus, handleAdminUpdateRoute, handleAdminWaiting } from '../handlers/admin';
import { handleAdminCreateAdmin, handleAdminCreateDriver, handleAdminCreateRouteAdmin, handleAdminCreateUser, handleAdminDeleteRouteAdmin, handleAdminListAdmins, handleAdminListDrivers, handleAdminListRouteAdmins, handleAdminListUsers, handleAdminUpdateAdmin, handleAdminUpdateDriver, handleAdminUpdateUser } from '../handlers/admin-users';
import { notFound } from '../lib/http';
import { requireRole } from '../middleware/auth.middleware';
import type { Env } from '../types';

function getIdFromPath(pathname: string, prefix: string) {
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).split('/')[0] || null;
}

export async function adminRouter(request: Request, env: Env) {
  const { pathname } = new URL(request.url);

  if (pathname === '/auth/admin/login' && request.method === 'POST') return handleAdminLogin(env, request);

  if (pathname.startsWith('/admin/')) {
    const auth = requireRole(request, ['admin']);
    if (auth instanceof Response) return auth;
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
