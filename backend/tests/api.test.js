const { describe, test, before, after, beforeEach } = require('node:test');
const { expect } = require('expect');
const request = require('supertest');
const { setup, teardown, reseed, makeUsers, signToken } = require('./helpers');
const Competition = require('../src/models/Competition');
const Registration = require('../src/models/Registration');
const registrationService = require('../src/services/registrationService');

const CLASSICAL = 'feedants-classical-dance';
const FREE = 'feedants-free-dance-jam';

let app;
let data;
let aditiAuth;

before(async () => {
  app = await setup();
});
after(teardown);
beforeEach(async () => {
  data = await reseed(new Date());
  aditiAuth = `Bearer ${signToken(data.users[0])}`;
});

const register = (slug, auth) => request(app).post(`/api/v1/competitions/${slug}/registrations`).set('Authorization', auth);
const taken = async (slug) => (await Competition.findOne({ slug }).lean()).spotsTaken;

describe('GET competition details', () => {
  test('returns dynamic, localized details and server time', async () => {
    const res = await request(app).get(`/api/v1/competitions/${CLASSICAL}?lang=hi`).expect(200);
    expect(res.body.serverTime).toBeDefined();
    expect(res.body.data).toMatchObject({
      title: 'फीडेंट्स शास्त्रीय नृत्य',
      prizePool: { amount: 150000, currency: 'INR' },
      availability: { capacity: 20, spotsTaken: 1, spotsLeft: 19 },
      lifecycle: { phase: 'REGISTRATION_OPEN', flags: { registrationOpen: true, submissionOpen: true } },
    });
    expect(res.body.data.rewards).toHaveLength(6);
  });

  test('404 for unknown competition, 400 for malformed id', async () => {
    await request(app).get('/api/v1/competitions/does-not-exist').expect(404);
    await request(app).get('/api/v1/competitions/bad%20slug!').expect(400);
  });

  test('viewer state reflects registration', async () => {
    const anon = await request(app).get(`/api/v1/competitions/${CLASSICAL}/viewer`).expect(200);
    expect(anon.body.data.primaryAction.type).toBe('REGISTER');
    const me = await request(app).get(`/api/v1/competitions/${CLASSICAL}/viewer`).set('Authorization', aditiAuth).expect(200);
    expect(me.body.data.registration.status).toBe('confirmed');
    expect(me.body.data.primaryAction.type).toBe('UPLOAD_SUBMISSION');
    expect(me.body.data.referral.link).toMatch(/referral123$/);
  });
});

describe('registration concurrency', () => {
  test('never oversells: 60 users racing for 19 seats', async () => {
    const users = await makeUsers(60);
    const results = await Promise.all(users.map((u) => register(CLASSICAL, u.auth)));
    const ok = results.filter((r) => r.status === 201);
    const soldOut = results.filter((r) => r.status === 409 && r.body.error.code === 'SOLD_OUT');
    expect(ok).toHaveLength(19);
    expect(soldOut).toHaveLength(41);
    expect(await taken(CLASSICAL)).toBe(20);
    const holding = await Registration.countDocuments({ status: { $in: Registration.SEAT_HOLDING } });
    expect(holding).toBe(20 + 20 + 2); // classical + folk (sold out) + kathak + semi
  });

  test('same user double-tapping holds exactly one seat', async () => {
    const [u] = await makeUsers(1);
    const results = await Promise.all(Array.from({ length: 10 }, () => register(CLASSICAL, u.auth)));
    expect(results.every((r) => [200, 201].includes(r.status))).toBe(true);
    const ids = new Set(results.map((r) => r.body.data.registration.id));
    expect(ids.size).toBe(1);
    expect(await taken(CLASSICAL)).toBe(2);
  });

  test('sold-out competition rejects new users', async () => {
    const [u] = await makeUsers(1);
    const res = await register('feedants-folk-dance', u.auth).expect(409);
    expect(res.body.error.code).toBe('SOLD_OUT');
  });

  test('closed and upcoming registration windows are enforced', async () => {
    const [u] = await makeUsers(1);
    expect((await register('feedants-kathak-showcase', u.auth).expect(409)).body.error.code).toBe('REGISTRATION_CLOSED');
    expect((await register('feedants-bharatanatyam-championship', u.auth).expect(409)).body.error.code).toBe(
      'REGISTRATION_NOT_OPEN',
    );
  });

  test('requires authentication', async () => {
    await request(app).post(`/api/v1/competitions/${CLASSICAL}/registrations`).expect(401);
  });
});

