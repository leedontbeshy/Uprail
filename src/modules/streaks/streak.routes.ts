import { Router } from 'express';
import * as streakController from './streak.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All streak routes require authentication
router.use(authenticate);

// GET /api/streaks - Get current streak info
router.get('/', streakController.getStreaks);

export default router;
