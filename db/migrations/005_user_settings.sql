CREATE TABLE user_settings (
  user_id        UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  distance_unit  TEXT NOT NULL DEFAULT 'km' CHECK (distance_unit IN ('km', 'mi')),
  time_format    TEXT NOT NULL DEFAULT '24h' CHECK (time_format IN ('24h', '12h')),
  date_format    TEXT NOT NULL DEFAULT 'DMY' CHECK (date_format IN ('DMY', 'MDY', 'YMD')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
