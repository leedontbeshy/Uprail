import { Router } from 'express';
import * as pomodoroController from './pomodoro.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { startSessionSchema, querySessionsSchema } from './pomodoro.schemas';

const router = Router();

/**
 * All Pomodoro routes require authentication
 */
router.use(authenticate);

/**
 * POST /api/pomodoro/start
 * Start a new Pomodoro session
 */
router.post('/start', validate(startSessionSchema), pomodoroController.startSession);

/**
 * POST /api/pomodoro/:id/complete
 * Complete a Pomodoro session
 */
router.post('/:id/complete', pomodoroController.completeSession);

/**
 * POST /api/pomodoro/:id/cancel
 * Cancel a Pomodoro session
 */
router.post('/:id/cancel', pomodoroController.cancelSession);

/**
 * GET /api/pomodoro/sessions
 * Get session history with optional filters
 */
router.get('/sessions', validate(querySessionsSchema, 'query'), pomodoroController.getSessions);

/**
 * GET /api/pomodoro/stats
 * Get focus time statistics
 */
router.get('/stats', pomodoroController.getStats);

export default router;
