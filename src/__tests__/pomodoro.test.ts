import request from 'supertest';
import { createApp } from '../app';
import { clearDatabase } from './setup';
import { createTestUser, createTestTask, createTestPomodoroSession } from './helpers';
import { Application } from 'express';

describe('Pomodoro Session Tracking', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/pomodoro/start', () => {
    it('should start a new Pomodoro session', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);

      const response = await request(app)
        .post('/api/pomodoro/start')
        .set('Authorization', `Bearer ${token}`)
        .send({
          taskId: task.id,
          duration: 25,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.taskId).toBe(task.id);
      expect(response.body.data.duration).toBe(25);
      expect(response.body.data.status).toBe('IN_PROGRESS');
      expect(response.body.data.startTime).toBeDefined();
    });

    it('should return validation error for invalid duration', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);

      const response = await request(app)
        .post('/api/pomodoro/start')
        .set('Authorization', `Bearer ${token}`)
        .send({
          taskId: task.id,
          duration: 150, // Over 120 minutes
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error when task does not exist', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .post('/api/pomodoro/start')
        .set('Authorization', `Bearer ${token}`)
        .send({
          taskId: '00000000-0000-0000-0000-000000000000',
          duration: 25,
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/pomodoro/:id/complete', () => {
    it('should complete an active Pomodoro session', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);
      const session = await createTestPomodoroSession(user.id, task.id, {
        status: 'IN_PROGRESS',
      });

      const response = await request(app)
        .post(`/api/pomodoro/${session.id}/complete`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COMPLETED');
      expect(response.body.data.endTime).toBeDefined();
    });

    it('should return error when completing already completed session', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);
      const session = await createTestPomodoroSession(user.id, task.id, {
        status: 'COMPLETED',
        endTime: new Date(),
      });

      const response = await request(app)
        .post(`/api/pomodoro/${session.id}/complete`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 when completing another user\'s session', async () => {
      const { user: user1 } = await createTestUser({ email: 'user1@example.com' });
      const { token: token2 } = await createTestUser({ email: 'user2@example.com' });
      const task = await createTestTask(user1.id);
      const session = await createTestPomodoroSession(user1.id, task.id, {
        status: 'IN_PROGRESS',
      });

      const response = await request(app)
        .post(`/api/pomodoro/${session.id}/complete`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/pomodoro/:id/cancel', () => {
    it('should cancel an active Pomodoro session', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);
      const session = await createTestPomodoroSession(user.id, task.id, {
        status: 'IN_PROGRESS',
      });

      const response = await request(app)
        .post(`/api/pomodoro/${session.id}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
    });
  });

  describe('GET /api/pomodoro/sessions', () => {
    it('should return all sessions for authenticated user', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);
      await createTestPomodoroSession(user.id, task.id, { status: 'COMPLETED' });
      await createTestPomodoroSession(user.id, task.id, { status: 'COMPLETED' });

      const response = await request(app)
        .get('/api/pomodoro/sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should not return sessions from other users', async () => {
      const { user: user1, token: token1 } = await createTestUser({ email: 'user1@example.com' });
      const { user: user2 } = await createTestUser({ email: 'user2@example.com' });
      const task1 = await createTestTask(user1.id);
      const task2 = await createTestTask(user2.id);

      await createTestPomodoroSession(user1.id, task1.id);
      await createTestPomodoroSession(user2.id, task2.id);

      const response = await request(app)
        .get('/api/pomodoro/sessions')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/pomodoro/stats', () => {
    it('should calculate total focus time correctly', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);

      // Create completed sessions
      await createTestPomodoroSession(user.id, task.id, {
        status: 'COMPLETED',
        duration: 25,
      });
      await createTestPomodoroSession(user.id, task.id, {
        status: 'COMPLETED',
        duration: 30,
      });

      // Create cancelled session (should not count)
      await createTestPomodoroSession(user.id, task.id, {
        status: 'CANCELLED',
        duration: 25,
      });

      const response = await request(app)
        .get('/api/pomodoro/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalFocusTime).toBe(55); // 25 + 30
    });

    it('should return zero focus time for user with no completed sessions', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .get('/api/pomodoro/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalFocusTime).toBe(0);
    });
  });
});
