import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { CreateDriverBody, DriverProfile, Env, JsonRecord, UpdateDriverBody } from '../types';

const mockDrivers: DriverProfile[] = [
  {
    id: 'driver-001',
    user_id: 'user-driver-001',
    employee_code: 'DRV001',
    license_no: 'LIC-001',
    assigned_bus_id: 'bus-001',
    assigned_route_id: 'route-r1',
    status: 'active',
  },
];

const DRIVER_SELECT = 'id,user_id,employee_code,license_no,license_type,license_issue_date,license_expiry_date,date_of_birth,address,photo_url,assigned_bus_id,assigned_route_id,status,created_at,created_by,updated_by,user:users!drivers_user_id_fkey(id,full_name,username,email,phone_number),created_by_user:users!fk_drivers_created_by(id,full_name,username),updated_by_user:users!fk_drivers_updated_by(id,full_name,username)';

/** List drivers, optionally scoped to a set of route IDs (for zone_admin) */
export async function listDrivers(env: Env, routeIds?: string[]) {
  if (!usingSupabase(env)) return mockDrivers;

  let query = `drivers?select=${DRIVER_SELECT}&order=created_at.desc`;

  if (routeIds && routeIds.length > 0) {
    query += `&assigned_route_id=in.(${routeIds.join(',')})`;
  } else if (routeIds && routeIds.length === 0) {
    return [];
  }

  return supabaseFetch<JsonRecord[]>(env, query);
}

export async function getDriverById(env: Env, driverId: string) {
  if (!usingSupabase(env)) return mockDrivers.find((d) => d.id === driverId) ?? null;
  const rows = await supabaseFetch<JsonRecord[]>(env, `drivers?select=${DRIVER_SELECT}&id=eq.${driverId}&limit=1`);
  return rows[0] ?? null;
}

export async function findDriverByUserId(env: Env, userId: string) {
  if (!usingSupabase(env)) return mockDrivers.find((d) => d.user_id === userId) ?? null;
  const rows = await supabaseFetch<DriverProfile[]>(env, `drivers?select=*&user_id=eq.${userId}&limit=1`);
  return rows[0] ?? null;
}

export async function createDriver(env: Env, body: CreateDriverBody, userId?: string | null) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      user_id: body.userId,
      employee_code: body.employeeCode ?? null,
      license_no: body.licenseNo ?? null,
      assigned_bus_id: body.assignedBusId ?? null,
      assigned_route_id: body.assignedRouteId ?? null,
      status: body.status ?? 'active',
    };
  }

  const created = await supabaseFetch<JsonRecord[]>(env, 'drivers', {
    method: 'POST',
    body: JSON.stringify([{
      user_id: body.userId,
      employee_code: body.employeeCode ?? null,
      license_no: body.licenseNo ?? null,
      license_type: body.licenseType ?? null,
      license_issue_date: body.licenseIssueDate ?? null,
      license_expiry_date: body.licenseExpiryDate ?? null,
      date_of_birth: body.dateOfBirth ?? null,
      address: body.address ?? null,
      photo_url: body.photoUrl ?? null,
      assigned_bus_id: body.assignedBusId ?? null,
      assigned_route_id: body.assignedRouteId ?? null,
      status: body.status ?? 'active',
      created_by: userId ?? null,
      updated_by: userId ?? null,
    }]),
  });

  return created[0];
}

export async function updateDriver(env: Env, driverId: string, body: UpdateDriverBody, userId?: string | null) {
  if (!usingSupabase(env)) return { id: driverId, ...body };

  const updated = await supabaseFetch<JsonRecord[]>(env, `drivers?id=eq.${driverId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      user_id: body.userId,
      employee_code: body.employeeCode,
      license_no: body.licenseNo,
      license_type: body.licenseType,
      license_issue_date: body.licenseIssueDate,
      license_expiry_date: body.licenseExpiryDate,
      date_of_birth: body.dateOfBirth,
      address: body.address,
      photo_url: body.photoUrl,
      assigned_bus_id: body.assignedBusId,
      assigned_route_id: body.assignedRouteId,
      status: body.status,
      updated_by: userId ?? null,
    }),
  });

  return updated[0];
}

export async function deleteDriver(env: Env, driverId: string) {
  if (!usingSupabase(env)) return { id: driverId, deleted: true };
  await supabaseFetch<JsonRecord[]>(env, `drivers?id=eq.${driverId}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
  return { id: driverId, deleted: true };
}
