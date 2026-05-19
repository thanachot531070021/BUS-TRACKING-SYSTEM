import { badRequest, forbidden, json, readJson } from '../lib/http';
import { supabaseAdminAuthFetch, supabaseFetch, usingSupabase } from '../lib/supabase';
import { listUsersService, createUserService, updateUserService, getUserByIdService, deleteUserService } from '../services/users.service';
import { listDriversService, createDriverService, updateDriverService, getDriverByIdService, deleteDriverService, getDriverByUserIdService } from '../services/drivers.service';
import { listAdminsService, createAdminService, updateAdminService, getAdminByIdService, deleteAdminService, findAdminByUserIdService } from '../services/admins.service';
import { createRouteAdminService, deleteRouteAdminService, getRouteAdminByIdService, listRouteAdminsService } from '../services/route-admins.service';
import type { AuthContext, CreateAdminBody, CreateDriverBody, CreateRouteAdminBody, CreateUserBody, Env, UpdateAdminBody, UpdateDriverBody, UpdateUserBody } from '../types';

function handleSupabaseAuthError(e: unknown): Response | null {
  const msg = String((e as any)?.message ?? '');
  if (msg.includes('email_exists')) {
    return json({ error: 'Email นี้ถูกใช้งานในระบบแล้ว กรุณาใช้ Email อื่น' }, 409);
  }
  return null;
}

function parseDatabaseError(e: unknown): Response | null {
  const msg = String((e as any)?.message ?? '');
  if (msg.includes('23505') || msg.includes('duplicate key')) {
    if (msg.includes('username'))      return json({ error: 'Username นี้ถูกใช้งานแล้ว กรุณาใช้ Username อื่น' }, 409);
    if (msg.includes('email'))         return json({ error: 'Email นี้ถูกใช้งานแล้ว กรุณาใช้ Email อื่น' }, 409);
    if (msg.includes('phone_number'))  return json({ error: 'เบอร์โทรนี้ถูกใช้งานแล้ว กรุณาใช้เบอร์โทรอื่น' }, 409);
    if (msg.includes('employee_code')) return json({ error: 'รหัสพนักงานนี้ถูกใช้งานแล้ว' }, 409);
    if (msg.includes('license_no'))    return json({ error: 'เลขที่ใบขับขี่นี้ถูกใช้งานแล้วในระบบ' }, 409);
    return json({ error: 'ข้อมูลซ้ำในระบบ กรุณาตรวจสอบ Username, Email, เบอร์โทร หรือรหัสพนักงาน' }, 409);
  }
  return null;
}

// ===== USERS =====
export async function handleAdminListUsers(env: Env) {
  return json({ data: await listUsersService(env) });
}
export async function handleAdminGetUserById(env: Env, userId: string) {
  if (!userId) return badRequest('userId is required');
  return json({ data: await getUserByIdService(env, userId) });
}
export async function handleAdminCreateUser(env: Env, request: Request) {
  const body = await readJson<CreateUserBody & { password?: string }>(request);
  if (!body?.role) return badRequest('role is required');

  let authUserId: string | null = null;
  let authWarning: string | undefined;

  // Create Supabase Auth user when password + email provided + service role key available
  if (body.password && body.email && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const authUser = await supabaseAdminAuthFetch<{ id: string }>(env, 'admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: {
            username: body.username ?? null,
            full_name: body.fullName ?? null,
          },
        }),
      });
      authUserId = authUser?.id ?? null;
    } catch (e) {
      const r = handleSupabaseAuthError(e); if (r) return r; throw e;
    }
  } else if (body.password && body.email && usingSupabase(env)) {
    authWarning = 'SUPABASE_SERVICE_ROLE_KEY not configured — auth user not created, login will not work until secret is set';
  }

  let user;
  try {
    user = await createUserService(env, { ...body, authUserId: authUserId ?? body.authUserId });
  } catch (e) { const r = parseDatabaseError(e); if (r) return r; throw e; }
  const resp: Record<string, unknown> = { message: 'User created', data: user };
  if (authWarning) resp.warning = authWarning;
  return json(resp, 201);
}
export async function handleAdminUpdateUser(env: Env, request: Request, userId: string) {
  const body = await readJson<UpdateUserBody>(request);
  if (!userId) return badRequest('userId is required');
  return json({ message: 'User updated', data: await updateUserService(env, userId, body ?? {}) });
}
export async function handleAdminDeleteUser(env: Env, userId: string) {
  if (!userId) return badRequest('userId is required');
  return json({ message: 'User deleted', data: await deleteUserService(env, userId) });
}

