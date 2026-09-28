const mongoose = require('mongoose');
const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const Submission = require('../models/Submission');
const User = require('../models/User');
const config = require('../config');
const { computeLifecycle, computePrimaryAction } = require('../domain/lifecycle');
const { t } = require('../utils/localize');
const { notFound } = require('../utils/errors');

const money = (amount, currency) => ({ amount, currency });

async function findVisible(idOrSlug) {
  const filter = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: String(idOrSlug).toLowerCase() };
  const competition = await Competition.findOne({ ...filter, status: { $ne: 'draft' } }).lean();
  if (!competition) throw notFound('Competition');
  return competition;
}

function toAvailability(c) {
  return {
    capacity: c.capacity,
    spotsTaken: c.spotsTaken,
    spotsLeft: Math.max(0, c.capacity - c.spotsTaken),
  };
}

function toPublicDto(c, lang, now) {
  return {
    id: String(c._id),
    slug: c.slug,
    status: c.status,
    title: t(c.title, lang),
    category: t(c.category, lang),
    tags: c.tags.map((tag) => t(tag, lang)),
    awardsCertificate: c.awardsCertificate,
    prizePool: money(c.prizePool, c.currency),
    entryFee: money(c.entryFee, c.currency),
    availability: toAvailability(c),
    judge: {
      name: c.judge.name,
      title: t(c.judge.title, lang),
      experienceYears: c.judge.experienceYears,
      photoUrl: c.judge.photoUrl,
      introVideoUrl: c.judge.introVideoUrl,
    },
    schedule: c.schedule,
    lifecycle: computeLifecycle(c, now),
    previousWinners: [...c.previousWinners].sort((a, b) => a.position - b.position),
    about: t(c.about, lang),
    judgingParameters: c.judgingParameters.map((p) => t(p, lang)),
    rules: c.rules.map((r) => t(r, lang)),
    rewards: [...c.rewards]
      .sort((a, b) => a.position - b.position)
      .map((r) => ({ position: r.position, prize: money(r.amount, c.currency) })),
    disclaimer: t(c.disclaimer, lang),
    prizeInfoVideoUrl: c.prizeInfoVideoUrl,
    refundPolicyUrl: c.refundPolicyUrl,
    paymentProvider: c.paymentProvider,
    referralRewardPerSignup: money(c.referralRewardPerSignup, c.currency),
  };
}

function toRegistrationDto(r) {
  if (!r) return null;
  return {
    id: String(r._id),
    status: r.status,
    amount: money(r.amount, r.currency),
    holdExpiresAt: r.holdExpiresAt || null,
    confirmedAt: r.confirmedAt || null,
    payment: r.payment ? { provider: r.payment.provider, orderId: r.payment.orderId } : null,
  };
}

function toSubmissionDto(s) {
  if (!s) return null;
  return {
    id: String(s._id),
    fileUrl: s.fileUrl,
    originalName: s.originalName,
    sizeBytes: s.sizeBytes,
    revision: s.revision,
    updatedAt: s.updatedAt,
  };
}

async function getDetails(idOrSlug, lang, now = new Date()) {
  const competition = await findVisible(idOrSlug);
  return toPublicDto(competition, lang, now);
}

async function getAvailability(idOrSlug) {
  const c = await findVisible(idOrSlug);
  return { competitionId: String(c._id), ...toAvailability(c) };
}

async function getViewerState(idOrSlug, userId, now = new Date()) {
  const competition = await findVisible(idOrSlug);
  const [registration, submission, user] = userId
    ? await Promise.all([
        Registration.findOne({ competition: competition._id, user: userId }).lean(),
        Submission.findOne({ competition: competition._id, user: userId }).lean(),
        User.findById(userId, { referralCode: 1 }).lean(),
      ])
    : [null, null, null];
  return {
    competitionId: String(competition._id),
    registration: toRegistrationDto(registration),
    submission: toSubmissionDto(submission),
    primaryAction: computePrimaryAction({ competition, registration, submission, now }),
    referral: user
      ? {
          code: user.referralCode,
          link: `${config.referralBaseUrl}/${user.referralCode}`,
          rewardPerSignup: money(competition.referralRewardPerSignup, competition.currency),
        }
      : null,
  };
}

async function list({ lang, limit = 20, now = new Date() }) {
  const docs = await Competition.find({ status: 'published' })
    .sort({ 'schedule.registrationClosesAt': -1 })
    .limit(limit)
    .lean();
  return docs.map((c) => ({
    id: String(c._id),
    slug: c.slug,
    title: t(c.title, lang),
    category: t(c.category, lang),
    prizePool: money(c.prizePool, c.currency),
    entryFee: money(c.entryFee, c.currency),
    availability: toAvailability(c),
    lifecycle: computeLifecycle(c, now),
  }));
}

module.exports = {
  findVisible,
  getDetails,
  getAvailability,
  getViewerState,
  list,
  toRegistrationDto,
  toSubmissionDto,
};
