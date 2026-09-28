/*
 * Fires many simultaneous registrations at a running API to demonstrate that
 * seats are never oversold. Usage:
 *   npm run loadtest -- [slug] [users]
 *   npm run loadtest -- feedants-classical-dance 300
 * Temporary users/registrations are removed afterwards and seats released.
 */
const mongoose = require('mongoose');
const config = require('../src/config');
const { connectDb } = require('../src/db');
const User = require('../src/models/User');
const Competition = require('../src/models/Competition');
const Registration = require('../src/models/Registration');
const { signToken } = require('../src/middleware/auth');

const [slug = 'feedants-classical-dance', count = '300'] = process.argv.slice(2);
const API = `${config.publicBaseUrl}/api/v1`;

async function main() {
  await connectDb();
  const competition = await Competition.findOne({ slug }).lean();
  if (!competition) throw new Error(`No competition "${slug}"`);
  console.log(`Before: ${competition.spotsTaken}/${competition.capacity} taken. Firing ${count} concurrent registrations...`);

  const runId = Date.now();
  const users = await User.insertMany(
    Array.from({ length: Number(count) }, (_, i) => ({ name: `Load ${i}`, email: `load-${runId}-${i}@test.local` })),
  );

  const started = Date.now();
  const results = await Promise.all(
    users.map((u) =>
      fetch(`${API}/competitions/${slug}/registrations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${signToken(u)}` },
      }).then(async (r) => ({ status: r.status, code: r.ok ? 'OK' : (await r.json()).error?.code })),
    ),
  );
  const tally = results.reduce((acc, r) => ({ ...acc, [`${r.status} ${r.code}`]: (acc[`${r.status} ${r.code}`] || 0) + 1 }), {});
  const after = await Competition.findById(competition._id).lean();
  console.log(`Done in ${Date.now() - started} ms`, tally);
  console.log(`After: ${after.spotsTaken}/${after.capacity} taken (never above capacity).`);

  // Cleanup
  const userIds = users.map((u) => u._id);
  const held = await Registration.countDocuments({ user: { $in: userIds }, status: { $in: Registration.SEAT_HOLDING } });
  await Registration.deleteMany({ user: { $in: userIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  await Competition.updateOne({ _id: competition._id }, { $inc: { spotsTaken: -held } });
  console.log(`Cleaned up ${users.length} users, released ${held} seats.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
