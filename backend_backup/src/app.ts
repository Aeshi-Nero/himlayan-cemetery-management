import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env';
import { db } from './config/database';
import { apiRateLimit } from './config/rateLimit';
import { requestLogger } from './middleware/logging';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import plotsRoutes from './routes/plots.routes';
import clientsRoutes from './routes/clients.routes';
import contractsRoutes from './routes/contracts.routes';
import paymentsRoutes from './routes/payments.routes';
import inquiriesRoutes from './routes/inquiries.routes';
import burialsRoutes from './routes/burials.routes';
import usersRoutes from './routes/users.routes';
import dashboardRoutes from './routes/dashboard.routes';
import pathfindingRoutes from './routes/pathfinding.routes';
import auditRoutes from './routes/audit.routes';
import notificationsRoutes from './routes/notifications.routes';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(compression());
if (env.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}
app.use(requestLogger);
app.use(apiRateLimit);
app.use(express.json({ limit: '1mb' }));

app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/plots', plotsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/inquiries', inquiriesRoutes);
app.use('/api/burials', burialsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pathfinding', pathfindingRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/api', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Himlayan Cemetery Management API',
      version: '1.0.0',
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function start(): Promise<void> {
  try {
    await db.connect();
    logger.info('Database connected successfully.');

    app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode.`);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server.');
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export { app, start };