// ===== DRIVERS =====
export async function handleAdminListDrivers(env: Env, auth?: AuthContext) {
  // zone_admin: filter by routes in their zone; super_admin: all
  const routeIds = auth?.adminType === 'zone_admin' || auth?.adminType === 'route_admin'
    ? (auth.routeIds ?? [])
    : undefined;
  return json({ data: await listDriversService(env, routeIds) });
}
export async function handleAdminGetDriverById(env: Env, driverId: string, auth?: AuthContext) {
  if (!driverId) return badRequest('driverId is required');
  const driver = await getDriverByIdService(env, driverId) as any;
  if (!driver) return json({ data: null });
  // zone_admin: can only view drivers whose route is in their zone
  if (auth?.adminType === 'zone_admin' && driver.assigned_route_id) {
    if (!auth.routeIds?.includes(driver.assigned_route_id)) {
      return forbidden('You do not have access to this driver');
    }
  }
  return json({ data: driver });
}
export async function handleAdminCreateDriver(env: Env, request: Request, auth?: AuthContext) {
  const body = await readJson<CreateDriverBody>(request);
  if (!body?.userId) return badRequest('userId is required');
  // zone_admin: assignedRouteId must belong to their zone
  if (auth?.adminType === 'zone_admin' && body.assignedRouteId) {
    if (!auth.routeIds?.includes(body.assignedRouteId)) {
      return forbidden('You can only assign drivers to routes in your zone');
    }
  }
  return json({ message: 'Driver created', data: await createDriverService(env, body, auth?.userId) }, 201);
}
export async function handleAdminUpdateDriver(env: Env, request: Request, driverId: string, auth?: AuthContext) {
  const body = await readJson<UpdateDriverBody & { fullName?: string | null; email?: string | null; phoneNumber?: string | null }>(request);
  if (!driverId) return badRequest('driverId is required');
  // zone_admin: new assignedRouteId must belong to their zone
  if (auth?.adminType === 'zone_admin' && body?.assignedRouteId) {
    if (!auth.routeIds?.includes(body.assignedRouteId)) {
      return forbidden('You can only assign drivers to routes in your zone');
    }
  }
  const driver = await updateDriverService(env, driverId, body ?? {}, auth?.userId);

  // Update associated user fields if provided — accessible by zone_admin via this endpoint
  const hasUserFields = body && (body.fullName !== undefined || body.email !== undefined || body.phoneNumber !== undefined);
  if (hasUserFields) {
    const driverRecord = await getDriverByIdService(env, driverId) as any;
    if (driverRecord?.user_id) {
      const userUpdate: Record<string, unknown> = {};
      if (body!.fullName !== undefined) userUpdate.fullName = body!.fullName;
      if (body!.email !== undefined) userUpdate.email = body!.email;
      if (body!.phoneNumber !== undefined) userUpdate.phoneNumber = body!.phoneNumber;
      await updateUserService(env, driverRecord.user_id, userUpdate as any);
    }
  }

  return json({ message: 'Driver updated', data: driver });
}
export async function handleAdminDeleteDriver(env: Env, driverId: string, auth?: AuthContext) {
  if (!driverId) return badRequest('driverId is required');
  // zone_admin: can only delete drivers in their zone
  if (auth?.adminType === 'zone_admin') {
    const driver = await getDriverByIdService(env, driverId) as any;
    if (driver?.assigned_route_id && !auth.routeIds?.includes(driver.assigned_route_id)) {
      return forbidden('You do not have access to this driver');
    }
  }
  return json({ message: 'Driver deleted', data: await deleteDriverService(env, driverId) });
}

/**
 * POST /admin/drivers/with-user
 * Creates a User (role=driver) + Driver profile in one step.
 * Body: { username, email, password, fullName, employeeCode, licenseNo, assignedRouteId, assignedBusId }
 */
