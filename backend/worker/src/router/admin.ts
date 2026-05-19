import { handleAdminCreateAnnouncement, handleAdminDeleteAnnouncement, handleAdminGetAnnouncementById, handleAdminListAnnouncements, handleAdminUpdateAnnouncement } from '../handlers/announcements';
import { handleAdminCreateBus, handleAdminCreateRoute, handleAdminDashboardSummary, handleAdminDeleteBus, handleAdminDeleteRoute, handleAdminGetBusById, handleAdminGetRouteById, handleAdminListBuses, handleAdminListRoutes, handleAdminLogin, handleAdminRouteBuses, handleAdminRouteWaitingSummary, handleAdminUpdateBus, handleAdminUpdateRoute, handleAdminWaiting, handleAdminWaitingSummary } from '../handlers/admin';
import { handleAdminCreateAdmin, handleAdminCreateAdminWithUser, handleAdminCreateDriver, handleAdminCreateDriverWithUser, handleAdminCreateRouteAdmin, handleAdminCreateUser, handleAdminDeleteAdmin, handleAdminDeleteDriver, handleAdminDeleteRouteAdmin, handleAdminDeleteUser, handleAdminGetAdminById, handleAdminGetDriverById, handleAdminGetRouteAdminById, handleAdminGetUserById, handleAdminListAdmins, handleAdminListDrivers, handleAdminListRouteAdmins, handleAdminListUsers, handleAdminResetPassword, handleAdminUpdateAdmin, handleAdminUpdateDriver, handleAdminUpdateUser, handleAdminVerifyEmail } from '../handlers/admin-users';
import { handleAdminCreateZone, handleAdminDeleteZone, handleAdminGetZoneById, handleAdminListZones, handleAdminUpdateZone } from '../handlers/zones';
import { handleListProvinces } from '../handlers/provinces';
import { handleGetAnalytics, handleLogEvent } from '../handlers/analytics';
import { json, notFound } from '../lib/http';
import { enrichAdminScope, requireAdminScope, requireRole } from '../middleware/auth.middleware';
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

  // ── Public ──────────────────────────────────────────────────────────────
  if (pathname === '/auth/admin/login' && request.method === 'POST') return handleAdminLogin(env, request);
  if (pathname === '/analytics/event' && request.method === 'POST') return handleLogEvent(env, request);

  // ── Zones (Super Admin only) ─────────────────────────────────────────────
  if (pathname === '/admin/zones' || pathname.startsWith('/admin/zones/')) {
    const auth = await requireRole(env, request, ['admin']);
    if (auth instanceof Response) return auth;
    const enriched = await enrichAdminScope(env, auth);
    if (enriched instanceof Response) return enriched;
    if (enriched.adminType !== 'super_admin') return json({ error: 'Forbidden: only super admin can manage zones' }, 403);
    if (pathname === '/admin/zones' && request.method === 'GET') return handleAdminListZones(env);
    if (pathname === '/admin/zones' && request.method === 'POST') return handleAdminCreateZone(env, request, enriched);
    if (pathname.startsWith('/admin/zones/') && request.method === 'GET') return handleAdminGetZoneById(env, getIdFromPath(pathname, '/admin/zones/') ?? '');
    if (pathname.startsWith('/admin/zones/') && request.method === 'PUT') return handleAdminUpdateZone(env, request, getIdFromPath(pathname, '/admin/zones/') ?? '', enriched);
    if (pathname.startsWith('/admin/zones/') && request.method === 'DELETE') return handleAdminDeleteZone(env, getIdFromPath(pathname, '/admin/zones/') ?? '');
  }

  // ── Reset Password (accessible to zone_admin — RBAC in handler) ─────────
  if (pathname.startsWith('/admin/users/') && pathname.endsWith('/reset-password') && request.method === 'POST') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    const userId = pathname.split('/')[3] ?? '';
    return handleAdminResetPassword(env, request, userId, auth);
  }

  // ── Verify Email (super admin only) ──────────────────────────────────────
  if (pathname.startsWith('/admin/users/') && pathname.endsWith('/verify-email') && request.method === 'POST') {
    const auth = await requireRole(env, request, ['admin']);
    if (auth instanceof Response) return auth;
    const enriched = await enrichAdminScope(env, auth);
    if (enriched instanceof Response) return enriched;
    if (enriched.adminType !== 'super_admin') return json({ error: 'Forbidden: only super admin can verify emails' }, 403);
    const userId = pathname.split('/')[3] ?? '';
    return handleAdminVerifyEmail(env, userId);
  }

  // ── Users (Super Admin only) ─────────────────────────────────────────────
  if (pathname === '/admin/users' || pathname.startsWith('/admin/users/')) {
    const auth = await requireRole(env, request, ['admin']);
    if (auth instanceof Response) return auth;
    const enriched = await enrichAdminScope(env, auth);
    if (enriched instanceof Response) return enriched;
    if (enriched.adminType !== 'super_admin') return json({ error: 'Forbidden: only super admin can manage users' }, 403);
    if (pathname === '/admin/users' && request.method === 'GET') return handleAdminListUsers(env);
    if (pathname === '/admin/users' && request.method === 'POST') return handleAdminCreateUser(env, request);
    if (pathname.startsWith('/admin/users/') && request.method === 'GET') return handleAdminGetUserById(env, getIdFromPath(pathname, '/admin/users/') ?? '');
    if (pathname.startsWith('/admin/users/') && request.method === 'PUT') return handleAdminUpdateUser(env, request, getIdFromPath(pathname, '/admin/users/') ?? '');
    if (pathname.startsWith('/admin/users/') && request.method === 'DELETE') return handleAdminDeleteUser(env, getIdFromPath(pathname, '/admin/users/') ?? '');
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  if (pathname === '/admin/summary' && request.method === 'GET') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminDashboardSummary(env, auth);
  }

  // ── Drivers ──────────────────────────────────────────────────────────────
  if (pathname === '/admin/drivers/with-user' && request.method === 'POST') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminCreateDriverWithUser(env, request, auth);
  }
  if (pathname === '/admin/drivers' && request.method === 'GET') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminListDrivers(env, auth);
  }
  if (pathname === '/admin/drivers' && request.method === 'POST') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminCreateDriver(env, request, auth);
  }
  if (pathname.startsWith('/admin/drivers/') && request.method === 'GET') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminGetDriverById(env, getIdFromPath(pathname, '/admin/drivers/') ?? '', auth);
  }
  if (pathname.startsWith('/admin/drivers/') && request.method === 'PUT') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminUpdateDriver(env, request, getIdFromPath(pathname, '/admin/drivers/') ?? '', auth);
  }
  if (pathname.startsWith('/admin/drivers/') && request.method === 'DELETE') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminDeleteDriver(env, getIdFromPath(pathname, '/admin/drivers/') ?? '', auth);
  }

  // ── Admins ───────────────────────────────────────────────────────────────
  if (pathname === '/admin/admins/with-user' && request.method === 'POST') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminCreateAdminWithUser(env, request, auth);
  }
  if (pathname === '/admin/admins' && request.method === 'GET') {
    const rawAuth = await requireRole(env, request, ['admin']);
    if (rawAuth instanceof Response) return rawAuth;
    const auth = await enrichAdminScope(env, rawAuth);
    if (auth instanceof Response) return auth;
    return handleAdminListAdmins(env, auth);
  }
  if (pathname === '/admin/admins' && request.method === 'POST') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminCreateAdmin(env, request, auth);
  }
  if (pathname.startsWith('/admin/admins/') && request.method === 'GET') {
    const rawAuth = await requireRole(env, request, ['admin']);
    if (rawAuth instanceof Response) return rawAuth;
    const auth = await enrichAdminScope(env, rawAuth);
    if (auth instanceof Response) return auth;
    return handleAdminGetAdminById(env, getIdFromPath(pathname, '/admin/admins/') ?? '', auth);
  }
  if (pathname.startsWith('/admin/admins/') && request.method === 'PUT') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminUpdateAdmin(env, request, getIdFromPath(pathname, '/admin/admins/') ?? '', auth);
  }
  if (pathname.startsWith('/admin/admins/') && request.method === 'DELETE') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminDeleteAdmin(env, getIdFromPath(pathname, '/admin/admins/') ?? '', auth);
  }

  // ── Route Admins (legacy) ────────────────────────────────────────────────
  if (pathname === '/admin/route-admins' && request.method === 'GET') return handleAdminListRouteAdmins(env);
  if (pathname === '/admin/route-admins' && request.method === 'POST') return handleAdminCreateRouteAdmin(env, request);
  if (pathname.startsWith('/admin/route-admins/') && request.method === 'GET') return handleAdminGetRouteAdminById(env, getIdFromPath(pathname, '/admin/route-admins/') ?? '');
  if (pathname.startsWith('/admin/route-admins/') && request.method === 'DELETE') return handleAdminDeleteRouteAdmin(env, getIdFromPath(pathname, '/admin/route-admins/') ?? '');

  // ── Routes ───────────────────────────────────────────────────────────────
  if (pathname === '/admin/routes' && request.method === 'GET') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminListRoutes(env, auth);
  }
  if (pathname === '/admin/routes' && request.method === 'POST') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminCreateRoute(env, request, auth);
  }
  if (pathname.startsWith('/admin/routes/') && pathname.endsWith('/buses') && request.method === 'GET') return handleAdminRouteBuses(env, pathname.split('/')[3] ?? '');
  if (pathname.startsWith('/admin/routes/') && pathname.endsWith('/waiting-summary') && request.method === 'GET') return handleAdminRouteWaitingSummary(env, pathname.split('/')[3] ?? '');
  if (pathname.startsWith('/admin/routes/') && request.method === 'GET') return handleAdminGetRouteById(env, getIdFromPath(pathname, '/admin/routes/') ?? '');
  if (pathname.startsWith('/admin/routes/') && request.method === 'PUT') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminUpdateRoute(env, request, getIdFromPath(pathname, '/admin/routes/') ?? '', auth);
  }
  if (pathname.startsWith('/admin/routes/') && request.method === 'DELETE') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminDeleteRoute(env, getIdFromPath(pathname, '/admin/routes/') ?? '');
  }

  // ── Buses ────────────────────────────────────────────────────────────────
  if (pathname === '/admin/buses' && request.method === 'GET') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminListBuses(env, auth);
  }
  if (pathname === '/admin/buses' && request.method === 'POST') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminCreateBus(env, request, auth);
  }
  if (pathname.startsWith('/admin/buses/') && request.method === 'GET') return handleAdminGetBusById(env, getIdFromPath(pathname, '/admin/buses/') ?? '');
  if (pathname.startsWith('/admin/buses/') && request.method === 'PUT') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminUpdateBus(env, request, getIdFromPath(pathname, '/admin/buses/') ?? '', auth);
  }
  if (pathname.startsWith('/admin/buses/') && request.method === 'DELETE') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleAdminDeleteBus(env, getIdFromPath(pathname, '/admin/buses/') ?? '');
  }

  // ── Waiting ──────────────────────────────────────────────────────────────
  if (pathname === '/admin/waiting' && request.method === 'GET') return handleAdminWaiting(env, request);
  if (pathname === '/admin/waiting-summary' && request.method === 'GET') return handleAdminWaitingSummary(env, request);

  // ── Analytics ────────────────────────────────────────────────────────────
  if (pathname === '/admin/analytics' && request.method === 'GET') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleGetAnalytics(env, request);
  }

  // ── Provinces (read-only reference data) ─────────────────────────────────
  if (pathname === '/admin/provinces' && request.method === 'GET') {
    const auth = await requireAdminScope(env, request);
    if (auth instanceof Response) return auth;
    return handleListProvinces(env);
  }

  // ── Announcements (Super Admin only) ─────────────────────────────────────
  if (pathname === '/admin/announcements' || pathname.startsWith('/admin/announcements/')) {
    const auth = await requireRole(env, request, ['admin']);
    if (auth instanceof Response) return auth;
    const enriched = await enrichAdminScope(env, auth);
    if (enriched instanceof Response) return enriched;
    if (enriched.adminType !== 'super_admin') return json({ error: 'Forbidden: only super admin can manage announcements' }, 403);
    if (pathname === '/admin/announcements' && request.method === 'GET')    return handleAdminListAnnouncements(env);
    if (pathname === '/admin/announcements' && request.method === 'POST')   return handleAdminCreateAnnouncement(env, request, enriched);
    if (pathname.startsWith('/admin/announcements/') && request.method === 'GET')    return handleAdminGetAnnouncementById(env, getIdFromPath(pathname, '/admin/announcements/') ?? '');
    if (pathname.startsWith('/admin/announcements/') && request.method === 'PUT')    return handleAdminUpdateAnnouncement(env, request, getIdFromPath(pathname, '/admin/announcements/') ?? '', enriched);
    if (pathname.startsWith('/admin/announcements/') && request.method === 'DELETE') return handleAdminDeleteAnnouncement(env, getIdFromPath(pathname, '/admin/announcements/') ?? '');
  }

  return notFound();
}
