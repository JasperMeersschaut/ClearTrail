import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT PostGIS_Version() AS version');
    res.json({
      status: 'ok',
      postgis: result.rows[0].version,
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api/v1', routes);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`ClearTrail API listening on http://localhost:${env.PORT}`);
});
