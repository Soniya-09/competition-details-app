/*
 * Rebuilds Competition.spotsTaken from the registrations collection.
 * The counter can only drift if a process crashes between a registration state
 * change and its compensating seat update. Run during low traffic (or with
 * registrations paused), since concurrent registrations can race the rewrite.
 */
const mongoose = require('mongoose');
const { connectDb } = require('../src/db');
const Competition = require('../src/models/Competition');
const Registration = require('../src/models/Registration');

async function reconcile() {
  const counts = await Registration.aggregate([
    { $match: { status: { $in: Registration.SEAT_HOLDING } } },
    { $group: { _id: '$competition', taken: { $sum: 1 } } },
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.taken]));
  const competitions = await Competition.find({}, { spotsTaken: 1, slug: 1 }).lean();
  const fixes = [];
  for (const c of competitions) {
    const actual = byId.get(String(c._id)) || 0;
    if (actual !== c.spotsTaken) {
      fixes.push({ slug: c.slug, from: c.spotsTaken, to: actual });
      await Competition.updateOne({ _id: c._id }, { $set: { spotsTaken: actual } });
    }
  }
  return fixes;
}

if (require.main === module) {
  connectDb()
    .then(reconcile)
    .then((fixes) => console.log(fixes.length ? fixes : 'All counters consistent'))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}

module.exports = { reconcile };
