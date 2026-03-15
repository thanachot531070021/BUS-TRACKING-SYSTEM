export interface Env {
  APP_NAME: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export type JsonRecord = Record<string, unknown>;

export type UserRole = 'passenger' | 'driver' | 'admin';
export type AuthProvider = 'guest' | 'phone' | 'google' | 'email';
export type AdminType = 'super_admin' | 'route_admin';

export type AuthContext = {
  token: string;
  role: UserRole;
  userId: string;
  provider?: AuthProvider;
  adminType?: AdminType;
  adminId?: string;
  routeIds?: string[];
};

export type UserProfile = {
  id: string;
  auth_user_id?: string | null;
  auth_provider: AuthProvider;
  provider_user_id?: string | null;
  email?: string | null;
  email_verified: boolean;
  username?: string | null;
  phone_number?: string | null;
  full_name?: string | null;
  given_name?: string | null;
  family_name?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DriverProfile = {
  id: string;
  user_id: string;
  employee_code?: string | null;
  license_no?: string | null;
  assigned_bus_id?: string | null;
  assigned_route_id?: string | null;
  status: 'active' | 'inactive';
  created_at?: string;
};

export type AdminProfile = {
  id: string;
  user_id: string;
  admin_type: AdminType;
  status: 'active' | 'inactive';
  created_at?: string;
};

export type RouteAdminAssignment = {
  id: string;
  route_id: string;
  admin_id: string;
  created_at?: string;
};

export type RouteSummary = {
  id: string;
  route_code: string;
  route_name: string;
  start_location: string;
  end_location: string;
  route_polyline?: string;
  status: 'active' | 'inactive';
};

export type BusLive = {
  id: string;
  plate_number: string;
  route_id: string;
  route_name: string;
  driver_id: string;
  status: 'on' | 'off' | 'maintenance';
  current_lat: number;
  current_lng: number;
  current_speed: number;
  last_seen_at: string;
};

export type WaitingPoint = {
  id: string;
  route_id: string;
  route_name: string;
  lat: number;
  lng: number;
  waiting_count: number;
  status: 'waiting' | 'cancelled' | 'picked_up';
  created_at: string;
};

export type DriverDutyStatus = 'on' | 'off';

export type CreateWaitingBody = {
  routeId: string;
  lat: number;
  lng: number;
  userId?: string;
};

export type UpdateLocationBody = {
  busId: string;
  lat: number;
  lng: number;
  speed?: number;
};

export type UpdateDriverDutyBody = {
  busId: string;
  status: DriverDutyStatus;
};

export type CreateRouteBody = {
  routeCode?: string;
  routeName: string;
  startLocation?: string;
  endLocation?: string;
  routePolyline?: string;
  status?: 'active' | 'inactive';
};

export type UpdateRouteBody = Partial<CreateRouteBody>;

export type CreateBusBody = {
  plateNumber: string;
  routeId?: string | null;
  driverId?: string | null;
  status?: 'off' | 'on' | 'maintenance';
};

export type UpdateBusBody = Partial<CreateBusBody>;

export type CreateUserBody = {
  authUserId?: string | null;
  authProvider?: AuthProvider;
  providerUserId?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  username?: string | null;
  phoneNumber?: string | null;
  fullName?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  status?: 'active' | 'inactive' | 'suspended';
};

export type UpdateUserBody = Partial<CreateUserBody>;

export type CreateDriverBody = {
  userId: string;
  employeeCode?: string | null;
  licenseNo?: string | null;
  assignedBusId?: string | null;
  assignedRouteId?: string | null;
  status?: 'active' | 'inactive';
};

export type UpdateDriverBody = Partial<CreateDriverBody>;

export type CreateAdminBody = {
  userId: string;
  adminType: AdminType;
  status?: 'active' | 'inactive';
};

export type UpdateAdminBody = Partial<CreateAdminBody>;

export type CreateRouteAdminBody = {
  routeId: string;
  adminId: string;
};
