const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const pinoHttp = require('pino-http');
const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./utils/logger');
const { globalLimiter } = require('./middleware/rateLimits');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { send } = require('./utils/respond');

function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',') }));
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(pinoHttp({ logger, autoLogging: !config.isTest }));
  app.use(globalLimiter);

  app.get('/health', (_req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'up' : 'down' });
  });
  app.get('/api/v1/time', (_req, res) => send(res, { now: new Date().toISOString() }));

  app.use('/uploads', express.static(path.resolve(config.uploadDir), { maxAge: '1d', fallthrough: false }));

  app.use('/api/v1/auth', require('./routes/auth.routes'));
  app.use('/api/v1/competitions', require('./routes/competitions.routes'));
  app.use('/api/v1/registrations', require('./routes/registrations.routes'));
  app.use('/api/v1/testimonials', require('./routes/testimonials.routes'));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
