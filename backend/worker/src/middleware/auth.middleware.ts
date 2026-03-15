import { json } from '../lib/http';
import { decodeMockToken, hasRequiredRole, parseBearerToken } from '../lib/auth';
import { findAdminByUserId } from '../repositories/admins';
import { listRouteIdsForAdmin } from '../repositories/route-admins';
import type { AuthContext, Env, UserRole } from '../types';

export function requireAuth(request: Request): AuthContext | Response {
  const token = parseBearerToken(request);
  if (!token) {
    return json({ error: 'Unauthorized: missing bearer token' }, 401);
  }

  const auth = decodeMockToken(token);
  if (!auth) {
    return json({ error: 'Unauthorized: invalid token' }, 401);
  }

  return auth;
}

export function requireRole(request: Request, allowedRoles: UserRole[]): AuthContext | Response {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  if (!hasRequiredRole(auth, allowedRoles)) {
    return json({ error: 'Forbidden: insufficient role' }, 403);
  }

  return auth;
}

export async function enrichAdminScope(env: Env, auth: AuthContext) {
  if (auth.role !== 'admin') return auth;
  if (auth.adminType && auth.routeIds) return auth;

  const admin = await findAdminByUserId(env, auth.userId);
  if (!admin) return auth;

  const routeIds = admin.admin_type === 'route_admin'
    ? await listRouteIdsForAdmin(env, admin.id)
    : [];

  return {
    ...auth,
    adminId: admin.id,
    adminType: admin.admin_type,
    routeIds,
  };
}

export async function requireAdminScope(env: Env, request: Request, routeId?: string | null) {
  const auth = requireRole(request, ['admin']);
  if (auth instanceof Response) return auth;

  const enriched = await enrichAdminScope(env, auth);
  if (enriched.adminType === 'super_admin') return enriched;

  if (enriched.adminType === 'route_admin') {
    if (!routeId) {
      return json({ error: 'Forbidden: routeId is required for route admin scope check' }, 403);
    }

    if (!enriched.routeIds?.includes(routeId)) {
      return json({ error: 'Forbidden: route admin cannot access this route' }, 403);
    }
  }

  return enriched;
}
