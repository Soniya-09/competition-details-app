const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const config = require('../config');

const skip = () => config.isTest;

const globalLimiter = rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: 'draft-8', legacyHeaders: false, skip });

const writeLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : ipKeyGenerator(req.ip)),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down' } },
});

module.exports = { globalLimiter, writeLimiter };
