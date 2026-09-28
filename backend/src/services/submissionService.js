const fs = require('fs/promises');
const Registration = require('../models/Registration');
const Submission = require('../models/Submission');
const { findVisible } = require('./competitionService');
const { isSubmissionWindowOpen } = require('../domain/lifecycle');
const { conflict, forbidden } = require('../utils/errors');

const S = Registration.REGISTRATION_STATUS;

async function assertCanSubmit(competition, userId, now) {
  if (competition.status !== 'published') throw conflict('COMPETITION_CANCELLED', 'This competition is not active');
  const registration = await Registration.findOne({ competition: competition._id, user: userId }).lean();
  if (!registration || registration.status !== S.CONFIRMED) {
    throw forbidden('NOT_REGISTERED', 'Only paid participants can upload a submission');
  }
  if (now < new Date(competition.schedule.submissionStartsAt)) {
    throw conflict('SUBMISSION_NOT_STARTED', 'Submissions have not opened yet');
  }
  if (!isSubmissionWindowOpen(competition.schedule, now)) {
    throw conflict('SUBMISSION_CLOSED', 'The submission window has closed');
  }
  return registration;
}

async function preflight(idOrSlug, userId, now = new Date()) {
  const competition = await findVisible(idOrSlug);
  await assertCanSubmit(competition, userId, now);
  return competition;
}

async function upsert({ idOrSlug, userId, file, publicUrl, now = new Date() }) {
  try {
    const competition = await findVisible(idOrSlug);
    const registration = await assertCanSubmit(competition, userId, now);
    return await Submission.findOneAndUpdate(
      { competition: competition._id, user: userId },
      {
        $set: {
          registration: registration._id,
          fileUrl: publicUrl,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
        },
        $inc: { revision: 1 },
      },
      { upsert: true, returnDocument: 'after', lean: true, setDefaultsOnInsert: false },
    );
  } catch (err) {
    await fs.unlink(file.path).catch(() => {});
    throw err;
  }
}

module.exports = { preflight, upsert };
