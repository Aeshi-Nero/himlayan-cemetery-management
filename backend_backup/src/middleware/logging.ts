import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';

export function requestLogger(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    logger.info({
      method,
      url,
      statusCode,
      duration,
      userId: req.user?.userId || 'anonymous',
    }, `${method} ${url} ${statusCode} ${duration}ms`);
  });

  next();
}