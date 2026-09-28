/* Resets the database to the demo dataset. Refuses to run in production. */
const mongoose = require('mongoose');
const config = require('../src/config');
const { connectDb } = require('../src/db');
const { buildSeed } = require('./seedData');
const User = require('../src/models/User');
const Competition = require('../src/models/Competition');
const Registration = require('../src/models/Registration');
const Submission = require('../src/models/Submission');
const Testimonial = require('../src/models/Testimonial');

async function seed({ now = new Date() } = {}) {
  const data = buildSeed(now);
  await Promise.all([User, Competition, Registration, Submission, Testimonial].map((m) => m.deleteMany({})));
  await Promise.all([User, Competition, Registration, Submission, Testimonial].map((m) => m.syncIndexes()));
  await User.insertMany(data.users);
  await Competition.insertMany(data.competitions); // runs schema validation incl. schedule rules
  await Registration.insertMany(data.registrations);
  await Submission.insertMany(data.submissions);
  await Testimonial.insertMany(data.testimonials);
  return data;
}

if (require.main === module) {
  if (config.isProduction) {
    console.error('Refusing to seed a production database.');
    process.exit(1);
  }
  connectDb()
    .then(() => seed())
    .then((data) => {
      console.log(`Seeded ${data.competitions.length} competitions and ${data.users.length} users:`);
      for (const c of data.competitions) console.log(`  - ${c.slug} (${c.spotsTaken}/${c.capacity})`);
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}

module.exports = { seed };
