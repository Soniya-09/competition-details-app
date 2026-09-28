const { Router } = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const config = require('../config');
const competitionService = require('../services/competitionService');
const registrationService = require('../services/registrationService');
const submissionService = require('../services/submissionService');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { validate, idOrSlug, z } = require('../middleware/validate');
const { writeLimiter } = require('../middleware/rateLimits');
const { resolveLang } = require('../utils/localize');
const { badRequest } = require('../utils/errors');
const { send } = require('../utils/respond');

const router = Router();
const params = validate({ params: z.object({ idOrSlug }) });

fs.mkdirSync(config.uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (_req, file, cb) =>
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase().slice(0, 10)}`),
  }),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith('video/') ? cb(null, true) : cb(badRequest('Only video files are accepted')),
});

router.get(
  '/',
  validate({ query: z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) }).loose() }),
  async (req, res) => {
    send(res, await competitionService.list({ lang: resolveLang(req), limit: req.valid.query.limit }));
  },
);

router.get('/:idOrSlug', params, async (req, res) => {
  const data = await competitionService.getDetails(req.valid.params.idOrSlug, resolveLang(req));
  res.set('Cache-Control', 'public, max-age=5, stale-while-revalidate=30');
  res.set('Vary', 'Accept-Language');
  send(res, data);
});

router.get('/:idOrSlug/availability', params, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  send(res, await competitionService.getAvailability(req.valid.params.idOrSlug));
});

router.get('/:idOrSlug/viewer', params, optionalAuth, async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  send(res, await competitionService.getViewerState(req.valid.params.idOrSlug, req.user?.id ?? null));
});

router.post('/:idOrSlug/registrations', params, requireAuth, writeLimiter, async (req, res) => {
  const competition = await competitionService.findVisible(req.valid.params.idOrSlug);
  const { registration, created } = await registrationService.register({
    competitionId: competition._id,
    userId: req.user.id,
  });
  const viewer = await competitionService.getViewerState(competition._id, req.user.id);
  send(res, { registration: competitionService.toRegistrationDto(registration), viewer }, created ? 201 : 200);
});

router.put(
  '/:idOrSlug/submission',
  params,
  requireAuth,
  writeLimiter,
  // Reject ineligible users before streaming a large body to disk.
  async (req, _res, next) => {
    await submissionService.preflight(req.valid.params.idOrSlug, req.user.id);
    next();
  },
  upload.single('file'),
  async (req, res) => {
    if (!req.file) throw badRequest('A video file is required in the "file" field');
    const submission = await submissionService.upsert({
      idOrSlug: req.valid.params.idOrSlug,
      userId: req.user.id,
      file: req.file,
      publicUrl: `${config.publicBaseUrl}/uploads/${req.file.filename}`,
    });
    const viewer = await competitionService.getViewerState(req.valid.params.idOrSlug, req.user.id);
    send(res, { submission: competitionService.toSubmissionDto(submission), viewer });
  },
);

module.exports = router;
