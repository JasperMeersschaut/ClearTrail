import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { pool, pointFromLatLng } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateCircularRoute, generateMultipleRoutes } from '../services/routing.service.js';

const router: RouterType = Router();

const generateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  durationMinutes: z.number().min(15).max(480),
  walkingSpeedKmh: z.number().min(2).max(8).optional(),
  loopRoutesOnly: z.boolean().optional(),
  dryFeetEnabled: z.boolean().optional(),
  shadePreferenceEnabled: z.boolean().optional(),
  count: z.number().min(1).max(5).optional(),
});

router.post('/generate', async (req, res, next) => {
  try {
    const body = generateSchema.parse(req.body);
    const result = await generateMultipleRoutes(body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/generate-single', async (req, res, next) => {
  try {
    const body = generateSchema.parse(req.body);
    const route = await generateCircularRoute(body);
    res.json(route);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, name, distance_meters, estimated_duration_min,
              elevation_gain_m, surface_breakdown, scoring_metadata, geojson, created_at
       FROM saved_routes WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user!.userId]
    );

    if (result.rows.length === 0) {
      next(new AppError(404, 'Route not found'));
      return;
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      distanceMeters: parseFloat(row.distance_meters),
      estimatedDurationMin: row.estimated_duration_min,
      elevationGainM: row.elevation_gain_m ? parseFloat(row.elevation_gain_m) : undefined,
      surfaceBreakdown: row.surface_breakdown,
      scoringMetadata: row.scoring_metadata,
      geojson: row.geojson,
      createdAt: row.created_at,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/save', requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      lat: z.number(),
      lng: z.number(),
      route: z.object({
        distanceMeters: z.number(),
        estimatedDurationMin: z.number(),
        elevationGainM: z.number().optional(),
        surfaceBreakdown: z.record(z.number()).optional(),
        scoringMetadata: z.record(z.unknown()).optional(),
        geojson: z.object({
          type: z.literal('Feature'),
          geometry: z.object({
            type: z.literal('LineString'),
            coordinates: z.array(z.tuple([z.number(), z.number()])),
          }),
          properties: z.record(z.unknown()).optional(),
        }),
      }),
    });

    const body = schema.parse(req.body);
    const startPoint = await pointFromLatLng(body.lat, body.lng);

    const result = await pool.query(
      `INSERT INTO saved_routes (
         user_id, name, start_point, route_geometry, distance_meters,
         estimated_duration_min, elevation_gain_m, surface_breakdown,
         scoring_metadata, geojson
       ) VALUES (
         $1, $2,
         ST_GeogFromText($3),
         ST_GeogFromText(ST_AsText(ST_GeomFromGeoJSON($4)::geography)),
         $5, $6, $7, $8, $9, $10
       ) RETURNING id, created_at`,
      [
        req.user!.userId,
        body.name,
        startPoint,
        JSON.stringify(body.route.geojson.geometry),
        body.route.distanceMeters,
        body.route.estimatedDurationMin,
        body.route.elevationGainM ?? null,
        JSON.stringify(body.route.surfaceBreakdown ?? {}),
        JSON.stringify(body.route.scoringMetadata ?? {}),
        JSON.stringify(body.route.geojson),
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

export default router;
