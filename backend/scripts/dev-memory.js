/*
 * Zero-setup local run: starts an embedded MongoDB (mongodb-memory-server),
 * seeds the demo data and boots the API against it. Data is lost on exit.
 * Use `npm run dev` with a real MongoDB for anything persistent.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  // Fixed port so `npm run seed` / `loadtest` / `reconcile` reach it with the default MONGODB_URI.
  const mongo = await MongoMemoryServer.create({ instance: { port: Number(process.env.MEMORY_MONGO_PORT || 27017) } });
  process.env.MONGODB_URI = mongo.getUri('feedants');

  const mongoose = require('mongoose');
  const { seed } = require('./seed');
  await mongoose.connect(process.env.MONGODB_URI);
  const data = await seed();
  await mongoose.disconnect();
  console.log(`Embedded MongoDB at ${process.env.MONGODB_URI} seeded with ${data.competitions.length} competitions`);

  require('../src/server');
  const stop = () => mongo.stop().finally(() => process.exit(0));
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})();
