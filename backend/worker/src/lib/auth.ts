import type { AuthContext, UserRole } from '../types';

export function parseBearerToken(request: Request) {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

export function decodeMockToken(token: string): AuthContext | null {
  if (token.startsWith('mock-driver-token-')) {
    return {
      token,
      role: 'driver',
      userId: token.replace('mock-driver-token-', '') || 'driver-user-001',
      provider: 'phone',
    };
  }

  if (token.startsWith('mock-admin-token-')) {
    return {
      token,
      role: 'admin',
      userId: token.replace('mock-admin-token-', '') || 'admin-user-001',
      provider: 'email',
    };
  }

  if (token.startsWith('mock-passenger-token-')) {
    return {
      token,
      role: 'passenger',
      userId: token.replace('mock-passenger-token-', '') || 'passenger-user-001',
      provider: 'google',
    };
  }

  return null;
}

export function hasRequiredRole(auth: AuthContext, allowedRoles: UserRole[]) {
  return allowedRoles.includes(auth.role);
}
