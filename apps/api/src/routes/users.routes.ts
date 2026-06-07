import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { getUserStats } from '../services/stats.service.js';
const router: RouterType = Router();

router.get('/me/stats', requireAuth, async (req, res, next) => {
  try {
    const stats = await getUserStats(req.user!.userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.get('/me/preferences', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT walking_speed_kmh, default_duration_minutes, temperature_unit,
              dry_feet_enabled, shade_preference_enabled, max_precipitation_pct
       FROM user_preferences WHERE user_id = $1`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.json({
        walkingSpeedKmh: 4.5,
        defaultDurationMinutes: 60,
        temperatureUnit: 'C',
        dryFeetEnabled: true,
        shadePreferenceEnabled: true,
        maxPrecipitationPct: 30,
      });
      return;
    }

    const row = result.rows[0];
    res.json({
      walkingSpeedKmh: parseFloat(row.walking_speed_kmh),
      defaultDurationMinutes: row.default_duration_minutes,
      temperatureUnit: row.temperature_unit,
      dryFeetEnabled: row.dry_feet_enabled,
      shadePreferenceEnabled: row.shade_preference_enabled,
      maxPrecipitationPct: row.max_precipitation_pct,
    });
  } catch (error) {
    next(error);
  }
});

const preferencesSchema = z.object({
  walkingSpeedKmh: z.number().min(2).max(8).optional(),
  defaultDurationMinutes: z.number().min(15).max(480).optional(),
  temperatureUnit: z.enum(['C', 'F']).optional(),
  dryFeetEnabled: z.boolean().optional(),
  shadePreferenceEnabled: z.boolean().optional(),
  maxPrecipitationPct: z.number().min(0).max(100).optional(),
});

router.put('/me/preferences', requireAuth, async (req, res, next) => {
  try {
    const body = preferencesSchema.parse(req.body);
    const fields: string[] = [];
    const values: unknown[] = [req.user!.userId];
    let idx = 2;

    const mapping: Record<string, string> = {
      walkingSpeedKmh: 'walking_speed_kmh',
      defaultDurationMinutes: 'default_duration_minutes',
      temperatureUnit: 'temperature_unit',
      dryFeetEnabled: 'dry_feet_enabled',
      shadePreferenceEnabled: 'shade_preference_enabled',
      maxPrecipitationPct: 'max_precipitation_pct',
    };

    for (const [key, column] of Object.entries(mapping)) {
      if (key in body) {
        fields.push(`${column} = $${idx++}`);
        values.push(body[key as keyof typeof body]);
      }
    }

    if (fields.length === 0) {
      res.json({ ok: true });
      return;
    }

    fields.push('updated_at = NOW()');
    await pool.query(
      `UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = $1`,
      values
    );

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
