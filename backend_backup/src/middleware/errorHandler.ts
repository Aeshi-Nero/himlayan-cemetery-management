import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function notFoundHandler(
  _req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction,
): void {
  res.status(404).json({
    success: false,
    error: 'Resource not found.',
  });
}

export function errorHandler(
  err: Error,
  _req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction,
): void {
  logger.error({ err }, 'Unhandled error');

  const statusCode = (err as any).statusCode || 500;
  const message = env.nodeEnv === 'production' && statusCode === 500
    ? 'Internal server error.'
    : err.message || 'Internal server error.';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}