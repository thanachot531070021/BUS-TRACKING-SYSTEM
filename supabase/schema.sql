-- =============================================
-- BUS TRACKING SYSTEM — Complete Database Schema
-- Run this in Supabase SQL Editor (new project)
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE user_role        AS ENUM ('passenger', 'driver', 'admin');
CREATE TYPE auth_provider    AS ENUM ('guest', 'phone', 'google', 'facebook', 'email');
CREATE TYPE admin_type       AS ENUM ('super_admin', 'zone_admin', 'route_admin');
CREATE TYPE user_status      AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE zone_status      AS ENUM ('active', 'inactive');
CREATE TYPE route_status     AS ENUM ('active', 'inactive');
CREATE TYPE bus_status       AS ENUM ('on', 'off', 'maintenance');
CREATE TYPE driver_status    AS ENUM ('active', 'inactive');
CREATE TYPE admin_status     AS ENUM ('active', 'inactive');
CREATE TYPE waiting_status   AS ENUM ('waiting', 'cancelled', 'picked_up');
CREATE TYPE analytics_source AS ENUM ('web_admin', 'mobile_app');
CREATE TYPE license_type     AS ENUM ('public_car', 'public_bus', 'public_motorcycle');

-- =============================================
-- TABLE: zones
-- =============================================
CREATE TABLE zones (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_code   TEXT        UNIQUE,
  zone_name   TEXT        NOT NULL,
  description TEXT,
  status      zone_status NOT NULL DEFAULT 'active',
  created_by  UUID,
  updated_by  UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: users
-- =============================================
CREATE TABLE users (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id     UUID          UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  auth_provider    auth_provider NOT NULL DEFAULT 'guest',
  provider_user_id TEXT,
  email            TEXT          UNIQUE,
  email_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
  username         TEXT          UNIQUE,
  phone_number     TEXT          UNIQUE,
  full_name        TEXT,
  given_name       TEXT,
  family_name      TEXT,
  avatar_url       TEXT,
  role             user_role     NOT NULL DEFAULT 'passenger',
  status           user_status   NOT NULL DEFAULT 'active',
  last_login_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (auth_provider, provider_user_id)
);

-- =============================================
-- TABLE: admins
-- =============================================
CREATE TABLE admins (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_type admin_type   NOT NULL DEFAULT 'zone_admin',
  zone_id    UUID         REFERENCES zones(id) ON DELETE SET NULL,
  avatar_url TEXT,
  status     admin_status NOT NULL DEFAULT 'active',
  created_by UUID         REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: routes
-- =============================================
CREATE TABLE routes (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_code     TEXT         UNIQUE,
  route_name     TEXT         NOT NULL,
  start_location TEXT,
  end_location   TEXT,
  route_polyline TEXT,
  zone_id        UUID         REFERENCES zones(id) ON DELETE SET NULL,
  status         route_status NOT NULL DEFAULT 'active',
  created_by     UUID         REFERENCES users(id) ON DELETE SET NULL,
  updated_by     UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: buses
-- =============================================
CREATE TABLE buses (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_number  TEXT        NOT NULL UNIQUE,
  route_id      UUID        REFERENCES routes(id) ON DELETE SET NULL,
  driver_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  status        bus_status  NOT NULL DEFAULT 'off',
  current_lat   DOUBLE PRECISION,
  current_lng   DOUBLE PRECISION,
  current_speed DOUBLE PRECISION DEFAULT 0,
  last_seen_at  TIMESTAMPTZ,
  created_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
  updated_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: drivers
-- =============================================
CREATE TABLE drivers (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_code       TEXT          UNIQUE,
  license_no          TEXT,
  license_type        license_type,
  license_issue_date  DATE,
  license_expiry_date DATE,
  date_of_birth       DATE,
  address             TEXT,
  photo_url           TEXT,
  assigned_bus_id     UUID          REFERENCES buses(id) ON DELETE SET NULL,
  assigned_route_id   UUID          REFERENCES routes(id) ON DELETE SET NULL,
  status              driver_status NOT NULL DEFAULT 'active',
  created_by          UUID          REFERENCES users(id) ON DELETE SET NULL,
  updated_by          UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: bus_locations  (location history log)
-- =============================================
CREATE TABLE bus_locations (
  id          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  bus_id      UUID            NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  speed       DOUBLE PRECISION DEFAULT 0,
  recorded_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: route_admins  (legacy assignment — kept for backward compat)
-- =============================================
CREATE TABLE route_admins (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id   UUID        NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  admin_id   UUID        NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (route_id, admin_id)
);

-- =============================================
-- TABLE: passenger_waiting
-- =============================================
CREATE TABLE passenger_waiting (
  id         UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id   UUID           NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  user_id    UUID           REFERENCES users(id) ON DELETE SET NULL,
  lat        DOUBLE PRECISION NOT NULL,
  lng        DOUBLE PRECISION NOT NULL,
  status     waiting_status NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- =============================================
-- TABLE: analytics_events
-- =============================================
CREATE TABLE analytics_events (
  id          UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  source      analytics_source NOT NULL,
  event_type  TEXT             NOT NULL,
  user_id     UUID             REFERENCES users(id) ON DELETE SET NULL,
  session_id  TEXT,
  page        TEXT,
  platform    TEXT,
  os          TEXT,
  device_type TEXT,
  user_agent  TEXT,
  ip_hint     TEXT,
  created_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_users_auth_user_id        ON users(auth_user_id);
CREATE INDEX idx_users_role                ON users(role);
CREATE INDEX idx_admins_user_id            ON admins(user_id);
CREATE INDEX idx_admins_zone_id            ON admins(zone_id);
CREATE INDEX idx_routes_zone_id            ON routes(zone_id);
CREATE INDEX idx_drivers_user_id           ON drivers(user_id);
CREATE INDEX idx_drivers_assigned_route_id ON drivers(assigned_route_id);
CREATE INDEX idx_buses_route_id            ON buses(route_id);
CREATE INDEX idx_buses_status              ON buses(status);
CREATE INDEX idx_bus_locations_bus_id      ON bus_locations(bus_id);
CREATE INDEX idx_bus_locations_recorded_at ON bus_locations(recorded_at DESC);
CREATE INDEX idx_waiting_route_id          ON passenger_waiting(route_id);
CREATE INDEX idx_waiting_status            ON passenger_waiting(status);
CREATE INDEX idx_analytics_event_type      ON analytics_events(event_type);
CREATE INDEX idx_analytics_user_id         ON analytics_events(user_id);
CREATE INDEX idx_analytics_created_at      ON analytics_events(created_at DESC);

-- Audit trail indexes
CREATE INDEX idx_zones_created_by   ON zones(created_by);
CREATE INDEX idx_admins_created_by  ON admins(created_by);
CREATE INDEX idx_routes_created_by  ON routes(created_by);
CREATE INDEX idx_buses_created_by   ON buses(created_by);
CREATE INDEX idx_drivers_created_by ON drivers(created_by);

-- FK constraints for zones.created_by / updated_by (zones is defined before users)
ALTER TABLE zones
  ADD CONSTRAINT fk_zones_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_zones_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- =============================================
-- VIEWS
-- =============================================

CREATE OR REPLACE VIEW active_buses_live AS
SELECT
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
FROM buses b
LEFT JOIN routes r ON r.id = b.route_id
WHERE b.status = 'on';

CREATE OR REPLACE VIEW active_waiting_passengers AS
SELECT
  pw.id,
  pw.route_id,
  r.route_name,
  pw.lat,
  pw.lng,
  pw.status,
  pw.user_id,
  COUNT(*) OVER (PARTITION BY pw.route_id) AS waiting_count,
  pw.created_at
FROM passenger_waiting pw
LEFT JOIN routes r ON r.id = pw.route_id
WHERE pw.status = 'waiting';

-- =============================================
-- AUTO updated_at TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_zones_updated_at
  BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_buses_updated_at
  BEFORE UPDATE ON buses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_passenger_waiting_updated_at
  BEFORE UPDATE ON passenger_waiting
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- Worker uses service_role key → bypasses RLS.
-- Enable RLS so anon key cannot read raw tables.
-- =============================================
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins            ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_locations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones             ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_admins      ENABLE ROW LEVEL SECURITY;
ALTER TABLE passenger_waiting ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events  ENABLE ROW LEVEL SECURITY;

-- =============================================
-- INITIAL DATA  (run AFTER creating the schema)
-- =============================================
-- Step 1: Create the super admin account in Supabase Dashboard
--   Authentication → Users → "Add user" → enter email + password
--   Copy the UUID shown as "User UID"
--
-- Step 2: Replace <AUTH_USER_UUID> below with that UUID, then run:

/*
INSERT INTO users (auth_user_id, auth_provider, email, email_verified, username, full_name, role, status)
VALUES (
  '<AUTH_USER_UUID>',   -- UUID from Supabase Auth
  'email',
  'admin@yourdomain.com',
  TRUE,
  'superadmin',
  'Super Admin',
  'admin',
  'active'
)
RETURNING id;           -- copy this users.id for the next insert

INSERT INTO admins (user_id, admin_type, status)
VALUES (
  '<USERS_ID_FROM_ABOVE>',
  'super_admin',
  'active'
);
*/

-- =============================================
-- MIGRATION: Add audit trail to existing DB
-- Run this if the database already exists
-- (skip if running the full schema above)
-- =============================================
/*
-- Add columns (safe to run multiple times)
ALTER TABLE zones   ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE zones   ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE admins  ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE admins  ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE routes  ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE routes  ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE buses   ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE buses   ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Add FK constraints (skips if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_zones_created_by')   THEN ALTER TABLE zones   ADD CONSTRAINT fk_zones_created_by   FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_zones_updated_by')   THEN ALTER TABLE zones   ADD CONSTRAINT fk_zones_updated_by   FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_admins_created_by')  THEN ALTER TABLE admins  ADD CONSTRAINT fk_admins_created_by  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_admins_updated_by')  THEN ALTER TABLE admins  ADD CONSTRAINT fk_admins_updated_by  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_routes_created_by')  THEN ALTER TABLE routes  ADD CONSTRAINT fk_routes_created_by  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_routes_updated_by')  THEN ALTER TABLE routes  ADD CONSTRAINT fk_routes_updated_by  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_buses_created_by')   THEN ALTER TABLE buses   ADD CONSTRAINT fk_buses_created_by   FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_buses_updated_by')   THEN ALTER TABLE buses   ADD CONSTRAINT fk_buses_updated_by   FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_drivers_created_by') THEN ALTER TABLE drivers ADD CONSTRAINT fk_drivers_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_drivers_updated_by') THEN ALTER TABLE drivers ADD CONSTRAINT fk_drivers_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL; END IF;
END $$;

-- Add indexes (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_zones_created_by   ON zones(created_by);
CREATE INDEX IF NOT EXISTS idx_admins_created_by  ON admins(created_by);
CREATE INDEX IF NOT EXISTS idx_routes_created_by  ON routes(created_by);
CREATE INDEX IF NOT EXISTS idx_buses_created_by   ON buses(created_by);
CREATE INDEX IF NOT EXISTS idx_drivers_created_by ON drivers(created_by);
*/
