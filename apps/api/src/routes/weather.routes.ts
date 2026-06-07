import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { getOptimalWeatherWindow } from '../services/weather.service.js';

const router: RouterType = Router();

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  hoursAhead: z.coerce.number().min(1).max(72).optional(),
});

router.get('/optimal-window', async (req, res, next) => {
  try {
    const { lat, lng, hoursAhead } = querySchema.parse(req.query);
    const window = await getOptimalWeatherWindow(lat, lng, hoursAhead ?? 48);
    res.json(window);
  } catch (error) {
    next(error);
  }
});

export default router;
