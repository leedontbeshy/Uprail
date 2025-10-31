import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { loggingMiddleware } from './middleware/logging.middleware';
import { errorHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import taskRoutes from './modules/tasks/task.routes';
import pomodoroRoutes from './modules/pomodoro/pomodoro.routes';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors({
    origin: env.ALLOWED_ORIGINS.split(','),
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(loggingMiddleware);

  // Serve uploaded files
  app.use('/uploads', express.static(env.UPLOAD_DIR));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/pomodoro', pomodoroRoutes);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
