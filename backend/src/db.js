const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./utils/logger');

mongoose.set('strictQuery', true);

async function connectDb(uri = config.mongoUri) {
  await mongoose.connect(uri, {
    maxPoolSize: 50,
    serverSelectionTimeoutMS: 10_000,
    autoIndex: !config.isProduction, // in production indexes are built by a migration step
  });
  logger.info({ db: mongoose.connection.name }, 'mongo connected');
  return mongoose.connection;
}

module.exports = { connectDb };
