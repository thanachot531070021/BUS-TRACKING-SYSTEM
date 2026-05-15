ALTER TABLE zones
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_by UUID;


ALTER TABLE zones
  ADD CONSTRAINT IF NOT EXISTS fk_zones_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_zones_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;


ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;


ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;


ALTER TABLE buses
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;


ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;


CREATE INDEX IF NOT EXISTS idx_zones_created_by   ON zones(created_by);
CREATE INDEX IF NOT EXISTS idx_admins_created_by  ON admins(created_by);
CREATE INDEX IF NOT EXISTS idx_routes_created_by  ON routes(created_by);
CREATE INDEX IF NOT EXISTS idx_buses_created_by   ON buses(created_by);
CREATE INDEX IF NOT EXISTS idx_drivers_created_by ON drivers(created_by);
*/




