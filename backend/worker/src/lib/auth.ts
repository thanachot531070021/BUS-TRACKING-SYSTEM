import type { AdminType, AuthContext, UserRole } from '../types';

export function parseBearerToken(request: Request) {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function decodeMockToken(token: string): AuthContext | null {
  if (token.startsWith('mock-driver-token:')) {
    const [, userId = 'driver-user-001'] = token.split(':');
    return {
      token,
      role: 'driver',
      userId,
      provider: 'phone',
    };
  }

  if (token.startsWith('mock-admin-token:')) {
    const [, adminType = 'route_admin', adminId = 'admin-002', userId = 'user-admin-route', routeIdsRaw = ''] = token.split(':');
    return {
      token,
      role: 'admin',
      userId,
      provider: 'email',
      adminType: adminType as AdminType,
      adminId,
      routeIds: routeIdsRaw ? routeIdsRaw.split(',').filter(Boolean) : [],
    };
  }

  if (token.startsWith('mock-passenger-token:')) {
    const [, userId = 'passenger-user-001'] = token.split(':');
    return {
      token,
      role: 'passenger',
      userId,
      provider: 'google',
    };
  }

  return null;
}

export function authFromJwtPayload(token: string, payload: Record<string, any>): AuthContext | null {
  const authUserId = payload?.sub;
  if (!authUserId) return null;

  return {
    token,
    role: 'passenger',
    userId: authUserId,
    provider: 'email',
  };
}

export function hasRequiredRole(auth: AuthContext, allowedRoles: UserRole[]) {
  return allowedRoles.includes(auth.role);
}
