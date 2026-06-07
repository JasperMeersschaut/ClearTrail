import pg from 'pg';
import { env } from '../config/env.js';

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
});

export async function geoJsonToGeography(geojson: object): Promise<string> {
  const result = await pool.query<{ geo: string }>(
    `SELECT ST_AsText(ST_GeomFromGeoJSON($1)::geography) AS geo`,
    [JSON.stringify(geojson)]
  );
  return result.rows[0].geo;
}

export async function pointFromLatLng(lat: number, lng: number): Promise<string> {
  const result = await pool.query<{ geo: string }>(
    `SELECT ST_AsText(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS geo`,
    [lng, lat]
  );
  return result.rows[0].geo;
}
