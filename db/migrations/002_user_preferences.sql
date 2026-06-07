CREATE TABLE user_preferences (
  user_id                      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  walking_speed_kmh            NUMERIC(4,2) NOT NULL DEFAULT 4.50,
  default_duration_minutes     INT NOT NULL DEFAULT 60,
  temperature_unit             TEXT NOT NULL DEFAULT 'C' CHECK (temperature_unit IN ('C','F')),
  dry_feet_enabled             BOOLEAN NOT NULL DEFAULT TRUE,
  shade_preference_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  max_precipitation_pct        INT NOT NULL DEFAULT 30,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
