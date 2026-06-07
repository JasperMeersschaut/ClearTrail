import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router: RouterType = Router();

const hikeSchema = z.object({
  savedRouteId: z.string().uuid().optional(),
  routeGeojson: z.object({
    type: z.literal('Feature'),
    geometry: z.object({
      type: z.literal('LineString'),
      coordinates: z.array(z.tuple([z.number(), z.number()])),
    }),
    properties: z.record(z.unknown()).optional(),
  }),
  distanceMeters: z.number().positive(),
  durationMinutes: z.number().positive(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  weatherConditions: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = hikeSchema.parse(req.body);

    const result = await pool.query(
      `INSERT INTO hike_logs (
         user_id, saved_route_id, route_geometry, distance_meters,
         duration_minutes, started_at, completed_at, weather_conditions, notes
       ) VALUES (
         $1, $2,
         ST_GeogFromText(ST_AsText(ST_GeomFromGeoJSON($3)::geography)),
         $4, $5, $6, $7, $8, $9
       ) RETURNING id, created_at`,
      [
        req.user!.userId,
        body.savedRouteId ?? null,
        JSON.stringify(body.routeGeojson.geometry),
        body.distanceMeters,
        body.durationMinutes,
        body.startedAt,
        body.completedAt,
        body.weatherConditions ? JSON.stringify(body.weatherConditions) : null,
        body.notes ?? null,
      ]
    );

    res.status(201).json({
      id: result.rows[0].id,
      createdAt: result.rows[0].created_at,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, distance_meters, duration_minutes, started_at, completed_at, notes, created_at
       FROM hike_logs WHERE user_id = $1
       ORDER BY completed_at DESC LIMIT 20`,
      [req.user!.userId]
    );

    res.json(
      result.rows.map((row) => ({
        id: row.id,
        distanceMeters: parseFloat(row.distance_meters),
        durationMinutes: row.duration_minutes,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        notes: row.notes,
        createdAt: row.created_at,
      }))
    );
  } catch (error) {
    next(error);
  }
});

export default router;
