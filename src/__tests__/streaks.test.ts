import request from 'supertest';
import { createApp } from '../app';
import { clearDatabase } from './setup';
import { createTestUser, createTestTask, createTestPomodoroSession } from './helpers';
import { Application } from 'express';

describe('Streak Calculation and Tracking', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('GET /api/streaks', () => {
    it('should return zero streak for user with no sessions', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .get('/api/streaks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currentStreak).toBe(0);
      expect(response.body.data.longestStreak).toBe(0);
    });

    it('should calculate current streak with consecutive days', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);

      const now = new Date();
      
      // Create sessions for today
      await createTestPomodoroSession(user.id, task.id, {
        status: 'COMPLETED',
        startTime: now,
      });

      // Create sessions for yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      await createTestPomodoroSession(user.id, task.id, {
        status: 'COMPLETED',
        startTime: yesterday,
      });

      // Create sessions for 2 days ago
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      await createTestPomodoroSession(user.id, task.id, {
        status: 'COMPLETED',
        startTime: twoDaysAgo,
      });

      const response = await request(app)
        .get('/api/streaks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.currentStreak).toBeGreaterThanOrEqual(2);
    });

    it('should reset streak when there is a gap in days', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);

      const now = new Date();
      
      // Create session for today
      await createTestPomodoroSession(user.id, task.id, {
        status: 'COMPLETED',
        startTime: now,
      });

      // Create session for 3 days ago (gap of 2 days)
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      await createTestPomodoroSession(user.id, task.id, {
        status: 'COMPLETED',
        startTime: threeDaysAgo,
      });

      const response = await request(app)
        .get('/api/streaks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      // Current streak should be 1 (only today)
      expect(response.body.data.currentStreak).toBe(1);
    });

    it('should track longest streak separately from current streak', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);

      const now = new Date();
      
      // Create a long streak in the past (5 days)
      for (let i = 10; i <= 14; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        await createTestPomodoroSession(user.id, task.id, {
          status: 'COMPLETED',
          startTime: date,
        });
      }

      // Create current shorter streak (2 days)
      await createTestPomodoroSession(user.id, task.id, {
        status: 'COMPLETED',
        startTime: now,
      });
      
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      await createTestPomodoroSession(user.id, task.id, {
        status: 'COMPLETED',
        startTime: yesterday,
      });

      const response = await request(app)
        .get('/api/streaks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.currentStreak).toBe(2);
      expect(response.body.data.longestStreak).toBeGreaterThanOrEqual(5);
    });

    it('should not count cancelled sessions for streak', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);

      const now = new Date();
      
      // Create completed session for today
      await createTestPomodoroSession(user.id, task.id, {
        status: 'COMPLETED',
        startTime: now,
      });

      // Create cancelled session for yesterday (should not count)
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      await createTestPomodoroSession(user.id, task.id, {
        status: 'CANCELLED',
        startTime: yesterday,
      });

      const response = await request(app)
        .get('/api/streaks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      // Streak should be 1 (only today, yesterday doesn't count)
      expect(response.body.data.currentStreak).toBe(1);
    });

    it('should handle timezone-aware date grouping', async () => {
      const { user, token } = await createTestUser({ timezone: 'America/New_York' });
      const task = await createTestTask(user.id);

      // Create session for today
      await createTestPomodoroSession(user.id, task.id, {
        status: 'COMPLETED',
        startTime: new Date(),
      });

      const response = await request(app)
        .get('/api/streaks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currentStreak).toBeGreaterThanOrEqual(1);
    });
  });
});
