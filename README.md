# Feedants: Competition Details (Full-Stack Module)

A working version of the Feedants Competition Details screen. It has a React Native (Expo) app, a Node.js + Express API and a MongoDB database. Everything on the screen comes from the backend: prize pool, seats, judge, dates, winners, rewards, referral link and the main button. The screen reacts to the competition lifecycle, to the user's registration and payment state, and to other users booking seats in real time.

```
.
├── backend/            Express API, MongoDB models, business rules, tests
│   ├── src/
│   │   ├── domain/        pure lifecycle + "primary action" rules (unit tested)
│   │   ├── services/      registration (concurrency), competition, submission
│   │   ├── models/        Mongoose schemas + indexes
│   │   ├── routes/        HTTP layer (validation, auth, rate limits)
│   │   ├── payments/      gateway abstraction (mock mirrors Razorpay)
│   │   ├── realtime/      domain event bus + Socket.IO fan-out
│   │   └── jobs/          expired payment-hold sweeper
│   ├── scripts/        seed, dev-memory, loadtest, reconcile
│   └── tests/          node:test + supertest + in-memory MongoDB
├── mobile/             Expo (SDK 57) React Native app
│   └── src/
│       ├── screens/       CompetitionDetails, Competitions (list), Testimonials
│       ├── components/    one component per design section + ui primitives
│       ├── hooks/         useCompetition (data + live updates), useCompetitionActions
│       ├── api/ auth/ i18n/ realtime/ lib/
└── docker-compose.yml  MongoDB (+ optional API container)
```

---

## Running it

### Prerequisites
- Node.js 20+ (tested on 22)
- For the app: the Expo Go app on a phone, or an Android emulator / iOS simulator. A web browser also works.
- MongoDB is optional. The backend can run against an embedded MongoDB with no setup.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env            # defaults work as-is for local dev
```

Pick one way to get a database:

| Option | Command | Notes |
|---|---|---|
| A. Zero setup (embedded MongoDB, auto-seeded) | `npm run dev:memory` | Easiest. Data resets on restart. |
| B. Docker | `docker compose up -d mongo` (from repo root), then `npm run seed && npm run dev` | Persistent |
| C. Your own MongoDB / Atlas | set `MONGODB_URI` in `.env`, then `npm run seed && npm run dev` | |

The API listens on `http://localhost:4000`. Check it with `GET /health`.

> Seed dates are relative to the moment you seed, so the demo always opens in the same state as the design ("Registration closes in 01d : 06h : 28m"). Run `npm run seed` again at any time to reset.

### 2. Mobile app

```bash
cd mobile
npm install
npx expo start          # press a (Android), i (iOS), w (web), or scan the QR with Expo Go
```

The app finds the API on its own. It uses the IP of the machine running the Expo dev server, on port 4000, so Expo Go on a phone on the same Wi-Fi works with no configuration. To point it somewhere else:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000 npx expo start
```

If you use a physical phone, also set `PUBLIC_BASE_URL` in `backend/.env` to your LAN IP so uploaded file URLs resolve.

### 3. Tests & load test

```bash
cd backend
npm test                                         # 33 tests: lifecycle rules + API incl. race conditions
npm run loadtest -- feedants-classical-dance 300 # against a running API
```

Sample load-test output (300 users fire at once for 19 free seats):
```
Done in 12434 ms { '201 OK': 19, '409 SOLD_OUT': 281 }
After: 20/20 taken (never above capacity).
```

---

## Environment variables (backend)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | HTTP port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/feedants` | Database |
| `JWT_SECRET` | dev value | Required in production (startup fails without it) |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `ALLOW_DEMO_LOGIN` | `true` outside production | Enables the demo-account picker |
| `PAYMENT_PROVIDER` | `mock` | Payment gateway implementation |
| `PAYMENT_HOLD_MINUTES` | `10` | How long an unpaid registration holds a seat |
| `HOLD_SWEEP_INTERVAL_MS` | `30000` | How often expired holds are released |
| `PUBLIC_BASE_URL` | `http://localhost:4000` | Used to build uploaded-file URLs |
| `UPLOAD_DIR` / `MAX_UPLOAD_MB` | `uploads` / `100` | Submission storage and limit |
| `REFERRAL_BASE_URL` | `https://feedants.com/r` | Base of each user's referral link |
| `CORS_ORIGIN` | `*` | Comma-separated allowed origins |
| `LOG_LEVEL` | `info` | pino log level |

Mobile: `EXPO_PUBLIC_API_URL` (optional, see above).

---

## Demo walkthrough

Accounts. Tap the Profile tab (or any action that needs sign-in) to pick a demo user:

| User | State in "Feedants Classical Dance" |
|---|---|
| Aditi Sharma | Registered and paid. Sees the Registered badge and Upload Submission (matches the design) |
| Rahul Mehta / Sneha Iyer | Not registered. Sees Register Now · ₹99 |
| *(guest)* | Can browse; registering asks them to sign in |

Competitions (tap "Go back" or the Competitions tab). Each one shows a different lifecycle state:

