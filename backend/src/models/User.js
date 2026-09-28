const { Schema, model } = require('mongoose');
const crypto = require('crypto');
const { httpUrl } = require('./shared');

const generateReferralCode = () => crypto.randomBytes(5).toString('hex');

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    avatarUrl: { type: String, validate: httpUrl },
    referralCode: { type: String, required: true, unique: true, default: generateReferralCode },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = model('User', UserSchema);