export async function handleAdminCreateDriverWithUser(env: Env, request: Request, auth?: AuthContext) {
  const body = await readJson<any>(request);
  if (!body?.username && !body?.email) return badRequest('username or email is required');
  // zone_admin: assignedRouteId must belong to their zone
  if (auth?.adminType === 'zone_admin' && body.assignedRouteId) {
    if (!auth.routeIds?.includes(body.assignedRouteId)) {
      return forbidden('You can only assign drivers to routes in your zone');
    }
  }

  // Step 1: create Supabase Auth account (if password + email + service role key)
  let authUserId: string | null = null;
  let authWarning: string | undefined;
  if (body.password && body.email && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const authUser = await supabaseAdminAuthFetch<{ id: string }>(env, 'admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: { username: body.username ?? null, full_name: body.fullName ?? null },
        }),
      });
      authUserId = authUser?.id ?? null;
    } catch (e) {
      const r = handleSupabaseAuthError(e); if (r) return r; throw e;
    }
  } else if (body.password && body.email && usingSupabase(env)) {
    authWarning = 'SUPABASE_SERVICE_ROLE_KEY not configured — auth user not created, login will not work';
  }

  // Step 2: create user profile with role=driver
  const userPayload: CreateUserBody = {
    authUserId: authUserId ?? null,
    username: body.username ?? null,
    email: body.email ?? null,
    fullName: body.fullName ?? null,
    phoneNumber: body.phoneNumber ?? null,
    role: 'driver',
    status: 'active',
    authProvider: 'email',
  };
  let user: any;
  try { user = await createUserService(env, userPayload); } catch (e) { const r = parseDatabaseError(e); if (r) return r; throw e; }
  if (!user?.id) return badRequest('Failed to create user');

  // Step 3: create driver profile
  const driverPayload: CreateDriverBody = {
    userId: user.id,
    employeeCode: body.employeeCode ?? null,
    licenseNo: body.licenseNo ?? null,
    licenseType: body.licenseType ?? null,
    licenseIssueDate: body.licenseIssueDate ?? null,
    licenseExpiryDate: body.licenseExpiryDate ?? null,
    dateOfBirth: body.dateOfBirth ?? null,
    address: body.address ?? null,
    photoUrl: body.photoUrl ?? null,
    assignedRouteId: body.assignedRouteId ?? null,
    assignedBusId: body.assignedBusId ?? null,
    status: body.status ?? 'active',
  };
  const driver = await createDriverService(env, driverPayload, auth?.userId);

  const resp: Record<string, unknown> = { message: 'Driver and user created', data: { user, driver } };
  if (authWarning) resp.warning = authWarning;
  return json(resp, 201);
}

// ===== ADMINS =====
export async function handleAdminListAdmins(env: Env, auth?: AuthContext) {
  // zone_admin: only see admins in same zone
  const zoneId = auth?.adminType === 'zone_admin' ? auth.zoneId : undefined;
  return json({ data: await listAdminsService(env, zoneId) });
}
export async function handleAdminGetAdminById(env: Env, adminId: string, auth?: AuthContext) {
  if (!adminId) return badRequest('adminId is required');
  const admin = await getAdminByIdService(env, adminId) as any;
  if (!admin) return json({ data: null });
  // zone_admin: can only view admins in their own zone
  if (auth?.adminType === 'zone_admin' && admin.zone_id !== auth.zoneId) {
    return forbidden('You do not have access to this admin');
  }
  return json({ data: admin });
}
export async function handleAdminCreateAdmin(env: Env, request: Request, auth?: AuthContext) {
  const body = await readJson<CreateAdminBody>(request);
  if (!body?.userId || !body.adminType) return badRequest('userId and adminType are required');
  // zone_admin: can only create zone_admin scoped to their own zone
  if (auth?.adminType === 'zone_admin') {
    if (body.adminType === 'super_admin') {
      return forbidden('zone_admin cannot create super_admin');
    }
    body.zoneId = auth.zoneId ?? body.zoneId;
  }
  return json({ message: 'Admin created', data: await createAdminService(env, body, auth?.userId) }, 201);
}
export async function handleAdminUpdateAdmin(env: Env, request: Request, adminId: string, auth?: AuthContext) {
  const body = await readJson<UpdateAdminBody>(request);
  if (!adminId) return badRequest('adminId is required');
  // zone_admin: cannot promote anyone to super_admin
  if (auth?.adminType === 'zone_admin' && (body as any)?.adminType === 'super_admin') {
    return forbidden('zone_admin cannot promote to super_admin');
  }
  return json({ message: 'Admin updated', data: await updateAdminService(env, adminId, body ?? {}, auth?.userId) });
}
export async function handleAdminDeleteAdmin(env: Env, adminId: string, auth?: AuthContext) {
  if (!adminId) return badRequest('adminId is required');
  // zone_admin: can only delete admins in their own zone
  if (auth?.adminType === 'zone_admin') {
    const admin = await getAdminByIdService(env, adminId) as any;
    if (admin?.zone_id !== auth.zoneId) {
      return forbidden('You do not have access to this admin');
    }
  }
  return json({ message: 'Admin deleted', data: await deleteAdminService(env, adminId) });
}

