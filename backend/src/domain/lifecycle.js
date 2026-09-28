const PHASE = Object.freeze({
  DRAFT: 'DRAFT',
  CANCELLED: 'CANCELLED',
  UPCOMING: 'UPCOMING',
  REGISTRATION_OPEN: 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED: 'REGISTRATION_CLOSED',
  SUBMISSION_OPEN: 'SUBMISSION_OPEN',
  JUDGING: 'JUDGING',
  RESULTS_ANNOUNCED: 'RESULTS_ANNOUNCED',
});

const MILESTONES = [
  ['REGISTRATION_OPENS', 'registrationOpensAt'],
  ['REGISTRATION_CLOSES', 'registrationClosesAt'],
  ['SUBMISSION_STARTS', 'submissionStartsAt'],
  ['SUBMISSION_ENDS', 'submissionEndsAt'],
  ['RESULTS', 'resultAt'],
];

const ms = (date) => new Date(date).getTime();

function isRegistrationWindowOpen(schedule, now) {
  const t = ms(now);
  return t >= ms(schedule.registrationOpensAt) && t < ms(schedule.registrationClosesAt);
}

function isSubmissionWindowOpen(schedule, now) {
  const t = ms(now);
  return t >= ms(schedule.submissionStartsAt) && t < ms(schedule.submissionEndsAt);
}

function computePhase(competition, now) {
  const { schedule, status } = competition;
  const t = ms(now);
  if (status === 'cancelled') return PHASE.CANCELLED;
  if (status === 'draft') return PHASE.DRAFT;
  if (t >= ms(schedule.resultAt)) return PHASE.RESULTS_ANNOUNCED;
  if (t >= ms(schedule.submissionEndsAt)) return PHASE.JUDGING;
  if (isRegistrationWindowOpen(schedule, now)) return PHASE.REGISTRATION_OPEN;
  if (isSubmissionWindowOpen(schedule, now)) return PHASE.SUBMISSION_OPEN;
  if (t < ms(schedule.registrationOpensAt)) return PHASE.UPCOMING;
  return PHASE.REGISTRATION_CLOSED;
}

function nextMilestone(schedule, now) {
  const t = ms(now);
  const upcoming = MILESTONES.map(([type, key]) => ({ type, at: new Date(schedule[key]) }))
    .filter((m) => m.at.getTime() > t)
    .sort((a, b) => a.at - b.at);
  return upcoming[0] || null;
}

function computeLifecycle(competition, now = new Date()) {
  const active = competition.status === 'published';
  const spotsLeft = Math.max(0, competition.capacity - competition.spotsTaken);
  return {
    phase: computePhase(competition, now),
    flags: {
      registrationOpen: active && isRegistrationWindowOpen(competition.schedule, now),
      submissionOpen: active && isSubmissionWindowOpen(competition.schedule, now),
      resultsAnnounced: active && ms(now) >= ms(competition.schedule.resultAt),
      isFull: spotsLeft === 0,
    },
    nextMilestone: active ? nextMilestone(competition.schedule, now) : null,
  };
}

const ACTION = Object.freeze({
  REGISTER: 'REGISTER',
  COMPLETE_PAYMENT: 'COMPLETE_PAYMENT',
  SOLD_OUT: 'SOLD_OUT',
  REGISTRATION_NOT_OPEN: 'REGISTRATION_NOT_OPEN',
  REGISTRATION_CLOSED: 'REGISTRATION_CLOSED',
  SUBMISSION_NOT_STARTED: 'SUBMISSION_NOT_STARTED',
  UPLOAD_SUBMISSION: 'UPLOAD_SUBMISSION',
  UPDATE_SUBMISSION: 'UPDATE_SUBMISSION',
  AWAITING_RESULTS: 'AWAITING_RESULTS',
  SUBMISSION_MISSED: 'SUBMISSION_MISSED',
  VIEW_RESULTS: 'VIEW_RESULTS',
  UNAVAILABLE: 'UNAVAILABLE',
});

const action = (type, enabled, meta = {}) => ({ type, enabled, meta });

function computePrimaryAction({ competition, registration, submission, now = new Date() }) {
  const { phase, flags } = computeLifecycle(competition, now);
  const { schedule } = competition;

  if (phase === PHASE.CANCELLED || phase === PHASE.DRAFT) return action(ACTION.UNAVAILABLE, false);

  const status = registration && registration.status;
  const holdValid =
    status === 'pending_payment' && ms(registration.holdExpiresAt) > ms(now);

  if (status === 'confirmed') {
    if (flags.resultsAnnounced) return action(ACTION.VIEW_RESULTS, true);
    if (flags.submissionOpen) {
      return submission
        ? action(ACTION.UPDATE_SUBMISSION, true, { submittedAt: submission.updatedAt })
        : action(ACTION.UPLOAD_SUBMISSION, true, { endsAt: schedule.submissionEndsAt });
    }
    if (ms(now) < ms(schedule.submissionStartsAt)) {
      return action(ACTION.SUBMISSION_NOT_STARTED, false, { at: schedule.submissionStartsAt });
    }
    return submission
      ? action(ACTION.AWAITING_RESULTS, false, { at: schedule.resultAt })
      : action(ACTION.SUBMISSION_MISSED, false);
  }

  if (holdValid && flags.registrationOpen) {
    return action(ACTION.COMPLETE_PAYMENT, true, { holdExpiresAt: registration.holdExpiresAt });
  }

  if (ms(now) < ms(schedule.registrationOpensAt)) {
    return action(ACTION.REGISTRATION_NOT_OPEN, false, { at: schedule.registrationOpensAt });
  }
  if (!flags.registrationOpen) return action(ACTION.REGISTRATION_CLOSED, false);
  if (flags.isFull) return action(ACTION.SOLD_OUT, false);
  return action(ACTION.REGISTER, true, { amount: competition.entryFee });
}

module.exports = {
  PHASE,
  ACTION,
  computeLifecycle,
  computePrimaryAction,
  isRegistrationWindowOpen,
  isSubmissionWindowOpen,
};
