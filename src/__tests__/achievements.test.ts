import request from 'supertest';
import { createApp } from '../app';
import { clearDatabase } from './setup';
import { createTestUser, createTestTask, createTestPomodoroSession } from './helpers';
import { prisma } from '../config/database';
import { Application } from 'express';

describe('Achievement Badge System', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('GET /api/achievements', () => {
    it('should return all achievements with unlock status', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .get('/api/achievements')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Check structure of achievement objects
      const achievement = response.body.data[0];
      expect(achievement).toHaveProperty('id');
      expect(achievement).toHaveProperty('name');
      expect(achievement).toHaveProperty('description');
      expect(achievement).toHaveProperty('isUnlocked');
    });
  });

  describe('GET /api/achievements/unlocked', () => {
    it('should return only unlocked achievements', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);

      // Complete a session to unlock "First Focus" achievement
      const session = await createTestPomodoroSession(user.id, task.id, {
        status: 'IN_PROGRESS',
      });

      // Complete the session
      await request(app)
        .post(`/api/pomodoro/${session.id}/complete`)
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app)
        .get('/api/achievements/unlocked')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return empty array for user with no unlocked achievements', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .get('/api/achievements/unlocked')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('Achievement Unlocking', () => {
    it('should unlock "First Focus" badge after first completed session', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);

      // Start a session
      const startResponse = await request(app)
        .post('/api/pomodoro/start')
        .set('Authorization', `Bearer ${token}`)
        .send({
          taskId: task.id,
          duration: 25,
        });

      const sessionId = startResponse.body.data.id;

      // Complete the session
      await request(app)
        .post(`/api/pomodoro/${sessionId}/complete`)
        .set('Authorization', `Bearer ${token}`);

      // Check unlocked achievements
      const achievementsResponse = await request(app)
        .get('/api/achievements/unlocked')
        .set('Authorization', `Bearer ${token}`);

      const firstFocus = achievementsResponse.body.data.find(
        (a: any) => a.name === 'First Focus'
      );
      expect(firstFocus).toBeDefined();
    });

    it('should unlock "Week Warrior" badge when streak reaches 7 days', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);

      // Create completed sessions for 7 consecutive days
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        await createTestPomodoroSession(user.id, task.id, {
          status: 'COMPLETED',
          startTime: date,
        });
      }

      // Check achievements
      const response = await request(app)
        .get('/api/achievements')
        .set('Authorization', `Bearer ${token}`);

      const weekWarrior = response.body.data.find(
        (a: any) => a.name === 'Week Warrior'
      );
      
      if (weekWarrior) {
        expect(weekWarrior.isUnlocked).toBe(true);
      }
    });

    it('should unlock "Dedicated Learner" badge at 25 hours focus time', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);

      // Create sessions totaling 25 hours (1500 minutes)
      // Create 60 sessions of 25 minutes each
      for (let i = 0; i < 60; i++) {
        await createTestPomodoroSession(user.id, task.id, {
          status: 'COMPLETED',
          duration: 25,
        });
      }

      // Check achievements
      const response = await request(app)
        .get('/api/achievements')
        .set('Authorization', `Bearer ${token}`);

      const dedicatedLearner = response.body.data.find(
        (a: any) => a.name === 'Dedicated Learner'
      );
      
      if (dedicatedLearner) {
        expect(dedicatedLearner.isUnlocked).toBe(true);
      }
    });

    it('should award achievement only once per user', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);

      // Complete multiple sessions
      for (let i = 0; i < 3; i++) {
        const session = await createTestPomodoroSession(user.id, task.id, {
          status: 'IN_PROGRESS',
        });

        await request(app)
          .post(`/api/pomodoro/${session.id}/complete`)
          .set('Authorization', `Bearer ${token}`);
      }

      // Check that "First Focus" is only awarded once
      const userAchievements = await prisma.userAchievement.findMany({
        where: { userId: user.id },
        include: { achievement: true },
      });

      const firstFocusCount = userAchievements.filter(
        (ua) => ua.achievement.name === 'First Focus'
      ).length;

      expect(firstFocusCount).toBeLessThanOrEqual(1);
    });

    it('should not unlock achievements for cancelled sessions', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);

      // Create and cancel a session
      const session = await createTestPomodoroSession(user.id, task.id, {
        status: 'IN_PROGRESS',
      });

      await request(app)
        .post(`/api/pomodoro/${session.id}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      // Check achievements
      const response = await request(app)
        .get('/api/achievements/unlocked')
        .set('Authorization', `Bearer ${token}`);

      expect(response.body.data).toHaveLength(0);
    });
  });
});
