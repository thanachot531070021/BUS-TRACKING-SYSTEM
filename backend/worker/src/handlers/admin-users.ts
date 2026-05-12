import { badRequest, forbidden, json, readJson } from '../lib/http';
import { supabaseAdminAuthFetch, usingSupabase } from '../lib/supabase';
import { listUsersService, createUserService, updateUserService, getUserByIdService, deleteUserService } from '../services/users.service';
import { listDriversService, createDriverService, updateDriverService, getDriverByIdService, deleteDriverService } from '../services/drivers.service';
import { listAdminsService, createAdminService, updateAdminService, getAdminByIdService, deleteAdminService } from '../services/admins.service';
import { createRouteAdminService, deleteRouteAdminService, getRouteAdminByIdService, listRouteAdminsService } from '../services/route-admins.service';
import type { AuthContext, CreateAdminBody, CreateDriverBody, CreateRouteAdminBody, CreateUserBody, Env, UpdateAdminBody, UpdateDriverBody, UpdateUserBody } from '../types';

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
  } else if (body.password && body.email && usingSupabase(env)) {
    authWarning = 'SUPABASE_SERVICE_ROLE_KEY not configured — auth user not created, login will not work until secret is set';
  }

  const user = await createUserService(env, { ...body, authUserId: authUserId ?? body.authUserId });
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
  return json({ message: 'Driver created', data: await createDriverService(env, body) }, 201);
}
export async function handleAdminUpdateDriver(env: Env, request: Request, driverId: string, auth?: AuthContext) {
  const body = await readJson<UpdateDriverBody>(request);
  if (!driverId) return badRequest('driverId is required');
  // zone_admin: new assignedRouteId must belong to their zone
  if (auth?.adminType === 'zone_admin' && body?.assignedRouteId) {
    if (!auth.routeIds?.includes(body.assignedRouteId)) {
      return forbidden('You can only assign drivers to routes in your zone');
    }
  }
  return json({ message: 'Driver updated', data: await updateDriverService(env, driverId, body ?? {}) });
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

  // Step 1: create user with role=driver
  const userPayload: CreateUserBody = {
    username: body.username ?? null,
    email: body.email ?? null,
    fullName: body.fullName ?? null,
    role: 'driver',
    status: 'active',
    authProvider: 'email',
  };
  const user = await createUserService(env, userPayload) as any;
  if (!user?.id) return badRequest('Failed to create user');

  // Step 2: create driver profile
  const driverPayload: CreateDriverBody = {
    userId: user.id,
    employeeCode: body.employeeCode ?? null,
    licenseNo: body.licenseNo ?? null,
    assignedRouteId: body.assignedRouteId ?? null,
    assignedBusId: body.assignedBusId ?? null,
    status: 'active',
  };
  const driver = await createDriverService(env, driverPayload);

  return json({ message: 'Driver and user created', data: { user, driver } }, 201);
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
  return json({ message: 'Admin created', data: await createAdminService(env, body) }, 201);
}
export async function handleAdminUpdateAdmin(env: Env, request: Request, adminId: string, auth?: AuthContext) {
  const body = await readJson<UpdateAdminBody>(request);
  if (!adminId) return badRequest('adminId is required');
  // zone_admin: cannot promote anyone to super_admin
  if (auth?.adminType === 'zone_admin' && (body as any)?.adminType === 'super_admin') {
    return forbidden('zone_admin cannot promote to super_admin');
  }
  return json({ message: 'Admin updated', data: await updateAdminService(env, adminId, body ?? {}) });
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

  // Step 1: create user with role=admin
  const userPayload: CreateUserBody = {
    username: body.username ?? null,
    email: body.email ?? null,
    fullName: body.fullName ?? null,
    role: 'admin',
    status: 'active',
    authProvider: 'email',
  };
  const user = await createUserService(env, userPayload) as any;
  if (!user?.id) return badRequest('Failed to create user');

  // Step 2: create admin profile
  const adminPayload = {
    userId: user.id,
    adminType: body.adminType,
    zoneId: body.zoneId ?? null,
    status: 'active',
  };
  const admin = await createAdminService(env, adminPayload as any);

  return json({ message: 'Admin and user created', data: { user, admin } }, 201);
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
