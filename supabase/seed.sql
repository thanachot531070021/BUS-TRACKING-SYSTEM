-- Starter seed for BUS TRACKING SYSTEM local development

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
  (
    gen_random_uuid(),
    'email',
    'superadmin@example.com',
    true,
    'superadmin',
    'Super Admin',
    'admin',
    'active'
  ),
  (
    gen_random_uuid(),
    'email',
    'routeadmin@example.com',
    true,
    'routeadmin',
    'Route Admin',
    'admin',
    'active'
  ),
  (
    gen_random_uuid(),
    'phone',
    'driver@example.com',
    true,
    'driver1',
    'Driver One',
    'driver',
    'active'
  ),
  (
    gen_random_uuid(),
    'guest',
    'passenger@example.com',
    true,
    'passenger1',
    'Passenger One',
    'passenger',
    'active'
  )
on conflict do nothing;
