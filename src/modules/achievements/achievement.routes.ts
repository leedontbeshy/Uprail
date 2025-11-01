import { Router } from 'express';
import * as achievementController from './achievement.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All achievement routes require authentication
router.use(authenticate);

// GET /api/achievements - Get all achievements with unlock status
router.get('/', achievementController.getAllAchievements);

// GET /api/achievements/unlocked - Get only unlocked achievements
router.get('/unlocked', achievementController.getUnlockedAchievements);

export default router;
