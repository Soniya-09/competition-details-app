const jwt = require('jsonwebtoken');
const config = require('../config');
const { unauthorized } = require('../utils/errors');

function signToken(user) {
  return jwt.sign({ sub: String(user._id), name: user.name }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return { id: payload.sub, name: payload.name };
  } catch {
    return null;
  }
}

function readBearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function optionalAuth(req, _res, next) {
  const token = readBearer(req);
  if (token) {
    const user = verifyToken(token);
    if (!user) return next(unauthorized('Invalid or expired token'));
    req.user = user;
  }
  next();
}

function requireAuth(req, _res, next) {
  const user = verifyToken(readBearer(req) || '');
  if (!user) return next(unauthorized());
  req.user = user;
  next();
}

module.exports = { signToken, verifyToken, optionalAuth, requireAuth };