/**
 * POST /admin/admins/with-user
 * Creates a User (role=admin) + Admin profile in one step.
 * Body: { username, email, password, fullName, adminType, zoneId }
 */
export async function handleAdminCreateAdminWithUser(env: Env, request: Request, auth?: AuthContext) {
  const body = await readJson<any>(request);
  if (!body?.username && !body?.email) return badRequest('username or email is required');
  if (!body?.adminType) return badRequest('adminType is required');
  // zone_admin: can only create zone_admin for their own zone
  if (auth?.adminType === 'zone_admin') {
    if (body.adminType === 'super_admin') {
      return forbidden('zone_admin cannot create super_admin');
    }
    body.zoneId = auth.zoneId ?? body.zoneId;
  }

  // Step 1: create Supabase Auth account (if password + email + service role key)
  let authUserId: string | null = null;
  let authWarning: string | undefined;
  if (body.password && body.email && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const authUser = await supabaseAdminAuthFetch<{ id: string }>(env, 'admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: { username: body.username ?? null, full_name: body.fullName ?? null },
        }),
      });
      authUserId = authUser?.id ?? null;
    } catch (e) {
      const r = handleSupabaseAuthError(e); if (r) return r; throw e;
    }
  } else if (body.password && body.email && usingSupabase(env)) {
    authWarning = 'SUPABASE_SERVICE_ROLE_KEY not configured — auth user not created, login will not work';
  }

  // Step 2: create user profile with role=admin
  const userPayload: CreateUserBody = {
    authUserId: authUserId ?? null,
    username: body.username ?? null,
    email: body.email ?? null,
    fullName: body.fullName ?? null,
    role: 'admin',
    status: 'active',
    authProvider: 'email',
  };
  let user: any;
  try { user = await createUserService(env, userPayload); } catch (e) { const r = parseDatabaseError(e); if (r) return r; throw e; }
  if (!user?.id) return badRequest('Failed to create user');

  // Step 3: create admin profile
  const adminPayload: CreateAdminBody = {
    userId: user.id,
    adminType: body.adminType,
    zoneId: body.zoneId ?? null,
    status: 'active',
  };
  const admin = await createAdminService(env, adminPayload, auth?.userId);

  const resp: Record<string, unknown> = { message: 'Admin and user created', data: { user, admin } };
  if (authWarning) resp.warning = authWarning;
  return json(resp, 201);
}

// ===== ROUTE ADMINS (legacy) =====
export async function handleAdminListRouteAdmins(env: Env) {
  return json({ data: await listRouteAdminsService(env) });
}
export async function handleAdminGetRouteAdminById(env: Env, assignmentId: string) {
  if (!assignmentId) return badRequest('assignmentId is required');
  return json({ data: await getRouteAdminByIdService(env, assignmentId) });
}
export async function handleAdminCreateRouteAdmin(env: Env, request: Request) {
  const body = await readJson<CreateRouteAdminBody>(request);
  if (!body?.routeId || !body.adminId) return badRequest('routeId and adminId are required');
  return json({ message: 'Route admin assigned', data: await createRouteAdminService(env, body) }, 201);
}
export async function handleAdminDeleteRouteAdmin(env: Env, assignmentId: string) {
  if (!assignmentId) return badRequest('assignmentId is required');
  return json({ message: 'Route admin assignment deleted', data: await deleteRouteAdminService(env, assignmentId) });
}

