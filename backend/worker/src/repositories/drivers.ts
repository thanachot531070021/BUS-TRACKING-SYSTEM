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

export async function listDrivers(env: Env) {
  if (!usingSupabase(env)) return mockDrivers;
  return supabaseFetch<DriverProfile[]>(env, 'drivers?select=*&order=created_at.desc');
}

export async function getDriverById(env: Env, driverId: string) {
  if (!usingSupabase(env)) return mockDrivers.find((driver) => driver.id === driverId) ?? null;
  const rows = await supabaseFetch<DriverProfile[]>(env, `drivers?select=*&id=eq.${driverId}&limit=1`);
  return rows[0] ?? null;
}

export async function findDriverByUserId(env: Env, userId: string) {
  if (!usingSupabase(env)) return mockDrivers.find((driver) => driver.user_id === userId) ?? null;
  const rows = await supabaseFetch<DriverProfile[]>(env, `drivers?select=*&user_id=eq.${userId}&limit=1`);
  return rows[0] ?? null;
}

export async function createDriver(env: Env, body: CreateDriverBody) {
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
      assigned_bus_id: body.assignedBusId ?? null,
      assigned_route_id: body.assignedRouteId ?? null,
      status: body.status ?? 'active',
    }]),
  });

  return created[0];
}

export async function updateDriver(env: Env, driverId: string, body: UpdateDriverBody) {
  if (!usingSupabase(env)) return { id: driverId, ...body };

  const updated = await supabaseFetch<JsonRecord[]>(env, `drivers?id=eq.${driverId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      user_id: body.userId,
      employee_code: body.employeeCode,
      license_no: body.licenseNo,
      assigned_bus_id: body.assignedBusId,
      assigned_route_id: body.assignedRouteId,
      status: body.status,
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
