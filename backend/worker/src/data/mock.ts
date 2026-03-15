import type { BusLive, RouteSummary, WaitingPoint } from '../types';

export const sampleRoutes: RouteSummary[] = [
  {
    id: 'route-r1',
    route_code: 'R1',
    route_name: 'Campus Loop',
    start_location: 'Main Gate',
    end_location: 'Engineering Building',
    route_polyline: '',
    status: 'active',
  },
  {
    id: 'route-r2',
    route_code: 'R2',
    route_name: 'City Connector',
    start_location: 'Bus Terminal',
    end_location: 'Central Market',
    route_polyline: '',
    status: 'active',
  },
];

export const sampleBuses: BusLive[] = [
  {
    id: 'bus-001',
    plate_number: '10-1234',
    route_id: 'route-r1',
    route_name: 'Campus Loop',
    driver_id: 'driver-001',
    status: 'on',
    current_lat: 13.7563,
    current_lng: 100.5018,
    current_speed: 32,
    last_seen_at: new Date().toISOString(),
  },
  {
    id: 'bus-002',
    plate_number: '20-5678',
    route_id: 'route-r2',
    route_name: 'City Connector',
    driver_id: 'driver-002',
    status: 'on',
    current_lat: 13.7465,
    current_lng: 100.5346,
    current_speed: 18,
    last_seen_at: new Date().toISOString(),
  },
];

export const sampleWaiting: WaitingPoint[] = [
  {
    id: 'wait-001',
    route_id: 'route-r1',
    route_name: 'Campus Loop',
    lat: 13.7512,
    lng: 100.5031,
    waiting_count: 3,
    status: 'waiting',
    created_at: new Date().toISOString(),
  },
];
