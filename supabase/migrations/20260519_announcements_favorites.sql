-- =============================================
-- Migration: announcements + user_favorite_routes
-- =============================================

-- =============================================
-- TABLE: announcements
-- type:  'promo'        → carousel banner on app home screen
--        'news'         → news feed card
--        'announcement' → announcement card
-- tone:  'promo' | 'warning' | 'success' | 'info'
-- =============================================
CREATE TABLE IF NOT EXISTS announcements (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT        NOT NULL,
  subtitle     TEXT,
  tag          TEXT,                        -- badge label e.g. 'โปรโมชั่น', 'ข่าวสาร'
  type         TEXT        NOT NULL DEFAULT 'news'  CHECK (type IN ('promo','news','announcement')),
  tone         TEXT        NOT NULL DEFAULT 'info'  CHECK (tone IN ('promo','warning','success','info')),
  icon_emoji   TEXT,                        -- e.g. '🎉', '⚡', '📢'
  cta_text     TEXT,                        -- e.g. 'รับเครดิต', 'ดูรายละเอียด'
  cta_url      TEXT,                        -- optional deep link / external URL
  image_url    TEXT,                        -- optional banner image URL
  sort_order   INT         NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  starts_at    TIMESTAMPTZ,                 -- NULL = always active from now
  ends_at      TIMESTAMPTZ,                 -- NULL = never expires
  created_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  updated_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_type      ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_sort      ON announcements(sort_order);
CREATE INDEX IF NOT EXISTS idx_announcements_ends_at   ON announcements(ends_at);

-- =============================================
-- TABLE: user_favorite_routes
-- =============================================
CREATE TABLE IF NOT EXISTS user_favorite_routes (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  route_id   UUID        NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, route_id)
);

CREATE INDEX IF NOT EXISTS idx_fav_routes_user_id  ON user_favorite_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_fav_routes_route_id ON user_favorite_routes(route_id);

-- =============================================
-- Seed: default announcements for demo
-- =============================================
INSERT INTO announcements (title, subtitle, tag, type, tone, icon_emoji, cta_text, sort_order)
VALUES
  ('เพื่อนใหม่รับฟรีเครดิต 50 บาท',  'ใช้ได้ทุกเส้นทาง · หมดเขต 31 พ.ค.',          'โปรโมชั่นเดือนนี้', 'promo',        'promo',   '🎉', 'รับเครดิต',     0),
  ('R-08 ปรับเปลี่ยนเส้นทางชั่วคราว', 'เนื่องจากการก่อสร้างถนนรอบเมือง · 12–18 พ.ค.', 'แจ้งเตือนบริการ',  'announcement', 'warning', '⚠️', NULL,           1),
  ('เพิ่มจุดรอใหม่ได้แล้ว 5 จังหวัด', 'เชียงใหม่ · ขอนแก่น · ภูเก็ต · ชลบุรี · นครราชสีมา', 'ฟีเจอร์ใหม่',  'news',         'success', '⚡', NULL,           2),
  ('งดให้บริการ R-04 วันหยุดราชการ',   'วันจันทร์ที่ 20 พ.ค. งดให้บริการทั้งวัน',      'ประกาศ',          'announcement', 'info',    '📢', NULL,           3)
ON CONFLICT DO NOTHING;
