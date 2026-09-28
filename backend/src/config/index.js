require('dotenv').config({ quiet: true });

const read = (key, fallback) => {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
};

const bool = (key, fallback) => {
  const value = read(key, undefined);
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes'].includes(String(value).toLowerCase());
};

const nodeEnv = read('NODE_ENV', 'development');
const port = Number(read('PORT', 4000));

const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port,
  mongoUri: read('MONGODB_URI', 'mongodb://127.0.0.1:27017/feedants'),
  jwtSecret: read('JWT_SECRET', 'dev-only-secret-change-me'),
  jwtExpiresIn: read('JWT_EXPIRES_IN', '7d'),
  corsOrigin: read('CORS_ORIGIN', '*'),
  publicBaseUrl: read('PUBLIC_BASE_URL', `http://localhost:${port}`),
  referralBaseUrl: read('REFERRAL_BASE_URL', 'https://feedants.com/r'),
  allowDemoLogin: bool('ALLOW_DEMO_LOGIN', nodeEnv !== 'production'),
  paymentProvider: read('PAYMENT_PROVIDER', 'mock'),
  paymentHoldMinutes: Number(read('PAYMENT_HOLD_MINUTES', 10)),
  holdSweepIntervalMs: Number(read('HOLD_SWEEP_INTERVAL_MS', 30_000)),
  uploadDir: read('UPLOAD_DIR', 'uploads'),
  maxUploadMb: Number(read('MAX_UPLOAD_MB', 100)),
  logLevel: read('LOG_LEVEL', nodeEnv === 'test' ? 'silent' : 'info'),
};

if (config.isProduction && config.jwtSecret === 'dev-only-secret-change-me') {
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = config;
