import type { UserSettings } from '@cleartrail/shared';
import { DEFAULT_USER_SETTINGS } from '@cleartrail/shared';
import { pool } from '../db/pool.js';

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const result = await pool.query(
    `SELECT distance_unit, time_format, date_format, pace_min_per_km
     FROM user_settings WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return DEFAULT_USER_SETTINGS;
  }

  const row = result.rows[0];
  return {
    distanceUnit: row.distance_unit,
    timeFormat: row.time_format,
    dateFormat: row.date_format,
    paceMinPerKm: parseFloat(row.pace_min_per_km ?? 12),
  };
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  const current = await getUserSettings(userId);
  const merged = { ...current, ...settings };

  await pool.query(
    `INSERT INTO user_settings (user_id, distance_unit, time_format, date_format, pace_min_per_km)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       distance_unit = EXCLUDED.distance_unit,
       time_format = EXCLUDED.time_format,
       date_format = EXCLUDED.date_format,
       pace_min_per_km = EXCLUDED.pace_min_per_km,
       updated_at = NOW()`,
    [
      userId,
      merged.distanceUnit,
      merged.timeFormat,
      merged.dateFormat,
      merged.paceMinPerKm,
    ]
  );

  return merged;
}

export async function ensureUserSettings(userId: string): Promise<void> {
  await pool.query(
    `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
    [userId]
  );
}
