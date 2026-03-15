export interface Env {
  APP_NAME: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export type JsonRecord = Record<string, unknown>;

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
