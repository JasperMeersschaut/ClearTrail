import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { getOptimalWeatherWindow } from '../services/weather.service.js';

const router: RouterType = Router();

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  hoursAhead: z.coerce.number().min(1).max(72).optional(),
  searchStartTime: z.string().optional(),
  searchEndTime: z.string().optional(),
  windowDurationMinutes: z.coerce.number().min(15).max(480).optional(),
});

router.get('/optimal-window', async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const window = await getOptimalWeatherWindow(query.lat, query.lng, {
      hoursAhead: query.hoursAhead,
      searchStartTime: query.searchStartTime,
      searchEndTime: query.searchEndTime,
      windowDurationMinutes: query.windowDurationMinutes,
    });
    res.json(window);
  } catch (error) {
    next(error);
  }
});

export default router;
