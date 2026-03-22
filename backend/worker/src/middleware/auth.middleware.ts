import { json } from '../lib/http';
import { authFromJwtPayload, decodeJwtPayload, decodeMockToken, hasRequiredRole, parseBearerToken } from '../lib/auth';
import { findAdminByUserId } from '../repositories/admins';
import { listRouteIdsByZone } from '../repositories/zones';
import { getUserByAuthUserId } from '../repositories/users';
import type { AuthContext, Env, UserRole } from '../types';

export async function requireAuth(env: Env, request: Request): Promise<AuthContext | Response> {
  const token = parseBearerToken(request);
  if (!token) {
    return json({ error: 'Unauthorized: missing bearer token' }, 401);
  }

  const mockAuth = decodeMockToken(token);
  if (mockAuth) return mockAuth;

  const payload = decodeJwtPayload(token);
  const jwtAuth = payload ? authFromJwtPayload(token, payload) : null;
  if (!jwtAuth) {
    return json({ error: 'Unauthorized: invalid token' }, 401);
  }

  const profile = await getUserByAuthUserId(env, jwtAuth.userId);
  if (!profile) {
    return json({ error: 'Unauthorized: no linked user profile for auth account' }, 401);
  }

  return {
    ...jwtAuth,
    userId: profile.id,
    role: profile.role,
    provider: profile.auth_provider,
  };
}

export async function requireRole(env: Env, request: Request, allowedRoles: UserRole[]): Promise<AuthContext | Response> {
  const auth = await requireAuth(env, request);
  if (auth instanceof Response) return auth;

  if (!hasRequiredRole(auth, allowedRoles)) {
    return json({ error: 'Forbidden: insufficient role' }, 403);
  }

  return auth;
}

export async function enrichAdminScope(env: Env, auth: AuthContext) {
  if (auth.role !== 'admin') return auth;
  if (auth.adminType && (auth.zoneId !== undefined || auth.routeIds)) return auth;

  const admin = await findAdminByUserId(env, auth.userId);
  if (!admin) return auth;

  const zoneId = (admin as any).zone_id ?? undefined;

  // zone_admin: scope to routes within their zone
  // route_admin: legacy support — no zone_id, routeIds empty
  const routeIds = (admin.admin_type === 'zone_admin' || admin.admin_type === 'route_admin') && zoneId
    ? await listRouteIdsByZone(env, zoneId)
    : [];

  return {
    ...auth,
    adminId: admin.id,
    adminType: admin.admin_type,
    zoneId,
    routeIds,
  };
}

export async function requireAdminScope(env: Env, request: Request, routeId?: string | null) {
  const auth = await requireRole(env, request, ['admin']);
  if (auth instanceof Response) return auth;

  const enriched = await enrichAdminScope(env, auth);

  // super_admin: unrestricted
  if (enriched.adminType === 'super_admin') return enriched;

  // zone_admin / route_admin: must have a zone with routes
  if (enriched.adminType === 'zone_admin' || enriched.adminType === 'route_admin') {
    if (routeId && !enriched.routeIds?.includes(routeId)) {
      return json({ error: 'Forbidden: you do not have access to this route' }, 403);
    }
  }

  return enriched;
}
