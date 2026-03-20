var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/lib/http.ts
function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,authorization"
  };
}
__name(corsHeaders, "corsHeaders");
function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders()
    }
  });
}
__name(json, "json");
async function readJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  return request.json();
}
__name(readJson, "readJson");
function notFound() {
  return json({ error: "Not Found" }, 404);
}
__name(notFound, "notFound");
function badRequest(message) {
  return json({ error: message }, 400);
}
__name(badRequest, "badRequest");

// src/lib/supabase.ts
function usingSupabase(env) {
  return Boolean(env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY));
}
__name(usingSupabase, "usingSupabase");
function getSupabaseBaseUrl(env) {
  if (!env.SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not configured");
  }
  return env.SUPABASE_URL;
}
__name(getSupabaseBaseUrl, "getSupabaseBaseUrl");
function getSupabaseAnonKey(env) {
  if (!env.SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_ANON_KEY is not configured");
  }
  return env.SUPABASE_ANON_KEY;
}
__name(getSupabaseAnonKey, "getSupabaseAnonKey");
async function supabaseFetch(env, path, init) {
  const baseUrl = getSupabaseBaseUrl(env);
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("Supabase environment variables are not configured");
  }
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init?.headers || {}
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${text}`);
  }
  if (response.status === 204) return [];
  return response.json();
}
__name(supabaseFetch, "supabaseFetch");
async function supabaseAuthFetch(env, path, init) {
  const baseUrl = getSupabaseBaseUrl(env);
  const anonKey = getSupabaseAnonKey(env);
  const response = await fetch(`${baseUrl}/auth/v1/${path}`, {
    ...init,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
      ...init?.headers || {}
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase auth request failed: ${response.status} ${text}`);
  }
  return response.json();
}
__name(supabaseAuthFetch, "supabaseAuthFetch");

// src/repositories/users.ts
var mockUsers = [
  {
    id: "user-passenger-001",
    auth_provider: "google",
    provider_user_id: "google-001",
    email: "passenger@example.com",
    email_verified: true,
    username: "passenger1",
    full_name: "Mock Passenger",
    given_name: "Mock",
    family_name: "Passenger",
    avatar_url: null,
    role: "passenger",
    status: "active"
  },
  {
    id: "user-admin-super",
    auth_provider: "email",
    provider_user_id: null,
    email: "superadmin@example.com",
    email_verified: true,
    username: "superadmin",
    full_name: "Mock Super Admin",
    given_name: "Mock",
    family_name: "SuperAdmin",
    avatar_url: null,
    role: "admin",
    status: "active"
  },
  {
    id: "user-admin-route",
    auth_provider: "email",
    provider_user_id: null,
    email: "routeadmin@example.com",
    email_verified: true,
    username: "routeadmin",
    full_name: "Mock Route Admin",
    given_name: "Mock",
    family_name: "RouteAdmin",
    avatar_url: null,
    role: "admin",
    status: "active"
  }
];
async function listUsers(env) {
  if (!usingSupabase(env)) return mockUsers;
  return supabaseFetch(env, "users?select=*&order=created_at.desc");
}
__name(listUsers, "listUsers");
async function findUserByUsernameOrEmail(env, identifier) {
  if (!usingSupabase(env)) {
    return mockUsers.find((user) => user.username === identifier || user.email === identifier || user.phone_number === identifier) ?? null;
  }
  const rows = await supabaseFetch(env, `users?select=*&or=(username.eq.${identifier},email.eq.${identifier},phone_number.eq.${identifier})&limit=1`);
  return rows[0] ?? null;
}
__name(findUserByUsernameOrEmail, "findUserByUsernameOrEmail");
async function createUser(env, body) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      auth_provider: body.authProvider ?? "guest",
      provider_user_id: body.providerUserId ?? null,
      email: body.email ?? null,
      email_verified: body.emailVerified ?? false,
      username: body.username ?? null,
      phone_number: body.phoneNumber ?? null,
      full_name: body.fullName ?? null,
      given_name: body.givenName ?? null,
      family_name: body.familyName ?? null,
      avatar_url: body.avatarUrl ?? null,
      role: body.role,
      status: body.status ?? "active"
    };
  }
  const created = await supabaseFetch(env, "users", {
    method: "POST",
    body: JSON.stringify([{
      auth_user_id: body.authUserId ?? null,
      auth_provider: body.authProvider ?? "guest",
      provider_user_id: body.providerUserId ?? null,
      email: body.email ?? null,
      email_verified: body.emailVerified ?? false,
      username: body.username ?? null,
      phone_number: body.phoneNumber ?? null,
      full_name: body.fullName ?? null,
      given_name: body.givenName ?? null,
      family_name: body.familyName ?? null,
      avatar_url: body.avatarUrl ?? null,
      role: body.role,
      status: body.status ?? "active"
    }])
  });
  return created[0];
}
__name(createUser, "createUser");
async function updateUser(env, userId, body) {
  if (!usingSupabase(env)) return { id: userId, ...body };
  const updated = await supabaseFetch(env, `users?id=eq.${userId}`, {
    method: "PATCH",
    body: JSON.stringify({
      auth_user_id: body.authUserId,
      auth_provider: body.authProvider,
      provider_user_id: body.providerUserId,
      email: body.email,
      email_verified: body.emailVerified,
      username: body.username,
      phone_number: body.phoneNumber,
      full_name: body.fullName,
      given_name: body.givenName,
      family_name: body.familyName,
      avatar_url: body.avatarUrl,
      role: body.role,
      status: body.status,
      last_login_at: (/* @__PURE__ */ new Date()).toISOString()
    })
  });
  return updated[0];
}
__name(updateUser, "updateUser");

// src/repositories/auth.ts
async function registerWithPassword(env, body) {
  if (!usingSupabase(env)) {
    const userPayload2 = {
      authProvider: "email",
      email: body.email,
      emailVerified: false,
      username: body.username ?? body.email,
      fullName: body.fullName ?? body.username ?? body.email,
      role: body.role ?? "passenger",
      status: "active"
    };
    const user2 = await createUser(env, userPayload2);
    return {
      session: {
        access_token: `mock-passenger-token:${user2.id}`,
        refresh_token: "mock-refresh-token",
        expires_in: 3600
      },
      user: user2,
      note: "Mock register only. Configure Supabase online keys for real auth."
    };
  }
  const session = await supabaseAuthFetch(env, "signup", {
    method: "POST",
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      data: {
        username: body.username ?? null,
        full_name: body.fullName ?? null
      }
    })
  });
  const userPayload = {
    authUserId: session.user?.id ?? null,
    authProvider: "email",
    email: session.user?.email ?? body.email,
    emailVerified: false,
    username: body.username ?? body.email,
    fullName: body.fullName ?? body.username ?? body.email,
    role: body.role ?? "passenger",
    status: "active"
  };
  const user = await createUser(env, userPayload);
  return { session, user };
}
__name(registerWithPassword, "registerWithPassword");
async function loginWithPassword(env, body) {
  if (!usingSupabase(env)) {
    const user = await findUserByUsernameOrEmail(env, body.identifier);
    const role = body.expectedRole ?? (user?.role ?? "passenger");
    if (role === "driver") {
      return {
        role: "driver",
        token: `mock-driver-token:${user?.id ?? body.identifier}`,
        user: user ?? { id: "driver-user-001", username: body.identifier },
        note: "Mock login only - replace with Supabase Auth"
      };
    }
    if (role === "admin") {
      const isSuperAdmin = ["admin", "superadmin", "root", "superadmin@example.com"].includes(body.identifier.toLowerCase());
      const adminType = isSuperAdmin ? "super_admin" : "route_admin";
      const adminId = isSuperAdmin ? "admin-001" : "admin-002";
      const userId = isSuperAdmin ? "user-admin-super" : "user-admin-route";
      const routeIds = isSuperAdmin ? "" : "route-r1";
      return {
        role: "admin",
        token: `mock-admin-token:${adminType}:${adminId}:${userId}:${routeIds}`,
        user: user ?? { id: userId, username: body.identifier, role: "admin" },
        note: "Mock login only - replace with Supabase Auth"
      };
    }
    return {
      role: "passenger",
      token: `mock-passenger-token:${user?.id ?? body.identifier}`,
      user: user ?? { id: "passenger-user-001", username: body.identifier },
      note: "Mock login only - replace with Supabase Auth"
    };
  }
  const session = await supabaseAuthFetch(env, "token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({
      email: body.identifier,
      password: body.password
    })
  });
  const profile = await findUserByUsernameOrEmail(env, body.identifier);
  return {
    role: profile?.role ?? body.expectedRole ?? "passenger",
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    auth_user: session.user,
    profile,
    anon_key_hint: getSupabaseAnonKey(env).slice(0, 12)
  };
}
__name(loginWithPassword, "loginWithPassword");
async function loginDriver(env, phoneOrUsername, password) {
  return loginWithPassword(env, { identifier: phoneOrUsername, password, expectedRole: "driver" });
}
__name(loginDriver, "loginDriver");
async function loginAdmin(env, username, password) {
  return loginWithPassword(env, { identifier: username, password, expectedRole: "admin" });
}
__name(loginAdmin, "loginAdmin");
async function loginWithGoogle(env, body) {
  const providerUserId = `google-sub-${body.googleIdToken.slice(0, 12)}`;
  const userPayload = {
    authProvider: "google",
    providerUserId,
    email: body.email ?? null,
    emailVerified: true,
    fullName: body.fullName ?? "Google User",
    avatarUrl: body.avatarUrl ?? null,
    role: "passenger",
    status: "active"
  };
  const user = await createUser(env, userPayload);
  return {
    role: "passenger",
    token: `mock-passenger-token:${providerUserId}`,
    user,
    note: "Starter Google login flow only. Replace with real Google token verification or Supabase Auth."
  };
}
__name(loginWithGoogle, "loginWithGoogle");

