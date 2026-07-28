import { Router, Request, Response } from 'express';
import { db } from '../config/database';
import { env } from '../config/env';
import { HealthStatus } from '../types';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'healthy';
  try {
    await db.getClient().$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'unhealthy';
  }

  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;

  const health: HealthStatus = {
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    memory: {
      used: usedMemory,
      total: totalMemory,
      percentage: totalMemory > 0 ? Math.round((usedMemory / totalMemory) * 100) : 0,
    },
  };

  const statusCode = dbStatus === 'healthy' ? 200 : 503;
  res.status(statusCode).json({ success: true, data: health });
});

export default router;