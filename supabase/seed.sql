-- BUS TRACKING SYSTEM online seed data

with inserted_users as (
  insert into users (
    id,
    auth_provider,
    email,
    email_verified,
    username,
    full_name,
    role,
    status
  )
  values
    (gen_random_uuid(), 'email', 'superadmin@example.com', true, 'superadmin', 'Super Admin', 'admin', 'active'),
    (gen_random_uuid(), 'email', 'routeadmin@example.com', true, 'routeadmin', 'Route Admin', 'admin', 'active'),
    (gen_random_uuid(), 'email', 'driver1@example.com', true, 'driver1', 'Driver One', 'driver', 'active'),
    (gen_random_uuid(), 'email', 'passenger1@example.com', true, 'passenger1', 'Passenger One', 'passenger', 'active'),
    (gen_random_uuid(), 'email', 'passenger2@example.com', true, 'passenger2', 'Passenger Two', 'passenger', 'active')
  on conflict (email) do update set full_name = excluded.full_name
  returning id, email, role
),
routes_upsert as (
  insert into routes (id, route_code, route_name, start_location, end_location, status)
  values
    (gen_random_uuid(), 'R1', 'Campus Loop', 'Main Gate', 'Engineering Building', 'active'),
    (gen_random_uuid(), 'R2', 'City Connector', 'Bus Terminal', 'Central Market', 'active')
  on conflict (route_code) do update set route_name = excluded.route_name
  returning id, route_code
),
admin_profiles as (
  insert into admins (id, user_id, admin_type, status)
  select gen_random_uuid(), u.id,
    case when u.email = 'superadmin@example.com' then 'super_admin' else 'route_admin' end,
    'active'
  from users u
  where u.email in ('superadmin@example.com', 'routeadmin@example.com')
  on conflict (user_id) do update set admin_type = excluded.admin_type
  returning id, user_id, admin_type
),
driver_profiles as (
  insert into drivers (id, user_id, employee_code, license_no, status)
  select gen_random_uuid(), u.id, 'DRV001', 'LIC-001', 'active'
  from users u
  where u.email = 'driver1@example.com'
  on conflict (user_id) do update set employee_code = excluded.employee_code
  returning id, user_id
),
route_admin_assign as (
  insert into route_admins (id, route_id, admin_id)
  select gen_random_uuid(), r.id, a.id
  from routes r
  cross join admins a
  join users u on u.id = a.user_id
  where r.route_code = 'R1' and u.email = 'routeadmin@example.com'
  on conflict (route_id, admin_id) do nothing
  returning id
),
buses_upsert as (
  insert into buses (id, plate_number, route_id, driver_id, status, current_lat, current_lng, current_speed, last_seen_at)
  select gen_random_uuid(), '10-1234', r.id, d.id, 'on', 13.7563, 100.5018, 25, now()
  from routes r, drivers d, users u
  where r.route_code = 'R1' and d.user_id = u.id and u.email = 'driver1@example.com'
  on conflict (plate_number) do update set route_id = excluded.route_id, driver_id = excluded.driver_id, status = excluded.status
  returning id, route_id
),
wait_one as (
  insert into passenger_waiting (id, user_id, route_id, lat, lng, status)
  select gen_random_uuid(), u.id, r.id, 13.7512, 100.5031, 'waiting'
  from users u, routes r
  where u.email = 'passenger1@example.com' and r.route_code = 'R1'
  on conflict do nothing
  returning id
),
wait_two as (
  insert into passenger_waiting (id, user_id, route_id, lat, lng, status)
  select gen_random_uuid(), u.id, r.id, 13.7520, 100.5040, 'waiting'
  from users u, routes r
  where u.email = 'passenger2@example.com' and r.route_code = 'R1'
  on conflict do nothing
  returning id
)
select 'seed complete' as status;
