import { badRequest, json, readJson } from '../lib/http';
import { googleLoginService } from '../services/auth.service';
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
