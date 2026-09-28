const { Schema, model } = require('mongoose');
const { LocalizedString, httpUrl } = require('./shared');

// amounts are in paise. spotsTaken counts confirmed + pending holds and is only
// changed via atomic $inc (see registrationService); scripts/reconcile.js rebuilds it.

const JudgeSchema = new Schema(
  {
    name: { type: String, required: true },
    title: { type: LocalizedString, required: true },
    experienceYears: { type: Number, min: 0 },
    photoUrl: { type: String, validate: httpUrl },
    introVideoUrl: { type: String, validate: httpUrl },
  },
  { _id: false },
);

const ScheduleSchema = new Schema(
  {
    registrationOpensAt: { type: Date, required: true },
    registrationClosesAt: { type: Date, required: true },
    submissionStartsAt: { type: Date, required: true },
    submissionEndsAt: { type: Date, required: true },
    resultAt: { type: Date, required: true },
  },
  { _id: false },
);

const WinnerSchema = new Schema(
  {
    name: { type: String, required: true },
    position: { type: Number, required: true, min: 1 },
    thumbnailUrl: { type: String, validate: httpUrl },
    videoUrl: { type: String, validate: httpUrl },
  },
  { _id: false },
);

const RewardSchema = new Schema(
  {
    position: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const CompetitionSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ['draft', 'published', 'cancelled'], default: 'draft', index: true },
    title: { type: LocalizedString, required: true },
    category: { type: LocalizedString, required: true },
    tags: { type: [LocalizedString], default: [] },
    awardsCertificate: { type: Boolean, default: false },

    currency: { type: String, default: 'INR' },
    prizePool: { type: Number, required: true, min: 0 },
    entryFee: { type: Number, required: true, min: 0 },

    capacity: { type: Number, required: true, min: 1 },
    spotsTaken: { type: Number, default: 0, min: 0 },

    judge: { type: JudgeSchema, required: true },
    schedule: { type: ScheduleSchema, required: true },
    previousWinners: { type: [WinnerSchema], default: [] },

    about: { type: LocalizedString, required: true },
    judgingParameters: { type: [LocalizedString], default: [] },
    rules: { type: [LocalizedString], default: [] },

    rewards: { type: [RewardSchema], default: [] },
    disclaimer: { type: LocalizedString },
    prizeInfoVideoUrl: { type: String, validate: httpUrl },
    refundPolicyUrl: { type: String, validate: httpUrl },
    paymentProvider: { type: String, default: 'Razorpay' },
    referralRewardPerSignup: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, optimisticConcurrency: true },
);

CompetitionSchema.index({ status: 1, 'schedule.registrationClosesAt': 1 });

CompetitionSchema.pre('validate', function validateBusinessRules() {
  const s = this.schedule;
  if (s) {
    const order = [
      ['registrationOpensAt', 'registrationClosesAt'],
      ['submissionStartsAt', 'submissionEndsAt'],
      ['registrationClosesAt', 'submissionEndsAt'],
      ['submissionEndsAt', 'resultAt'],
    ];
    for (const [a, b] of order) {
      if (s[a] && s[b] && s[a] >= s[b]) this.invalidate(`schedule.${a}`, `${a} must be before ${b}`);
    }
  }
  if (this.spotsTaken > this.capacity) this.invalidate('spotsTaken', 'spotsTaken cannot exceed capacity');

  const positions = this.rewards.map((r) => r.position);
  if (new Set(positions).size !== positions.length) this.invalidate('rewards', 'duplicate reward position');
  const total = this.rewards.reduce((sum, r) => sum + r.amount, 0);
  if (total > this.prizePool) this.invalidate('rewards', 'rewards exceed the prize pool');
});

module.exports = model('Competition', CompetitionSchema);
