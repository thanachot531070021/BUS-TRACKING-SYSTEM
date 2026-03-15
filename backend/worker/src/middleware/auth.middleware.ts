import { json } from '../lib/http';
import { decodeMockToken, hasRequiredRole, parseBearerToken } from '../lib/auth';
import type { AuthContext, UserRole } from '../types';

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
