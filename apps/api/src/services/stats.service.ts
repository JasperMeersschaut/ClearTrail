import { pool } from '../db/pool.js';
import type { UserHikeStats } from '@cleartrail/shared';

export async function getUserStats(userId: string): Promise<UserHikeStats> {
  const result = await pool.query<{
    completed_routes: number;
    total_km_walked: string;
    total_hiking_hours: string;
  }>(
    `SELECT completed_routes, total_km_walked, total_hiking_hours
     FROM user_hike_stats WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return { completedRoutes: 0, totalKmWalked: 0, totalHikingHours: 0 };
  }

  const row = result.rows[0];
  return {
    completedRoutes: row.completed_routes,
    totalKmWalked: parseFloat(row.total_km_walked),
    totalHikingHours: parseFloat(row.total_hiking_hours),
  };
}