| Slug | State |
|---|---|
| `feedants-classical-dance` | Registration and submissions open (the design), 1/20 booked |
| `feedants-folk-dance` | Sold out (20/20) |
| `feedants-bharatanatyam-championship` | Upcoming. Registration opens in 2 days |
| `feedants-kathak-showcase` | Judging. Aditi submitted, so she sees "Submission Received" |
| `feedants-semi-classical-cup` | Results announced |
| `feedants-free-dance-jam` | Free entry. Registration confirms instantly, capacity 5 |

Things to try
1. As Rahul: Register Now. A seat is reserved, the checkout sheet shows the countdown for the hold, and Pay ₹99 confirms. The badge becomes Registered and the button becomes Upload Submission.
2. Open the same competition on two devices or simulators. Registering on one updates "Only N spots left" on the other straight away (Socket.IO).
3. Register, then Cancel & release seat (or wait for the hold to expire). The seat comes back.
4. As Aditi: Upload Submission opens a video picker and uploads. The button becomes Replace Submission.
5. Switch ENG / हिंदी. Both the UI labels and the competition content from the server change language.
6. Let a countdown reach zero. The app refetches and the button and banner move to the next state on their own.

---

## API

Base path `/api/v1`. Every response looks like `{ data, serverTime }`. Errors look like `{ error: { code, message, details? } }` with stable `code`s (`SOLD_OUT`, `REGISTRATION_CLOSED`, `HOLD_EXPIRED`, `NOT_REGISTERED`, …).

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/competitions` | – | List (cards) |
| GET | `/competitions/:idOrSlug` | – | Public details, localized (`?lang=hi` or `Accept-Language`). `Cache-Control: public, max-age=5` |
| GET | `/competitions/:idOrSlug/viewer` | optional | Per-user state: registration, submission, primaryAction, referral link. `no-store` |
| GET | `/competitions/:idOrSlug/availability` | – | Seat counts (polling fallback for the socket) |
| POST | `/competitions/:idOrSlug/registrations` | ✔ | Reserve a seat. Idempotent: returns 201 when created, 200 when a registration already exists |
| PUT | `/competitions/:idOrSlug/submission` | ✔ | Multipart `file` (video). Creates or replaces the submission |
| POST | `/registrations/:id/payment/confirm` | ✔ | `{ orderId, paymentId, signature }`. Verifies the HMAC and confirms. Safe to retry |
| DELETE | `/registrations/:id` | ✔ | Release an unpaid hold |
| POST | `/registrations/:id/payment/simulate` | ✔ | Dev-only stand-in for the provider's hosted checkout |
| GET | `/auth/demo-users`, POST `/auth/demo-login` | – | Demo sign-in (returns a real JWT) |
| GET | `/testimonials` | – | "Hear from our users" |

Realtime. Connect with Socket.IO, emit `competition:subscribe` with the competition id, and listen for `availability` → `{ competitionId, capacity, spotsTaken, spotsLeft }`.

### Why details and viewer state are separate endpoints
The public details are the same for every visitor, so a CDN can cache them for a few seconds. That matters when thousands of people open a popular competition at once. The small per-user part is never cached. The app fetches both in parallel.

---

## Data model (MongoDB)

- competitions: all display content (localized as `{ en, hi }`), money in paise (integers), `capacity`, and a denormalized `spotsTaken` counter. It also holds the `schedule` (registration opens and closes, submission starts and ends, result date), which the schema validates for date order. Rewards are validated so they never exceed the prize pool. The judge and previous winners are embedded because they are always read together with the competition.
- registrations: one document per (competition, user), enforced by a unique index. `status`: `pending_payment → confirmed | expired | cancelled`. It stores `holdExpiresAt` and the payment references. If a user registers again after a hold expired, the same document is reused.
- submissions: one per (competition, user), unique index. Re-uploading bumps `revision`.
- users: profile and `referralCode` (unique).
- testimonials.

Indexes: `competitions.slug` (unique), `registrations(competition,user)` (unique), a partial index on `registrations.holdExpiresAt` where `status = pending_payment` (used by the sweeper), and `submissions(competition,user)` (unique).

---

## Concurrency & consistency

The core problem is never selling more seats than exist, with thousands of users acting at the same moment.

1. Seat reservation is one atomic, conditional update.
   `findOneAndUpdate({ _id, status: 'published', regOpen <= now < regClose, $expr: spotsTaken < capacity }, { $inc: { spotsTaken: 1 } })`.
   MongoDB applies this atomically on the single document, so the check and the increment cannot interleave between requests. There are no locks and no read-then-write race.
2. One seat per user. A unique index on `(competition, user)` handles double-taps and retries. If the same user races themselves, the losing request gets a duplicate-key error. It gives its seat back (a compensating `$inc: -1`) and returns the winning registration. The endpoint is therefore idempotent.
3. State transitions are guarded by the current status (`status: 'pending_payment'` appears in the filter). The payment confirmation and the expiry sweeper can never both succeed for the same registration, so a seat is released exactly once. The sweeper can safely run on every API instance.
4. Payment holds. Paid entries hold a seat for `PAYMENT_HOLD_MINUTES` while the user pays. Abandoned holds are released by the sweeper, or lazily when that user registers again. A payment that arrives just after the deadline is still accepted if the seat hasn't been released yet, because the seat is still counted and capacity cannot be exceeded.
5. Payment verification. The server checks the HMAC signature over `orderId|paymentId` (the same scheme Razorpay uses), compared in constant time. Tampered payloads get `402`.
6. The server clock is authoritative. Deadlines are enforced inside the database query. Every response includes `serverTime`, and the app corrects its countdowns for device clock skew.
7. Live views. Every seat change publishes a domain event, and Socket.IO pushes it to the competition's room. The app also refetches when it returns to the foreground and exactly when the next milestone or hold deadline passes.

The tests cover each of these: 60 users racing for 19 seats (exactly 19 succeed), one user sending 10 parallel taps (one registration, one seat), two sweepers racing (one release), tampered signatures, idempotent retries, closed and not-yet-open windows, and upload permissions.

---

## Assumptions

- Authentication is outside this assignment's scope. The backend uses real JWT middleware and per-user authorization, but tokens come from a demo login that picks a seeded user (turned off by `ALLOW_DEMO_LOGIN=false`).
- Payments are mocked behind a gateway interface that follows Razorpay's order → checkout → signed callback flow. No real money moves.
- "Registered" means *paid* (confirmed). The design's disclaimer says only paid participants are judged, so only confirmed participants can upload.
- The registration and submission windows can overlap. The design itself shows submissions starting (6 Aug) before registration closes (10 Aug), so lifecycle flags are independent rather than one linear state.
- "Spots left" counts active payment holds as taken, so users can't be sold a seat that someone else is paying for.
- Paid registrations can't be cancelled by the user. They follow the refund policy (linked). Unpaid holds can be released.
- Times are shown in the device's timezone. The server stores UTC.
- Images and videos in the seed are public placeholders. The "Ad Here" slot is a reserved placement with no ad network behind it.
- Home, Explore and "+" in the bottom bar are outside this screen and show a notice. Competitions and Profile work.

## Major technical decisions

- The server computes the primary action (`REGISTER`, `COMPLETE_PAYMENT`, `SOLD_OUT`, `UPLOAD_SUBMISSION`, `AWAITING_RESULTS`, …). The rules live in one pure, unit-tested module (`backend/src/domain/lifecycle.js`), so every client behaves the same. The app only maps each type to text. It makes one local adjustment: switching Register ↔ Sold out as live seat counts arrive.
- A denormalized seat counter with atomic `$inc` instead of counting registrations or using multi-document transactions. Reads cost nothing, it works on a standalone MongoDB, and it stays correct under contention.
- Localized content stored in the database (`{ en, hi }`) and resolved per request, with English as the fallback. UI labels live in the app.
- Money stored as integers in paise.
- Layering: routes (HTTP, zod validation) → services (business rules) → models. Realtime is separated from the services by an event bus.
- Expo for the app, so reviewers can run it with Expo Go without building native code.
- node:test instead of Jest. Jest's VM sandbox breaks the MongoDB 7 driver handshake, and Node's built-in runner with `expect` runs the same assertions without it.

## Trade-offs considered

- Counter vs. transactions. A crash between a registration's status change and its compensating counter update could leave `spotsTaken` off by one. This is rare and detectable, and `npm run reconcile` rebuilds the counters. Multi-document transactions would remove that gap, but they need a replica set and add latency on the hottest path.
- Holds vs. charging first. Holding seats during payment avoids charging someone and then refunding them because the last seat went elsewhere. The cost is that a sold-out competition can free up seats again when holds expire, which the app handles live.
- Socket.IO vs. polling. Push keeps "spots left" accurate without extra load. A polling endpoint exists as a fallback, and the app also refetches on focus and at deadlines.
- Embedded judge and winners make the page one read, at the cost of duplicating data if the same judge runs many competitions.
- Local disk for uploads keeps the demo self-contained. It is not suitable for multiple instances (see below).

## What I'd do next for production

- Real auth (OTP or OAuth) with refresh tokens, and a real Razorpay integration with a webhook as the source of truth, plus automatic refunds for payments that arrive after a hold expired.
- Uploads direct to S3/GCS through pre-signed URLs with resumable uploads, then transcoding, thumbnails and content moderation.
- Redis: Socket.IO adapter for fan-out across instances, a shared rate-limit store, and a short-lived cache for the details payload.
- A MongoDB replica set, index builds as migrations, and optionally transactions around seat plus registration.
- A waitlist for sold-out competitions that is notified when holds expire. Push notifications before deadlines.
- An admin CMS for competitions, results publishing, and a scheduled job that reconciles the counters.
- Observability: tracing, metrics on seat contention and hold expiry, alerts on counter drift.
- App: React Query for caching and retries, offline banner, E2E tests (Detox/Maestro), Sentry, analytics, accessibility audit, deep links (`feedants.com/c/:slug`).

---

## Screen recording

*(Add link here.)*