// src/services/auth.service.ts
async function driverLoginService(env, phone, password) {
  return loginDriver(env, phone, password);
}
__name(driverLoginService, "driverLoginService");
async function adminLoginService(env, username, password) {
  return loginAdmin(env, username, password);
}
__name(adminLoginService, "adminLoginService");
async function passwordLoginService(env, identifier, password, expectedRole) {
  return loginWithPassword(env, { identifier, password, expectedRole });
}
__name(passwordLoginService, "passwordLoginService");
async function registerService(env, email, password, username, fullName, role) {
  return registerWithPassword(env, { email, password, username, fullName, role });
}
__name(registerService, "registerService");
async function googleLoginService(env, googleIdToken, email, fullName, avatarUrl) {
  return loginWithGoogle(env, { googleIdToken, email, fullName, avatarUrl });
}
__name(googleLoginService, "googleLoginService");
async function currentUserService(env, identifier) {
  return findUserByUsernameOrEmail(env, identifier);
}
__name(currentUserService, "currentUserService");

// src/data/mock.ts
var sampleRoutes = [
  {
    id: "route-r1",
    route_code: "R1",
    route_name: "Campus Loop",
    start_location: "Main Gate",
    end_location: "Engineering Building",
    route_polyline: "",
    status: "active"
  },
  {
    id: "route-r2",
    route_code: "R2",
    route_name: "City Connector",
    start_location: "Bus Terminal",
    end_location: "Central Market",
    route_polyline: "",
    status: "active"
  }
];
var sampleBuses = [
  {
    id: "bus-001",
    plate_number: "10-1234",
    route_id: "route-r1",
    route_name: "Campus Loop",
    driver_id: "driver-001",
    status: "on",
    current_lat: 13.7563,
    current_lng: 100.5018,
    current_speed: 32,
    last_seen_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "bus-002",
    plate_number: "20-5678",
    route_id: "route-r2",
    route_name: "City Connector",
    driver_id: "driver-002",
    status: "on",
    current_lat: 13.7465,
    current_lng: 100.5346,
    current_speed: 18,
    last_seen_at: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var sampleWaiting = [
  {
    id: "wait-001",
    route_id: "route-r1",
    route_name: "Campus Loop",
    lat: 13.7512,
    lng: 100.5031,
    waiting_count: 3,
    status: "waiting",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  }
];

// src/repositories/buses.ts
async function listLiveBuses(env, routeId) {
  if (!usingSupabase(env)) {
    return routeId ? sampleBuses.filter((bus) => bus.route_id === routeId) : sampleBuses;
  }
  const query = routeId ? `active_buses_live?select=*&route_id=eq.${routeId}` : "active_buses_live?select=*";
  return supabaseFetch(env, query);
}
__name(listLiveBuses, "listLiveBuses");
async function listBusesByRoute(env, routeId) {
  if (!usingSupabase(env)) return sampleBuses.filter((bus) => bus.route_id === routeId);
  return supabaseFetch(env, `buses?select=*&route_id=eq.${routeId}&order=created_at.desc`);
}
__name(listBusesByRoute, "listBusesByRoute");
async function getBusById(env, busId) {
  if (!usingSupabase(env)) return sampleBuses.find((bus) => bus.id === busId) ?? null;
  const rows = await supabaseFetch(env, `buses?select=*&id=eq.${busId}&limit=1`);
  return rows[0] ?? null;
}
__name(getBusById, "getBusById");
async function listAdminBuses(env) {
  if (!usingSupabase(env)) return sampleBuses;
  return supabaseFetch(env, "buses?select=*&order=created_at.desc");
}
__name(listAdminBuses, "listAdminBuses");
async function createBus(env, body) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      plate_number: body.plateNumber,
      route_id: body.routeId ?? null,
      driver_id: body.driverId ?? null,
      status: body.status ?? "off"
    };
  }
  const created = await supabaseFetch(env, "buses", {
    method: "POST",
    body: JSON.stringify([{
      plate_number: body.plateNumber,
      route_id: body.routeId ?? null,
      driver_id: body.driverId ?? null,
      status: body.status ?? "off"
    }])
  });
  return created[0];
}
__name(createBus, "createBus");
async function updateBus(env, busId, body) {
  if (!usingSupabase(env)) {
    return { id: busId, ...body };
  }
  const updated = await supabaseFetch(env, `buses?id=eq.${busId}`, {
    method: "PATCH",
    body: JSON.stringify({
      plate_number: body.plateNumber,
      route_id: body.routeId,
      driver_id: body.driverId,
      status: body.status
    })
  });
  return updated[0];
}
__name(updateBus, "updateBus");
async function deleteBus(env, busId) {
  if (!usingSupabase(env)) return { id: busId, deleted: true };
  await supabaseFetch(env, `buses?id=eq.${busId}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" }
  });
  return { id: busId, deleted: true };
}
__name(deleteBus, "deleteBus");
async function updateDriverDuty(env, busId, status) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  if (!usingSupabase(env)) {
    return { bus_id: busId, status, timestamp };
  }
  const updated = await supabaseFetch(env, `buses?id=eq.${busId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, last_seen_at: timestamp })
  });
  return updated[0] ?? { bus_id: busId, status, timestamp };
}
__name(updateDriverDuty, "updateDriverDuty");
async function createBusLocation(env, body) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  if (!usingSupabase(env)) {
    return {
      bus_id: body.busId,
      lat: body.lat,
      lng: body.lng,
      speed: body.speed ?? 0,
      recorded_at: timestamp
    };
  }
  await supabaseFetch(env, "bus_locations", {
    method: "POST",
    body: JSON.stringify([{
      bus_id: body.busId,
      lat: body.lat,
      lng: body.lng,
      speed: body.speed ?? 0,
      recorded_at: timestamp
    }])
  });
  const updatedBus = await supabaseFetch(env, `buses?id=eq.${body.busId}`, {
    method: "PATCH",
    body: JSON.stringify({
      current_lat: body.lat,
      current_lng: body.lng,
      current_speed: body.speed ?? 0,
      last_seen_at: timestamp
    })
  });
  return updatedBus[0] ?? {
    bus_id: body.busId,
    current_lat: body.lat,
    current_lng: body.lng,
    current_speed: body.speed ?? 0,
    last_seen_at: timestamp
  };
}
__name(createBusLocation, "createBusLocation");

