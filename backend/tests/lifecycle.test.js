const { describe, test } = require('node:test');
const { expect } = require('expect');
const { computeLifecycle, computePrimaryAction, PHASE, ACTION } = require('../src/domain/lifecycle');

const DAY = 86_400_000;
const now = new Date('2026-08-08T12:00:00Z');
const at = (days) => new Date(now.getTime() + days * DAY);

const competition = (overrides = {}) => ({
  status: 'published',
  capacity: 20,
  spotsTaken: 1,
  entryFee: 9900,
  schedule: {
    registrationOpensAt: at(-10),
    registrationClosesAt: at(2),
    submissionStartsAt: at(-2),
    submissionEndsAt: at(20),
    resultAt: at(22),
  },
  ...overrides,
});

describe('computeLifecycle', () => {
  test('overlapping windows: registration and submission both open', () => {
    const l = computeLifecycle(competition(), now);
    expect(l.phase).toBe(PHASE.REGISTRATION_OPEN);
    expect(l.flags).toMatchObject({ registrationOpen: true, submissionOpen: true, isFull: false });
    expect(l.nextMilestone.type).toBe('REGISTRATION_CLOSES');
  });

  for (const [day, phase] of [
    [-11, PHASE.UPCOMING],
    [3, PHASE.SUBMISSION_OPEN],
    [21, PHASE.JUDGING],
    [23, PHASE.RESULTS_ANNOUNCED],
  ]) {
    test(`at day ${day} phase is ${phase}`, () => {
      expect(computeLifecycle(competition(), at(day)).phase).toBe(phase);
    });
  }

  test('registration closes exactly at the deadline', () => {
    const c = competition();
    expect(computeLifecycle(c, c.schedule.registrationClosesAt).flags.registrationOpen).toBe(false);
  });

  test('cancelled competitions expose no open windows', () => {
    const l = computeLifecycle(competition({ status: 'cancelled' }), now);
    expect(l.phase).toBe(PHASE.CANCELLED);
    expect(l.flags.registrationOpen).toBe(false);
    expect(l.nextMilestone).toBeNull();
  });
});

describe('computePrimaryAction', () => {
  const confirmed = { status: 'confirmed' };

  test('anonymous user can register while open', () => {
    expect(computePrimaryAction({ competition: competition(), now }).type).toBe(ACTION.REGISTER);
  });

  test('sold out blocks new registrations', () => {
    const a = computePrimaryAction({ competition: competition({ spotsTaken: 20 }), now });
    expect(a).toMatchObject({ type: ACTION.SOLD_OUT, enabled: false });
  });

  test('sold out still lets confirmed participants upload', () => {
    const a = computePrimaryAction({ competition: competition({ spotsTaken: 20 }), registration: confirmed, now });
    expect(a).toMatchObject({ type: ACTION.UPLOAD_SUBMISSION, enabled: true });
  });

  test('valid payment hold asks to complete payment; expired hold falls back to register', () => {
    const valid = { status: 'pending_payment', holdExpiresAt: new Date(now.getTime() + 60_000) };
    const stale = { status: 'pending_payment', holdExpiresAt: new Date(now.getTime() - 60_000) };
    expect(computePrimaryAction({ competition: competition(), registration: valid, now }).type).toBe(ACTION.COMPLETE_PAYMENT);
    expect(computePrimaryAction({ competition: competition(), registration: stale, now }).type).toBe(ACTION.REGISTER);
  });

  test('confirmed before submissions open', () => {
    const a = computePrimaryAction({ competition: competition(), registration: confirmed, now: at(-5) });
    expect(a.type).toBe(ACTION.SUBMISSION_NOT_STARTED);
  });

  test('submitted participant can update, then awaits results, then views results', () => {
    const submission = { updatedAt: now };
    const args = { competition: competition(), registration: confirmed, submission };
    expect(computePrimaryAction({ ...args, now }).type).toBe(ACTION.UPDATE_SUBMISSION);
    expect(computePrimaryAction({ ...args, now: at(21) }).type).toBe(ACTION.AWAITING_RESULTS);
    expect(computePrimaryAction({ ...args, now: at(23) }).type).toBe(ACTION.VIEW_RESULTS);
  });

  test('confirmed without submission after deadline has missed it', () => {
    const a = computePrimaryAction({ competition: competition(), registration: confirmed, now: at(21) });
    expect(a.type).toBe(ACTION.SUBMISSION_MISSED);
  });

  test('closed and not-yet-open registration', () => {
    expect(computePrimaryAction({ competition: competition(), now: at(5) }).type).toBe(ACTION.REGISTRATION_CLOSED);
    expect(computePrimaryAction({ competition: competition(), now: at(-11) }).type).toBe(ACTION.REGISTRATION_NOT_OPEN);
  });
});
