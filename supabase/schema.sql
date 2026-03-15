-- BUS TRACKING SYSTEM
-- Supabase PostgreSQL schema starter

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique,
  full_name text,
  role text not null check (role in ('passenger', 'driver', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  license_no text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  admin_type text not null check (admin_type in ('super_admin', 'route_admin')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  route_code text unique,
  route_name text not null,
  start_location text,
  end_location text,
  route_polyline text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists route_admins (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id) on delete cascade,
  admin_id uuid not null references admins(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(route_id, admin_id)
);

create table if not exists buses (
  id uuid primary key default gen_random_uuid(),
  plate_number text not null unique,
  route_id uuid references routes(id) on delete set null,
  driver_id uuid references drivers(id) on delete set null,
  status text not null default 'off' check (status in ('off', 'on', 'maintenance')),
  current_lat double precision,
  current_lng double precision,
  current_speed double precision,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bus_locations (
  id bigserial primary key,
  bus_id uuid not null references buses(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  speed double precision,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_bus_locations_bus_id_recorded_at
on bus_locations(bus_id, recorded_at desc);

create table if not exists passenger_waiting (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  route_id uuid not null references routes(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  status text not null default 'waiting' check (status in ('waiting', 'cancelled', 'picked_up')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_passenger_waiting_route_status
on passenger_waiting(route_id, status);

create or replace view active_buses_live as
select
  b.id,
  b.plate_number,
  b.route_id,
  r.route_name,
  b.driver_id,
  b.status,
  b.current_lat,
  b.current_lng,
  b.current_speed,
  b.last_seen_at
from buses b
left join routes r on r.id = b.route_id
where b.status = 'on';

create or replace view active_waiting_passengers as
select
  pw.id,
  pw.user_id,
  pw.route_id,
  r.route_name,
  pw.lat,
  pw.lng,
  pw.status,
  pw.created_at,
  pw.updated_at
from passenger_waiting pw
left join routes r on r.id = pw.route_id
where pw.status = 'waiting';

drop trigger if exists trg_routes_set_updated_at on routes;
create trigger trg_routes_set_updated_at
before update on routes
for each row execute function set_updated_at();

drop trigger if exists trg_buses_set_updated_at on buses;
create trigger trg_buses_set_updated_at
before update on buses
for each row execute function set_updated_at();

drop trigger if exists trg_passenger_waiting_set_updated_at on passenger_waiting;
create trigger trg_passenger_waiting_set_updated_at
before update on passenger_waiting
for each row execute function set_updated_at();

-- Enable realtime for core tables in Supabase dashboard:
-- buses
-- bus_locations
-- passenger_waiting
-- routes