// src/services/buses.service.ts
async function listLiveBusesService(env, routeId) {
  return listLiveBuses(env, routeId);
}
__name(listLiveBusesService, "listLiveBusesService");
async function listBusesByRouteService(env, routeId) {
  return listBusesByRoute(env, routeId);
}
__name(listBusesByRouteService, "listBusesByRouteService");
async function getBusByIdService(env, busId) {
  return getBusById(env, busId);
}
__name(getBusByIdService, "getBusByIdService");
async function listAdminBusesService(env) {
  return listAdminBuses(env);
}
__name(listAdminBusesService, "listAdminBusesService");
async function createBusService(env, body) {
  return createBus(env, body);
}
__name(createBusService, "createBusService");
async function updateBusService(env, busId, body) {
  return updateBus(env, busId, body);
}
__name(updateBusService, "updateBusService");
async function deleteBusService(env, busId) {
  return deleteBus(env, busId);
}
__name(deleteBusService, "deleteBusService");
async function updateDriverDutyService(env, body) {
  return updateDriverDuty(env, body.busId, body.status);
}
__name(updateDriverDutyService, "updateDriverDutyService");
async function createBusLocationService(env, body) {
  return createBusLocation(env, body);
}
__name(createBusLocationService, "createBusLocationService");

// src/repositories/routes.ts
async function listRoutes(env) {
  if (!usingSupabase(env)) return sampleRoutes;
  return supabaseFetch(env, "routes?select=id,route_code,route_name,start_location,end_location,route_polyline,status&order=route_code.asc");
}
__name(listRoutes, "listRoutes");
async function getRouteById(env, routeId) {
  if (!usingSupabase(env)) return sampleRoutes.find((route) => route.id === routeId) ?? null;
  const rows = await supabaseFetch(env, `routes?select=id,route_code,route_name,start_location,end_location,route_polyline,status&id=eq.${routeId}&limit=1`);
  return rows[0] ?? null;
}
__name(getRouteById, "getRouteById");
async function createRoute(env, body) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      route_code: body.routeCode ?? `R-${Date.now()}`,
      route_name: body.routeName,
      start_location: body.startLocation ?? "",
      end_location: body.endLocation ?? "",
      route_polyline: body.routePolyline ?? "",
      status: body.status ?? "active"
    };
  }
  const created = await supabaseFetch(env, "routes", {
    method: "POST",
    body: JSON.stringify([{
      route_code: body.routeCode ?? null,
      route_name: body.routeName,
      start_location: body.startLocation ?? null,
      end_location: body.endLocation ?? null,
      route_polyline: body.routePolyline ?? null,
      status: body.status ?? "active"
    }])
  });
  return created[0];
}
__name(createRoute, "createRoute");
async function updateRoute(env, routeId, body) {
  if (!usingSupabase(env)) {
    return { id: routeId, ...body };
  }
  const updated = await supabaseFetch(env, `routes?id=eq.${routeId}`, {
    method: "PATCH",
    body: JSON.stringify({
      route_code: body.routeCode,
      route_name: body.routeName,
      start_location: body.startLocation,
      end_location: body.endLocation,
      route_polyline: body.routePolyline,
      status: body.status
    })
  });
  return updated[0];
}
__name(updateRoute, "updateRoute");
async function deleteRoute(env, routeId) {
  if (!usingSupabase(env)) return { id: routeId, deleted: true };
  await supabaseFetch(env, `routes?id=eq.${routeId}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" }
  });
  return { id: routeId, deleted: true };
}
__name(deleteRoute, "deleteRoute");

// src/services/routes.service.ts
async function listRoutesService(env) {
  return listRoutes(env);
}
__name(listRoutesService, "listRoutesService");
async function getRouteByIdService(env, routeId) {
  return getRouteById(env, routeId);
}
__name(getRouteByIdService, "getRouteByIdService");
async function createRouteService(env, body) {
  return createRoute(env, body);
}
__name(createRouteService, "createRouteService");
async function updateRouteService(env, routeId, body) {
  return updateRoute(env, routeId, body);
}
__name(updateRouteService, "updateRouteService");
async function deleteRouteService(env, routeId) {
  return deleteRoute(env, routeId);
}
__name(deleteRouteService, "deleteRouteService");

// src/repositories/waiting.ts
async function listWaiting(env, routeId) {
  if (!usingSupabase(env)) {
    return routeId ? sampleWaiting.filter((point) => point.route_id === routeId) : sampleWaiting;
  }
  const query = routeId ? `active_waiting_passengers?select=*&route_id=eq.${routeId}` : "active_waiting_passengers?select=*";
  const rows = await supabaseFetch(env, query);
  return rows.map((row) => ({ ...row, waiting_count: row.waiting_count ?? 1 }));
}
__name(listWaiting, "listWaiting");
async function getWaitingById(env, waitingId) {
  if (!usingSupabase(env)) return sampleWaiting.find((point) => point.id === waitingId) ?? null;
  const rows = await supabaseFetch(env, `passenger_waiting?select=*&id=eq.${waitingId}&limit=1`);
  return rows[0] ?? null;
}
__name(getWaitingById, "getWaitingById");
async function getWaitingSummary(env, routeId) {
  const waiting = await listWaiting(env, routeId);
  return {
    total_points: waiting.length,
    total_waiting_count: waiting.reduce((sum, item) => sum + (item.waiting_count ?? 1), 0),
    route_id: routeId ?? null
  };
}
__name(getWaitingSummary, "getWaitingSummary");
async function createWaiting(env, body) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      route_id: body.routeId,
      lat: body.lat,
      lng: body.lng,
      user_id: body.userId ?? null,
      status: "waiting",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const created = await supabaseFetch(env, "passenger_waiting", {
    method: "POST",
    body: JSON.stringify([{
      route_id: body.routeId,
      lat: body.lat,
      lng: body.lng,
      user_id: body.userId ?? null,
      status: "waiting"
    }])
  });
  return created[0];
}
__name(createWaiting, "createWaiting");
async function cancelWaiting(env, waitingId) {
  if (!usingSupabase(env)) {
    return { id: waitingId, status: "cancelled" };
  }
  const updated = await supabaseFetch(env, `passenger_waiting?id=eq.${waitingId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "cancelled" })
  });
  return updated[0] ?? { id: waitingId, status: "cancelled" };
}
__name(cancelWaiting, "cancelWaiting");
async function markWaitingPickedUp(env, waitingId) {
  if (!usingSupabase(env)) {
    return { id: waitingId, status: "picked_up" };
  }
  const updated = await supabaseFetch(env, `passenger_waiting?id=eq.${waitingId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "picked_up" })
  });
  return updated[0] ?? { id: waitingId, status: "picked_up" };
}
__name(markWaitingPickedUp, "markWaitingPickedUp");

// src/services/waiting.service.ts
async function listWaitingService(env, routeId) {
  return listWaiting(env, routeId);
}
__name(listWaitingService, "listWaitingService");
async function getWaitingByIdService(env, waitingId) {
  return getWaitingById(env, waitingId);
}
__name(getWaitingByIdService, "getWaitingByIdService");
async function getWaitingSummaryService(env, routeId) {
  return getWaitingSummary(env, routeId);
}
__name(getWaitingSummaryService, "getWaitingSummaryService");
async function createWaitingService(env, body) {
  return createWaiting(env, body);
}
__name(createWaitingService, "createWaitingService");
async function cancelWaitingService(env, waitingId) {
  return cancelWaiting(env, waitingId);
}
__name(cancelWaitingService, "cancelWaitingService");
async function markWaitingPickedUpService(env, waitingId) {
  return markWaitingPickedUp(env, waitingId);
}
__name(markWaitingPickedUpService, "markWaitingPickedUpService");

// src/repositories/drivers.ts
var mockDrivers = [
  {
    id: "driver-001",
    user_id: "user-driver-001",
    employee_code: "DRV001",
    license_no: "LIC-001",
    assigned_bus_id: "bus-001",
    assigned_route_id: "route-r1",
    status: "active"
  }
];
async function listDrivers(env) {
  if (!usingSupabase(env)) return mockDrivers;
  return supabaseFetch(env, "drivers?select=*&order=created_at.desc");
}
__name(listDrivers, "listDrivers");
async function findDriverByUserId(env, userId) {
  if (!usingSupabase(env)) return mockDrivers.find((driver) => driver.user_id === userId) ?? null;
  const rows = await supabaseFetch(env, `drivers?select=*&user_id=eq.${userId}&limit=1`);
  return rows[0] ?? null;
}
__name(findDriverByUserId, "findDriverByUserId");
async function createDriver(env, body) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      user_id: body.userId,
      employee_code: body.employeeCode ?? null,
      license_no: body.licenseNo ?? null,
      assigned_bus_id: body.assignedBusId ?? null,
      assigned_route_id: body.assignedRouteId ?? null,
      status: body.status ?? "active"
    };
  }
  const created = await supabaseFetch(env, "drivers", {
    method: "POST",
    body: JSON.stringify([{
      user_id: body.userId,
      employee_code: body.employeeCode ?? null,
      license_no: body.licenseNo ?? null,
      assigned_bus_id: body.assignedBusId ?? null,
      assigned_route_id: body.assignedRouteId ?? null,
      status: body.status ?? "active"
    }])
  });
  return created[0];
}
__name(createDriver, "createDriver");
async function updateDriver(env, driverId, body) {
  if (!usingSupabase(env)) return { id: driverId, ...body };
  const updated = await supabaseFetch(env, `drivers?id=eq.${driverId}`, {
    method: "PATCH",
    body: JSON.stringify({
      user_id: body.userId,
      employee_code: body.employeeCode,
      license_no: body.licenseNo,
      assigned_bus_id: body.assignedBusId,
      assigned_route_id: body.assignedRouteId,
      status: body.status
    })
  });
  return updated[0];
}
__name(updateDriver, "updateDriver");

// src/services/drivers.service.ts
async function listDriversService(env) {
  return listDrivers(env);
}
__name(listDriversService, "listDriversService");
async function getDriverByUserIdService(env, userId) {
  return findDriverByUserId(env, userId);
}
__name(getDriverByUserIdService, "getDriverByUserIdService");
async function createDriverService(env, body) {
  return createDriver(env, body);
}
__name(createDriverService, "createDriverService");
async function updateDriverService(env, driverId, body) {
  return updateDriver(env, driverId, body);
}
__name(updateDriverService, "updateDriverService");

// src/services/users.service.ts
async function listUsersService(env) {
  return listUsers(env);
}
__name(listUsersService, "listUsersService");
async function createUserService(env, body) {
  return createUser(env, body);
}
__name(createUserService, "createUserService");
async function updateUserService(env, userId, body) {
  return updateUser(env, userId, body);
}
__name(updateUserService, "updateUserService");

// src/lib/validate.ts
function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, error: `${field} is required` };
  }
  return { ok: true, data: value.trim() };
}
__name(requiredString, "requiredString");
function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
__name(optionalString, "optionalString");
function requiredNumber(value, field) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return { ok: false, error: `${field} must be a valid number` };
  }
  return { ok: true, data: value };
}
__name(requiredNumber, "requiredNumber");
function oneOf(value, field, allowed) {
  if (typeof value !== "string" || !allowed.includes(value)) {
    return { ok: false, error: `${field} must be one of: ${allowed.join(", ")}` };
  }
  return { ok: true, data: value };
}
__name(oneOf, "oneOf");

// src/schemas/bus.schema.ts
function validateCreateBusBody(body) {
  const plateNumber = requiredString(body?.plateNumber, "plateNumber");
  if (!plateNumber.ok) return plateNumber;
  return {
    ok: true,
    data: {
      plateNumber: plateNumber.data,
      routeId: optionalString(body?.routeId),
      driverId: optionalString(body?.driverId),
      status: optionalString(body?.status)
    }
  };
}
__name(validateCreateBusBody, "validateCreateBusBody");

// src/schemas/route.schema.ts
function validateCreateRouteBody(body) {
  const routeName = requiredString(body?.routeName, "routeName");
  if (!routeName.ok) return routeName;
  return {
    ok: true,
    data: {
      routeCode: optionalString(body?.routeCode),
      routeName: routeName.data,
      startLocation: optionalString(body?.startLocation),
      endLocation: optionalString(body?.endLocation),
      routePolyline: optionalString(body?.routePolyline),
      status: optionalString(body?.status)
    }
  };
}
__name(validateCreateRouteBody, "validateCreateRouteBody");

// src/handlers/admin.ts
async function handleAdminLogin(env, request) {
  const body = await readJson(request);
  if (!body?.username || !body.password) return badRequest("username and password are required");
  return json({ message: "Admin login success", data: await adminLoginService(env, body.username, body.password) });
}
__name(handleAdminLogin, "handleAdminLogin");
async function handleAdminDashboardSummary(env) {
  const [routes, buses, drivers, users] = await Promise.all([
    listRoutesService(env),
    listAdminBusesService(env),
    listDriversService(env),
    listUsersService(env)
  ]);
  return json({
    data: {
      total_routes: routes.length,
      total_buses: buses.length,
      total_drivers: drivers.length,
      total_users: users.length,
      active_buses: buses.filter((bus) => bus.status === "on").length
    }
  });
}
__name(handleAdminDashboardSummary, "handleAdminDashboardSummary");
async function handleAdminListRoutes(env) {
  return json({ data: await listRoutesService(env) });
}
__name(handleAdminListRoutes, "handleAdminListRoutes");
async function handleAdminGetRouteById(env, routeId) {
  if (!routeId) return badRequest("routeId is required");
  return json({ data: await getRouteByIdService(env, routeId) });
}
__name(handleAdminGetRouteById, "handleAdminGetRouteById");
async function handleAdminCreateRoute(env, request) {
  const body = await readJson(request);
  const validated = validateCreateRouteBody(body);
  if (!validated.ok) return badRequest(validated.error);
  return json({ message: "Route created", data: await createRouteService(env, validated.data) }, 201);
}
__name(handleAdminCreateRoute, "handleAdminCreateRoute");
async function handleAdminUpdateRoute(env, request, routeId) {
  const body = await readJson(request);
  if (!routeId) return badRequest("routeId is required");
  return json({ message: "Route updated", data: await updateRouteService(env, routeId, body ?? {}) });
}
__name(handleAdminUpdateRoute, "handleAdminUpdateRoute");
async function handleAdminDeleteRoute(env, routeId) {
  if (!routeId) return badRequest("routeId is required");
  return json({ message: "Route deleted", data: await deleteRouteService(env, routeId) });
}
__name(handleAdminDeleteRoute, "handleAdminDeleteRoute");
async function handleAdminRouteBuses(env, routeId) {
  if (!routeId) return badRequest("routeId is required");
  return json({ data: await listBusesByRouteService(env, routeId) });
}
__name(handleAdminRouteBuses, "handleAdminRouteBuses");
async function handleAdminRouteWaitingSummary(env, routeId) {
  if (!routeId) return badRequest("routeId is required");
  return json({ data: await getWaitingSummaryService(env, routeId) });
}
__name(handleAdminRouteWaitingSummary, "handleAdminRouteWaitingSummary");
async function handleAdminListBuses(env) {
  return json({ data: await listAdminBusesService(env) });
}
__name(handleAdminListBuses, "handleAdminListBuses");
async function handleAdminGetBusById(env, busId) {
  if (!busId) return badRequest("busId is required");
  return json({ data: await getBusByIdService(env, busId) });
}
__name(handleAdminGetBusById, "handleAdminGetBusById");
async function handleAdminCreateBus(env, request) {
  const body = await readJson(request);
  const validated = validateCreateBusBody(body);
  if (!validated.ok) return badRequest(validated.error);
  return json({ message: "Bus created", data: await createBusService(env, validated.data) }, 201);
}
__name(handleAdminCreateBus, "handleAdminCreateBus");
async function handleAdminUpdateBus(env, request, busId) {
  const body = await readJson(request);
  if (!busId) return badRequest("busId is required");
  return json({ message: "Bus updated", data: await updateBusService(env, busId, body ?? {}) });
}
__name(handleAdminUpdateBus, "handleAdminUpdateBus");
async function handleAdminDeleteBus(env, busId) {
  if (!busId) return badRequest("busId is required");
  return json({ message: "Bus deleted", data: await deleteBusService(env, busId) });
}
__name(handleAdminDeleteBus, "handleAdminDeleteBus");
async function handleAdminWaiting(env, request) {
  const routeId = new URL(request.url).searchParams.get("routeId");
  return json({ data: await listWaitingService(env, routeId) });
}
__name(handleAdminWaiting, "handleAdminWaiting");
async function handleAdminWaitingSummary(env, request) {
  const routeId = new URL(request.url).searchParams.get("routeId");
  return json({ data: await getWaitingSummaryService(env, routeId) });
}
__name(handleAdminWaitingSummary, "handleAdminWaitingSummary");

// src/repositories/admins.ts
var mockAdmins = [
  {
    id: "admin-001",
    user_id: "user-admin-super",
    admin_type: "super_admin",
    status: "active"
  },
  {
    id: "admin-002",
    user_id: "user-admin-route",
    admin_type: "route_admin",
    status: "active"
  }
];
async function listAdmins(env) {
  if (!usingSupabase(env)) return mockAdmins;
  return supabaseFetch(env, "admins?select=*&order=created_at.desc");
}
__name(listAdmins, "listAdmins");
async function findAdminByUserId(env, userId) {
  if (!usingSupabase(env)) return mockAdmins.find((admin) => admin.user_id === userId) ?? null;
  const rows = await supabaseFetch(env, `admins?select=*&user_id=eq.${userId}&limit=1`);
  return rows[0] ?? null;
}
__name(findAdminByUserId, "findAdminByUserId");
async function createAdmin(env, body) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      user_id: body.userId,
      admin_type: body.adminType,
      status: body.status ?? "active"
    };
  }
  const created = await supabaseFetch(env, "admins", {
    method: "POST",
    body: JSON.stringify([{
      user_id: body.userId,
      admin_type: body.adminType,
      status: body.status ?? "active"
    }])
  });
  return created[0];
}
__name(createAdmin, "createAdmin");
async function updateAdmin(env, adminId, body) {
  if (!usingSupabase(env)) return { id: adminId, ...body };
  const updated = await supabaseFetch(env, `admins?id=eq.${adminId}`, {
    method: "PATCH",
    body: JSON.stringify({
      user_id: body.userId,
      admin_type: body.adminType,
      status: body.status
    })
  });
  return updated[0];
}
__name(updateAdmin, "updateAdmin");

// src/services/admins.service.ts
async function listAdminsService(env) {
  return listAdmins(env);
}
__name(listAdminsService, "listAdminsService");
async function createAdminService(env, body) {
  return createAdmin(env, body);
}
__name(createAdminService, "createAdminService");
async function updateAdminService(env, adminId, body) {
  return updateAdmin(env, adminId, body);
}
__name(updateAdminService, "updateAdminService");

// src/repositories/route-admins.ts
var mockRouteAdmins = [
  {
    id: "route-admin-001",
    route_id: "route-r1",
    admin_id: "admin-002"
  }
];
async function listRouteAdmins(env) {
  if (!usingSupabase(env)) return mockRouteAdmins;
  return supabaseFetch(env, "route_admins?select=*&order=created_at.desc");
}
__name(listRouteAdmins, "listRouteAdmins");
async function listRouteIdsForAdmin(env, adminId) {
  if (!usingSupabase(env)) {
    return mockRouteAdmins.filter((item) => item.admin_id === adminId).map((item) => item.route_id);
  }
  const rows = await supabaseFetch(env, `route_admins?select=route_id&admin_id=eq.${adminId}`);
  return rows.map((row) => row.route_id);
}
__name(listRouteIdsForAdmin, "listRouteIdsForAdmin");
async function createRouteAdmin(env, body) {
  if (!usingSupabase(env)) {
    return {
      id: crypto.randomUUID(),
      route_id: body.routeId,
      admin_id: body.adminId
    };
  }
  const created = await supabaseFetch(env, "route_admins", {
    method: "POST",
    body: JSON.stringify([{
      route_id: body.routeId,
      admin_id: body.adminId
    }])
  });
  return created[0];
}
__name(createRouteAdmin, "createRouteAdmin");
async function deleteRouteAdmin(env, assignmentId) {
  if (!usingSupabase(env)) return { id: assignmentId, deleted: true };
  await supabaseFetch(env, `route_admins?id=eq.${assignmentId}`, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal"
    }
  });
  return { id: assignmentId, deleted: true };
}
__name(deleteRouteAdmin, "deleteRouteAdmin");

// src/services/route-admins.service.ts
async function listRouteAdminsService(env) {
  return listRouteAdmins(env);
}
__name(listRouteAdminsService, "listRouteAdminsService");
async function createRouteAdminService(env, body) {
  return createRouteAdmin(env, body);
}
__name(createRouteAdminService, "createRouteAdminService");
async function deleteRouteAdminService(env, assignmentId) {
  return deleteRouteAdmin(env, assignmentId);
}
__name(deleteRouteAdminService, "deleteRouteAdminService");

// src/handlers/admin-users.ts
async function handleAdminListUsers(env) {
  return json({ data: await listUsersService(env) });
}
__name(handleAdminListUsers, "handleAdminListUsers");
async function handleAdminCreateUser(env, request) {
  const body = await readJson(request);
  if (!body?.role) return badRequest("role is required");
  return json({ message: "User created", data: await createUserService(env, body) }, 201);
}
__name(handleAdminCreateUser, "handleAdminCreateUser");
async function handleAdminUpdateUser(env, request, userId) {
  const body = await readJson(request);
  if (!userId) return badRequest("userId is required");
  return json({ message: "User updated", data: await updateUserService(env, userId, body ?? {}) });
}
__name(handleAdminUpdateUser, "handleAdminUpdateUser");
async function handleAdminListDrivers(env) {
  return json({ data: await listDriversService(env) });
}
__name(handleAdminListDrivers, "handleAdminListDrivers");
async function handleAdminCreateDriver(env, request) {
  const body = await readJson(request);
  if (!body?.userId) return badRequest("userId is required");
  return json({ message: "Driver created", data: await createDriverService(env, body) }, 201);
}
__name(handleAdminCreateDriver, "handleAdminCreateDriver");
async function handleAdminUpdateDriver(env, request, driverId) {
  const body = await readJson(request);
  if (!driverId) return badRequest("driverId is required");
  return json({ message: "Driver updated", data: await updateDriverService(env, driverId, body ?? {}) });
}
__name(handleAdminUpdateDriver, "handleAdminUpdateDriver");
async function handleAdminListAdmins(env) {
  return json({ data: await listAdminsService(env) });
}
__name(handleAdminListAdmins, "handleAdminListAdmins");
async function handleAdminCreateAdmin(env, request) {
  const body = await readJson(request);
  if (!body?.userId || !body.adminType) return badRequest("userId and adminType are required");
  return json({ message: "Admin created", data: await createAdminService(env, body) }, 201);
}
__name(handleAdminCreateAdmin, "handleAdminCreateAdmin");
async function handleAdminUpdateAdmin(env, request, adminId) {
  const body = await readJson(request);
  if (!adminId) return badRequest("adminId is required");
  return json({ message: "Admin updated", data: await updateAdminService(env, adminId, body ?? {}) });
}
__name(handleAdminUpdateAdmin, "handleAdminUpdateAdmin");
async function handleAdminListRouteAdmins(env) {
  return json({ data: await listRouteAdminsService(env) });
}
__name(handleAdminListRouteAdmins, "handleAdminListRouteAdmins");
async function handleAdminCreateRouteAdmin(env, request) {
  const body = await readJson(request);
  if (!body?.routeId || !body.adminId) return badRequest("routeId and adminId are required");
  return json({ message: "Route admin assigned", data: await createRouteAdminService(env, body) }, 201);
}
__name(handleAdminCreateRouteAdmin, "handleAdminCreateRouteAdmin");
async function handleAdminDeleteRouteAdmin(env, assignmentId) {
  if (!assignmentId) return badRequest("assignmentId is required");
  return json({ message: "Route admin assignment deleted", data: await deleteRouteAdminService(env, assignmentId) });
}
__name(handleAdminDeleteRouteAdmin, "handleAdminDeleteRouteAdmin");

// src/lib/auth.ts
function parseBearerToken(request) {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}
__name(parseBearerToken, "parseBearerToken");
function decodeMockToken(token) {
  if (token.startsWith("mock-driver-token:")) {
    const [, userId = "driver-user-001"] = token.split(":");
    return {
      token,
      role: "driver",
      userId,
      provider: "phone"
    };
  }
  if (token.startsWith("mock-admin-token:")) {
    const [, adminType = "route_admin", adminId = "admin-002", userId = "user-admin-route", routeIdsRaw = ""] = token.split(":");
    return {
      token,
      role: "admin",
      userId,
      provider: "email",
      adminType,
      adminId,
      routeIds: routeIdsRaw ? routeIdsRaw.split(",").filter(Boolean) : []
    };
  }
  if (token.startsWith("mock-passenger-token:")) {
    const [, userId = "passenger-user-001"] = token.split(":");
    return {
      token,
      role: "passenger",
      userId,
      provider: "google"
    };
  }
  return null;
}
__name(decodeMockToken, "decodeMockToken");
function hasRequiredRole(auth, allowedRoles) {
  return allowedRoles.includes(auth.role);
}
__name(hasRequiredRole, "hasRequiredRole");

// src/middleware/auth.middleware.ts
function requireAuth(request) {
  const token = parseBearerToken(request);
  if (!token) {
    return json({ error: "Unauthorized: missing bearer token" }, 401);
  }
  const auth = decodeMockToken(token);
  if (!auth) {
    return json({ error: "Unauthorized: invalid token" }, 401);
  }
  return auth;
}
__name(requireAuth, "requireAuth");
function requireRole(request, allowedRoles) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;
  if (!hasRequiredRole(auth, allowedRoles)) {
    return json({ error: "Forbidden: insufficient role" }, 403);
  }
  return auth;
}
__name(requireRole, "requireRole");
async function enrichAdminScope(env, auth) {
  if (auth.role !== "admin") return auth;
  if (auth.adminType && auth.routeIds) return auth;
  const admin = await findAdminByUserId(env, auth.userId);
  if (!admin) return auth;
  const routeIds = admin.admin_type === "route_admin" ? await listRouteIdsForAdmin(env, admin.id) : [];
  return {
    ...auth,
    adminId: admin.id,
    adminType: admin.admin_type,
    routeIds
  };
}
__name(enrichAdminScope, "enrichAdminScope");
async function requireAdminScope(env, request, routeId) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof Response) return auth;
  const enriched = await enrichAdminScope(env, auth);
  if (enriched.adminType === "super_admin") return enriched;
  if (enriched.adminType === "route_admin") {
    if (!routeId) {
      return json({ error: "Forbidden: routeId is required for route admin scope check" }, 403);
    }
    if (!enriched.routeIds?.includes(routeId)) {
      return json({ error: "Forbidden: route admin cannot access this route" }, 403);
    }
  }
  return enriched;
}
__name(requireAdminScope, "requireAdminScope");

// src/router/admin.ts
function getIdFromPath(pathname, prefix) {
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).split("/")[0] || null;
}
__name(getIdFromPath, "getIdFromPath");
function routeIdFromRequest(request) {
  const url = new URL(request.url);
  return url.searchParams.get("routeId") || request.headers.get("x-route-id");
}
__name(routeIdFromRequest, "routeIdFromRequest");
async function adminRouter(request, env) {
  const { pathname } = new URL(request.url);
  if (pathname === "/auth/admin/login" && request.method === "POST") return handleAdminLogin(env, request);
  if (pathname === "/admin/users" || pathname.startsWith("/admin/users/") || pathname === "/admin/admins" || pathname.startsWith("/admin/admins/") || pathname === "/admin/route-admins" || pathname.startsWith("/admin/route-admins/")) {
    const auth = requireRole(request, ["admin"]);
    if (auth instanceof Response) return auth;
    if (auth.adminType === "route_admin") {
      return json({ error: "Forbidden: route admin cannot manage global identity resources" }, 403);
    }
  }
  if (pathname === "/admin/summary" || pathname === "/admin/drivers" || pathname.startsWith("/admin/drivers/") || pathname === "/admin/routes" || pathname.startsWith("/admin/routes/") || pathname === "/admin/buses" || pathname.startsWith("/admin/buses/") || pathname === "/admin/waiting" || pathname === "/admin/waiting-summary") {
    const scoped = await requireAdminScope(env, request, routeIdFromRequest(request));
    if (scoped instanceof Response) return scoped;
  }
  if (pathname === "/admin/summary" && request.method === "GET") return handleAdminDashboardSummary(env);
  if (pathname === "/admin/users" && request.method === "GET") return handleAdminListUsers(env);
  if (pathname === "/admin/users" && request.method === "POST") return handleAdminCreateUser(env, request);
  if (pathname.startsWith("/admin/users/") && request.method === "PUT") {
    const userId = getIdFromPath(pathname, "/admin/users/");
    return handleAdminUpdateUser(env, request, userId ?? "");
  }
  if (pathname === "/admin/drivers" && request.method === "GET") return handleAdminListDrivers(env);
  if (pathname === "/admin/drivers" && request.method === "POST") return handleAdminCreateDriver(env, request);
  if (pathname.startsWith("/admin/drivers/") && request.method === "PUT") {
    const driverId = getIdFromPath(pathname, "/admin/drivers/");
    return handleAdminUpdateDriver(env, request, driverId ?? "");
  }
  if (pathname === "/admin/admins" && request.method === "GET") return handleAdminListAdmins(env);
  if (pathname === "/admin/admins" && request.method === "POST") return handleAdminCreateAdmin(env, request);
  if (pathname.startsWith("/admin/admins/") && request.method === "PUT") {
    const adminId = getIdFromPath(pathname, "/admin/admins/");
    return handleAdminUpdateAdmin(env, request, adminId ?? "");
  }
  if (pathname === "/admin/route-admins" && request.method === "GET") return handleAdminListRouteAdmins(env);
  if (pathname === "/admin/route-admins" && request.method === "POST") return handleAdminCreateRouteAdmin(env, request);
  if (pathname.startsWith("/admin/route-admins/") && request.method === "DELETE") {
    const assignmentId = getIdFromPath(pathname, "/admin/route-admins/");
    return handleAdminDeleteRouteAdmin(env, assignmentId ?? "");
  }
  if (pathname === "/admin/routes" && request.method === "GET") return handleAdminListRoutes(env);
  if (pathname === "/admin/routes" && request.method === "POST") return handleAdminCreateRoute(env, request);
  if (pathname.startsWith("/admin/routes/") && pathname.endsWith("/buses") && request.method === "GET") {
    const routeId = pathname.split("/")[3];
    return handleAdminRouteBuses(env, routeId ?? "");
  }
  if (pathname.startsWith("/admin/routes/") && pathname.endsWith("/waiting-summary") && request.method === "GET") {
    const routeId = pathname.split("/")[3];
    return handleAdminRouteWaitingSummary(env, routeId ?? "");
  }
  if (pathname.startsWith("/admin/routes/") && request.method === "GET") {
    const routeId = getIdFromPath(pathname, "/admin/routes/");
    return handleAdminGetRouteById(env, routeId ?? "");
  }
  if (pathname.startsWith("/admin/routes/") && request.method === "PUT") {
    const routeId = getIdFromPath(pathname, "/admin/routes/");
    return handleAdminUpdateRoute(env, request, routeId ?? routeIdFromRequest(request) ?? "");
  }
  if (pathname.startsWith("/admin/routes/") && request.method === "DELETE") {
    const routeId = getIdFromPath(pathname, "/admin/routes/");
    return handleAdminDeleteRoute(env, routeId ?? "");
  }
  if (pathname === "/admin/buses" && request.method === "GET") return handleAdminListBuses(env);
  if (pathname === "/admin/buses" && request.method === "POST") return handleAdminCreateBus(env, request);
  if (pathname.startsWith("/admin/buses/") && request.method === "GET") {
    const busId = getIdFromPath(pathname, "/admin/buses/");
    return handleAdminGetBusById(env, busId ?? "");
  }
  if (pathname.startsWith("/admin/buses/") && request.method === "PUT") {
    const busId = getIdFromPath(pathname, "/admin/buses/");
    return handleAdminUpdateBus(env, request, busId ?? "");
  }
  if (pathname.startsWith("/admin/buses/") && request.method === "DELETE") {
    const busId = getIdFromPath(pathname, "/admin/buses/");
    return handleAdminDeleteBus(env, busId ?? "");
  }
  if (pathname === "/admin/waiting" && request.method === "GET") return handleAdminWaiting(env, request);
  if (pathname === "/admin/waiting-summary" && request.method === "GET") return handleAdminWaitingSummary(env, request);
  return notFound();
}
__name(adminRouter, "adminRouter");

// src/schemas/driver.schema.ts
function validateDriverDutyBody(body) {
  const busId = requiredString(body?.busId, "busId");
  if (!busId.ok) return busId;
  const status = oneOf(body?.status, "status", ["on", "off"]);
  if (!status.ok) return status;
  return { ok: true, data: { busId: busId.data, status: status.data } };
}
__name(validateDriverDutyBody, "validateDriverDutyBody");
function validateLocationBody(body) {
  const busId = requiredString(body?.busId, "busId");
  if (!busId.ok) return busId;
  const lat = requiredNumber(body?.lat, "lat");
  if (!lat.ok) return lat;
  const lng = requiredNumber(body?.lng, "lng");
  if (!lng.ok) return lng;
  return {
    ok: true,
    data: {
      busId: busId.data,
      lat: lat.data,
      lng: lng.data,
      speed: typeof body?.speed === "number" ? body.speed : void 0
    }
  };
}
__name(validateLocationBody, "validateLocationBody");

// src/handlers/driver.ts
async function handleDriverLogin(env, request) {
  const body = await readJson(request);
  if (!body?.phone || !body.password) return badRequest("phone and password are required");
  return json({ message: "Driver login success", data: await driverLoginService(env, body.phone, body.password) });
}
__name(handleDriverLogin, "handleDriverLogin");
async function handleDriverDuty(env, request) {
  const body = await readJson(request);
  const validated = validateDriverDutyBody(body);
  if (!validated.ok) return badRequest(validated.error);
  return json({ message: "Driver duty status updated", data: await updateDriverDutyService(env, validated.data) });
}
__name(handleDriverDuty, "handleDriverDuty");
async function handleDriverLocation(env, request) {
  const body = await readJson(request);
  const validated = validateLocationBody(body);
  if (!validated.ok) return badRequest(validated.error);
  return json({ message: "Bus location update accepted", data: await createBusLocationService(env, validated.data) }, 201);
}
__name(handleDriverLocation, "handleDriverLocation");
async function handleDriverWaiting(env, request) {
  const routeId = new URL(request.url).searchParams.get("routeId");
  return json({ data: await listWaitingService(env, routeId) });
}
__name(handleDriverWaiting, "handleDriverWaiting");
async function handleDriverWaitingSummary(env, request) {
  const routeId = new URL(request.url).searchParams.get("routeId");
  return json({ data: await getWaitingSummaryService(env, routeId) });
}
__name(handleDriverWaitingSummary, "handleDriverWaitingSummary");
async function handleDriverProfile(env, request, userId) {
  const driver = await getDriverByUserIdService(env, userId);
  if (!driver) return json({ data: null }, 404);
  const assignedBus = driver.assigned_bus_id ? await getBusByIdService(env, driver.assigned_bus_id) : null;
  return json({ data: { ...driver, assigned_bus: assignedBus } });
}
__name(handleDriverProfile, "handleDriverProfile");
async function handleDriverPickupWaiting(env, waitingId) {
  if (!waitingId) return badRequest("waitingId is required");
  return json({ message: "Waiting marked as picked up", data: await markWaitingPickedUpService(env, waitingId) });
}
__name(handleDriverPickupWaiting, "handleDriverPickupWaiting");

// src/router/driver.ts
function getIdFromPath2(pathname, prefix) {
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).split("/")[0] || null;
}
__name(getIdFromPath2, "getIdFromPath");
async function driverRouter(request, env) {
  const { pathname } = new URL(request.url);
  if (pathname === "/auth/driver/login" && request.method === "POST") return handleDriverLogin(env, request);
  if (pathname === "/drivers/duty" || pathname === "/locations" || pathname === "/driver/waiting" || pathname === "/driver/waiting-summary" || pathname === "/driver/me" || pathname.startsWith("/driver/waiting/")) {
    const auth = requireRole(request, ["driver", "admin"]);
    if (auth instanceof Response) return auth;
    if (pathname === "/driver/me" && request.method === "GET") {
      return handleDriverProfile(env, request, auth.userId);
    }
  }
  if (pathname === "/drivers/duty" && request.method === "POST") return handleDriverDuty(env, request);
  if (pathname === "/locations" && request.method === "POST") return handleDriverLocation(env, request);
  if (pathname === "/driver/waiting" && request.method === "GET") return handleDriverWaiting(env, request);
  if (pathname === "/driver/waiting-summary" && request.method === "GET") return handleDriverWaitingSummary(env, request);
  if (pathname.startsWith("/driver/waiting/") && pathname.endsWith("/pickup") && request.method === "POST") {
    const waitingId = getIdFromPath2(pathname, "/driver/waiting/");
    return handleDriverPickupWaiting(env, waitingId ?? "");
  }
  return notFound();
}
__name(driverRouter, "driverRouter");

// src/schemas/auth.schema.ts
function validateRegisterBody(body) {
  const email = requiredString(body?.email, "email");
  if (!email.ok) return email;
  const password = requiredString(body?.password, "password");
  if (!password.ok) return password;
  return {
    ok: true,
    data: {
      email: email.data,
      password: password.data,
      username: optionalString(body?.username),
      fullName: optionalString(body?.fullName),
      role: typeof body?.role === "string" ? body.role : void 0
    }
  };
}
__name(validateRegisterBody, "validateRegisterBody");
function validateLoginBody(body) {
  const identifier = requiredString(body?.identifier, "identifier");
  if (!identifier.ok) return identifier;
  const password = requiredString(body?.password, "password");
  if (!password.ok) return password;
  const expectedRole = body?.expectedRole ? oneOf(body.expectedRole, "expectedRole", ["passenger", "driver", "admin"]) : null;
  if (expectedRole && !expectedRole.ok) return expectedRole;
  return {
    ok: true,
    data: {
      identifier: identifier.data,
      password: password.data,
      expectedRole: expectedRole?.ok ? expectedRole.data : void 0
    }
  };
}
__name(validateLoginBody, "validateLoginBody");

// src/handlers/auth.ts
async function handleGoogleLogin(env, request) {
  const body = await readJson(request);
  if (!body?.googleIdToken) {
    return badRequest("googleIdToken is required");
  }
  return json({
    message: "Google login success",
    data: await googleLoginService(env, body.googleIdToken, body.email, body.fullName, body.avatarUrl)
  });
}
__name(handleGoogleLogin, "handleGoogleLogin");
async function handleRegister(env, request) {
  const body = await readJson(request);
  const validated = validateRegisterBody(body);
  if (!validated.ok) return badRequest(validated.error);
  return json({
    message: "Register success",
    data: await registerService(env, validated.data.email, validated.data.password, validated.data.username, validated.data.fullName, validated.data.role)
  }, 201);
}
__name(handleRegister, "handleRegister");
async function handlePasswordLogin(env, request) {
  const body = await readJson(request);
  const validated = validateLoginBody(body);
  if (!validated.ok) return badRequest(validated.error);
  return json({
    message: "Login success",
    data: await passwordLoginService(env, validated.data.identifier, validated.data.password, validated.data.expectedRole)
  });
}
__name(handlePasswordLogin, "handlePasswordLogin");
async function handleCurrentUser(env, request) {
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;
  return json({
    message: "Current user resolved",
    data: await currentUserService(env, auth.userId),
    auth
  });
}
__name(handleCurrentUser, "handleCurrentUser");

// src/handlers/health.ts
async function handleHealth(env) {
  return json({
    ok: true,
    service: "worker",
    app: env.APP_NAME,
    mode: usingSupabase(env) ? "supabase" : "mock"
  });
}
__name(handleHealth, "handleHealth");

// src/handlers/passenger.ts
async function handleListRoutes(env) {
  return json({ data: await listRoutesService(env) });
}
__name(handleListRoutes, "handleListRoutes");
async function handleGetRouteById(env, routeId) {
  if (!routeId) return badRequest("routeId is required");
  return json({ data: await getRouteByIdService(env, routeId) });
}
__name(handleGetRouteById, "handleGetRouteById");
async function handleLiveBuses(env, request) {
  const routeId = new URL(request.url).searchParams.get("routeId");
  return json({ data: await listLiveBusesService(env, routeId) });
}
__name(handleLiveBuses, "handleLiveBuses");
async function handleGetBusById(env, busId) {
  if (!busId) return badRequest("busId is required");
  return json({ data: await getBusByIdService(env, busId) });
}
__name(handleGetBusById, "handleGetBusById");
async function handleListWaiting(env, request) {
  const routeId = new URL(request.url).searchParams.get("routeId");
  return json({ data: await listWaitingService(env, routeId) });
}
__name(handleListWaiting, "handleListWaiting");
async function handleGetWaitingById(env, waitingId) {
  if (!waitingId) return badRequest("waitingId is required");
  return json({ data: await getWaitingByIdService(env, waitingId) });
}
__name(handleGetWaitingById, "handleGetWaitingById");
async function handleCreateWaiting(env, request) {
  const body = await readJson(request);
  if (!body?.routeId || body.lat === void 0 || body.lng === void 0) {
    return badRequest("routeId, lat, lng are required");
  }
  return json({ message: "Passenger waiting request accepted", data: await createWaitingService(env, body) }, 201);
}
__name(handleCreateWaiting, "handleCreateWaiting");
async function handleCancelWaiting(env, waitingId) {
  if (!waitingId) return badRequest("waitingId is required");
  return json({ message: "Passenger waiting cancelled", data: await cancelWaitingService(env, waitingId) });
}
__name(handleCancelWaiting, "handleCancelWaiting");

// src/router/public.ts
function getIdFromPath3(pathname, prefix) {
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).split("/")[0] || null;
}
__name(getIdFromPath3, "getIdFromPath");
async function publicRouter(request, env) {
  const { pathname } = new URL(request.url);
  if (pathname === "/health" && request.method === "GET") return handleHealth(env);
  if (pathname === "/auth/register" && request.method === "POST") return handleRegister(env, request);
  if (pathname === "/auth/login" && request.method === "POST") return handlePasswordLogin(env, request);
  if (pathname === "/auth/me" && request.method === "GET") return handleCurrentUser(env, request);
  if (pathname === "/auth/google/login" && request.method === "POST") return handleGoogleLogin(env, request);
  if (pathname === "/routes" && request.method === "GET") return handleListRoutes(env);
  if (pathname.startsWith("/routes/") && request.method === "GET") {
    const routeId = getIdFromPath3(pathname, "/routes/");
    return handleGetRouteById(env, routeId ?? "");
  }
  if (pathname === "/buses/live" && request.method === "GET") return handleLiveBuses(env, request);
  if (pathname.startsWith("/buses/") && request.method === "GET") {
    const busId = getIdFromPath3(pathname, "/buses/");
    return handleGetBusById(env, busId ?? "");
  }
  if (pathname === "/waiting" && request.method === "GET") return handleListWaiting(env, request);
  if (pathname === "/waiting" && request.method === "POST") {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    return handleCreateWaiting(env, request);
  }
  if (pathname.startsWith("/waiting/") && request.method === "GET") {
    const waitingId = getIdFromPath3(pathname, "/waiting/");
    return handleGetWaitingById(env, waitingId ?? "");
  }
  if (pathname.startsWith("/waiting/") && request.method === "DELETE") {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const waitingId = getIdFromPath3(pathname, "/waiting/");
    return handleCancelWaiting(env, waitingId ?? "");
  }
  return notFound();
}
__name(publicRouter, "publicRouter");

// src/router.ts
async function routeRequest(request, env) {
  const { pathname } = new URL(request.url);
  if (pathname === "/") {
    return json({
      app: env.APP_NAME,
      status: "ok",
      mode: usingSupabase(env) ? "supabase" : "mock",
      endpoints: {
        health: "GET /health",
        register: "POST /auth/register",
        login: "POST /auth/login",
        me: "GET /auth/me (Bearer required)",
        googleLogin: "POST /auth/google/login",
        passengerRoutes: "GET /routes",
        passengerRouteById: "GET /routes/:routeId",
        passengerLiveBuses: "GET /buses/live?routeId=...",
        passengerBusById: "GET /buses/:busId",
        passengerWaitingList: "GET /waiting?routeId=...",
        passengerWaitingById: "GET /waiting/:waitingId",
        passengerCreateWaiting: "POST /waiting (Bearer required)",
        passengerCancelWaiting: "DELETE /waiting/:waitingId (Bearer required)",
        driverLogin: "POST /auth/driver/login",
        driverDuty: "POST /drivers/duty (Driver/Admin token)",
        driverLocations: "POST /locations (Driver/Admin token)",
        driverWaiting: "GET /driver/waiting?routeId=... (Driver/Admin token)",
        adminLogin: "POST /auth/admin/login",
        adminUsers: "GET/POST /admin/users (Admin token)",
        adminUserById: "PUT /admin/users/:userId (Admin token)",
        adminDrivers: "GET/POST /admin/drivers (Admin token)",
        adminDriverById: "PUT /admin/drivers/:driverId (Admin token)",
        adminAdmins: "GET/POST /admin/admins (Admin token)",
        adminAdminById: "PUT /admin/admins/:adminId (Admin token)",
        adminRouteAdmins: "GET/POST /admin/route-admins (Admin token)",
        adminRouteAdminById: "DELETE /admin/route-admins/:assignmentId (Admin token)",
        adminRoutes: "GET/POST /admin/routes (Admin token)",
        adminRouteById: "GET/PUT/DELETE /admin/routes/:routeId (Admin token)",
        adminBuses: "GET/POST /admin/buses (Admin token)",
        adminBusById: "GET/PUT/DELETE /admin/buses/:busId (Admin token)",
        adminWaiting: "GET /admin/waiting?routeId=... (Admin token)"
      }
    });
  }
  const response = await publicRouter(request, env);
  if (response.status !== 404) return response;
  const driverResponse = await driverRouter(request, env);
  if (driverResponse.status !== 404) return driverResponse;
  return adminRouter(request, env);
}
__name(routeRequest, "routeRequest");

// src/index.ts
var src_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    try {
      return await routeRequest(request, env);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return json({ error: message }, 500);
    }
  }
};

// ../../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-TVV7ar/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-TVV7ar/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
