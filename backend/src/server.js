const http = require('http');
const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./utils/logger');
const { connectDb } = require('./db');
const { createApp } = require('./app');
const { attachRealtime } = require('./realtime/socket');
const { startHoldSweeper } = require('./jobs/holdSweeper');

async function main() {
  await connectDb();
  const server = http.createServer(createApp());
  const realtime = attachRealtime(server);
  const stopSweeper = startHoldSweeper(config.holdSweepIntervalMs);

  server.listen(config.port, () => logger.info({ port: config.port }, 'api listening'));

  const shutdown = async (signal) => {
    logger.info({ signal }, 'shutting down');
    stopSweeper();
    await realtime.close();
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, 'failed to start');
  process.exit(1);
});
