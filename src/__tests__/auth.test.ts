import request from 'supertest';
import { createApp } from '../app';
import { clearDatabase } from './setup';
import { Application } from 'express';

describe('Authentication Flow', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return error when email already exists', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
      };

      // Register first user
      await request(app).post('/api/auth/register').send(userData);

      // Try to register again with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      // Register a user first
      const userData = {
        email: 'logintest@example.com',
        password: 'SecurePass123!',
      };
      await request(app).post('/api/auth/register').send(userData);

      // Login
      const response = await request(app)
        .post('/api/auth/login')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('should return error with incorrect password', async () => {
      // Register a user first
      await request(app).post('/api/auth/register').send({
        email: 'wrongpass@example.com',
        password: 'CorrectPass123!',
      });

      // Try to login with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'WrongPass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should accept valid email for password reset', async () => {
      // Register a user first
      await request(app).post('/api/auth/register').send({
        email: 'reset@example.com',
        password: 'OldPass123!',
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'reset@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        });

      // Should return success to prevent email enumeration
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
