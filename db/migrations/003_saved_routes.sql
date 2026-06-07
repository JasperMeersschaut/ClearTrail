CREATE TABLE saved_routes (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                     TEXT NOT NULL,
  start_point              GEOGRAPHY(POINT, 4326) NOT NULL,
  route_geometry           GEOGRAPHY(LINESTRING, 4326) NOT NULL,
  distance_meters          NUMERIC(10,2) NOT NULL,
  estimated_duration_min   INT NOT NULL,
  elevation_gain_m         NUMERIC(8,2),
  surface_breakdown        JSONB NOT NULL DEFAULT '{}',
  weather_snapshot         JSONB,
  scoring_metadata         JSONB NOT NULL DEFAULT '{}',
  geojson                  JSONB NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_routes_user ON saved_routes(user_id);
CREATE INDEX idx_saved_routes_geom ON saved_routes USING GIST(route_geometry);
