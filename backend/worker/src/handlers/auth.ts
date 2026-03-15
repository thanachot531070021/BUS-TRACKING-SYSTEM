import { badRequest, json, readJson } from '../lib/http';
import { currentUserService, googleLoginService, passwordLoginService, registerService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth.middleware';
import type { Env } from '../types';

export async function handleGoogleLogin(env: Env, request: Request) {
  const body = await readJson<{ googleIdToken?: string; email?: string; fullName?: string; avatarUrl?: string }>(request);
  if (!body?.googleIdToken) {
    return badRequest('googleIdToken is required');
  }

  return json({
    message: 'Google login success',
    data: await googleLoginService(env, body.googleIdToken, body.email, body.fullName, body.avatarUrl),
  });
}

export async function handleRegister(env: Env, request: Request) {
  const body = await readJson<{ email?: string; password?: string; username?: string; fullName?: string; role?: 'passenger' | 'driver' | 'admin' }>(request);
  if (!body?.email || !body.password) {
    return badRequest('email and password are required');
  }

  return json({
    message: 'Register success',
    data: await registerService(env, body.email, body.password, body.username, body.fullName, body.role),
  }, 201);
}

export async function handlePasswordLogin(env: Env, request: Request) {
  const body = await readJson<{ identifier?: string; password?: string; expectedRole?: 'driver' | 'admin' | 'passenger' }>(request);
  if (!body?.identifier || !body.password) {
    return badRequest('identifier and password are required');
  }

  return json({
    message: 'Login success',
    data: await passwordLoginService(env, body.identifier, body.password, body.expectedRole),
  });
}

export async function handleCurrentUser(env: Env, request: Request) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  return json({
    message: 'Current user resolved',
    data: await currentUserService(env, auth.userId),
    auth,
  });
}
