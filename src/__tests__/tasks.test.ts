import request from 'supertest';
import { createApp } from '../app';
import { clearDatabase } from './setup';
import { createTestUser, createTestTask } from './helpers';
import { Application } from 'express';

describe('Task Management', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task with valid data', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Learn TypeScript',
          description: 'Complete TypeScript tutorial',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Learn TypeScript');
      expect(response.body.data.description).toBe('Complete TypeScript tutorial');
      expect(response.body.data.isCompleted).toBe(false);
    });

    it('should return error when not authenticated', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Test Task',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for missing title', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'No title provided',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks for authenticated user', async () => {
      const { user, token } = await createTestUser();
      await createTestTask(user.id, { title: 'Task 1' });
      await createTestTask(user.id, { title: 'Task 2' });

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].title).toBeDefined();
    });

    it('should return empty array when user has no tasks', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should not return tasks from other users', async () => {
      const { user: user1, token: token1 } = await createTestUser({ email: 'user1@example.com' });
      const { user: user2 } = await createTestUser({ email: 'user2@example.com' });

      await createTestTask(user1.id, { title: 'User 1 Task' });
      await createTestTask(user2.id, { title: 'User 2 Task' });

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('User 1 Task');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return a specific task by id', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id, { title: 'Specific Task' });

      const response = await request(app)
        .get(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(task.id);
      expect(response.body.data.title).toBe('Specific Task');
    });

    it('should return 404 for non-existent task', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .get('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 when accessing another user\'s task', async () => {
      const { user: user1 } = await createTestUser({ email: 'user1@example.com' });
      const { token: token2 } = await createTestUser({ email: 'user2@example.com' });

      const task = await createTestTask(user1.id, { title: 'User 1 Task' });

      const response = await request(app)
        .get(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('should update a task with valid data', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id, { title: 'Old Title' });

      const response = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Title',
          isCompleted: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.isCompleted).toBe(true);
    });

    it('should return 403 when updating another user\'s task', async () => {
      const { user: user1 } = await createTestUser({ email: 'user1@example.com' });
      const { token: token2 } = await createTestUser({ email: 'user2@example.com' });

      const task = await createTestTask(user1.id);

      const response = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ title: 'Hacked Title' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const { user, token } = await createTestUser();
      const task = await createTestTask(user.id);

      const response = await request(app)
        .delete(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify task is deleted
      const getResponse = await request(app)
        .get(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 403 when deleting another user\'s task', async () => {
      const { user: user1 } = await createTestUser({ email: 'user1@example.com' });
      const { token: token2 } = await createTestUser({ email: 'user2@example.com' });

      const task = await createTestTask(user1.id);

      const response = await request(app)
        .delete(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
