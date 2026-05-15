import { badRequest, json, readJson } from '../lib/http';
import { currentUserService, googleLoginService, passwordLoginService, registerService } from '../services/auth.service';
import { findAdminByUserId } from '../repositories/admins';
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

  try {
    const result = await passwordLoginService(env, validated.data.identifier, validated.data.password, validated.data.expectedRole as any) as any;

    if (validated.data.expectedRole === 'admin') {
      const profile = result?.profile;
      if (!profile || profile.role !== 'admin') {
        return json({ error: 'บัญชีนี้ไม่มีสิทธิ์เข้าระบบผู้ดูแล' }, 403);
      }
      const adminRecord = await findAdminByUserId(env, profile.id) as any;
      if (!adminRecord || !['super_admin', 'zone_admin'].includes(adminRecord.admin_type)) {
        return json({ error: 'บัญชีนี้ไม่มีสิทธิ์เข้าระบบ — เฉพาะ Super Admin และ Zone Admin เท่านั้น' }, 403);
      }
      if (adminRecord.status !== 'active') {
        return json({ error: 'บัญชีผู้ดูแลนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' }, 403);
      }
    }

    return json({ message: 'Login success', data: result });
  } catch (e) {
    const msg = String((e as any)?.message ?? '');
    if (msg.includes('invalid_credentials') || msg.includes('Invalid login credentials')) {
      return json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, 401);
    }
    if (msg.includes('No email found')) {
      return json({ error: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ' }, 401);
    }
    if (msg.includes('Email not confirmed')) {
      return json({ error: 'กรุณายืนยัน Email ก่อนเข้าสู่ระบบ' }, 401);
    }
    throw e;
  }
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
