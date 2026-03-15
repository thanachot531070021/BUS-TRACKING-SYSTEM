import type { AdminType, AuthContext, UserRole } from '../types';

export function parseBearerToken(request: Request) {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
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

export function hasRequiredRole(auth: AuthContext, allowedRoles: UserRole[]) {
  return allowedRoles.includes(auth.role);
}
