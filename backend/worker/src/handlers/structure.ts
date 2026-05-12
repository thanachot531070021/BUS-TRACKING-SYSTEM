import { json } from '../lib/http';
import { supabaseFetch, usingSupabase } from '../lib/supabase';
import type { Env } from '../types';

/**
 * GET /structure
 * Public endpoint — returns full user/zone/route structure.
 * Passwords are NOT included (stored only in Supabase Auth, never in public.users).
 */
export async function handleGetStructure(env: Env) {
  if (!usingSupabase(env)) {
    return json({ data: { zones: [], super_admins: [], passengers: [], total: { zones: 0, routes: 0, admins: 0, drivers: 0, passengers: 0 } } });
  }

  // Fetch sequentially to avoid hitting Supabase connection pool limit (error 1016)
  const zones      = await supabaseFetch<any[]>(env, 'zones?select=*&order=zone_name.asc');
  const routes     = await supabaseFetch<any[]>(env, 'routes?select=*&order=route_name.asc');
  const admins     = await supabaseFetch<any[]>(env, 'admins?select=id,admin_type,zone_id,status,created_at,user:users(id,username,full_name,email,phone_number,auth_provider,status,created_at,last_login_at)&order=created_at.asc');
  const drivers    = await supabaseFetch<any[]>(env, 'drivers?select=id,employee_code,license_no,assigned_route_id,assigned_bus_id,status,created_at,user:users(id,username,full_name,email,phone_number,auth_provider,status,created_at,last_login_at)&order=created_at.asc');
  const passengers = await supabaseFetch<any[]>(env, 'users?select=id,username,full_name,email,phone_number,auth_provider,status,created_at,last_login_at&role=eq.passenger&order=created_at.asc');

  // Index for fast lookup
  const routesByZone: Record<string, any[]> = {};
  routes.forEach(r => {
    const zid = r.zone_id || '__none__';
    if (!routesByZone[zid]) routesByZone[zid] = [];
    routesByZone[zid].push(r);
  });

  const adminsByZone: Record<string, any[]> = {};
  const superAdmins: any[] = [];
  admins.forEach(a => {
    if (a.admin_type === 'super_admin') { superAdmins.push(a); return; }
    const zid = a.zone_id || '__none__';
    if (!adminsByZone[zid]) adminsByZone[zid] = [];
    adminsByZone[zid].push(a);
  });

  const driversByRoute: Record<string, any[]> = {};
  drivers.forEach(d => {
    const rid = d.assigned_route_id || '__none__';
    if (!driversByRoute[rid]) driversByRoute[rid] = [];
    driversByRoute[rid].push(d);
  });

  // Assemble zone tree
  const zoneTree = zones.map(zone => ({
    ...zone,
    admins: adminsByZone[zone.id] || [],
    routes: (routesByZone[zone.id] || []).map(route => ({
      ...route,
      drivers: driversByRoute[route.id] || [],
    })),
  }));

  return json({
    data: {
      zones: zoneTree,
      super_admins: superAdmins,
      passengers,
      total: {
        zones: zones.length,
        routes: routes.length,
        admins: admins.length,
        drivers: drivers.length,
        passengers: passengers.length,
      },
    },
  });
}