// ===== VERIFY EMAIL =====
export async function handleAdminVerifyEmail(env: Env, userId: string) {
  if (!userId) return badRequest('userId is required');

  const user = await getUserByIdService(env, userId) as any;
  if (!user) return json({ error: 'ไม่พบผู้ใช้' }, 404);
  if (user.email_verified) {
    return json({ message: 'Email นี้ได้รับการยืนยันแล้ว', alreadyVerified: true });
  }

  // Mark email_verified = true in our DB
  await updateUserService(env, userId, { emailVerified: true } as any);

  // Also confirm in Supabase Auth when possible so the user can actually log in
  let authWarning: string | undefined;
  if (user.auth_user_id) {
    if (env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await supabaseAdminAuthFetch(env, `admin/users/${user.auth_user_id}`, {
          method: 'PUT',
          body: JSON.stringify({ email_confirm: true }),
        });
      } catch (e) {
        authWarning = `DB updated but Supabase Auth confirm failed: ${String((e as any)?.message ?? '')}`;
      }
    } else if (usingSupabase(env)) {
      authWarning = 'SUPABASE_SERVICE_ROLE_KEY not configured — DB updated but Supabase Auth email not confirmed';
    }
  }

  const resp: Record<string, unknown> = { message: 'ยืนยัน Email สำเร็จ' };
  if (authWarning) resp.warning = authWarning;
  return json(resp);
}

// ===== RESET PASSWORD =====
export async function handleAdminResetPassword(env: Env, request: Request, userId: string, auth?: AuthContext) {
  if (!userId) return badRequest('userId is required');
  const body = await readJson<{ newPassword: string }>(request);
  if (!body?.newPassword || body.newPassword.length < 6) {
    return badRequest('newPassword ต้องมีอย่างน้อย 6 ตัวอักษร');
  }

  const user = await getUserByIdService(env, userId) as any;
  if (!user) return json({ error: 'ไม่พบผู้ใช้' }, 404);
  if (!user.auth_user_id) {
    return badRequest('ผู้ใช้นี้ยังไม่มีบัญชี Supabase Auth — ไม่สามารถ reset password ได้');
  }

  // Zone admin: can only reset drivers in their zone or admins in their zone
  if (auth?.adminType === 'zone_admin') {
    const driver = await getDriverByUserIdService(env, userId) as any;
    if (driver) {
      if (driver.assigned_route_id && !auth.routeIds?.includes(driver.assigned_route_id)) {
        return forbidden('คุณสามารถ reset password ได้เฉพาะคนขับในโซนของคุณเท่านั้น');
      }
    } else {
      const admins = await listAdminsService(env, auth.zoneId) as any[];
      const isInZone = Array.isArray(admins) && admins.some((a: any) => a.user_id === userId);
      if (!isInZone) {
        return forbidden('คุณสามารถ reset password ได้เฉพาะผู้ใช้ในโซนของคุณเท่านั้น');
      }
    }
  }

  try {
    await supabaseAdminAuthFetch(env, `admin/users/${user.auth_user_id}`, {
      method: 'PUT',
      body: JSON.stringify({ password: body.newPassword }),
    });
  } catch (e) {
    return json({ error: `ไม่สามารถ reset password ได้: ${String((e as any)?.message ?? '')}` }, 500);
  }

  if (usingSupabase(env) && auth?.userId) {
    const now = new Date().toISOString();

    // บันทึกว่าใครเป็นคนกด reset และเมื่อไหร่
    await supabaseFetch(env, `users?id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        password_reset_by: auth.userId,
        password_reset_at: now,
      }),
    }).catch(() => {});

    // update updated_by บน drivers หรือ admins table ด้วย
    const [driverRecord, adminRecord] = await Promise.all([
      getDriverByUserIdService(env, userId).catch(() => null),
      findAdminByUserIdService(env, userId).catch(() => null),
    ]);
    if (driverRecord) {
      await updateDriverService(env, (driverRecord as any).id, {}, auth.userId).catch(() => {});
    }
    if (adminRecord) {
      await updateAdminService(env, (adminRecord as any).id, {}, auth.userId).catch(() => {});
    }
  }

  return json({ message: 'Reset password สำเร็จ' });
}
