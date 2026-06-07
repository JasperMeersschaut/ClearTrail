CREATE TABLE hike_logs (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  saved_route_id     UUID REFERENCES saved_routes(id) ON DELETE SET NULL,
  route_geometry     GEOGRAPHY(LINESTRING, 4326) NOT NULL,
  distance_meters    NUMERIC(10,2) NOT NULL,
  duration_minutes   INT NOT NULL,
  started_at         TIMESTAMPTZ NOT NULL,
  completed_at       TIMESTAMPTZ NOT NULL,
  weather_conditions JSONB,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hike_logs_user ON hike_logs(user_id);
CREATE INDEX idx_hike_logs_completed ON hike_logs(user_id, completed_at DESC);

CREATE VIEW user_hike_stats AS
SELECT
  user_id,
  COUNT(*)::INT AS completed_routes,
  COALESCE(SUM(distance_meters), 0) / 1000.0 AS total_km_walked,
  COALESCE(SUM(duration_minutes), 0) / 60.0 AS total_hiking_hours
FROM hike_logs
GROUP BY user_id;
