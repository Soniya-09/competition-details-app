const { Schema, model } = require('mongoose');

const SubmissionSchema = new Schema(
  {
    competition: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    registration: { type: Schema.Types.ObjectId, ref: 'Registration', required: true },
    fileUrl: { type: String, required: true },
    originalName: String,
    mimeType: String,
    sizeBytes: Number,
    revision: { type: Number, default: 1 },
  },
  { timestamps: true },
);

SubmissionSchema.index({ competition: 1, user: 1 }, { unique: true });

module.exports = model('Submission', SubmissionSchema);
