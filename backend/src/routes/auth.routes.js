const { Router } = require('express');
const User = require('../models/User');
const config = require('../config');
const { signToken, requireAuth } = require('../middleware/auth');
const { validate, objectId, z } = require('../middleware/validate');
const { forbidden, notFound } = require('../utils/errors');
const { send } = require('../utils/respond');

const router = Router();

const toUserDto = (u) => ({ id: String(u._id), name: u.name, email: u.email, avatarUrl: u.avatarUrl });

function demoOnly(_req, _res, next) {
  if (!config.allowDemoLogin) return next(forbidden('DEMO_LOGIN_DISABLED', 'Demo login is disabled'));
  next();
}

router.get('/demo-users', demoOnly, async (_req, res) => {
  const users = await User.find({ isDemo: true }).sort({ createdAt: 1 }).lean();
  send(res, users.map(toUserDto));
});

router.post(
  '/demo-login',
  demoOnly,
  validate({ body: z.object({ userId: objectId }) }),
  async (req, res) => {
    const user = await User.findOne({ _id: req.valid.body.userId, isDemo: true }).lean();
    if (!user) throw notFound('User');
    send(res, { token: signToken(user), user: toUserDto(user) });
  },
);

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) throw notFound('User');
  send(res, toUserDto(user));
});

module.exports = router;
