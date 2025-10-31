import { Request, Response } from 'express';
import * as pomodoroService from './pomodoro.service';
import {
  sendSuccess,
  sendError,
  sendNotFoundError,
  sendAuthorizationError,
} from '../../utils/response.util';
import { StartSessionInput, QuerySessionsInput } from './pomodoro.schemas';

/**
 * Start a new Pomodoro session
 * POST /api/pomodoro/start
 */
export async function startSession(
  req: Request<{}, {}, StartSessionInput>,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const sessionData = req.body;

    const session = await pomodoroService.startSession(userId, sessionData);

    sendSuccess(res, session, 201, 'Pomodoro session started successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      sendNotFoundError(res, 'Task not found');
      return;
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      sendAuthorizationError(res, 'You do not have permission to start a session for this task');
      return;
    }
    sendError(res, 'START_SESSION_ERROR', 'Failed to start Pomodoro session', 500);
  }
}

/**
 * Complete a Pomodoro session
 * POST /api/pomodoro/:id/complete
 */
export async function completeSession(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const session = await pomodoroService.completeSession(id, userId);

    sendSuccess(res, session, 200, 'Pomodoro session completed successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'Session not found') {
      sendNotFoundError(res, 'Session not found');
      return;
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      sendAuthorizationError(res, 'You do not have permission to complete this session');
      return;
    }
    if (error instanceof Error && error.message === 'Session is not in progress') {
      sendError(res, 'INVALID_SESSION_STATE', 'Session is not in progress and cannot be completed', 400);
      return;
    }
    sendError(res, 'COMPLETE_SESSION_ERROR', 'Failed to complete Pomodoro session', 500);
  }
}

/**
 * Cancel a Pomodoro session
 * POST /api/pomodoro/:id/cancel
 */
export async function cancelSession(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const session = await pomodoroService.cancelSession(id, userId);

    sendSuccess(res, session, 200, 'Pomodoro session cancelled successfully');
  } catch (error) {
    if (error instanceof Error && error.message === 'Session not found') {
      sendNotFoundError(res, 'Session not found');
      return;
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      sendAuthorizationError(res, 'You do not have permission to cancel this session');
      return;
    }
    if (error instanceof Error && error.message === 'Session is not in progress') {
      sendError(res, 'INVALID_SESSION_STATE', 'Session is not in progress and cannot be cancelled', 400);
      return;
    }
    sendError(res, 'CANCEL_SESSION_ERROR', 'Failed to cancel Pomodoro session', 500);
  }
}

/**
 * Get session history
 * GET /api/pomodoro/sessions
 */
export async function getSessions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const filters = req.query;

    const sessions = await pomodoroService.getSessionHistory(userId, filters);

    sendSuccess(res, sessions, 200);
  } catch (error) {
    sendError(res, 'GET_SESSIONS_ERROR', 'Failed to retrieve session history', 500);
  }
}

/**
 * Get focus time statistics
 * GET /api/pomodoro/stats
 */
export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const stats = await pomodoroService.getFocusTimeStats(userId);

    sendSuccess(res, stats, 200);
  } catch (error) {
    sendError(res, 'GET_STATS_ERROR', 'Failed to retrieve focus time statistics', 500);
  }
}
