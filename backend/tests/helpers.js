process.env.NODE_ENV = 'test';
process.env.UPLOAD_DIR = require('path').join(require('os').tmpdir(), 'feedants-test-uploads');

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('../src/app');
const { seed } = require('../scripts/seed');
const User = require('../src/models/User');
const { signToken } = require('../src/middleware/auth');

let mongo;

async function setup() {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  return createApp();
}

async function teardown() {
  await mongoose.disconnect();
  await mongo?.stop();
}

async function reseed(now) {
  return seed({ now });
}

async function makeUsers(n) {
  const stamp = new mongoose.Types.ObjectId();
  const users = await User.insertMany(
    Array.from({ length: n }, (_, i) => ({ name: `Tester ${i}`, email: `t-${stamp}-${i}@test.local` })),
  );
  return users.map((u) => ({ user: u, auth: `Bearer ${signToken(u)}` }));
}

module.exports = { setup, teardown, reseed, makeUsers, signToken };