describe('payment lifecycle', () => {
  async function holdSeat() {
    const [u] = await makeUsers(1);
    const res = await register(CLASSICAL, u.auth).expect(201);
    return { u, reg: res.body.data.registration, viewer: res.body.data.viewer };
  }

  test('hold -> signed payment -> confirmed (idempotent)', async () => {
    const { u, reg, viewer } = await holdSeat();
    expect(reg.status).toBe('pending_payment');
    expect(viewer.primaryAction.type).toBe('COMPLETE_PAYMENT');

    const checkout = await request(app).post(`/api/v1/registrations/${reg.id}/payment/simulate`).set('Authorization', u.auth).expect(200);
    const confirm = () =>
      request(app).post(`/api/v1/registrations/${reg.id}/payment/confirm`).set('Authorization', u.auth).send(checkout.body.data);
    const first = await confirm().expect(200);
    expect(first.body.data.registration.status).toBe('confirmed');
    expect(first.body.data.viewer.primaryAction.type).toBe('UPLOAD_SUBMISSION');
    await confirm().expect(200); // retry-safe
    expect(await taken(CLASSICAL)).toBe(2);
  });

  test('tampered signature is rejected', async () => {
    const { u, reg } = await holdSeat();
    const res = await request(app)
      .post(`/api/v1/registrations/${reg.id}/payment/confirm`)
      .set('Authorization', u.auth)
      .send({ orderId: reg.payment.orderId, paymentId: 'pay_fake', signature: 'deadbeef' })
      .expect(402);
    expect(res.body.error.code).toBe('PAYMENT_VERIFICATION_FAILED');
  });

  test('another user cannot touch my registration', async () => {
    const { reg } = await holdSeat();
    const [other] = await makeUsers(1);
    await request(app).delete(`/api/v1/registrations/${reg.id}`).set('Authorization', other.auth).expect(404);
  });

  test('cancelling a hold releases the seat', async () => {
    const { u, reg } = await holdSeat();
    expect(await taken(CLASSICAL)).toBe(2);
    const res = await request(app).delete(`/api/v1/registrations/${reg.id}`).set('Authorization', u.auth).expect(200);
    expect(res.body.data.registration.status).toBe('cancelled');
    expect(await taken(CLASSICAL)).toBe(1);
  });

  test('paid registrations cannot be self-cancelled', async () => {
    const reg = data.registrations[0];
    const res = await request(app).delete(`/api/v1/registrations/${reg._id}`).set('Authorization', aditiAuth).expect(409);
    expect(res.body.error.code).toBe('CANCELLATION_NOT_ALLOWED');
  });

  test('expired holds are swept exactly once, and user can register again', async () => {
    const { u, reg } = await holdSeat();
    const later = new Date(Date.now() + 11 * 60_000);
    const sweeps = await Promise.all([
      registrationService.sweepExpiredHolds({ now: later }),
      registrationService.sweepExpiredHolds({ now: later }),
    ]);
    expect(sweeps[0] + sweeps[1]).toBe(1);
    expect(await taken(CLASSICAL)).toBe(1);

    const again = await register(CLASSICAL, u.auth).expect(201);
    expect(again.body.data.registration.id).toBe(reg.id); // same document reused
    expect(await taken(CLASSICAL)).toBe(2);
  });

  test('free competitions confirm instantly', async () => {
    const [u] = await makeUsers(1);
    const res = await register(FREE, u.auth).expect(201);
    expect(res.body.data.registration.status).toBe('confirmed');
  });
});

describe('submissions', () => {
  const upload = (slug, auth) =>
    request(app)
      .put(`/api/v1/competitions/${slug}/submission`)
      .set('Authorization', auth)
      .attach('file', Buffer.from('fake video bytes'), { filename: 'dance.mp4', contentType: 'video/mp4' });

  test('confirmed participant can upload and replace a submission', async () => {
    const first = await upload(CLASSICAL, aditiAuth).expect(200);
    expect(first.body.data.submission.revision).toBe(1);
    expect(first.body.data.viewer.primaryAction.type).toBe('UPDATE_SUBMISSION');
    const second = await upload(CLASSICAL, aditiAuth).expect(200);
    expect(second.body.data.submission.revision).toBe(2);
  });

  test('unregistered users and closed windows are rejected', async () => {
    const [u] = await makeUsers(1);
    expect((await upload(CLASSICAL, u.auth).expect(403)).body.error.code).toBe('NOT_REGISTERED');
    expect((await upload('feedants-kathak-showcase', aditiAuth).expect(409)).body.error.code).toBe('SUBMISSION_CLOSED');
  });

  test('non-video files are rejected', async () => {
    await request(app)
      .put(`/api/v1/competitions/${CLASSICAL}/submission`)
      .set('Authorization', aditiAuth)
      .attach('file', Buffer.from('hello'), { filename: 'notes.txt', contentType: 'text/plain' })
      .expect(400);
  });
});
