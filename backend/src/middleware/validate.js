const { z } = require('zod');
const mongoose = require('mongoose');
const { badRequest } = require('../utils/errors');

const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), 'must be a valid id');
const idOrSlug = z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9-]+$/, 'invalid identifier');

const validate = (schemas) => (req, _res, next) => {
  req.valid ??= {}; // validators may be chained on one route
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) {
      return next(
        badRequest(
          'Invalid request',
          result.error.issues.map((i) => ({ path: [part, ...i.path].join('.'), message: i.message })),
        ),
      );
    }
    req.valid[part] = result.data;
  }
  next();
};

module.exports = { validate, objectId, idOrSlug, z };
