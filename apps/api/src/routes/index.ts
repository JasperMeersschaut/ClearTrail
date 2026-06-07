import { Router, type Router as RouterType } from 'express';
import authRoutes from './auth.routes.js';
import weatherRoutes from './weather.routes.js';
import routesRoutes from './routes.routes.js';
import hikesRoutes from './hikes.routes.js';
import usersRoutes from './users.routes.js';
import gearRoutes from './gear.routes.js';

const router: RouterType = Router();

router.use('/auth', authRoutes);
router.use('/weather', weatherRoutes);
router.use('/routes', routesRoutes);
router.use('/hikes', hikesRoutes);
router.use('/users', usersRoutes);
router.use('/gear', gearRoutes);

export default router;
