const { Schema, model } = require('mongoose');

const REGISTRATION_STATUS = Object.freeze({
  PENDING_PAYMENT: 'pending_payment',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
});

const SEAT_HOLDING = [REGISTRATION_STATUS.PENDING_PAYMENT, REGISTRATION_STATUS.CONFIRMED];

const PaymentSchema = new Schema(
  {
    provider: String,
    orderId: String,
    paymentId: String,
    paidAt: Date,
  },
  { _id: false },
);

const RegistrationSchema = new Schema(
  {
    competition: { type: Schema.Types.ObjectId, ref: 'Competition', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(REGISTRATION_STATUS), required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    holdExpiresAt: { type: Date },
    payment: { type: PaymentSchema, default: undefined },
    confirmedAt: Date,
  },
  { timestamps: true },
);

RegistrationSchema.index({ competition: 1, user: 1 }, { unique: true });
RegistrationSchema.index({ user: 1, createdAt: -1 });
// Used by the hold-expiry sweeper.
RegistrationSchema.index(
  { holdExpiresAt: 1 },
  { partialFilterExpression: { status: REGISTRATION_STATUS.PENDING_PAYMENT } },
);

module.exports = model('Registration', RegistrationSchema);
module.exports.REGISTRATION_STATUS = REGISTRATION_STATUS;
module.exports.SEAT_HOLDING = SEAT_HOLDING;
