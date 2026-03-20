import { badRequest, json, readJson } from '../lib/http';
import { currentUserService, googleLoginService, passwordLoginService, registerService } from '../services/auth.service';
import { requireAuth } from '../middleware/auth.middleware';
import { validateLoginBody, validateRegisterBody } from '../schemas/auth.schema';
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
  const body = await readJson(request);
  const validated = validateRegisterBody(body);
  if (!validated.ok) return badRequest(validated.error);

  return json({
    message: 'Register success',
    data: await registerService(env, validated.data.email, validated.data.password, validated.data.username, validated.data.fullName, validated.data.role as any),
  }, 201);
}

export async function handlePasswordLogin(env: Env, request: Request) {
  const body = await readJson(request);
  const validated = validateLoginBody(body);
  if (!validated.ok) return badRequest(validated.error);

  return json({
    message: 'Login success',
    data: await passwordLoginService(env, validated.data.identifier, validated.data.password, validated.data.expectedRole as any),
  });
}

export async function handleCurrentUser(env: Env, request: Request) {
  const auth = await requireAuth(env, request);
  if (auth instanceof Response) return auth;

  return json({
    message: 'Current user resolved',
    data: await currentUserService(env, auth.userId, 'profile-id'),
    auth,
  });
}
