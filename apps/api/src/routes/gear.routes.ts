import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { getOptimalWeatherWindow } from '../services/weather.service.js';
import { getGearRecommendation } from '../services/gear.service.js';

const router: RouterType = Router();

router.get('/recommendation', async (req, res, next) => {
  try {
    const schema = z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
    });
    const { lat, lng } = schema.parse(req.query);
    const window = await getOptimalWeatherWindow(lat, lng);
    const recommendation = getGearRecommendation(window);
    res.json(recommendation);
  } catch (error) {
    next(error);
  }
});

export default router;
