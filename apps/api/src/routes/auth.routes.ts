import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router: RouterType = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
});

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 12);

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, created_at`,
      [body.email, passwordHash, body.displayName]
    );

    const user = userResult.rows[0];
    await pool.query(
      `INSERT INTO user_preferences (user_id) VALUES ($1)`,
      [user.id]
    );

    const token = signToken({ userId: user.id, email: user.email });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      next(new AppError(409, 'Email already registered'));
      return;
    }
    next(error);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await pool.query(
      `SELECT id, email, display_name, password_hash, created_at FROM users WHERE email = $1`,
      [body.email]
    );

    if (result.rows.length === 0) {
      next(new AppError(401, 'Invalid email or password'));
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(body.password, user.password_hash);
    if (!valid) {
      next(new AppError(401, 'Invalid email or password'));
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, email, display_name, created_at FROM users WHERE id = $1`,
      [req.user!.userId]
    );
    if (result.rows.length === 0) {
      next(new AppError(404, 'User not found'));
      return;
    }
    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
