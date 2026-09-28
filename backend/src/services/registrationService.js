const Competition = require('../models/Competition');
const Registration = require('../models/Registration');
const config = require('../config');
const { getGateway } = require('../payments');
const { events, EVENTS } = require('../realtime/events');
const { isRegistrationWindowOpen } = require('../domain/lifecycle');
const { AppError, conflict, notFound, badRequest } = require('../utils/errors');
const logger = require('../utils/logger');

const S = Registration.REGISTRATION_STATUS;
const DUPLICATE_KEY = 11000;
const AVAILABILITY_PROJECTION = { spotsTaken: 1, capacity: 1 };

function emitAvailability(doc) {
  if (!doc) return;
  events.emit(EVENTS.AVAILABILITY_CHANGED, {
    competitionId: String(doc._id),
    capacity: doc.capacity,
    spotsTaken: doc.spotsTaken,
    spotsLeft: Math.max(0, doc.capacity - doc.spotsTaken),
  });
}

// check + increment in one update so parallel requests can't oversell
async function reserveSeat(competitionId, now) {
  return Competition.findOneAndUpdate(
    {
      _id: competitionId,
      status: 'published',
      'schedule.registrationOpensAt': { $lte: now },
      'schedule.registrationClosesAt': { $gt: now },
      $expr: { $lt: ['$spotsTaken', '$capacity'] },
    },
    { $inc: { spotsTaken: 1 } },
    { returnDocument: 'after', projection: AVAILABILITY_PROJECTION, lean: true },
  );
}

async function releaseSeat(competitionId) {
  const doc = await Competition.findOneAndUpdate(
    { _id: competitionId, spotsTaken: { $gt: 0 } },
    { $inc: { spotsTaken: -1 } },
    { returnDocument: 'after', projection: AVAILABILITY_PROJECTION, lean: true },
  );
  if (!doc) logger.warn({ competitionId }, 'releaseSeat found no seat to release (counter drift?)');
  emitAvailability(doc);
}

function assertCanRegister(competition, now) {
  if (competition.status === 'cancelled') {
    throw conflict('COMPETITION_CANCELLED', 'This competition has been cancelled');
  }
  if (now < new Date(competition.schedule.registrationOpensAt)) {
    throw conflict('REGISTRATION_NOT_OPEN', 'Registration has not opened yet');
  }
  if (!isRegistrationWindowOpen(competition.schedule, now)) {
    throw conflict('REGISTRATION_CLOSED', 'Registration for this competition has closed');
  }
}

async function expireHold(registrationId, now = new Date()) {
  const expired = await Registration.findOneAndUpdate(
    { _id: registrationId, status: S.PENDING_PAYMENT, holdExpiresAt: { $lte: now } },
    { $set: { status: S.EXPIRED } },
    { returnDocument: 'after', lean: true },
  );
  if (!expired) return false;
  await releaseSeat(expired.competition);
  return true;
}

async function register({ competitionId, userId, now = new Date() }) {
  const competition = await Competition.findById(competitionId).lean();
  if (!competition || competition.status === 'draft') throw notFound('Competition');

  let existing = await Registration.findOne({ competition: competitionId, user: userId }).lean();
  if (existing?.status === S.CONFIRMED) return { registration: existing, created: false };
  if (existing?.status === S.PENDING_PAYMENT) {
    if (new Date(existing.holdExpiresAt) > now) return { registration: existing, created: false };
    await expireHold(existing._id, now); // lazily expire instead of waiting for the sweeper
    existing = { ...existing, status: S.EXPIRED };
  }

  assertCanRegister(competition, now);

  const seat = await reserveSeat(competitionId, now);
  if (!seat) {
    const fresh = await Competition.findById(competitionId).lean();
    assertCanRegister(fresh, now);
    throw conflict('SOLD_OUT', 'All spots for this competition have been booked');
  }
  emitAvailability(seat);

  try {
    const fields = await buildRegistrationFields(competition, userId, now);
    let registration;
    if (existing) {
      // Reuse the (competition, user) document from a previous expired/cancelled attempt.
      registration = await Registration.findOneAndUpdate(
        { _id: existing._id, status: { $in: [S.CANCELLED, S.EXPIRED] } },
        fields.status === S.CONFIRMED
          ? { $set: fields, $unset: { holdExpiresAt: 1 } }
          : { $set: fields },
        { returnDocument: 'after', lean: true },
      );
      if (!registration) throw Object.assign(new Error('registration race lost'), { raceLost: true });
    } else {
      registration = (
        await Registration.create({ competition: competitionId, user: userId, ...fields })
      ).toObject();
    }
    return { registration, created: true };
  } catch (err) {
    // Compensate: give the seat back, then resolve races in favour of the winner.
    await releaseSeat(competitionId);
    if (err.code === DUPLICATE_KEY || err.raceLost) {
      const winner = await Registration.findOne({ competition: competitionId, user: userId }).lean();
      return { registration: winner, created: false };
    }
    throw err;
  }
}

async function buildRegistrationFields(competition, userId, now) {
  if (competition.entryFee === 0) {
    return { status: S.CONFIRMED, amount: 0, currency: competition.currency, confirmedAt: now };
  }
  const gateway = getGateway();
  const order = await gateway.createOrder({
    amount: competition.entryFee,
    currency: competition.currency,
    receipt: `${competition._id}:${userId}`,
  });
  return {
    status: S.PENDING_PAYMENT,
    amount: competition.entryFee,
    currency: competition.currency,
    holdExpiresAt: new Date(now.getTime() + config.paymentHoldMinutes * 60_000),
    payment: { provider: gateway.name, orderId: order.orderId },
  };
}

async function confirmPayment({ registrationId, userId, orderId, paymentId, signature, now = new Date() }) {
  const registration = await Registration.findOne({ _id: registrationId, user: userId }).lean();
  if (!registration) throw notFound('Registration');
  if (registration.status === S.CONFIRMED) return registration;
  if (registration.status !== S.PENDING_PAYMENT) {
    throw conflict('HOLD_EXPIRED', 'Your seat reservation expired. Please register again.');
  }
  if (registration.payment?.orderId !== orderId) throw badRequest('orderId does not match this registration');

  const verified = await getGateway().verifyPayment({ orderId, paymentId, signature });
  if (!verified) throw new AppError(402, 'PAYMENT_VERIFICATION_FAILED', 'Payment could not be verified');

  // no holdExpiresAt check on purpose: a late payment still wins if the sweeper hasn't released the seat yet
  const confirmed = await Registration.findOneAndUpdate(
    { _id: registrationId, status: S.PENDING_PAYMENT },
    {
      $set: { status: S.CONFIRMED, confirmedAt: now, 'payment.paymentId': paymentId, 'payment.paidAt': now },
      $unset: { holdExpiresAt: 1 },
    },
    { returnDocument: 'after', lean: true },
  );
  if (confirmed) return confirmed;

  const latest = await Registration.findById(registrationId).lean();
  if (latest?.status === S.CONFIRMED) return latest;
  // Lost the race against the sweeper: money captured but seat released.
  // In production this enqueues an automatic refund.
  logger.error({ registrationId, paymentId }, 'payment received for expired hold; refund required');
  throw conflict('HOLD_EXPIRED', 'Your seat reservation expired before payment completed. A refund will be issued.');
}

async function cancel({ registrationId, userId }) {
  const cancelled = await Registration.findOneAndUpdate(
    { _id: registrationId, user: userId, status: S.PENDING_PAYMENT },
    { $set: { status: S.CANCELLED }, $unset: { holdExpiresAt: 1 } },
    { returnDocument: 'after', lean: true },
  );
  if (cancelled) {
    await releaseSeat(cancelled.competition);
    return cancelled;
  }
  const registration = await Registration.findOne({ _id: registrationId, user: userId }).lean();
  if (!registration) throw notFound('Registration');
  if (registration.status === S.CONFIRMED) {
    throw conflict('CANCELLATION_NOT_ALLOWED', 'Paid registrations can only be cancelled under the refund policy');
  }
  return registration; // already cancelled/expired: idempotent
}

async function sweepExpiredHolds({ now = new Date(), batchSize = 200 } = {}) {
  const stale = await Registration.find(
    { status: S.PENDING_PAYMENT, holdExpiresAt: { $lte: now } },
    { _id: 1 },
  )
    .limit(batchSize)
    .lean();
  let released = 0;
  for (const { _id } of stale) {
    if (await expireHold(_id, now)) released += 1;
  }
  return released;
}

module.exports = { register, confirmPayment, cancel, sweepExpiredHolds, expireHold };
